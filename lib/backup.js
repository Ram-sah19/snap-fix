import fs from 'fs';
import path from 'path';
import { ensureGitignoreEntry } from './envManager.js';

const BACKUP_DIR = '.snap-fix/backups';
const SESSIONS_FILE = '.snap-fix/sessions.json';

/**
 * Read the sessions manifest from disk.
 * @param {string} projectRoot
 * @returns {{ sessions: Array }}
 */
function readSessions(projectRoot) {
  const sessionsPath = path.join(projectRoot, SESSIONS_FILE);
  if (fs.existsSync(sessionsPath)) {
    try {
      return JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
    } catch {
      return { sessions: [] };
    }
  }
  return { sessions: [] };
}

/**
 * Write the sessions manifest to disk.
 * @param {{ sessions: Array }} data
 * @param {string} projectRoot
 */
function writeSessions(data, projectRoot) {
  const sessionsPath = path.join(projectRoot, SESSIONS_FILE);
  const dir = path.dirname(sessionsPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(sessionsPath, JSON.stringify(data, null, 2));
}

/**
 * Start a new backup session for the current run.
 * Also ensures .snap-fix/ is in .gitignore so backups (which may contain secrets) are safe.
 * @param {string} projectRoot
 * @returns {string} sessionId
 */
export function startSession(projectRoot) {
  const snapFixDir = path.join(projectRoot, '.snap-fix');
  fs.mkdirSync(snapFixDir, { recursive: true });
  ensureGitignoreEntry('.snap-fix/', projectRoot);

  const sessionId = `session-${Date.now()}`;
  const data = readSessions(projectRoot);
  data.sessions.push({
    id: sessionId,
    timestamp: new Date().toISOString(),
    files: []
  });
  writeSessions(data, projectRoot);
  return sessionId;
}

/**
 * Save a backup copy of a file before it is overwritten.
 * @param {string} sessionId
 * @param {string} filePath   - Original file path (absolute or relative)
 * @param {string} content    - Original file content
 * @param {string} projectRoot
 */
export function saveBackup(sessionId, filePath, content, projectRoot) {
  const backupBase = path.join(projectRoot, BACKUP_DIR, sessionId);
  fs.mkdirSync(backupBase, { recursive: true });

  // Flatten path separators to avoid nested dirs inside backup folder
  const relPath = path.relative(projectRoot, path.resolve(filePath));
  const safeFileName = relPath.replace(/[/\\]/g, '__');
  const backupPath = path.join(backupBase, safeFileName);
  fs.writeFileSync(backupPath, content);

  // Record this file in the session manifest
  const data = readSessions(projectRoot);
  const session = data.sessions.find(s => s.id === sessionId);
  if (session) {
    session.files.push({
      original: path.resolve(filePath),
      backup: backupPath
    });
    writeSessions(data, projectRoot);
  }
}

/**
 * Revert all files changed in the last snap-fix session.
 * @param {string} projectRoot
 * @returns {{ success: boolean, message?: string, restored?: string[] }}
 */
export function undoLastSession(projectRoot) {
  const data = readSessions(projectRoot);
  if (!data.sessions || data.sessions.length === 0) {
    return { success: false, message: 'No snap-fix sessions found. Nothing to undo.' };
  }

  const lastSession = data.sessions[data.sessions.length - 1];
  if (!lastSession.files || lastSession.files.length === 0) {
    return { success: false, message: 'Last session had no file changes to undo.' };
  }

  const restored = [];
  const failed = [];
  for (const fileInfo of lastSession.files) {
    if (fs.existsSync(fileInfo.backup)) {
      try {
        const backupContent = fs.readFileSync(fileInfo.backup, 'utf-8');
        fs.writeFileSync(fileInfo.original, backupContent);
        restored.push(fileInfo.original);
      } catch (err) {
        failed.push(`${fileInfo.original} (${err.message})`);
      }
    } else {
      failed.push(`${fileInfo.original} (backup missing)`);
    }
  }

  // Pop session from manifest so undo can't be run twice on the same session
  data.sessions.pop();
  writeSessions(data, projectRoot);

  return { success: true, restored, failed };
}

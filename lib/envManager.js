import fs from 'fs';
import path from 'path';

/**
 * Ensures a given entry (e.g. '.env', '.snap-fix/') exists in .gitignore.
 * Creates .gitignore if it doesn't exist.
 * @param {string} entry
 * @param {string} projectRoot
 */
export function ensureGitignoreEntry(entry, projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }
  const lines = content.split('\n').map(l => l.trim());
  if (!lines.includes(entry)) {
    content = (content.trim() ? content.trim() + '\n' : '') + entry + '\n';
    fs.writeFileSync(gitignorePath, content);
  }
}

/**
 * Writes a key=value entry to .env (only if the key doesn't already exist).
 * Also ensures .env is listed in .gitignore.
 * @param {string} envKey       - e.g. 'APP_API_KEY'
 * @param {string} secretValue  - the raw secret string
 * @param {string} projectRoot
 */
export function writeEnvEntry(envKey, secretValue, projectRoot) {
  const envPath = path.join(projectRoot, '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  }
  // Only append if key not already present
  const keyExists = content.split('\n').some(line => line.startsWith(`${envKey}=`));
  if (!keyExists) {
    const newLine = `${envKey}=${secretValue}`;
    content = content.trim() ? `${content.trim()}\n${newLine}\n` : `${newLine}\n`;
    fs.writeFileSync(envPath, content);
  }
  // Lock the door
  ensureGitignoreEntry('.env', projectRoot);
}

#!/usr/bin/env node
/* eslint-disable no-console */
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { runScanner } from './lib/engine.js';
import { undoLastSession } from './lib/backup.js';
import { logger } from './lib/ui.js';

const program = new Command();

program
    .name('snap-fix')
    .description('Production-ready code review and auto-fix tool')
    .version('2.0.0');

// ─── check (alias: c) ─────────────────────────────────────────────────────────
program
    .command('check')
    .alias('c')                                          // Nickname: npx snap-fix c
    .description('Check files for production-readiness (file, directory, or glob). Defaults to current directory.')
    .argument('[path]', 'File, directory, or glob to scan', '.')  // Mind Reader: default is '.'
    .option('-f, --fix', 'Apply all fixes automatically without prompting')
    .option('-y, --yes', 'Alias for --fix: auto-approve all fixes (same as -f)')
    .option('-d, --dry-run', 'Show what would be fixed without modifying any files')
    .action(async (pathArg, options) => {
        // -y is a friendly alias for --fix
        if (options.yes) { options.fix = true; }

        // Mind Reader: default to current directory if no path given
        const targetPath = pathArg || '.';

        // Path Intelligence: if target is a directory, auto-recurse into it
        let resolvedPattern = targetPath;
        const resolvedPath = path.resolve(targetPath);
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
            resolvedPattern = targetPath.replace(/\/?$/, '') + '/**/*';
            logger.info(`Directory detected — scanning ${chalk.cyan(resolvedPattern)} recursively.`);
        }
        await runScanner(resolvedPattern, options);
    });

// ─── undo ─────────────────────────────────────────────────────────────────────
program
    .command('undo')
    .description('Revert all file changes made in the last snap-fix session')
    .action(() => {
        const result = undoLastSession(process.cwd());
        if (result.success) {
            if (result.restored.length > 0) {
                logger.success(`Undo successful! Restored ${result.restored.length} file(s):`);
                result.restored.forEach(f => logger.info(`  ↩  ${chalk.cyan(f)}`));
            }
            if (result.failed && result.failed.length > 0) {
                logger.warn(`Could not restore ${result.failed.length} file(s):`);
                result.failed.forEach(f => logger.error(`  ✖  ${f}`));
            }
        } else {
            logger.error(result.message);
        }
    });

program.parse();

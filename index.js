#!/usr/bin/env node
/* eslint-disable no-console */
import { Command } from 'commander';
import { runScanner } from './lib/engine.js';

const program = new Command();

program
    .name('snap-fix')
    .description('Production-ready code review and fix tool')
    .version('1.0.0');

program
    .command('check')
    .description('Check files for production-readiness')
    .argument('<path>', 'File or glob pattern to check')
    .option('-f, --fix', 'Apply fixes automatically where possible')
    .option('-d, --dry-run', 'Show output without modifying files')
    .action(async (pathPattern, options) => {
        await runScanner(pathPattern, options);
    });

program.parse();

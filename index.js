#!/usr/bin/env node
/* eslint-disable no-console */
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import glob from 'fast-glob';
import { banner, logger, renderSummary } from './lib/ui.js';
import { getRules, checkFileWithRules } from './lib/rules.js';

const program = new Command();

const loadConfig = () => {
    const configPath = path.join(process.cwd(), '.profixrc');
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (error) {
            logger.error('Error parsing .profixrc. Using default settings.');
            return {};
        }
    }
    return {};
};

program
    .name('snap-fix')
    .description('Production-ready code review and fix tool')
    .version('1.0.0');

program
    .command('check')
    .description('Check files for production-readiness')
    .argument('<path>', 'File or glob pattern to check')
    .option('-f, --fix', 'Apply fixes automatically where possible')
    .action(async (pathPattern, options) => {
        banner();

        const config = loadConfig();
        const ignoreFiles = config.ignoreFiles || [];
        const disabledRules = config.disabledRules || [];

        const activeRules = getRules(disabledRules);
        const files = await glob(pathPattern, { ignore: ignoreFiles });

        if (files.length === 0) {
            logger.error('No files found matching the pattern.');
            return;
        }

        let totalIssuesCount = 0;

        for (const file of files) {
            logger.info(`Checking ${logger.highlight(file)}...`);

            const content = fs.readFileSync(file, 'utf-8');
            const issues = checkFileWithRules(content, activeRules);

            if (issues.length === 0) {
                logger.success(`No issues found in ${file}. ✨`);
                continue;
            }

            let totalFixed = 0;
            let updatedContent = content;

            for (const issue of issues) {
                console.log(`${chalk.red('✖')} [Line ${issue.line}] ${issue.message}`);
                console.log(`  ${chalk.gray('↳')} Current: ${logger.issue(issue.match)}`);
                console.log(`  ${chalk.gray('↳')} ${issue.suggestion}\n`);

                if (issue.fix) {
                    let apply = options.fix;

                    if (!apply) {
                        const response = await inquirer.prompt([
                            {
                                type: 'confirm',
                                name: 'apply',
                                message: `Apply production-ready fix for ${issue.ruleName}?`,
                                default: true
                            }
                        ]);
                        apply = response.apply;
                    }

                    if (apply) {
                        // Replace ALL occurrences of the matched string with the fix
                        updatedContent = updatedContent.split(issue.match).join(issue.fix);
                        totalFixed++;
                        logger.success(`Fix applied for ${issue.ruleName}!`);
                    }
                }
            }

            if (totalFixed > 0) {
                try {
                    fs.writeFileSync(file, updatedContent);
                    logger.success(`Update saved to ${file}.`);
                    totalIssuesCount += Math.max(0, issues.length - totalFixed);
                } catch (error) {
                    logger.error(`Failed to save changes to ${file}: ${error.message}`);
                    totalIssuesCount += issues.length;
                }
            } else {
                totalIssuesCount += issues.length;
            }
        }

        renderSummary(totalIssuesCount);
    });

program.parse();

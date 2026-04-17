import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import glob from 'fast-glob';
import { banner, logger, renderSummary } from './ui.js';
import { getRules, checkFileWithRules } from './rules/index.js';

export const loadConfig = () => {
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

export const runScanner = async (pathPattern, options) => {
    banner();

    const config = loadConfig();
    const ignoreFiles = config.ignoreFiles || [];
    // Ensure default ignores for fast-glob are included to prevent freezing on large repos
    const defaultIgnores = ['**/.git/**', '**/node_modules/**', '**/dist/**'];
    const finalIgnores = [...new Set([...ignoreFiles, ...defaultIgnores])];

    const disabledRules = config.disabledRules || [];
    const activeRules = getRules(disabledRules);
    const files = await glob(pathPattern, { ignore: finalIgnores });

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
            
            // Visual diff
            console.log(`  ${chalk.red('- ' + issue.match)}`);
            
            if (issue.fix) {
                console.log(`  ${chalk.green('+ ' + issue.fix)}\n`);
                
                if (options.dryRun) {
                    logger.info(`[Dry Run] Would apply fix for ${issue.ruleName}.`);
                    continue;
                }

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
                    updatedContent = updatedContent.split(issue.match).join(issue.fix);
                    totalFixed++;
                    logger.success(`Fix applied for ${issue.ruleName}!`);
                }
            } else {
                console.log(`  ${chalk.gray('↳')} ${issue.suggestion}\n`);
            }
        }

        if (totalFixed > 0 && !options.dryRun) {
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
};

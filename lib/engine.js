import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import glob from 'fast-glob';
import { banner, logger, renderSummary } from './ui.js';
import { getRules, checkFileWithRules } from './rules/index.js';
import { startSession, saveBackup } from './backup.js';
import { writeEnvEntry } from './envManager.js';

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

    const projectRoot = process.cwd();
    const config = loadConfig();
    const ignoreFiles = config.ignoreFiles || [];
    // Also ignore backup folder so snap-fix never scans its own snapshots
    const defaultIgnores = ['**/.git/**', '**/node_modules/**', '**/dist/**', '**/.snap-fix/**'];
    const finalIgnores = [...new Set([...ignoreFiles, ...defaultIgnores])];

    const disabledRules = config.disabledRules || [];
    const activeRules = getRules(disabledRules);
    const files = await glob(pathPattern, { ignore: finalIgnores });

    if (files.length === 0) {
        logger.error('No files found matching the pattern.');
        return;
    }

    // Lazy session: only create a backup session when we first actually write a file
    let backupSessionId = null;
    const getSessionId = () => {
        if (!backupSessionId) {
            backupSessionId = startSession(projectRoot);
        }
        return backupSessionId;
    };

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
        // Collect secrets that need to be moved to .env after the file is saved
        const secretsToEnv = [];

        for (const issue of issues) {
            console.log(`${chalk.red('✖')} [Line ${issue.line}] ${issue.message}`);
            console.log(`  ${chalk.red('- ' + issue.match)}`);

            if (issue.fix) {
                console.log(`  ${chalk.green('+ ' + issue.fix)}\n`);

                if (options.dryRun) {
                    logger.info(`[Dry Run] Would apply fix for ${issue.ruleName}.`);
                    if (issue.isSecret) {
                        logger.info(`[Dry Run] Would move "${issue.envKey}" to .env`);
                    }
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

                    // Queue secrets for .env management (Feature 2)
                    if (issue.isSecret && issue.envKey && issue.secretValue) {
                        secretsToEnv.push({ envKey: issue.envKey, secretValue: issue.secretValue });
                    }
                }
            } else {
                console.log(`  ${chalk.gray('↳')} ${issue.suggestion}\n`);
            }
        }

        if (totalFixed > 0 && !options.dryRun) {
            try {
                // Feature 4: Save snapshot BEFORE overwriting the file
                saveBackup(getSessionId(), file, content, projectRoot);

                fs.writeFileSync(file, updatedContent);
                logger.success(`Update saved to ${file}.`);

                // Feature 2: Move secrets into .env and protect with .gitignore
                for (const { envKey, secretValue } of secretsToEnv) {
                    writeEnvEntry(envKey, secretValue, projectRoot);
                    logger.success(`Secret ${chalk.cyan(envKey)} → written to ${chalk.yellow('.env')} 🔒`);
                    logger.success(`.env is protected in ${chalk.yellow('.gitignore')} ✔`);
                }

                totalIssuesCount += Math.max(0, issues.length - totalFixed);
            } catch (error) {
                logger.error(`Failed to save changes to ${file}: ${error.message}`);
                totalIssuesCount += issues.length;
            }
        } else {
            totalIssuesCount += issues.length;
        }
    }

    if (backupSessionId) {
        logger.info(`Snapshot saved. Run ${chalk.cyan('npx snap-fix undo')} to revert all changes.`);
    }

    renderSummary(totalIssuesCount);
};

import { LocalhostRule } from './LocalhostRule.js';
import { SecretSentryRule } from './SecretSentryRule.js';
import { AsyncGuardRule } from './AsyncGuardRule.js';
import { SQLInjectionRule } from './SQLInjectionRule.js';
import { XSSRule } from './XSSRule.js';

export * from './Rule.js';
export * from './LocalhostRule.js';
export * from './SecretSentryRule.js';
export * from './AsyncGuardRule.js';
export * from './SQLInjectionRule.js';
export * from './XSSRule.js';

/**
 * Build the list of active rules, excluding any that are disabled in config.
 * @param {string[]} [disabledRules] - Array of rule IDs to skip
 * @returns {import('./Rule.js').Rule[]}
 */
export const getRules = (disabledRules = []) => {
  const allRules = [
    new LocalhostRule(),
    new SecretSentryRule(),
    new AsyncGuardRule(),
    new SQLInjectionRule(),
    new XSSRule()
  ];
  return allRules.filter(rule => !disabledRules.includes(rule.id));
};

/**
 * Run all active rules against a file's content and collect every issue.
 * @param {string} content       - Full source file content
 * @param {import('./Rule.js').Rule[]} activeRules   - Rules to apply
 * @returns {any[]}
 */
export const checkFileWithRules = (content, activeRules) => {
  let allIssues = [];
  activeRules.forEach(rule => {
    allIssues = allIssues.concat(rule.check(content));
  });
  return allIssues;
};

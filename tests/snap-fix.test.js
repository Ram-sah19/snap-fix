import { expect, test, describe } from 'vitest';
import { getRules, checkFileWithRules } from '../lib/rules/index.js';

describe('Snap-Fix Core Tests', () => {

  test('Should load all active rules by default', () => {
    const rules = getRules();
    expect(rules.length).toBeGreaterThanOrEqual(5);
  });

  test('Should ignore disabled rules', () => {
    const activeRules = getRules(['sql-injection', 'xss-detector']);
    expect(activeRules.some(r => r.id === 'sql-injection')).toBe(false);
    expect(activeRules.some(r => r.id === 'xss-detector')).toBe(false);
  });

  test('checkFileWithRules should aggregate issues across all rules', () => {
    const rules = getRules();
    // Use a genuinely high-entropy key (not all-zeros) so SecretSentryRule flags it
    const code = `
      const apiKey = "xK9mP2qL8vN4wJ7rT3sY6uC1eA5bD0fH";
      const apiUrl = "http://localhost:3000";
    `;
    const issues = checkFileWithRules(code, rules);

    expect(issues.length).toBe(2);
    expect(issues.some(i => i.ruleId === 'secret-sentry')).toBe(true);
    expect(issues.some(i => i.ruleId === 'localhost-check')).toBe(true);
  });
});

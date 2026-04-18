import { Rule } from './Rule.js';

// --- Entropy Engine ---

/**
 * Calculates Shannon Entropy for a string.
 * Higher entropy = more randomness = more likely to be a secret.
 * @param {string} str
 * @returns {number} entropy in bits
 */
function calculateEntropy(str) {
  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  const len = str.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// Entropy threshold: real secrets are typically > 3.5 bits/char
const ENTROPY_THRESHOLD = 3.5;
// Minimum secret length to avoid false positives
const MIN_SECRET_LENGTH = 12;

// Matches variable names that look like they hold secrets (brand-agnostic)
const SECRET_VAR_PATTERN = /(?:api[_-]?key|api[_-]?secret|secret[_-]?key|access[_-]?key|private[_-]?key|auth[_-]?key|token|password|passwd|pwd|credential|client[_-]?secret|app[_-]?key)/i;

// Finds: const/let/var <NAME> = "value" or '<value>'
// Group 1: variable name
// Group 2: value in single quotes
// Group 3: value in double quotes
const ASSIGNMENT_REGEX = /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:'([^'\n]{8,})'|"([^"\n]{8,})")/g;

export class SecretSentryRule extends Rule {
  constructor() {
    // Pass the regex to the base class, but we override check() for entropy logic
    super(
      'secret-sentry',
      'Secret Sentry',
      'Detects hardcoded secrets via name heuristics + Shannon Entropy (brand-agnostic).',
      ASSIGNMENT_REGEX,
      'Potential hardcoded secret detected.',
      'Move this value into a .env file and replace with process.env.VAR_NAME'
    );
  }

  /**
   * Overrides base check() to apply both variable-name heuristics AND entropy scoring.
   * This catches ANY secret — not just OpenAI keys — based on randomness.
   * @param {string} content - Full file content
   * @returns {import('./Rule.js').Issue[]}
   */
  check(content) {
    const issues = [];
    // Reset regex state (must clone since we extend the class)
    const regex = new RegExp(ASSIGNMENT_REGEX.source, ASSIGNMENT_REGEX.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const varName = match[1];
      // Pick whichever quote group matched
      const secretValue = match[2] || match[3];

      if (!secretValue || secretValue.length < MIN_SECRET_LENGTH) { continue; }

      // 1. Name heuristic: skip if the variable doesn't look secret-related
      if (!SECRET_VAR_PATTERN.test(varName)) { continue; }

      // 2. Entropy check: skip if value looks like a plain English string
      const entropy = calculateEntropy(secretValue);
      if (entropy < ENTROPY_THRESHOLD) { continue; }

      const envKey = varName.toUpperCase();
      const fullMatch = match[0];
      const quoteChar = match[2] !== undefined ? "'" : '"';
      // Replace only the quoted value, keep the assignment (`const X = process.env.X`)
      const fixedAssignment = fullMatch.replace(
        `${quoteChar}${secretValue}${quoteChar}`,
        `process.env.${envKey}`
      );

      issues.push({
        ruleId: this.id,
        ruleName: this.name,
        message: `${this.message} (entropy: ${entropy.toFixed(2)} bits, var: "${varName}")`,
        suggestion: this.suggestion,
        match: fullMatch,
        index: match.index,
        line: (content.substring(0, match.index).match(/\n/g) || []).length + 1,
        fix: fixedAssignment,
        // Extended metadata for automated .env management (Feature 2)
        envKey,
        secretValue,
        isSecret: true
      });
    }

    return issues;
  }
}

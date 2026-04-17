/**
 * @typedef {Object} Issue
 * @property {string} ruleId      - Unique rule identifier
 * @property {string} ruleName    - Human-readable rule name
 * @property {string} message     - Short description of the problem
 * @property {string} suggestion  - Recommended fix description
 * @property {string} match       - The exact matched source text
 * @property {number} index       - Character index in the file content
 * @property {number} line        - 1-based line number
 * @property {string|null} fix    - Auto-fixed replacement string, or null
 */

/**
 * @callback FixFn
 * @param {RegExpExecArray} match   - The regex match array
 * @param {string} content          - Full file content
 * @returns {string}                - The replacement string
 */

/**
 * Base class for all snap-fix rules.
 */
export class Rule {
  /**
   * @param {string}   id          - Unique rule ID (e.g. 'localhost-check')
   * @param {string}   name        - Display name
   * @param {string}   description - What the rule detects
   * @param {RegExp}   pattern     - Regex used to find violations (must use the `g` flag)
   * @param {string}   message     - Issue message shown to the user
   * @param {string}   suggestion  - Fix suggestion shown to the user
   * @param {FixFn|null} [fixFn]   - Optional function that returns an auto-fix string
   */
  constructor(id, name, description, pattern, message, suggestion, fixFn = null) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.pattern = pattern;
    this.message = message;
    this.suggestion = suggestion;
    this.fixFn = fixFn;
  }

  /**
   * Run the rule against the given file content.
   * @param {string} content - Full source file content
   * @returns {Issue[]}
   */
  check(content) {
    /** @type {Issue[]} */
    const issues = [];
    let match;
    this.pattern.lastIndex = 0;
    while ((match = this.pattern.exec(content)) !== null) {
      issues.push({
        ruleId: this.id,
        ruleName: this.name,
        message: this.message,
        suggestion: this.suggestion,
        match: match[0],
        index: match.index,
        line: (content.substring(0, match.index).match(/\n/g) || []).length + 1,
        fix: this.fixFn ? this.fixFn(match, content) : null
      });
    }
    return issues;
  }
}

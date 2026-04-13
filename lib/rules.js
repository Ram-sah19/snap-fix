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

export class LocalhostRule extends Rule {
  constructor() {
    super(
      'localhost-check',
      'Localhost Detector',
      'Finds hardcoded localhost URLs and suggests environment variables.',
      /(['"])(http:\/\/localhost:\d+[^'"]*)\1/g,
      'Hardcoded localhost URL found.',
      'Replace with process.env.API_URL',
      (match, _content) => `process.env.API_URL || ${match[1]}${match[2]}${match[1]}`
    );
  }
}

export class SecretSentryRule extends Rule {
  constructor() {
    super(
      'secret-sentry',
      'Secret Sentry',
      'Detects potential hardcoded API keys or secrets.',
      /(['"])(sk-[a-zA-Z0-9]{24,})\1/g,
      'Potential hardcoded API key detected.',
      'Move to a .env file',
      (match, content) => {
        // Try to extract variable name from the line containing the secret
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineEnd = content.indexOf('\n', match.index);
        const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
        const varMatch = line.match(/(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/);
        const envName = varMatch ? varMatch[1].toUpperCase() : 'SECRET_KEY';
        return `process.env.${envName}`;
      }
    );
  }
}

export class AsyncGuardRule extends Rule {
  constructor() {
    super(
      'async-guard',
      'Async Guard',
      'Detects await calls that might not be wrapped in a try/catch.',
      /\bawait\s+.+$/gm,
      'Await call without visible try/catch wrapper.',
      'Wrap in a try/catch block for production reliability.'
    );
  }

  check(content) {
    const issues = super.check(content);
    return issues.filter(issue => !this._isInsideTryCatch(content, issue.index));
  }

  // Walk backwards from awaitIndex to find the exact enclosing block's opening brace,
  // then check if that brace is immediately preceded by 'try' (not catch/if/else/etc).
  // This correctly handles nested braces, object literals, and catch blocks.
  _isInsideTryCatch(content, awaitIndex) {
    let depth = 0;
    for (let i = awaitIndex - 1; i >= 0; i--) {
      const ch = content[i];
      if (ch === '}') {
        depth++;
      } else if (ch === '{') {
        if (depth === 0) {
          // This is the opening { of the block directly enclosing our await
          const before = content.substring(0, i).trimEnd();
          // Check if this block is a try block (not catch, if, else, function, etc.)
          return /\btry\s*$/.test(before);
        }
        depth--;
      }
    }
    return false;
  }
}

export class SQLInjectionRule extends Rule {
  constructor() {
    super(
      'sql-injection',
      'SQL Injection Detector',
      'Detects potentially vulnerable SQL query string concatenation.',
      /(?:SELECT|INSERT|UPDATE|DELETE)[^`'"]+(?:WHERE|VALUES|SET)[^`'"]*\$\{[^}]+\}/gi,
      'Potential SQL injection vulnerability via string interpolation.',
      'Use parameterized queries instead.'
    );
  }
}

export class XSSRule extends Rule {
  constructor() {
    super(
      'xss-detector',
      'XSS Detector',
      'Detects direct assignments to innerHTML which can lead to Cross-Site Scripting.',
      /\.innerHTML\s*=\s*/g,
      'Direct assignment to innerHTML detected.',
      'Use .textContent or sanitize the input with DOMPurify.'
    );
  }
}

/**
 * Build the list of active rules, excluding any that are disabled in config.
 * @param {string[]} [disabledRules] - Array of rule IDs to skip
 * @returns {Rule[]}
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
 * @param {Rule[]} activeRules   - Rules to apply
 * @returns {Issue[]}
 */
export const checkFileWithRules = (content, activeRules) => {
  /** @type {Issue[]} */
  let allIssues = [];
  activeRules.forEach(rule => {
    allIssues = allIssues.concat(rule.check(content));
  });
  return allIssues;
};

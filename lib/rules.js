export class Rule {
  constructor(id, name, description, pattern, message, suggestion, fixFn = null) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.pattern = pattern;
    this.message = message;
    this.suggestion = suggestion;
    this.fixFn = fixFn;
  }

  check(content) {
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
        fix: this.fixFn ? this.fixFn(...match) : null
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
      (match, p1, p2) => `process.env.API_URL || ${p1}${p2}${p1}`
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
      (match, p1, p2) => `process.env.API_KEY`
    );
  }
}

export class AsyncGuardRule extends Rule {
  constructor() {
    super(
      'async-guard',
      'Async Guard',
      'Detects await calls that might not be wrapped in a try/catch.',
      /^(?!.*try\s*\{).*await\s+.*$/gm,
      'Await call without visible try/catch wrapper.',
      'Wrap in a try/catch block for production reliability.'
    );
  }
}

export const getRules = (disabledRules = []) => {
  const allRules = [
    new LocalhostRule(),
    new SecretSentryRule(),
    new AsyncGuardRule()
  ];
  return allRules.filter(rule => !disabledRules.includes(rule.id));
};

export const checkFileWithRules = (content, activeRules) => {
  let allIssues = [];
  activeRules.forEach(rule => {
    allIssues = allIssues.concat(rule.check(content));
  });
  return allIssues;
};

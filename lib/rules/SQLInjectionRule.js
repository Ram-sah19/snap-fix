import { Rule } from './Rule.js';

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

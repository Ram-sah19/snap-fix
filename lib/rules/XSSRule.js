import { Rule } from './Rule.js';

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

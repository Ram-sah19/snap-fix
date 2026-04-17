import { Rule } from './Rule.js';

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

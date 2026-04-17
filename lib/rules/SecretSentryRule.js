import { Rule } from './Rule.js';

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

import { Rule } from './Rule.js';

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

<div align="center">
  <h1>🚀 Snap-Fix</h1>
  <p><strong>Production-Ready Code Guard & Auto-Fixer for Node.js</strong></p>

  [![npm version](https://img.shields.io/npm/v/snap-fix.svg?style=flat-square)](https://www.npmjs.com/package/snap-fix)
  [![License](https://img.shields.io/npm/l/@ram-sah19/snap-fix.svg?style=flat-square)](https://github.com/Ram-sah19/snap-fix/blob/main/LICENSE)
</div>

Snap-Fix is a Node.js CLI tool designed to bridge the "Junior-to-Senior" gap by automatically reviewing code for production-readiness. It identifies common pitfalls like hardcoded secrets, local development URLs, and potentially unsafe asynchronous patterns, and even applies automatic fixes.

---

## 📑 Table of Contents
- [✨ Features](#-features)
- [🚀 Getting Started](#-getting-started)
- [📖 Usage](#-usage)
- [🛠️ Rules & Configuration](#-rules--configuration)
- [📊 Final Grade Report](#-final-grade-report)
- [🧑‍💻 Development](#-development)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

- **🛡️ Secret Sentry**: Detects hardcoded API keys and credentials (e.g., OpenAI, Stripe-like patterns).
- **🌍 Localhost Detector**: Finds hardcoded `localhost` URLs and suggests environment-based alternatives.
- **⚡ Async Guard**: Identifies `await` calls that aren't wrapped in `try/catch` blocks for better reliability.
- **🔒 Security Sweeps**: Detects basic SQL injection patterns and `.innerHTML` XSS vulnerabilities.
- **🛠️ Interactive Fixes**: Confirm each suggestion before applying it to your source code.
- **📦 Bulk Processing**: Use the `--fix` flag to automatically apply all production-ready fixes.
- **🔍 Dry Run Mode**: Use the `--dry-run` flag to preview fixes safely with visual terminal diffs before modifying files.
- **🎨 Premium UI**: Beautiful terminal output leveraging `chalk` with a detailed final grade report.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Installation
You can install the package globally or use it per project:

```bash
# Install globally
npm install -g snap-fix

# Or run instantly via npx
npx snap-fix check "src/**/*.js"
```

*For local development and testing:*
```bash
git clone https://github.com/Ram-sah19/snap-fix.git
cd snap-fix
npm link
```

---

## 📖 Usage

### Basic Check
Scan a specific file for production issues:
```bash
snap-fix check index.js
```

### Batch Scanning
Check all JavaScript files in a directory using glob patterns (ensure you quote the pattern!):
```bash
snap-fix check "src/**/*.js"
```

### Dry Run Mode
Preview what changes would be made without modifying any files:
```bash
snap-fix check "src/**/*.js" --dry-run
```

### Automated Fixing
Automatically apply all suggested fixes without manual confirmation prompts:
```bash
snap-fix check "src/**/*.js" --fix
```

---

## 🛠️ Rules & Configuration

Snap-Fix enforces best practices using an extensible rules engine.

### Built-in Rules
| Rule ID | What It Detects | Recommended Fix |
| :--- | :--- | :--- |
| `localhost-check` | Hardcoded `http://localhost` endpoints | Replace with `process.env.API_URL` |
| `secret-sentry` | Hardcoded keys (e.g., `sk-...`) | Extract variable to `.env` |
| `async-guard` | `await` missing a `try/catch` boundary | Wrap in a `try/catch` block |
| `sql-injection` | String interpolation in SQL queries | Use parameterized queries |
| `xss-detector` | Direct `.innerHTML` assignments | Replace with `.textContent` or `DOMPurify` |

### Configuration File (`.profixrc`)
Create a `.profixrc` JSON file in your project root to ignore files and disable specific rules you don't need.

```json
{
  "ignoreFiles": [
    "node_modules/**",
    "dist/**",
    "coverage/**"
  ],
  "disabledRules": [
    "localhost-check"
  ]
}
```

---

## 📊 Final Grade Report

After running a check, Snap-Fix provides a comprehensive report grading your code's production-readiness:

- **Grade A**: 0 issues - *Production Ready! 🚀 Perfect score.*
- **Grade B**: 1-2 issues - *Good, but could be better. Minor tweaks needed.*
- **Grade C**: 3-4 issues - *Average. Please review the suggested fixes.*
- **Grade D**: >4 issues - *Needs Work. 🚧 Significant production risks found.*

---

## 🧑‍💻 Development

Want to add new rules or tweak existing ones?

```bash
# Run tests via vitest
npm test

# Run tests in watch mode
npm run test:watch

# Lint the codebase
npm run lint
```

<details>
<summary><strong>Adding a Custom Rule</strong></summary>

Currently, built-in rules are located in the `lib/rules/` directory. You can easily extend the engine by extending the base `Rule` class:

```javascript
import { Rule } from './lib/rules/Rule.js';

export class MyCustomRule extends Rule {
  constructor() {
    super(
      'rule-id',
      'Display Name',
      'Description of what the rule detects.',
      /YOUR_REGEX_PATTERN/g,
      'Warning message to display.',
      'Suggested fix description.',
      (match, content) => {
        return `Code string for auto-replace`;
      }
    );
  }
}
```
</details>

---

## 🤝 Contributing
We welcome contributions! If you have ideas for new production rules, better regex patterns, or UI improvements, please open an issue or submit a pull request.

---

<div align="center">
  <p>Built with ❤️ for Developers - <i>Automate your checks and focus on building great software.</i></p>
</div>

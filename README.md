<div align="center">
  <h1>🚀 Snap-Fix 2.0</h1>
  <p><strong>Production-Ready Code Guard & Auto-Fixer for Node.js</strong></p>

  [![npm version](https://img.shields.io/npm/v/snap-fix.svg?style=flat-square)](https://www.npmjs.com/package/snap-fix)
  [![License](https://img.shields.io/npm/l/@ram-sah19/snap-fix.svg?style=flat-square)](https://github.com/Ram-sah19/snap-fix/blob/main/LICENSE)
</div>

Snap-Fix is a Node.js CLI tool that bridges the "Junior-to-Senior" gap by automatically reviewing code for production-readiness. Version **2.0** introduces four major upgrades: brand-agnostic entropy-based secret detection, automated `.env` management, one-button commands, and a full undo system.

---

## 📑 Table of Contents
- [✨ What's New in 2.0](#-whats-new-in-20)
- [🛡️ Features](#️-features)
- [🚀 Getting Started](#-getting-started)
- [📖 Usage & Commands](#-usage--commands)
- [🛠️ Rules & Configuration](#️-rules--configuration)
- [📊 Final Grade Report](#-final-grade-report)
- [🧑‍💻 Development](#-development)
- [🤝 Contributing](#-contributing)

---

## ✨ What's New in 2.0

### 1. 🔬 Universal Secret Sentry (Entropy Mode)
The old detector only caught `sk-...` style (OpenAI) keys. The new one uses **Shannon Entropy** — pure mathematics — to detect *any* high-randomness string assigned to a secret-like variable, regardless of brand.

```js
// ✅ NOW DETECTED — any brand, any format
const apiKey    = "xK9mP2qL8vN4wJ7rT3sY6uC1eA5bD0fH";  // Generic
const token     = "ghp_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5";  // GitHub
const clientSecret = "AKIAIOSFODNN7EXAMPLE1234567890AB";   // AWS
```

### 2. 📦 Automated `.env` Management
When a secret is fixed, snap-fix automatically:
- Writes `VARNAME=<secret>` to your `.env` file (creates it if missing)
- Replaces the hardcoded value with `process.env.VARNAME` in your source
- Adds `.env` to `.gitignore` — automatically, every time

### 3. ⚡ One-Button Commands
No more long combos. Three upgrades to the CLI:

| Name | Old Way | New Way |
|---|---|---|
| **Mind Reader** | `check ./src/**/*` | `check` — scans `.` by default |
| **Nickname** | `check` | `c` — single letter alias |
| **Fast Forward** | `--fix` | `-y` — friendlier "yes to all" |

### 4. ↩️ The Undo Button
Every fix run now saves a snapshot of each original file in `.snap-fix/backups/`. One command brings everything back:
```bash
npx snap-fix undo
```

---

## 🛡️ Features

- **🔬 Entropy Secret Sentry**: Catches *any* high-entropy secret — not just OpenAI keys.
- **📦 Auto .env Management**: Moves secrets to `.env` and locks down `.gitignore` automatically.
- **↩️ Undo Button**: Every fix session is snapshotted. Roll back instantly if needed.
- **🌍 Localhost Detector**: Finds hardcoded `localhost` URLs and suggests env-based alternatives.
- **⚡ Async Guard**: Identifies `await` calls not wrapped in `try/catch`.
- **🔒 Security Sweeps**: Detects SQL injection patterns and `.innerHTML` XSS risks.
- **🎯 One-Button CLI**: Alias `c`, default path `.`, and `-y` flag for zero-friction usage.
- **🔍 Dry Run Mode**: Preview all fixes safely before touching any file.
- **🎨 Premium UI**: Chalk-powered terminal output with a final production grade report.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher)
- npm

### Installation
```bash
# Run instantly without installing
npx snap-fix check

# Or install globally
npm install -g snap-fix
```

*For local development and testing:*
```bash
git clone https://github.com/Ram-sah19/snap-fix.git
cd snap-fix
npm link
```

---

## 📖 Usage & Commands

### ⚡ The One-Button Command
```bash
# Scans everything in the current folder — no arguments needed
npx snap-fix check

# Same, using the short alias
npx snap-fix c

# Auto-approve all fixes (the "Yes to everything" button)
npx snap-fix c -y
```

### Scan a Specific Path
```bash
# A single file
npx snap-fix c index.js

# A directory — auto-expands to src/**/* recursively
npx snap-fix c ./src

# An explicit glob pattern
npx snap-fix c "src/**/*.js"
```

### Dry Run Mode
Preview every fix without modifying any files:
```bash
npx snap-fix c --dry-run
npx snap-fix c ./src --dry-run
```

### Interactive Fix (confirm each one)
```bash
npx snap-fix c ./src
# Prompts: "Apply fix for Secret Sentry? (Y/n)"
```

### Auto-Fix Everything
```bash
npx snap-fix c ./src --fix
npx snap-fix c ./src -y      # same, shorter
```

### ↩️ Undo Last Session
Reverts all files changed in the last `--fix` run:
```bash
npx snap-fix undo
```

### Full Options Reference
```
snap-fix c [path] [options]

Arguments:
  path          File, directory, or glob to scan (default: ".")

Options:
  -f, --fix     Apply all fixes automatically without prompting
  -y, --yes     Alias for --fix (friendly "yes to all")
  -d, --dry-run Show fixes without modifying any files
  -h, --help    Display help
```

---

## 🛠️ Rules & Configuration

Snap-Fix enforces best practices using an extensible rules engine.

### Built-in Rules
| Rule ID | What It Detects | Auto-Fix |
| :--- | :--- | :--- |
| `secret-sentry` | Any high-entropy string in a secret-like variable (brand-agnostic, Shannon Entropy) | Moves to `.env`, replaces with `process.env.VAR` |
| `localhost-check` | Hardcoded `http://localhost` endpoints | Replaces with `process.env.API_URL` |
| `async-guard` | `await` without a `try/catch` boundary | Suggestion only |
| `sql-injection` | String interpolation inside SQL queries | Suggestion only |
| `xss-detector` | Direct `.innerHTML` assignments | Suggestion only |

### How the Entropy Detector Works
The `secret-sentry` rule flags a string only when **both** conditions are true:
1. The **variable name** looks secret-related (`apiKey`, `token`, `password`, `credential`, `secret`, etc.)
2. The **string value** has a Shannon Entropy score **above 3.5 bits/character** — meaning it looks truly random, not a plain English word.

This means no false positives on `const password = "helloworld"` but guaranteed detection of `const apiKey = "xK9mP2qL8vN4wJ7rT3sY6uC1eA5bD0fH"`.

### How the `.env` Auto-Manager Works
After fixing a secret, snap-fix:
1. Creates `.env` in the project root if it doesn't exist
2. Appends `VARNAME=<original_secret>` to `.env`
3. Writes `process.env.VARNAME` into your source file
4. Ensures `.env` is listed in `.gitignore`
5. Also ensures `.snap-fix/` (backups folder) is in `.gitignore`

### How the Undo System Works
Before overwriting any file, snap-fix:
1. Creates `.snap-fix/backups/session-<timestamp>/` in your project root
2. Saves a snapshot of every file it's about to modify
3. Logs the session to `.snap-fix/sessions.json`

Running `npx snap-fix undo` reads the last session, restores all original files, and removes the session from the log so it can't be undone twice.

### Configuration File (`.profixrc`)
Create a `.profixrc` JSON file in your project root to ignore files or disable specific rules:

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

After every scan, snap-fix grades your code's production-readiness:

| Grade | Issues | Message |
|---|---|---|
| **A** 🟢 | 0 | Production Ready! 🚀 Perfect score. |
| **B** 🟡 | 1–2 | Good, but could be better. Minor tweaks needed. |
| **C** 🟠 | 3–4 | Average. Please review the suggested fixes. |
| **D** 🔴 | > 4 | Needs Work. 🚧 Significant production risks found. |

---

## 🧑‍💻 Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint the codebase
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

<details>
<summary><strong>Project Structure</strong></summary>

```
snap-fix/
├── index.js              # CLI entry point (check, undo commands)
├── lib/
│   ├── engine.js         # Core scanner — orchestrates rules, backups, .env writes
│   ├── ui.js             # Terminal output (chalk, banner, grade report)
│   ├── backup.js         # Snapshot sessions + undo logic
│   ├── envManager.js     # .env writer + .gitignore protector
│   └── rules/
│       ├── Rule.js           # Base class for all rules
│       ├── SecretSentryRule.js  # Entropy-based secret detection (2.0)
│       ├── LocalhostRule.js
│       ├── AsyncGuardRule.js
│       ├── SQLInjectionRule.js
│       └── XSSRule.js
└── tests/
    ├── rules.test.js     # Unit tests for each rule
    └── snap-fix.test.js  # Integration tests for the rules engine
```

</details>

<details>
<summary><strong>Adding a Custom Rule</strong></summary>

All rules live in `lib/rules/` and extend the base `Rule` class:

```javascript
import { Rule } from './lib/rules/Rule.js';

export class MyCustomRule extends Rule {
  constructor() {
    super(
      'rule-id',          // unique ID used in .profixrc disabledRules
      'Display Name',
      'Description of what the rule detects.',
      /YOUR_REGEX_PATTERN/g,
      'Warning message to display.',
      'Suggested fix description.',
      (match, content) => {
        return `replacement string for auto-fix`;
      }
    );
  }
}
```

Then register it in `lib/rules/index.js` inside `getRules()`.

</details>

---

## 🤝 Contributing
We welcome contributions! If you have ideas for new production rules, better entropy thresholds, or UI improvements, please open an issue or submit a pull request.

---

<div align="center">
  <p>Built with ❤️ for Developers — <i>Automate your checks and focus on building great software.</i></p>
  <p><strong>Snap-Fix 2.0</strong> — The Secret Fix · The Storage Fix · The Speed Fix · The Trust Fix</p>
</div>

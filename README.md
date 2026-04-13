# 🚀 Snap-Fix: Production-Ready Code Guard

Snap-Fix is a Node.js CLI tool designed to bridge the "Junior-to-Senior" gap by automatically reviewing code for production-readiness. It identifies common pitfalls like hardcoded secrets, local development URLs, and potentially unsafe asynchronous patterns.

---

## ✨ Features

- **🛡️ Secret Sentry**: Detects hardcoded API keys and credentials (e.g., OpenAI, Stripe-like patterns).
- **🌍 Localhost Detector**: Finds hardcoded `localhost` URLs and suggests environment-based alternatives.
- **⚡ Async Guard**: Identifies `await` calls that aren't wrapped in `try/catch` blocks for better reliability.
- **🛠️ Interactive Fixes**: Confirm each suggestion before applying it to your source code.
- **📦 Bulk Processing**: Use the `--fix` flag to automatically apply all production-ready fixes.
- **🎨 Premium UI**: Beautiful terminal output powered by `chalk` and `commander`.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm

### Installation

To install and link Snap-Fix locally for development:

1. Clone or navigate to the project directory:
   ```bash
   cd d:/Gsoc/npm
   ```

2. Link the package globally:
   ```bash
   npm link
   ```

Now you can run the `snap-fix` command from anywhere in your terminal!..

---

## 📖 Usage

### Basic Check
Scan a specific file for production issues:
```bash
snap-fix check index.js
```

### Batch Scanning
Check all JavaScript files in a directory using glob patterns:
```bash
snap-fix check "**/*.js"
```

### Automated Fixing
Automatically apply all suggested fixes without manual confirmation:
```bash
snap-fix check test.js --fix
```

---

## 🛠️ Configuration & Rules

Snap-Fix uses a customizable rules engine located in `lib/rules.js`. Current rules include:

| Rule ID | Name | Detection | Suggestion |
| :--- | :--- | :--- | :--- |
| `localhost-check` | Localhost Detector | Hardcoded `http://localhost` | Replace with `process.env.API_URL` |
| `secret-sentry` | Secret Sentry | Hardcoded strings like `sk-...` | Move to a `.env` file |
| `async-guard` | Async Guard | `await` outside of `try { ... }` | Wrap in a try/catch block |

---

## 🛡️ License

This project is licensed under the ISC License.

---

## 🤝 Contributing

We welcome contributions! If you have ideas for new production rules or UI improvements, feel free to submit a pull request.

---

### Built with ❤️ for Developers
*Automate your production checks and focus on building great software.*

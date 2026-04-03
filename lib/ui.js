import chalk from 'chalk';

export const logger = {
  info: (msg) => console.log(chalk.blue('ℹ ') + msg),
  success: (msg) => console.log(chalk.green('✔ ') + msg),
  warn: (msg) => console.log(chalk.yellow('⚠ ') + msg),
  error: (msg) => console.log(chalk.red('✖ ') + msg),
  highlight: (msg) => chalk.cyan(msg),
  fix: (msg) => chalk.greenBright(msg),
  issue: (msg) => chalk.redBright(msg),
};

export const banner = () => {
  console.log(chalk.bold.magenta('\n🚀 Snap-Fix: Production-Ready Code Guard\n'));
};

export const renderSummary = (totalIssues) => {
  console.log(chalk.bold.white('\n' + '='.repeat(40)));
  console.log(chalk.bold.white('📊 FINAL PRODUCTION READINESS REPORT'));
  console.log(chalk.bold.white('='.repeat(40)));

  let grade, color, message;

  if (totalIssues === 0) {
    grade = 'A';
    color = chalk.greenBright;
    message = 'Production Ready! 🚀 Perfect score.';
  } else if (totalIssues <= 2) {
    grade = 'B';
    color = chalk.green;
    message = 'Good, but could be better. Minor tweaks needed.';
  } else if (totalIssues <= 4) {
    grade = 'C';
    color = chalk.yellow;
    message = 'Average. Please review the suggested fixes.';
  } else {
    grade = 'D';
    color = chalk.redBright;
    message = 'Needs Work. 🚧 Significant production risks found.';
  }

  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`Final Grade: ${color.bold(grade)}`);
  console.log(`${color(message)}`);
  console.log(chalk.bold.white('='.repeat(40) + '\n'));
};

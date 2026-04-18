import { expect, test, describe } from 'vitest';
import { LocalhostRule, SecretSentryRule, AsyncGuardRule, SQLInjectionRule, XSSRule } from '../lib/rules/index.js';

describe('ProFix Rule Logic', () => {

  test('LocalhostRule should detect localhost URLs with ports and paths', () => {
    const rule = new LocalhostRule();
    const code = 'const api = "http://localhost:5000/api/v1"';
    const issues = rule.check(code);
    
    expect(issues.length).toBe(1);
    expect(issues[0].message).toContain('localhost');
    expect(issues[0].fix).toContain('process.env.API_URL');
  });

  test('SecretSentryRule should detect any high-entropy secret via entropy + name heuristic', () => {
    const rule = new SecretSentryRule();
    // Uses a generic random-looking key NOT branded as OpenAI — proving brand-agnostic detection
    const code = 'const apiKey = "xK9mP2qL8vN4wJ7rT3sY6uC1eA5bD0fH"';
    const issues = rule.check(code);

    expect(issues.length).toBe(1);
    expect(issues[0].ruleId).toBe('secret-sentry');
    expect(issues[0].fix).toContain('process.env.APIKEY');
    expect(issues[0].isSecret).toBe(true);
    expect(issues[0].envKey).toBe('APIKEY');
    expect(issues[0].secretValue).toBe('xK9mP2qL8vN4wJ7rT3sY6uC1eA5bD0fH');
  });

  test('SecretSentryRule should NOT flag low-entropy plain strings', () => {
    const rule = new SecretSentryRule();
    // "helloworld" is low entropy and not a real secret
    const code = 'const apiKey = "helloworldhello"';
    const issues = rule.check(code);
    expect(issues.length).toBe(0);
  });

  test('AsyncGuardRule should detect await calls outside try/catch', () => {
    const rule = new AsyncGuardRule();
    const code = 'const data = await fetch(url);';
    const issues = rule.check(code);
    
    expect(issues.length).toBe(1);
    expect(issues[0].ruleId).toBe('async-guard');
  });

  test('AsyncGuardRule should NOT detect await calls inside same-line try/catch', () => {
    const rule = new AsyncGuardRule();
    const code = 'try { await fetch(url); } catch(e) {}';
    const issues = rule.check(code);
    
    expect(issues.length).toBe(0);
  });

  test('SQLInjectionRule should detect vulnerable query interpolation', () => {
    const rule = new SQLInjectionRule();
    const code = 'const query = `SELECT * FROM users WHERE id = ${userId}`;';
    const issues = rule.check(code);
    
    expect(issues.length).toBe(1);
    expect(issues[0].ruleId).toBe('sql-injection');
  });

  test('XSSRule should detect innerHTML assignments', () => {
    const rule = new XSSRule();
    const code = 'document.getElementById("app").innerHTML = "<div>" + userInput + "</div>";';
    const issues = rule.check(code);
    
    expect(issues.length).toBe(1);
    expect(issues[0].ruleId).toBe('xss-detector');
  });
});

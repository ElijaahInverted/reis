---
description: Full architecture, UI, and security review for pull requests
---

# PR Review Workflow

Run a comprehensive review before merging any significant changes.

## Steps

### 1. UI Compliance Check
Invoke `@daisy-enforcer scan` on changed files:
- Flag raw Tailwind button/card/input patterns
- Ensure semantic color tokens are used
- Check DaisyUI component usage

### 2. Architecture Validation
Invoke `@reis-guardian review` on changed files:
- Verify StorageService usage (no raw chrome.storage)
- Check asset URLs use chrome.runtime.getURL
- Confirm types are imported from src/types/
- Validate file structure conventions

### 3. Security Audit
Invoke `@extension-security audit` on changed files:
- Check for XSS vulnerabilities
- Verify no credential storage
- Confirm CSP compliance
- Flag any suspicious external requests

### 4. Parser Observability (if parsers changed)
Invoke `@parser-debugger scan` on changed parser files:
- Ensure console.debug logging present
- Verify edge cases are logged

---

## Usage

```
/pr-review
```

Or manually run each step for focused review.

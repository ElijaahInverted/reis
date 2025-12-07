---
description: Security audit for Chrome extension vulnerabilities
---

# Security Check Workflow

Comprehensive security audit for extension-specific vulnerabilities.

## When to Use

- Before any release
- After adding external data handling
- When modifying Chrome API usage
- After adding new network requests

## Steps

### 1. Full Security Audit
```
@extension-security audit
```

### 2. Critical Checks

| Category | What to Flag |
|----------|-------------|
| **XSS** | `dangerouslySetInnerHTML`, `innerHTML` with external data |
| **Credentials** | Any password/credential storage |
| **CSP** | `eval()`, `new Function()`, inline scripts |
| **Permissions** | Undeclared Chrome API usage |
| **Data Leak** | Requests to non-IS Mendelu domains |

### 3. Specific File Check
```
@extension-security check src/api/documents.ts
```

---

## Usage

```
/security-check
```

## Risk Context

REIS handles:
- University student data
- Course schedules and grades
- Exam registrations

A security vulnerability could expose sensitive academic records. **Zero tolerance** for XSS or data leaks.

## Before Release Checklist

- [ ] No XSS vectors found
- [ ] No credential storage
- [ ] All Chrome APIs declared in manifest
- [ ] No external data exfiltration
- [ ] Content Security Policy compliant

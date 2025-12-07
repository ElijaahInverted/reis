---
description: Check parser functions for proper debug logging
---

# Parser Audit Workflow

Ensure all parsers have proper observability.

## When to Use

- After adding/modifying parser functions
- When debugging parsing issues
- Before deploying scraping changes

## Steps

### 1. Scan All Parsers
```
@parser-debugger scan
```

Target files:
- `src/utils/examParser.ts`
- `src/utils/scheduleParser.ts`
- Any `*Parser.ts` or parsing utility

### 2. Required Logging Checks

Each parser function must have:

| Step | Example |
|------|---------|
| Entry log | `console.debug('[functionName] Starting...')` |
| Key steps | `console.debug('[functionName] Found rows:', count)` |
| Edge cases | `console.debug('[functionName] Empty result, returning []')` |
| Result log | `console.debug('[functionName] Returning', results.length, 'items')` |

### 3. Add Missing Logging
```
@parser-debugger add-logging src/utils/examParser.ts
```

---

## Usage

```
/audit-parsers
```

## Why This Matters

IS Mendelu has undocumented HTML structure. When parsing breaks:
- Without logging: "It doesn't work" (hours of debugging)
- With logging: Exact point of failure visible in console

This is **cheap insurance** against future debugging pain.

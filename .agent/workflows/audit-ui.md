---
description: Quick DaisyUI compliance scan for UI consistency
---

# UI Audit Workflow

Fast check for DaisyUI and design system compliance.

## When to Use

- Before committing UI changes
- When reviewing component refactors
- After adding new components

## Steps

### 1. Scan Components
```
@daisy-enforcer scan src/components
```

### 2. Focus on Common Violations

Look for:
- Raw `px-* py-*` on buttons → use `btn`
- `border rounded shadow` patterns → use `card`
- Literal colors (`text-green-500`) → use semantic tokens
- Custom input styling → use `input input-bordered`

### 3. Check Theme Consistency

Ensure usage of REIS tokens:
- `brand-primary` over `green-500`
- `surface-*` for backgrounds
- `content-*` for text colors

---

## Usage

```
/audit-ui
```

Or for a specific file:
```
@daisy-enforcer fix src/components/ExamDrawer.tsx
```

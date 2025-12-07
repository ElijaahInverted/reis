#!/bin/bash

# ===========================================
# REIS DaisyUI Compliance Check
# Run before commits to catch UI violations
# ===========================================

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Running DaisyUI compliance check..."

VIOLATIONS=0

# Check for raw px-* py-* button patterns (excluding ui/ primitives)
echo ""
echo "Checking for raw Tailwind button patterns..."
BUTTON_VIOLATIONS=$(grep -rn "px-[0-9].*py-[0-9]" src/components/*.tsx 2>/dev/null | grep -v "src/components/ui/" | wc -l | tr -d ' ')
if [ "$BUTTON_VIOLATIONS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $BUTTON_VIOLATIONS potential button violations (px-* py-* patterns)${NC}"
    grep -rn "px-[0-9].*py-[0-9]" src/components/*.tsx 2>/dev/null | grep -v "src/components/ui/" | head -5
    echo "   ... use 'btn', 'btn-primary', etc. instead"
    VIOLATIONS=$((VIOLATIONS + BUTTON_VIOLATIONS))
fi

# Check for literal color usage (excluding ui/ primitives)
echo ""
echo "Checking for literal color references..."
COLOR_VIOLATIONS=$(grep -rEn "text-(red|blue|green|yellow|orange|purple|pink)-[0-9]+" src/components/*.tsx 2>/dev/null | grep -v "src/components/ui/" | wc -l | tr -d ' ')
if [ "$COLOR_VIOLATIONS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $COLOR_VIOLATIONS literal text color violations${NC}"
    grep -rEn "text-(red|blue|green|yellow|orange|purple|pink)-[0-9]+" src/components/*.tsx 2>/dev/null | grep -v "src/components/ui/" | head -5
    echo "   ... use 'text-primary', 'text-error', 'text-base-content', etc."
    VIOLATIONS=$((VIOLATIONS + COLOR_VIOLATIONS))
fi

BG_VIOLATIONS=$(grep -rEn "bg-(red|blue|green|yellow|orange|purple|pink)-[0-9]+" src/components/*.tsx 2>/dev/null | grep -v "src/components/ui/" | wc -l | tr -d ' ')
if [ "$BG_VIOLATIONS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $BG_VIOLATIONS literal bg color violations${NC}"
    grep -rEn "bg-(red|blue|green|yellow|orange|purple|pink)-[0-9]+" src/components/*.tsx 2>/dev/null | grep -v "src/components/ui/" | head -5
    echo "   ... use 'bg-primary', 'bg-error', 'bg-base-100', etc."
    VIOLATIONS=$((VIOLATIONS + BG_VIOLATIONS))
fi

# Summary
echo ""
echo "=========================================="
if [ "$VIOLATIONS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Total violations found: $VIOLATIONS${NC}"
    echo "Consider fixing these before committing."
    echo "Run '/audit-ui' in Antigravity for detailed analysis."
    # Exit with warning but don't block commit (change to exit 1 to block)
    exit 0
else
    echo -e "${GREEN}✅ No DaisyUI violations found!${NC}"
    exit 0
fi

#!/usr/bin/env bash
set -euo pipefail

echo "[1/5] Running lint"
pnpm run lint

echo "[2/5] Running critical path coverage"
pnpm exec vitest run tests/e2e/critical-path-routing.test.tsx

echo "[3/5] Running full unit/integration suite"
pnpm run test

echo "[4/5] Running production build"
pnpm run build

echo "[5/5] Running coverage snapshot"
pnpm run test:coverage

echo "Release gate passed."

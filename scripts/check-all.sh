#!/usr/bin/env bash
set -euo pipefail

echo "[1/3] Running lint"
pnpm run lint

echo "[2/3] Running tests"
pnpm run test

echo "[3/3] Running build"
pnpm run build

echo "All frontend checks passed."

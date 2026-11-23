#!/usr/bin/env bash
# PantauNegeri — Server Dependency Setup
# Safe for aaPanel Ubuntu: does NOT touch MySQL/Nginx/OpenLiteSpeed managed by aaPanel.
# Run as root: bash scripts/setup-deps.sh
set -euo pipefail

echo "==> [1/5] Update apt package list"
apt-get update -qq

echo "==> [2/5] Install OS-level document processing tools"
apt-get install -y --no-install-recommends \
  tesseract-ocr \
  tesseract-ocr-ind \
  tesseract-ocr-eng \
  poppler-utils \
  ghostscript \
  curl \
  ca-certificates \
  gnupg

echo "==> [3/5] Install Node.js LTS (via NodeSource) if not present"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  apt-get install -y nodejs
else
  echo "    Node.js already installed: $(node -v)"
fi

echo "==> [4/5] Install PM2 globally"
npm install -g pm2@latest

echo "==> [5/5] Install pnpm (monorepo package manager)"
npm install -g pnpm@latest

echo ""
echo "==> Setup complete. Versions:"
echo "    tesseract  : $(tesseract --version 2>&1 | head -1)"
echo "    pdftotext  : $(pdftotext -v 2>&1 | head -1)"
echo "    node       : $(node -v)"
echo "    pm2        : $(pm2 --version)"
echo "    pnpm       : $(pnpm --version)"
echo ""
echo "Next: cd /www/wwwroot/pantaunegeri && pnpm install && pm2 start ecosystem.config.js"

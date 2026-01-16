#!/usr/bin/env bash
# scripts/package_desktop_release.sh
# Collect the critical launch artifacts into a folder on the Desktop and zip it.
# Usage: ./scripts/package_desktop_release.sh [DEST_FOLDER]
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEST_NAME="${1:-BlazeMixMaster_Launch_$TIMESTAMP}"
DEST_PATH="$HOME/Desktop/$DEST_NAME"

echo ">>> Creating release package at $DEST_PATH..."
mkdir -p "$DEST_PATH"

# 1. Copy documentation
echo ">>> Copying documentation..."
mkdir -p "$DEST_PATH/docs"
cp -r docs/launch "$DEST_PATH/docs/" 2>/dev/null || echo "Warning: docs/launch missing"
cp docs/EVIDENCE_README.md "$DEST_PATH/" 2>/dev/null || echo "Warning: docs/EVIDENCE_README.md missing"
cp docs/COUNSEL_PSP_EMAIL.md "$DEST_PATH/" 2>/dev/null || echo "Warning: docs/COUNSEL_PSP_EMAIL.md missing"
cp REGULATOR_PACK.md "$DEST_PATH/" 2>/dev/null || echo "Warning: REGULATOR_PACK.md missing"
cp PROOFS_README.md "$DEST_PATH/" 2>/dev/null || echo "Warning: PROOFS_README.md missing"

# 2. Copy scripts and migrations
echo ">>> Copying scripts and migrations..."
mkdir -p "$DEST_PATH/scripts"
cp scripts/validate_staging_attestation.sh "$DEST_PATH/scripts/" 2>/dev/null || echo "Warning: validate_staging_attestation.sh missing"
cp scripts/antigravity-ci-harness.cjs "$DEST_PATH/scripts/" 2>/dev/null || echo "Warning: antigravity-ci-harness.cjs missing"
cp scripts/ingest_public_domain.sh "$DEST_PATH/scripts/" 2>/dev/null || echo "Warning: ingest_public_domain.sh missing"
cp scripts/generate_proofs.js "$DEST_PATH/scripts/" 2>/dev/null || echo "Warning: generate_proofs.js missing"
cp scripts/verify_score_client.js "$DEST_PATH/scripts/" 2>/dev/null || echo "Warning: verify_score_client.js missing"

mkdir -p "$DEST_PATH/migrations"
cp migrations/*.sql "$DEST_PATH/migrations/" 2>/dev/null || echo "Warning: migrations missing"

# 3. Copy key code files
echo ">>> Copying key code files..."
mkdir -p "$DEST_PATH/code/components"
cp src/components/PaymentLinks.jsx "$DEST_PATH/code/components/" 2>/dev/null || echo "Warning: PaymentLinks.jsx missing"
cp src/components/RealMoneyBanner.jsx "$DEST_PATH/code/components/" 2>/dev/null || echo "Warning: RealMoneyBanner.jsx missing"
mkdir -p "$DEST_PATH/code/server"
cp server/routes/profilePayments.js "$DEST_PATH/code/server/" 2>/dev/null || echo "Warning: profilePayments.js missing"

# 4. Copy evidence (if present)
echo ">>> Checking for existing evidence..."
if [ -d "evidence" ]; then
  cp -r evidence "$DEST_PATH/"
fi
cp evidence_*.zip "$DEST_PATH/" 2>/dev/null || true

# 5. Create the ZIP
echo ">>> Creating final ZIP on Desktop..."
cd "$HOME/Desktop"
zip -r "${DEST_NAME}.zip" "$DEST_NAME"

echo "--------------------------------------------------------"
echo "✅ Success! Release package created."
echo "📂 Folder: $DEST_PATH"
echo "📦 ZIP: $HOME/Desktop/${DEST_NAME}.zip"
echo "--------------------------------------------------------"

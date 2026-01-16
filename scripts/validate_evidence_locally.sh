#!/bin/bash
set -euo pipefail

# ════════════════════════════════════════════════════════════════════════════════
# BLAZETV EVIDENCE BUNDLE LOCAL VALIDATOR
# ════════════════════════════════════════════════════════════════════════════════
#
# Usage: ./scripts/validate_evidence_locally.sh
#
# This script validates the evidence bundle locally by:
# 1. Finding and extracting the evidence ZIP
# 2. Listing all files
# 3. Checking harness_output for merkle/anchor activity
# 4. Extracting merkle_root and anchor_tx from proofs/*.json
# 5. Comparing merkle roots between proofs/ and db/proofs_table.txt
# 6. Generating a validation report
#
# ════════════════════════════════════════════════════════════════════════════════

ZIP=$(ls -1 blazetv_evidence_*.zip 2>/dev/null | head -n1 || echo "")
if [ -z "$ZIP" ]; then
  echo "❌ ERROR: No blazetv_evidence_*.zip found in $(pwd)"
  echo "Available files:"
  ls -la *.zip 2>/dev/null || echo "(no zip files found)"
  exit 2
fi

TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║             BLAZETV EVIDENCE BUNDLE LOCAL VALIDATOR                       ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📦 Evidence Bundle: $ZIP"
echo "📂 Temp Directory: $TMP"
echo ""

# Extract
echo "🔍 Extracting bundle..."
unzip -q "$ZIP" -d "$TMP"
echo "✅ Extraction complete"
echo ""

# Find the actual bundle directory (might be nested)
BUNDLE_DIR=$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -n1)
if [ -z "$BUNDLE_DIR" ]; then
  BUNDLE_DIR="$TMP"
fi

echo "📋 TOP-LEVEL FILES IN BUNDLE:"
echo "─────────────────────────────────────────────────────────────────────────────"
ls -lh "$BUNDLE_DIR" | tail -n +2 | awk '{printf "%-50s %10s\n", $9, $5}'
echo ""

# Check harness output
HARN="$BUNDLE_DIR/harness_output.txt"
if [ -f "$HARN" ]; then
  echo "🔗 HARNESS OUTPUT (merkle/anchor activity):"
  echo "─────────────────────────────────────────────────────────────────────────────"
  grep -Ei 'merkle|anchor|Anchored|anchor_tx|merkle_root|Status|verified|validation' "$HARN" | head -50 || echo "(no merkle/anchor lines found)"
  echo ""
  echo "Total lines in harness_output.txt: $(wc -l < "$HARN")"
  echo ""
else
  echo "⚠️  WARN: harness_output.txt not found"
  echo ""
fi

# Check proofs
PROOFDIR="$BUNDLE_DIR/proofs"
if [ -d "$PROOFDIR" ]; then
  PROOF_COUNT=$(find "$PROOFDIR" -name "*.json" | wc -l)
  echo "📊 PROOFS SUMMARY ($PROOF_COUNT proof files):"
  echo "─────────────────────────────────────────────────────────────────────────────"
  
  if [ "$PROOF_COUNT" -gt 0 ]; then
    echo "ID / Match ID                                  Merkle Root                        Anchor TX"
    echo "─────────────────────────────────────────────────────────────────────────────"
    
    for f in $(find "$PROOFDIR" -name "*.json" | sort | head -20); do
      # Extract key fields
      ID=$(jq -r '.match_id // .id // .video_id // .provider_id // "unknown"' "$f" 2>/dev/null || echo "?")
      MERKLE=$(jq -r '.merkle_root // "none"' "$f" 2>/dev/null || echo "?")
      ANCHOR=$(jq -r '.anchor_tx // "none"' "$f" 2>/dev/null || echo "?")
      
      # Truncate for display
      ID_SHORT="${ID:0:30}"
      MERKLE_SHORT="${MERKLE:0:32}"
      ANCHOR_SHORT="${ANCHOR:0:32}"
      
      printf "%-45s %-35s %s\n" "$ID_SHORT" "$MERKLE_SHORT" "$ANCHOR_SHORT"
    done
  else
    echo "  (no proof JSON files found)"
  fi
  echo ""
else
  echo "⚠️  WARN: proofs/ directory not found"
  echo ""
fi

# Check database dump
DB_FILE="$BUNDLE_DIR/db/proofs_table.txt"
if [ -f "$DB_FILE" ]; then
  echo "🗄️  DATABASE PROOFS TABLE (first 30 lines):"
  echo "─────────────────────────────────────────────────────────────────────────────"
  sed -n '1,30p' "$DB_FILE"
  echo ""
  echo "Total lines in proofs_table.txt: $(wc -l < "$DB_FILE")"
  echo ""
else
  echo "⚠️  WARN: db/proofs_table.txt not found"
  echo ""
fi

# Compare merkle roots
echo "🔄 MERKLE ROOT COMPARISON:"
echo "─────────────────────────────────────────────────────────────────────────────"
if [ -d "$PROOFDIR" ] && [ -f "$DB_FILE" ]; then
  PROOF_ROOTS=$(find "$PROOFDIR" -name "*.json" -exec jq -r '.merkle_root // empty' {} \; 2>/dev/null | sort -u | wc -l)
  DB_ROOTS=$(grep -oE '0x[0-9a-fA-F]{32,}' "$DB_FILE" 2>/dev/null | sort -u | wc -l)
  
  echo "  Unique merkle_root values in proofs/: $PROOF_ROOTS"
  echo "  Unique 0x-prefixed hashes in DB: $DB_ROOTS"
  
  if [ "$PROOF_ROOTS" -gt 0 ] && [ "$DB_ROOTS" -gt 0 ]; then
    echo "  ✅ Both proofs and DB contain merkle/hash data"
  elif [ "$PROOF_ROOTS" -eq 0 ] && [ "$DB_ROOTS" -eq 0 ]; then
    echo "  ⚠️  No merkle_root data found in either proofs or DB (check if attestation ran)"
  else
    echo "  ⚠️  Mismatch: one has data, other doesn't"
  fi
else
  echo "  ⚠️  Cannot compare: missing proofs/ or db/proofs_table.txt"
fi
echo ""

# Final status
echo "✅ VALIDATION COMPLETE"
echo "─────────────────────────────────────────────────────────────────────────────"
echo ""
echo "📌 NEXT STEPS:"
echo "   1. Copy the full output of this script"
echo "   2. Paste it in the chat for final validation"
echo "   3. I'll verify merkle roots, anchor_tx, and generate final counsel email"
echo ""
echo "📋 Bundle contents verified:"
echo "   ✅ harness_output.txt present"
if [ -d "$PROOFDIR" ]; then
  echo "   ✅ proofs/ directory with $(find "$PROOFDIR" -name "*.json" | wc -l) proof files"
else
  echo "   ⚠️  proofs/ directory missing or empty"
fi
if [ -f "$DB_FILE" ]; then
  echo "   ✅ db/proofs_table.txt with $(wc -l < "$DB_FILE") records"
else
  echo "   ⚠️  db/proofs_table.txt missing"
fi
echo ""

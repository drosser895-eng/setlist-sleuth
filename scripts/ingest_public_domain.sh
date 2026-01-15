#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <ia_id> \"Title\" \"Creator\" YEAR"
  exit 1
fi
echo "Ingesting $1..."

#!/usr/bin/env python3
"""
extract_roots.py

Extract merkle roots, anchor transactions, and proof IDs from a blazetv_evidence_*.zip 
bundle and write a tab-separated summary for use in counsel email generation.

Usage:
  python3 scripts/extract_roots.py <evidence_zip_path> <output_summary.tsv>

Example:
  python3 scripts/extract_roots.py artifacts/blazetv_evidence_20260116.zip artifacts/proof_summary.tsv

Output format:
  id\tmerkle_root\tanchor_tx
  49279\t0xabcd...\t0x1234...
  51682\t0xdef0...\t0x5678...
  ...
"""

import sys
import zipfile
import json
import tempfile
import os
from pathlib import Path


def extract_roots(zip_path: str, output_tsv: str) -> None:
    """Extract proof data from ZIP and write TSV."""
    
    if not os.path.isfile(zip_path):
        print(f"❌ ZIP file not found: {zip_path}")
        sys.exit(1)
    
    proofs_data = []
    
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            print(f"📦 Extracting {zip_path}...")
            
            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(tmpdir)
            
            proofs_dir = Path(tmpdir) / 'proofs'
            
            if not proofs_dir.exists():
                print(f"⚠️  No 'proofs' directory in ZIP. Checking for JSON files...")
                # Look for any .json files in the ZIP
                for json_file in Path(tmpdir).glob('**/*.json'):
                    try:
                        with open(json_file, 'r') as f:
                            data = json.load(f)
                            proof_id = data.get('match_id') or data.get('id') or data.get('video_id') or 'unknown'
                            merkle_root = data.get('merkle_root') or 'none'
                            anchor_tx = data.get('anchor_tx') or 'pending'
                            proofs_data.append((proof_id, merkle_root, anchor_tx))
                    except json.JSONDecodeError as e:
                        print(f"⚠️  Could not parse {json_file}: {e}")
            else:
                print(f"📂 Found proofs directory. Extracting {len(list(proofs_dir.glob('*.json')))} proof files...")
                
                for proof_file in sorted(proofs_dir.glob('*.json')):
                    try:
                        with open(proof_file, 'r') as f:
                            data = json.load(f)
                            proof_id = data.get('match_id') or data.get('id') or data.get('video_id') or 'unknown'
                            merkle_root = data.get('merkle_root') or 'none'
                            anchor_tx = data.get('anchor_tx') or 'pending'
                            proofs_data.append((proof_id, merkle_root, anchor_tx))
                    except json.JSONDecodeError as e:
                        print(f"⚠️  Could not parse {proof_file}: {e}")
            
            # Write TSV output
            os.makedirs(os.path.dirname(output_tsv) or '.', exist_ok=True)
            
            with open(output_tsv, 'w') as out:
                out.write("id\tmerkle_root\tanchor_tx\n")
                for proof_id, merkle_root, anchor_tx in proofs_data:
                    out.write(f"{proof_id}\t{merkle_root}\t{anchor_tx}\n")
            
            print(f"✅ Extracted {len(proofs_data)} proofs")
            print(f"💾 Written to {output_tsv}")
            
            if proofs_data:
                print(f"\n📊 Sample proofs:")
                for proof_id, merkle_root, anchor_tx in proofs_data[:3]:
                    print(f"  ID: {proof_id}")
                    print(f"    Merkle: {merkle_root[:20]}...")
                    print(f"    AnchorTX: {anchor_tx[:20]}...")
    
    except zipfile.BadZipFile:
        print(f"❌ Invalid ZIP file: {zip_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error extracting roots: {e}")
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <evidence_zip_path> <output_summary.tsv>")
        sys.exit(1)
    
    zip_path = sys.argv[1]
    output_tsv = sys.argv[2]
    
    extract_roots(zip_path, output_tsv)

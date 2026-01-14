# Contract Deployment Playbook

## Preconditions
- Third-party audit completed.
- Multisig (Gnosis Safe) prepared.
- Keys in KMS/HSM.

## Testnet flow
1. Run tests & static analysis.
2. Deploy to staging (Mumbai/Goerli).
3. Verify on block explorer, run canary anchors.
4. Transfer ownership to multisig.

## Mainnet flow
- Freeze deployer key.
- Deploy with verified artifacts, publish ABI & address.

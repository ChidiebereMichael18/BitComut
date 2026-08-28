#!/usr/bin/env bash
# ============================================================
#  BitPulse — Setup Bitcoin Core (regtest) + LND inside WSL
#  Memory-optimized for a 4GB machine. No Polar needed.
#
#  Run INSIDE your WSL Ubuntu shell:
#     bash scripts/setup-wsl-lnd.sh
#
#  This gives the backend a real Lightning node on regtest.
#  After this completes, set USE_LND=true in .env and the backend
#  will connect using the LND_* values also in .env.
# ============================================================
set -euo pipefail

echo "==> Installing bitcoin & lnd (trimmed) ==================="
sudo apt-get update
sudo apt-get install -y bitcoin-cli bitcoind lnd

# ---------- bitcoind (regtest, memory-trimmed) ----------
mkdir -p ~/.bitcoin
cat > ~/.bitcoin/bitcoin.conf <<'EOF'
regtest=1
server=1
txindex=0
dbcache=64
maxmempool=32
daemon=1
fallbackfee=0.0002
[regtest]
rpcuser=bitpulse
rpcpassword=CHANGE_ME
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
EOF

# ---------- lnd (regtest, memory-trimmed) ----------
mkdir -p ~/.lnd
cat > ~/.lnd/lnd.conf <<'EOF'
[Application Options]
lnddir=/home/REB/.lnd
bitcoin.regtest=1
bitcoin.active=1
bitcoin.node=bitcoind
bitcoind.rpchost=127.0.0.1:18443
bitcoind.rpcuser=bitpulse
bitcoind.rpcpass=CHANGE_ME
bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332
bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333
debuglevel=info
maxpendingchannels=5
EOF

echo "==> Starting bitcoind (regtest) ========================="
bitcoind
sleep 3
bitcoin-cli -regtest createwallet "miner" || true
# Mine a few blocks so LND has coins to open channels with.
bitcoin-cli -regtest -rpcwallet=miner generatetoaddress 110 "$(bitcoin-cli -regtest -rpcwallet=miner getnewaddress)" > /dev/null

echo "==> Starting lnd ======================================="
lnd --lnddir=/home/REB/.lnd &
sleep 8

echo "==> Create LND wallet =================================="
# Unlock/create wallet non-interactively (custom cipher seed phrase concept).
lndinit gen-password /home/REB/.lnd/walletpassword 2>/dev/null || echo "using manual wallet password"
echo "NOTE: run  lncli create  interactively once to finalize the LND wallet."

echo ""
echo "DONE. Backend should be configured with:"
echo "  USE_LND=true"
echo "  LND_GRPC_HOST=localhost:10009"
echo "  LND_TLS_CERT_PATH=/home/REB/.lnd/tls.cert"
echo "  LND_MACAROON_PATH=/home/REB/.lnd/data/chain/bitcoin/regtest/admin.macaroon"
echo "  LND_NETWORK=regtest"

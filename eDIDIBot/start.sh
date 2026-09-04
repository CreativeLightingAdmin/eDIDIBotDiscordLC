#!/usr/bin/env bash
# eDIDIBot launcher for macOS / Linux. Run:  ./start.sh
# Plain script — everything here you can also do by hand (npm install,
# edit .env, node index.js). Edit freely.
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
	echo "Node.js is not installed. Install the LTS version from https://nodejs.org/ and try again."
	exit 1
fi

if [ ! -d node_modules ]; then
	echo "Installing dependencies (first run only)..."
	npm install
fi

if [ ! -f .env ]; then
	echo "First-time setup: creating .env"
	cp .env.example .env
	echo "Edit .env and paste your Discord bot token after DISCORD_TOKEN=, then run ./start.sh again."
	exit 0
fi

echo "Starting eDIDIBot... (Ctrl+C to stop)"
node index.js

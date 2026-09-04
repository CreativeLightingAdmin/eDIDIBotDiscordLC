// Centralised configuration loader.
//
// Secrets are read from environment variables first (recommended, via a .env
// file that is gitignored) and fall back to the legacy config.json so existing
// setups keep working. NEVER commit real tokens.

const path = require('node:path');
const fs = require('node:fs');

// Load .env if present (dependency is optional; ignore if not installed).
try {
	require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
	/* dotenv not installed - environment variables / config.json only */
}

function fromLegacyConfig() {
	const legacyPath = path.join(__dirname, '..', 'config.json');
	if (!fs.existsSync(legacyPath)) return {};
	try {
		return JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
	} catch (err) {
		console.warn(`[config] Could not parse config.json: ${err.message}`);
		return {};
	}
}

const legacy = fromLegacyConfig();

const config = {
	token: process.env.DISCORD_TOKEN || legacy.token,
	clientId: process.env.DISCORD_CLIENT_ID || legacy.clientId,
	// guildId is only needed for fast guild-scoped command deploys during dev.
	guildId: process.env.DISCORD_GUILD_ID || legacy.guildId,

	// Controller defaults. Plain TCP is port 23; TLS is port 443.
	controllerPort: Number(process.env.EDIDIO_PORT || legacy.controllerPort || 23),
	controllerTlsPort: Number(process.env.EDIDIO_TLS_PORT || legacy.controllerTlsPort || 443),
	defaultControllerIp: process.env.EDIDIO_IP || legacy.defaultControllerIp || null,

	// Access control: comma-separated Discord role IDs allowed to run control
	// commands. Empty/unset means everyone is allowed (fine for a private server).
	controlRoleIds: (process.env.CONTROL_ROLE_IDS || legacy.controlRoleIds || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean),

	// Heartbeat interval (ms) to keep the controller socket alive.
	heartbeatIntervalMs: Number(process.env.HEARTBEAT_MS || 7000),
};

function assertConfigured() {
	const missing = [];
	if (!config.token) missing.push('DISCORD_TOKEN');
	if (!config.clientId) missing.push('DISCORD_CLIENT_ID');
	if (missing.length) {
		throw new Error(
			`Missing required configuration: ${missing.join(', ')}. ` +
				'Set them in a .env file or config.json (see .env.example).',
		);
	}
}

module.exports = { config, assertConfigured };

// Tracks the active controller connection per Discord guild, so multiple
// servers using the same self-hosted bot don't fight over one socket.

const { ControllerConnection } = require('./ControllerConnection');
const { discoverControllers } = require('./discovery');
const { attachNotifications } = require('../ui/notify');

const connections = new Map(); // guildId -> ControllerConnection

// options: { port?, useTLS?, lineTypes?, client?, channelId? }
// If lineTypes isn't supplied (e.g. from /discover), we run a quick UDP discovery
// probe and match the connecting IP to learn the controller's line-type map. A
// probe failure never blocks the actual TCP connect.
//
// Returns { conn, connected, error }. On a failed initial connect we DON'T throw:
// the connection keeps retrying in the background and will notify the channel when
// it comes online. Callers report the pending state to the user.
async function openConnection(guildId, ip, options = {}) {
	// Replace any existing connection for this guild.
	closeConnection(guildId);

	let lineTypes = options.lineTypes || null;
	if (!lineTypes) {
		try {
			const found = await discoverControllers();
			const match = found.find((c) => c.IP === ip);
			if (match && Array.isArray(match.LINES)) lineTypes = match.LINES;
		} catch {
			/* discovery is best-effort; proceed without line types */
		}
	}

	const conn = new ControllerConnection(ip, { ...options, lineTypes });
	// Store before connecting so the background retry loop is always tracked and
	// closeConnection() can stop it even if the first attempt fails.
	connections.set(guildId, conn);
	attachNotifications(conn, options.client, options.channelId);

	try {
		await conn.connect();
		conn._notifyUp = true; // baseline online; initial success reported by the command reply
		return { conn, connected: true };
	} catch (error) {
		conn._notifyUp = false; // baseline offline; a later successful retry will post 🟢
		return { conn, connected: false, error };
	}
}

function getConnection(guildId) {
	return connections.get(guildId) || null;
}

function closeConnection(guildId) {
	const existing = connections.get(guildId);
	if (existing) {
		existing.disconnect();
		connections.delete(guildId);
		return true;
	}
	return false;
}

module.exports = { openConnection, getConnection, closeConnection };

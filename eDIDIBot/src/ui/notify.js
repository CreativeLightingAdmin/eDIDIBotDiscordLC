// Posts controller offline/online status changes to the Discord channel where
// the connection was opened.
//
// State machine (stored as conn._notifyUp) is inherently debounced:
//   - only a genuine drop of an established socket emits 'disconnect' → 🔴
//   - failed reconnect attempts emit 'error'/'close' (no 'disconnect') → no spam
//   - a reconnect after a drop emits 'connect' while _notifyUp is false → 🟢

const { baseEmbed } = require('./embeds');

async function post(client, channelId, embed) {
	try {
		const channel = await client.channels.fetch(channelId);
		if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
	} catch (err) {
		console.warn(`[notify] Could not post to channel ${channelId}: ${err.message}`);
	}
}

function label(conn) {
	return `\`${conn.ip}:${conn.port}\``;
}

// Attach offline/online notifications to a connection. Call BEFORE connect() so
// the baseline state is set by connectionManager based on the initial outcome.
function attachNotifications(conn, client, channelId) {
	if (!client || !channelId) return;

	conn.on('disconnect', () => {
		if (conn._notifyUp !== false) {
			conn._notifyUp = false;
			post(
				client,
				channelId,
				baseEmbed('🔴 Controller offline').setColor(0xe53935).setDescription(
					`Lost connection to ${label(conn)} — retrying in the background…`,
				),
			);
		}
	});

	conn.on('connect', () => {
		if (conn._notifyUp === false) {
			conn._notifyUp = true;
			post(
				client,
				channelId,
				baseEmbed('🟢 Controller online').setColor(0x43a047).setDescription(
					`Reconnected to ${label(conn)}.`,
				),
			);
		}
	});
}

module.exports = { attachNotifications };

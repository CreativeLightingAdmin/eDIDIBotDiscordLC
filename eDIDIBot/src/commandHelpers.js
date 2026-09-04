// Shared helpers for slash-command handlers.

const { getConnection } = require('./controller/connectionManager');
const { errorEmbed } = require('./ui/embeds');

// Fetch the active connection for the interaction's guild, or reply with an
// error and return null if there isn't one / it's not connected.
async function requireConnection(interaction) {
	const conn = getConnection(interaction.guildId);
	if (!conn || !conn.connected) {
		await interaction.reply({
			embeds: [
				errorEmbed(
					'Not connected',
					'No controller is connected. Use `/connect` (or `/discover`) first.',
				),
			],
			ephemeral: true,
		});
		return null;
	}
	return conn;
}

module.exports = { requireConnection };

const { SlashCommandBuilder } = require('discord.js');
const { closeConnection } = require('../../src/controller/connectionManager');
const { denyIfUnauthorized } = require('../../src/auth');
const { successEmbed, errorEmbed } = require('../../src/ui/embeds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('disconnect')
		.setDescription('Disconnect from the current controller'),
	async execute(interaction) {
		if (await denyIfUnauthorized(interaction)) return;

		const closed = closeConnection(interaction.guildId);
		await interaction.reply({
			embeds: closed
				? [successEmbed('Disconnected', 'The controller connection has been closed.')]
				: [errorEmbed('Nothing to disconnect', 'There was no active controller connection.')],
		});
	},
};

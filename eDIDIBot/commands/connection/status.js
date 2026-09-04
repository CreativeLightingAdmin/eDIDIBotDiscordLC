const { SlashCommandBuilder } = require('discord.js');
const { getConnection } = require('../../src/controller/connectionManager');
const { statusEmbed } = require('../../src/ui/embeds');
const { config } = require('../../src/config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Show the current controller connection status'),
	async execute(interaction) {
		const conn = getConnection(interaction.guildId);
		await interaction.reply({
			embeds: [
				statusEmbed({
					ip: conn?.ip || null,
					port: conn?.port || config.controllerPort,
					connected: Boolean(conn?.connected),
					useTLS: Boolean(conn?.useTLS),
					lineTypes: conn?.lineTypes ?? null,
				}),
			],
			ephemeral: true,
		});
	},
};

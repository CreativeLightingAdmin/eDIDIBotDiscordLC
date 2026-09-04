const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot is alive'),
	async execute(interaction) {
		await interaction.reply({ content: '🏓 Pong!', ephemeral: true });
	},
};

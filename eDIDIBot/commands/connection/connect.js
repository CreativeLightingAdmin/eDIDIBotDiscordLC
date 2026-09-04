const { SlashCommandBuilder } = require('discord.js');
const { openConnection } = require('../../src/controller/connectionManager');
const { denyIfUnauthorized } = require('../../src/auth');
const { baseEmbed, successEmbed, errorEmbed, statusEmbed } = require('../../src/ui/embeds');
const { config } = require('../../src/config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('connect')
		.setDescription('Connect to an eDIDIO lighting controller')
		.addStringOption((option) =>
			option
				.setName('ip')
				.setDescription('Controller IP address (defaults to EDIDIO_IP if set)')
				.setRequired(!config.defaultControllerIp),
		)
		.addBooleanOption((option) =>
			option
				.setName('tls')
				.setDescription('Use a secure TLS connection (port 443). Newer controllers only.'),
		)
		.addIntegerOption((option) =>
			option
				.setName('port')
				.setDescription('Override the port (default 23 for TCP, 443 for TLS)')
				.setMinValue(1)
				.setMaxValue(65535),
		),
	async execute(interaction) {
		if (await denyIfUnauthorized(interaction)) return;

		const ip = interaction.options.getString('ip') || config.defaultControllerIp;
		const useTLS = interaction.options.getBoolean('tls') ?? false;
		const port = interaction.options.getInteger('port') ?? undefined;
		await interaction.deferReply();

		const { conn, connected, error } = await openConnection(interaction.guildId, ip, {
			useTLS,
			port,
			client: interaction.client,
			channelId: interaction.channelId,
		});

		if (connected) {
			await interaction.editReply({
				embeds: [
					successEmbed('Connected', `Connected to controller at \`${ip}\`${useTLS ? ' over **TLS**' : ''}.`),
					statusEmbed({ ip: conn.ip, port: conn.port, connected: true, useTLS: conn.useTLS, lineTypes: conn.lineTypes }),
				],
			});
		} else {
			// Not reachable yet — the connection keeps retrying in the background and
			// will post here when it comes online.
			await interaction.editReply({
				embeds: [
					baseEmbed('⏳ Controller offline')
						.setColor(0xffb300)
						.setDescription(
							`Couldn't reach \`${ip}\` yet (${error?.message ?? 'no response'}). ` +
								'I\'ll keep trying and post here when it connects. Use `/disconnect` to stop.',
						),
				],
			});
		}
	},
};

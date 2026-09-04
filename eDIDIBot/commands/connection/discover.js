const { SlashCommandBuilder } = require('discord.js');
const { discoverControllers } = require('../../src/controller/discovery');
const { openConnection } = require('../../src/controller/connectionManager');
const { denyIfUnauthorized } = require('../../src/auth');
const { baseEmbed, successEmbed, errorEmbed, statusEmbed } = require('../../src/ui/embeds');
const { summarize } = require('../../src/controller/lineTypes');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('discover')
		.setDescription('Find eDIDIO controllers on the local network')
		.addBooleanOption((option) =>
			option
				.setName('connect')
				.setDescription('Automatically connect if exactly one controller is found'),
		),
	async execute(interaction) {
		await interaction.deferReply();
		const autoConnect = interaction.options.getBoolean('connect') ?? false;
		const controllers = await discoverControllers();

		if (controllers.length === 0) {
			await interaction.editReply({
				embeds: [
					errorEmbed(
						'No controllers found',
						'No eDIDIO controllers responded on the local network. ' +
							'Make sure the bot is running on the same LAN as the controller.',
					),
				],
			});
			return;
		}

		const list = controllers
			.map((c, i) => {
				const name = c.NAME || 'eDIDIO';
				const fw = c.FW_VER ? ` · fw ${c.FW_VER}` : '';
				const tls = c.TLS ? ' · 🔒 TLS' : '';
				const lines = Array.isArray(c.LINES) ? `\n    ${summarize(c.LINES)}` : '';
				return `**${i + 1}.** \`${c.IP}\` — ${name}${fw}${tls}${lines}`;
			})
			.join('\n');

		const embed = baseEmbed(`🔎 Found ${controllers.length} controller(s)`).setDescription(list);

		if (autoConnect && controllers.length === 1) {
			if (await denyIfUnauthorized(interaction)) return;
			const target = controllers[0];
			const ip = target.IP;
			const useTLS = Boolean(target.TLS); // prefer TLS if the unit advertises it
			const { conn, connected, error } = await openConnection(interaction.guildId, ip, {
				useTLS,
				lineTypes: target.LINES,
				client: interaction.client,
				channelId: interaction.channelId,
			});
			if (connected) {
				await interaction.editReply({
					embeds: [
						embed,
						successEmbed('Connected', `Auto-connected to \`${ip}\`${useTLS ? ' over **TLS**' : ''}.`),
						statusEmbed({ ip: conn.ip, port: conn.port, connected: true, useTLS: conn.useTLS, lineTypes: conn.lineTypes }),
					],
				});
			} else {
				await interaction.editReply({
					embeds: [embed, errorEmbed('Auto-connect failed', `${error?.message ?? 'no response'} — retrying in the background.`)],
				});
			}
			return;
		}

		embed.setFooter({ text: 'Use /connect ip:<address> to connect.' });
		await interaction.editReply({ embeds: [embed] });
	},
};

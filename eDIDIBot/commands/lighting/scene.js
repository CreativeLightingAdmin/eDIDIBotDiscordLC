const { SlashCommandBuilder } = require('discord.js');
const builder = require('../../src/controller/messageBuilder');
const { maskForLine, validateLine } = require('../../src/controller/lineTypes');
const { requireConnection } = require('../../src/commandHelpers');
const { denyIfUnauthorized } = require('../../src/auth');
const { successEmbed, errorEmbed } = require('../../src/ui/embeds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scene')
		.setDescription('Broadcast a stored DALI scene to all fittings on a line')
		.addIntegerOption((o) =>
			o.setName('scene').setDescription('Scene number (0-15)').setMinValue(0).setMaxValue(15).setRequired(true),
		)
		.addIntegerOption((o) =>
			o.setName('line').setDescription('DALI line (1-4)').setMinValue(1).setMaxValue(4).setRequired(true),
		),

	async execute(interaction) {
		if (await denyIfUnauthorized(interaction)) return;
		const conn = await requireConnection(interaction);
		if (!conn) return;

		const scene = interaction.options.getInteger('scene');
		const line = interaction.options.getInteger('line');

		const check = validateLine(conn.lineTypes, line, 'DALI');
		if (!check.ok) {
			await interaction.reply({ embeds: [errorEmbed('Wrong line type', check.reason)], ephemeral: true });
			return;
		}

		await conn.send(builder.daliBroadcastScene({ scene, lineMask: maskForLine(line) }));
		await interaction.reply({
			embeds: [successEmbed('Scene broadcast', `Recalled scene \`${scene}\` across line \`${line}\`.`)],
		});
	},
};

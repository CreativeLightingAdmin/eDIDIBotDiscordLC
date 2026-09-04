const { SlashCommandBuilder } = require('discord.js');
const builder = require('../../src/controller/messageBuilder');
const { maskForLine, validateLine } = require('../../src/controller/lineTypes');
const { requireConnection } = require('../../src/commandHelpers');
const { denyIfUnauthorized } = require('../../src/auth');
const { successEmbed, errorEmbed } = require('../../src/ui/embeds');

const lineOption = (o) =>
	o.setName('line').setDescription('DALI line (1-4)').setMinValue(1).setMaxValue(4).setRequired(true);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('group')
		.setDescription('Control a DALI group')
		.addSubcommand((sub) =>
			sub
				.setName('level')
				.setDescription('Set an arc level on a whole group')
				.addIntegerOption((o) =>
					o.setName('group').setDescription('Group number (0-15)').setMinValue(0).setMaxValue(15).setRequired(true),
				)
				.addIntegerOption((o) =>
					o.setName('level').setDescription('Arc level 0-254').setMinValue(0).setMaxValue(254).setRequired(true),
				)
				.addIntegerOption(lineOption),
		)
		.addSubcommand((sub) =>
			sub
				.setName('scene')
				.setDescription('Recall a stored scene on a group')
				.addIntegerOption((o) =>
					o.setName('group').setDescription('Group number (0-15)').setMinValue(0).setMaxValue(15).setRequired(true),
				)
				.addIntegerOption((o) =>
					o.setName('scene').setDescription('Scene number (0-15)').setMinValue(0).setMaxValue(15).setRequired(true),
				)
				.addIntegerOption(lineOption),
		),

	async execute(interaction) {
		if (await denyIfUnauthorized(interaction)) return;
		const conn = await requireConnection(interaction);
		if (!conn) return;

		const sub = interaction.options.getSubcommand();
		const line = interaction.options.getInteger('line');
		const group = interaction.options.getInteger('group');

		const check = validateLine(conn.lineTypes, line, 'DALI');
		if (!check.ok) {
			await interaction.reply({ embeds: [errorEmbed('Wrong line type', check.reason)], ephemeral: true });
			return;
		}
		const mask = maskForLine(line);

		if (sub === 'level') {
			const level = interaction.options.getInteger('level');
			await conn.send(builder.daliGroupArcLevel({ group, level, lineMask: mask }));
			await interaction.reply({
				embeds: [successEmbed('Group level set', `Group \`${group}\` on line \`${line}\` → level \`${level}\`.`)],
			});
		} else {
			const scene = interaction.options.getInteger('scene');
			await conn.send(builder.daliSceneOnGroup({ group, scene, lineMask: mask }));
			await interaction.reply({
				embeds: [successEmbed('Scene recalled', `Group \`${group}\` on line \`${line}\` → scene \`${scene}\`.`)],
			});
		}
	},
};

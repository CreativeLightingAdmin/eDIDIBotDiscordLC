const { SlashCommandBuilder } = require('discord.js');
const builder = require('../../src/controller/messageBuilder');
const { requireConnection } = require('../../src/commandHelpers');
const { denyIfUnauthorized } = require('../../src/auth');
const { successEmbed } = require('../../src/ui/embeds');

const { SpektraTargetType, SpektraActionType } = builder;

const ACTION = {
	start: SpektraActionType.START,
	stop: SpektraActionType.STOP,
	pause: SpektraActionType.PAUSE,
};

function targetSubcommand(name, description, targetType) {
	return {
		name,
		targetType,
		build: (sub) =>
			sub
				.setName(name)
				.setDescription(description)
				.addStringOption((o) =>
					o
						.setName('action')
						.setDescription('start, stop or pause')
						.setRequired(true)
						.addChoices(
							{ name: 'start', value: 'start' },
							{ name: 'stop', value: 'stop' },
							{ name: 'pause', value: 'pause' },
						),
				)
				.addIntegerOption((o) =>
					o.setName('index').setDescription('Which one (index number)').setMinValue(0),
				)
				.addIntegerOption((o) =>
					o.setName('zone').setDescription('Zone number (default 0 = all)').setMinValue(0),
				),
	};
}

const SUBS = [
	targetSubcommand('sequence', 'Start/stop an animated SpektraPlus sequence', SpektraTargetType.SEQUENCE),
	targetSubcommand('theme', 'Start/stop a SpektraPlus colour theme', SpektraTargetType.THEME),
	targetSubcommand('static', 'Recall a SpektraPlus static scene', SpektraTargetType.STATIC),
];

const data = new SlashCommandBuilder()
	.setName('spektra')
	.setDescription('Trigger SpektraPlus sequences, themes and scenes');
for (const s of SUBS) data.addSubcommand(s.build);

module.exports = {
	data,
	async execute(interaction) {
		if (await denyIfUnauthorized(interaction)) return;
		const conn = await requireConnection(interaction);
		if (!conn) return;

		const subName = interaction.options.getSubcommand();
		const target = SUBS.find((s) => s.name === subName);
		const verb = interaction.options.getString('action');
		const index = interaction.options.getInteger('index') ?? 0;
		const zone = interaction.options.getInteger('zone') ?? 0;

		if (verb === 'stop') {
			// Stop via external trigger so the output is also turned off (matches
			// SpektraPlus); SpektraControl STOP alone only halts playback.
			await conn.send(builder.spektraStop({ zone }));
		} else {
			await conn.send(
				builder.spektraControl({ type: target.targetType, zone, index, action: ACTION[verb] }),
			);
		}

		await interaction.reply({
			embeds: [
				successEmbed(
					`${subName} ${verb}`,
					`${subName[0].toUpperCase() + subName.slice(1)} \`${index}\` on zone \`${zone}\` — **${verb}**.`,
				),
			],
		});
	},
};

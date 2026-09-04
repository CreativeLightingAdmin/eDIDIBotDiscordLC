const { SlashCommandBuilder } = require('discord.js');
const builder = require('../../src/controller/messageBuilder');
const { maskForLine, validateLine } = require('../../src/controller/lineTypes');
const { requireConnection } = require('../../src/commandHelpers');
const { denyIfUnauthorized } = require('../../src/auth');
const { successEmbed, errorEmbed, lightControlButtons } = require('../../src/ui/embeds');

function lineOption(option) {
	return option
		.setName('line')
		.setDescription('DALI/DMX line (daughter-board slot 1-4)')
		.setMinValue(1)
		.setMaxValue(4)
		.setRequired(true);
}

function addressOption(option, required = true) {
	return option
		.setName('address')
		.setDescription('DALI short address (0-63)')
		.setMinValue(0)
		.setMaxValue(63)
		.setRequired(required);
}

// Parse "#RRGGBB" / "RRGGBB" into [r, g, b].
function parseHex(input) {
	const hex = input.replace(/^#/, '').trim();
	if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
	return [
		parseInt(hex.slice(0, 2), 16),
		parseInt(hex.slice(2, 4), 16),
		parseInt(hex.slice(4, 6), 16),
	];
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('light')
		.setDescription('Control DALI lighting')
		.addSubcommand((sub) =>
			sub
				.setName('on')
				.setDescription('Turn a light on (max level)')
				.addIntegerOption((o) => addressOption(o))
				.addIntegerOption(lineOption),
		)
		.addSubcommand((sub) =>
			sub
				.setName('off')
				.setDescription('Turn a light off')
				.addIntegerOption((o) => addressOption(o))
				.addIntegerOption(lineOption),
		)
		.addSubcommand((sub) =>
			sub
				.setName('level')
				.setDescription('Set a light to a specific arc level (0-254)')
				.addIntegerOption((o) => addressOption(o))
				.addIntegerOption((o) =>
					o
						.setName('level')
						.setDescription('Arc level 0-254')
						.setMinValue(0)
						.setMaxValue(254)
						.setRequired(true),
				)
				.addIntegerOption(lineOption),
		)
		.addSubcommand((sub) =>
			sub
				.setName('color')
				.setDescription('Set an RGB colour across a DMX line')
				.addIntegerOption(lineOption)
				.addStringOption((o) =>
					o.setName('hex').setDescription('Colour as #RRGGBB').setRequired(true),
				)
				.addIntegerOption((o) =>
					o
						.setName('fixtures')
						.setDescription('How many RGB fixtures to set (default: fill the line)')
						.setMinValue(1)
						.setMaxValue(170),
				),
		),

	async execute(interaction) {
		if (await denyIfUnauthorized(interaction)) return;
		const conn = await requireConnection(interaction);
		if (!conn) return;

		const sub = interaction.options.getSubcommand();
		const line = interaction.options.getInteger('line');
		const mask = maskForLine(line);
		const { DALICommandType } = builder;

		// Colour is DMX; everything else is DALI. Validate the line matches.
		const expected = sub === 'color' ? 'DMX' : 'DALI';
		const check = validateLine(conn.lineTypes, line, expected);
		if (!check.ok) {
			await interaction.reply({
				embeds: [errorEmbed('Wrong line type', check.reason)],
				ephemeral: true,
			});
			return;
		}

		switch (sub) {
			case 'on': {
				const address = interaction.options.getInteger('address');
				await conn.send(builder.daliCommand({ address, command: DALICommandType.DALI_MAX_LEVEL, lineMask: mask }));
				await interaction.reply({
					embeds: [successEmbed('Light on', `Address \`${address}\` on line \`${line}\` set to full.`)],
					components: [lightControlButtons(address, line)],
				});
				break;
			}
			case 'off': {
				const address = interaction.options.getInteger('address');
				await conn.send(builder.daliCommand({ address, command: DALICommandType.DALI_OFF, lineMask: mask }));
				await interaction.reply({
					embeds: [successEmbed('Light off', `Address \`${address}\` on line \`${line}\` turned off.`)],
					components: [lightControlButtons(address, line)],
				});
				break;
			}
			case 'level': {
				const address = interaction.options.getInteger('address');
				const level = interaction.options.getInteger('level');
				await conn.send(builder.daliArcLevel({ address, level, lineMask: mask }));
				await interaction.reply({
					embeds: [successEmbed('Level set', `Address \`${address}\` on line \`${line}\` → level \`${level}\`.`)],
					components: [lightControlButtons(address, line)],
				});
				break;
			}
			case 'color': {
				const hex = interaction.options.getString('hex');
				const rgb = parseHex(hex);
				if (!rgb) {
					await interaction.reply({ content: `\`${hex}\` is not a valid #RRGGBB colour.`, ephemeral: true });
					return;
				}
				// Raw DMX: paint the line by tiling the RGB triplet from channel 1.
				// fixtures = how many triplets; default fills a 512-channel universe.
				const fixtures = interaction.options.getInteger('fixtures') ?? Math.floor(512 / rgb.length);
				await conn.send(
					builder.dmxColour({ zone: 0xff, universeMask: mask, channel: 1, repeat: fixtures, levels: rgb }),
				);
				await interaction.reply({
					embeds: [
						successEmbed('Colour set', `Line \`${line}\` → \`#${hex.replace(/^#/, '')}\`  (R${rgb[0]} G${rgb[1]} B${rgb[2]}) across ${fixtures} fixture(s)`)
							.setColor((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]),
					],
				});
				break;
			}
		}
	},
};

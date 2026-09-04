const { Events } = require('discord.js');
const builder = require('../src/controller/messageBuilder');
const { maskForLine } = require('../src/controller/lineTypes');
const { getConnection } = require('../src/controller/connectionManager');
const { canControl } = require('../src/auth');

// Handle the quick-action buttons attached to light replies.
// customId format: light:<action>:<address>:<line>  (line omitted on old messages)
async function handleLightButton(interaction) {
	if (!canControl(interaction)) {
		await interaction.reply({ content: '🚫 You do not have permission to control the lighting.', ephemeral: true });
		return;
	}

	const [, action, addressStr, lineStr] = interaction.customId.split(':');
	const address = Number(addressStr) || 0;
	const line = Number(lineStr) || 1; // default line 1 for buttons from before line support
	const mask = maskForLine(line);
	const conn = getConnection(interaction.guildId);
	if (!conn || !conn.connected) {
		await interaction.reply({ content: 'Not connected to a controller.', ephemeral: true });
		return;
	}

	const { DALICommandType } = builder;
	const map = {
		off: () => builder.daliCommand({ address, command: DALICommandType.DALI_OFF, lineMask: mask }),
		max: () => builder.daliCommand({ address, command: DALICommandType.DALI_MAX_LEVEL, lineMask: mask }),
		up: () => builder.daliCommand({ address, command: DALICommandType.DALI_FADE_UP, lineMask: mask }),
		down: () => builder.daliCommand({ address, command: DALICommandType.DALI_FADE_DOWN, lineMask: mask }),
	};
	const make = map[action];
	if (!make) {
		await interaction.reply({ content: 'Unknown action.', ephemeral: true });
		return;
	}

	await conn.send(make());
	await interaction.reply({ content: `💡 \`${address}\` (line ${line}) → **${action}**`, ephemeral: true });
}

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isButton()) {
			if (interaction.customId.startsWith('light:')) {
				try {
					await handleLightButton(interaction);
				} catch (error) {
					console.error(error);
				}
			}
			return;
		}

		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			const payload = { content: 'There was an error while executing this command!', ephemeral: true };
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(payload);
			} else {
				await interaction.reply(payload);
			}
		}
	},
};

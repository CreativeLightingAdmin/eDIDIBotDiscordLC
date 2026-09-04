// Registers slash commands with Discord.
//
//   node deploy-commands.js          -> global registration (all servers; may
//                                       take up to an hour to appear)
//   node deploy-commands.js --guild  -> fast guild-scoped registration for the
//                                       DISCORD_GUILD_ID test server

const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { config, assertConfigured } = require('./src/config');

assertConfigured();

const commands = [];
function loadCommands(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			loadCommands(full);
		} else if (entry.name.endsWith('.js')) {
			const command = require(full);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${full} is missing "data" or "execute".`);
			}
		}
	}
}
loadCommands(path.join(__dirname, 'commands'));

const guildScoped = process.argv.includes('--guild');
const rest = new REST().setToken(config.token);

(async () => {
	try {
		console.log(`Refreshing ${commands.length} application (/) commands...`);
		if (guildScoped) {
			if (!config.guildId) throw new Error('DISCORD_GUILD_ID is required for --guild deploys.');
			await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
			console.log(`Deployed ${commands.length} commands to guild ${config.guildId}.`);
		} else {
			await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
			console.log(`Deployed ${commands.length} commands globally.`);
		}
	} catch (error) {
		console.error(error);
	}
})();

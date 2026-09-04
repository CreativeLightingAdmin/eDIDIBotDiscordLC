// eDIDIBot — Discord lighting controller.
// Loads slash commands + event handlers, then logs in.

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { config, assertConfigured } = require('./src/config');

assertConfigured();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Recursively load every command file under commands/.
function loadCommands(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			loadCommands(full);
		} else if (entry.name.endsWith('.js')) {
			const command = require(full);
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${full} is missing "data" or "execute".`);
			}
		}
	}
}
loadCommands(path.join(__dirname, 'commands'));

// Load event handlers.
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
	const event = require(path.join(eventsPath, file));
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(config.token);

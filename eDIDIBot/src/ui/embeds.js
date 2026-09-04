// Rich embed and button helpers so command replies look polished instead of
// plain "success" strings.

const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const { summarize } = require('../controller/lineTypes');

const BRAND_COLOUR = 0xffb300; // warm amber, on-brand for lighting

function baseEmbed(title) {
	return new EmbedBuilder().setColor(BRAND_COLOUR).setTitle(title).setTimestamp();
}

function successEmbed(title, description) {
	const e = baseEmbed(`✅ ${title}`);
	if (description) e.setDescription(description);
	return e;
}

function errorEmbed(title, description) {
	return baseEmbed(`⚠️ ${title}`).setColor(0xe53935).setDescription(description || '');
}

function statusEmbed({ ip, connected, port, useTLS, lineTypes }) {
	const embed = baseEmbed('💡 Controller Status')
		.setColor(connected ? 0x43a047 : 0x9e9e9e)
		.addFields(
			{ name: 'Address', value: ip ? `\`${ip}:${port}\`` : '—', inline: true },
			{ name: 'State', value: connected ? '🟢 Connected' : '🔴 Disconnected', inline: true },
			{ name: 'Transport', value: useTLS ? '🔒 TLS' : '🔓 TCP', inline: true },
		);
	if (lineTypes !== undefined) {
		embed.addFields({ name: 'Lines', value: summarize(lineTypes), inline: false });
	}
	return embed;
}

// Quick-action buttons attached to a light-control reply.
// customId format: light:<action>:<address>:<line>
function lightControlButtons(address = 0, line = 1) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`light:off:${address}:${line}`)
			.setLabel('Off')
			.setEmoji('🌙')
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(`light:down:${address}:${line}`)
			.setLabel('Dim')
			.setEmoji('🔅')
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`light:up:${address}:${line}`)
			.setLabel('Brighten')
			.setEmoji('🔆')
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`light:max:${address}:${line}`)
			.setLabel('Full')
			.setEmoji('☀️')
			.setStyle(ButtonStyle.Success),
	);
}

module.exports = {
	baseEmbed,
	successEmbed,
	errorEmbed,
	statusEmbed,
	lightControlButtons,
	BRAND_COLOUR,
};

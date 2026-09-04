// Role-based access control for lighting commands.
//
// If CONTROL_ROLE_IDS is configured, the interacting member must have at least
// one of those roles. If it's empty, everyone is allowed (private-server mode).

const { config } = require('./config');

function canControl(interaction) {
	if (config.controlRoleIds.length === 0) return true;
	const memberRoles = interaction.member?.roles;
	if (!memberRoles) return false;
	// discord.js GuildMemberRoleManager exposes a `cache` collection.
	const roleIds = memberRoles.cache ? [...memberRoles.cache.keys()] : memberRoles;
	return config.controlRoleIds.some((id) => roleIds.includes(id));
}

// Reply with a permission-denied message. Returns true if denied (so callers
// can early-return), false if allowed.
async function denyIfUnauthorized(interaction) {
	if (canControl(interaction)) return false;
	await interaction.reply({
		content: '🚫 You do not have permission to control the lighting.',
		ephemeral: true,
	});
	return true;
}

module.exports = { canControl, denyIfUnauthorized };

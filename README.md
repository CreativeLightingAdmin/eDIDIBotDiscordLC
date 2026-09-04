# eDIDIBot — Discord Lighting Controller

A self-hosted Discord bot that controls [eDIDIO](https://www.creativelighting.com.au/)
lighting controllers directly from Discord slash commands. Run it on a machine on the
same network as your controller (an office PC, a home server) and let anyone in your
Discord server dim lights, set colours, and trigger scenes and animated effects — all
from chat.

> 🏠 **Designed to be self-hosted.** The controller lives on your local network, so the
> bot runs on a machine on that same network. There's no cloud service and no data
> leaves your LAN.

## Features

- **Slash commands** built on [discord.js](https://discord.js.org/) v14
- **LAN auto-discovery** of controllers (UDP broadcast) — no need to hunt for IPs
- **Line-aware** — knows whether each controller line is DALI or DMX and routes/validates
  commands accordingly
- **DALI control** — on/off, arc levels, groups, and stored scenes
- **DMX colour** — paint a whole DMX line an RGB colour
- **SpektraPlus playback** — start / pause / stop sequences, themes and static scenes
- **TLS or TCP** — secure connection to newer controllers, plain TCP for older ones
- **Per-guild connections** with automatic reconnect and a keep-alive heartbeat
- **Offline/online notifications** posted back to Discord when a controller drops or returns
- **Role-based access control** — restrict who can drive the lights
- **Rich embeds + quick-action buttons** on replies (Off / Dim / Brighten / Full)

## Commands

| Command | What it does |
|---|---|
| `/discover [connect]` | Find controllers on the LAN; optionally auto-connect if exactly one is found |
| `/connect [ip] [tls] [port]` | Connect to a controller (uses `EDIDIO_IP` if no IP given) |
| `/disconnect` | Close the connection |
| `/status` | Show connection status and each line's type |
| `/ping` | Check the bot is alive |
| `/light on\|off\|level` | Control a DALI address on a line |
| `/light color` | Set an RGB colour across a DMX line |
| `/group level\|scene` | Set a DALI group's level or recall a group scene |
| `/scene` | Broadcast a stored DALI scene across a line |
| `/spektra sequence\|theme\|static` | Start / pause / stop SpektraPlus effects |

Every lighting command takes a **`line`** (1–4, the daughter-board slot). The bot knows
each line's type from discovery and will block a DALI command aimed at a DMX line (and
vice versa) with a helpful message.

Examples:

```
/discover connect:true
/light on address:3 line:1
/light level address:3 level:200 line:1
/light color hex:#ff8800 line:2
/light color hex:#00ff00 line:2 fixtures:10
/group level group:2 level:128 line:1
/scene scene:4 line:1
/spektra sequence action:start index:1
/spektra sequence action:stop index:1
```

## How it works

```
Discord user ──/light color hex:#ff8800 line:2──► Discord ──► eDIDIBot (Node.js)
                                                                 │
                                                                 │  Protobuf-encoded message
                                                                 │  framed with 0xCD + length header
                                                                 ▼
                                                        eDIDIO controller (TCP :23 / TLS :443)
                                                                 │
                                                                 ▼
                                                          DALI / DMX fixtures
```

## Lines: DALI vs DMX

An eDIDIO controller has up to four physical **lines** (daughter-board slots), and each
can be a different type — DALI or DMX. When the bot connects it learns the line map from
the controller's discovery response (e.g. `Line 1: DALI · Lines 2-4: DMX`, shown by
`/status`).

- **DALI lines** — addressed by short address (0–63), groups (0–15) and stored scenes.
  Use `/light on|off|level`, `/group`, `/scene`.
- **DMX lines** — `/light color` paints the line an RGB colour. It tiles the colour across
  the line's channels; use the optional `fixtures` option to limit how many RGB fixtures
  are set (default fills the line).

If a command targets the wrong kind of line, the bot blocks it and tells you which line
type it is. If discovery couldn't determine the line types, validation is skipped and
commands are sent as-is.

## Reconnect & notifications

- The controller connection **auto-reconnects** with exponential backoff and keeps itself
  alive with a heartbeat.
- If a controller drops, the bot posts **🔴 Controller offline — retrying…** to the channel
  where you ran `/connect`, and **🟢 Controller online** when it comes back.
- If `/connect` is run while the controller is offline, the bot keeps retrying in the
  background and notifies you when it connects. Use `/disconnect` to stop.

## Project structure

```
eDIDIBot/
├── index.js                       # Entry point: loads commands + events, logs in
├── deploy-commands.js             # Registers slash commands (global or --guild)
├── .env.example                   # Copy to .env and fill in (see Setup)
├── Start eDIDIBot.cmd             # Double-click launcher (Windows) / start.sh (mac/Linux)
├── Register Commands.cmd          # Double-click slash-command registration
├── commands/
│   ├── connection/                # connect, disconnect, discover, status, ping
│   └── lighting/                  # light, group, scene, spektra
├── events/
│   ├── ready.js                   # Logs in
│   └── interactionCreate.js       # Routes slash commands + button clicks
├── src/
│   ├── config.js                  # Loads secrets/settings from .env (or config.json)
│   ├── auth.js                    # Role-based access control
│   ├── commandHelpers.js          # Shared "require connection" helper
│   ├── ui/
│   │   ├── embeds.js              # Rich embeds + button rows
│   │   └── notify.js             # Offline/online channel notifications
│   └── controller/
│       ├── ControllerConnection.js # TCP/TLS socket: reconnect + heartbeat + events
│       ├── connectionManager.js    # One connection per Discord guild
│       ├── messageBuilder.js       # Framed protobuf builders (DALI / DMX / Spektra)
│       ├── lineTypes.js            # Line-type map, line→mask, validation
│       └── discovery.js            # UDP :30303 LAN discovery
└── eDIDIOMessaging/
    └── eDS10_ProtocolBuffer_pb.js  # Generated protobuf definitions
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- A Discord application + bot ([Developer Portal](https://discord.com/developers/applications))
- An eDIDIO controller on the same LAN as the machine running the bot

## Quick start (no command line)

Prefer clicking to typing? The repo ships with double-click launchers. The bot is still
plain, editable source underneath — click to run it, or open the `.js` files to change
it. Either way works.

1. Install [Node.js](https://nodejs.org/) (LTS) — one time.
2. Create your bot and invite it to your server (see [Setup](#setup) steps 1–2 below for
   the token and invite link).
3. Double-click **`Start eDIDIBot.cmd`** (Windows) or run `./start.sh` (macOS/Linux). On
   first run it installs dependencies and opens a `.env` file — paste your bot token after
   `DISCORD_TOKEN=`, save, and double-click again.
4. Double-click **`Register Commands.cmd`** once so the slash commands appear.
5. That's it — the bot is online. Use `/discover` and `/light` in Discord.

Everything these launchers do, you can also do by hand with the commands in the
[Setup](#setup) section — they're just convenience wrappers.

## Setup

1. **Install dependencies**

   ```bash
   cd eDIDIBot
   npm install
   ```

2. **Configure secrets.** Copy `.env.example` to `.env` and fill it in:

   ```bash
   cp .env.example .env
   ```

   ```ini
   DISCORD_TOKEN=your-bot-token          # Bot → Reset Token in the Developer Portal
   DISCORD_CLIENT_ID=your-application-id  # General Information → Application ID
   DISCORD_GUILD_ID=your-test-server-id   # only needed for fast dev deploys
   EDIDIO_IP=192.168.0.91                 # optional default controller
   EDIDIO_PORT=23                         # TCP port (default 23)
   EDIDIO_TLS_PORT=443                    # TLS port for newer controllers (default 443)
   CONTROL_ROLE_IDS=                      # optional: restrict control to roles
   ```

   > `.env` is gitignored — never commit it or your bot token. (A legacy `config.json` is
   > still read as a fallback, but environment variables are preferred.)

3. **Register slash commands**

   ```bash
   npm run deploy:guild   # fast — appears instantly in your DISCORD_GUILD_ID server
   npm run deploy         # global — all servers, can take up to an hour to appear
   ```

4. **Start the bot**

   ```bash
   npm start
   ```

## Usage

Invite the bot to your server, then in any channel it can see:

```
/discover connect:true          → find and connect to the controller on your LAN
/light on address:3 line:1      → turn DALI address 3 on (line 1)
/light color hex:#f50 line:2    → paint DMX line 2 orange
/spektra theme action:start index:2   → run SpektraPlus theme 2
```

Replies include quick-action buttons (Off / Dim / Brighten / Full) so you can nudge a
light without typing another command.

### Connecting over TLS

Newer controllers advertise TLS support in discovery; `/discover connect:true` will pick
TLS automatically. To force it manually:

```
/connect ip:192.168.1.185 tls:true
```

## Access control

By default anyone in the server can control the lights (fine for a private office
server). To lock it down, set `CONTROL_ROLE_IDS` to a comma-separated list of Discord
role IDs — only members with one of those roles can run control commands.

## Security

- **Never commit `.env` or your bot token.** If a token is ever exposed, reset it in the
  Discord Developer Portal — an exposed token stays valid until it's reset.
- TLS to the controller uses a permissive handshake (`rejectUnauthorized: false`) because
  eDIDIO units present self-signed / legacy certificates. Traffic is encrypted, but
  certificate pinning is not yet implemented.

## Limitations

- **Self-hosted only.** Because controllers live on private networks, the bot must run on
  the same LAN — there's no hosted/cloud option.
- **DMX colour** assumes fixtures are RGB in R-G-B channel order.
- **SpektraPlus `index`/`zone`** values must match how your sequences/themes are configured
  on the controller.

## Extending the bot

The bot is deliberately modular so you can fork it and add your own commands. Adding a
command is two small steps:

**1. Add a message builder** (if you need a new controller action) in
`src/controller/messageBuilder.js`. Each builder returns a framed byte array:

```js
// Recall the last active level on an address.
function daliRecallLastLevel({ address, lineMask = 0b0001 }) {
	return wrapDali((dali) => {
		dali.setLineMask(lineMask);
		dali.setCommand(DALICommandType.DALI_RECALL_LAST_ACTIVE_LEVEL);
		dali.setAddress(address);
	});
}
```

**2. Add a command file** under `commands/lighting/` (or `commands/connection/`). Every
command exports `data` (a `SlashCommandBuilder`) and an `execute` handler. The loader in
`index.js` picks it up automatically — no registration list to edit:

```js
const { SlashCommandBuilder } = require('discord.js');
const builder = require('../../src/controller/messageBuilder');
const { maskForLine, validateLine } = require('../../src/controller/lineTypes');
const { requireConnection } = require('../../src/commandHelpers');
const { denyIfUnauthorized } = require('../../src/auth');
const { successEmbed, errorEmbed } = require('../../src/ui/embeds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('recall')
		.setDescription('Recall the last active level')
		.addIntegerOption((o) =>
			o.setName('address').setDescription('DALI address').setRequired(true),
		)
		.addIntegerOption((o) =>
			o.setName('line').setDescription('DALI line (1-4)').setMinValue(1).setMaxValue(4).setRequired(true),
		),
	async execute(interaction) {
		if (await denyIfUnauthorized(interaction)) return;       // role gating
		const conn = await requireConnection(interaction);        // ensures connected
		if (!conn) return;

		const address = interaction.options.getInteger('address');
		const line = interaction.options.getInteger('line');
		const check = validateLine(conn.lineTypes, line, 'DALI'); // block wrong line type
		if (!check.ok) {
			await interaction.reply({ embeds: [errorEmbed('Wrong line type', check.reason)], ephemeral: true });
			return;
		}

		await conn.send(builder.daliRecallLastLevel({ address, lineMask: maskForLine(line) }));
		await interaction.reply({ embeds: [successEmbed('Recalled', `Address \`${address}\` on line \`${line}\`.`)] });
	},
};
```

Then re-run `npm run deploy:guild` to register it. The full protocol surface (DALI
commands, DMX, SpektraPlus control, external triggers, queries, sensors, and more) lives
in `eDIDIOMessaging/eDS10_ProtocolBuffer_pb.js` — inspect the `proto.*CommandType` enums
and message setters to see everything the controller supports.

## Contributing

Pull requests and forks are welcome. This is a reference integration — fork it, adapt it
to your own controllers and workflows, and share improvements back if you'd like.

## License

[MIT](LICENSE) © 2026 Creative Lighting. Fork it, modify it, make it your own.

## Author

Michael Howes — [Creative Lighting](https://www.creativelighting.com.au/)

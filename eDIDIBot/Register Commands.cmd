@echo off
REM ==========================================================================
REM  Registers the bot's slash commands with Discord.
REM  Run this once after first setup, and again whenever you add or change a
REM  command. Global registration can take up to an hour to appear; if you set
REM  DISCORD_GUILD_ID in .env you can use "Register Commands (test server).cmd"
REM  for instant registration in that one server.
REM ==========================================================================
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
	echo Node.js is not installed. Install it from https://nodejs.org/ first.
	pause
	exit /b 1
)

echo Registering slash commands globally...
echo (These can take up to an hour to appear in every server.)
node deploy-commands.js
echo.
pause

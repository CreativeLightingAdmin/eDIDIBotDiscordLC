@echo off
REM ==========================================================================
REM  Fast slash-command registration for your test server.
REM  Requires DISCORD_GUILD_ID to be set in .env. Commands appear instantly in
REM  that one server (great while developing). Use "Register Commands.cmd" for
REM  the global version that works in every server the bot joins.
REM ==========================================================================
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
	echo Node.js is not installed. Install it from https://nodejs.org/ first.
	pause
	exit /b 1
)

echo Registering slash commands to your test server...
node deploy-commands.js --guild
echo.
pause

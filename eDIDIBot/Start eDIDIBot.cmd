@echo off
REM ==========================================================================
REM  eDIDIBot launcher — double-click to run the bot.
REM  This is a normal script: everything it does, you can also do by hand with
REM  `npm install`, editing .env, and `node index.js`. Edit away.
REM ==========================================================================
setlocal
cd /d "%~dp0"

REM --- 1. Check Node.js is installed --------------------------------------
where node >nul 2>nul
if errorlevel 1 (
	echo.
	echo   Node.js is not installed.
	echo   Please install the LTS version from https://nodejs.org/
	echo   then double-click this file again.
	echo.
	pause
	exit /b 1
)

REM --- 2. Install dependencies on first run -------------------------------
if not exist "node_modules\" (
	echo Installing dependencies ^(first run only, may take a minute^)...
	call npm install
	if errorlevel 1 (
		echo.
		echo   npm install failed. See the messages above.
		pause
		exit /b 1
	)
)

REM --- 3. Make sure a .env with a token exists ----------------------------
if not exist ".env" (
	echo First-time setup: creating your .env configuration file...
	copy ".env.example" ".env" >nul
	echo.
	echo   Opening .env in Notepad.
	echo   Paste your Discord bot token after  DISCORD_TOKEN=
	echo   ^(Discord Developer Portal -^> your app -^> Bot -^> Reset Token^)
	echo   Save the file, then double-click this launcher again.
	echo.
	notepad ".env"
	exit /b 0
)

REM --- 4. Start the bot ---------------------------------------------------
echo Starting eDIDIBot...  (close this window to stop the bot)
echo.
node index.js
echo.
echo eDIDIBot has stopped.
pause

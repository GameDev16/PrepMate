@echo off
echo Starting PrepMate...

docker compose up -d

start "PrepMate Server" cmd /k "cd /d %~dp0server && npm run dev"
start "PrepMate Client" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo Two new windows just opened - one for the server, one for the client.
echo Leave both running. Close this window any time, the app keeps running in those two.

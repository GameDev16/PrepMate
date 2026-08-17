@echo off
setlocal
echo ============================================
echo   PrepMate - one-time local setup
echo ============================================

echo.
echo [1/6] Checking Docker is running...
docker version >nul 2>&1
if errorlevel 1 (
  echo   Docker Desktop does not seem to be running.
  echo   Start Docker Desktop, wait until it says "running", then re-run this script.
  pause
  exit /b 1
)
echo   OK.

echo.
echo [2/6] Starting Postgres via Docker Compose...
docker compose up -d
if errorlevel 1 (
  echo   docker compose failed - see the error above.
  echo   If it mentions port 5432 already in use, you likely have a native
  echo   Windows Postgres service running. Stop it with:
  echo     net stop postgresql-x64-16
  echo   (version number may differ) then re-run this script.
  pause
  exit /b 1
)

echo.
echo [3/6] Waiting for Postgres to be ready...
:waitpg
docker exec prepmate_postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
  timeout /t 2 /nobreak >nul
  goto waitpg
)
echo   Postgres is ready.

echo.
echo [4/6] Setting up server\.env (only if it doesn't exist yet)...
node scripts\init-env.js

echo.
echo [5/6] Installing dependencies...
echo   -- server --
cd server
call npm install
call npm install uuid
cd ..
echo   -- client --
call npm install

echo.
echo [6/6] Creating database tables...
cd server
call npx drizzle-kit push
cd ..

echo.
echo ============================================
echo   Setup complete. Run start.bat to launch PrepMate.
echo ============================================
pause
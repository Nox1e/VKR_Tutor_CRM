@echo off
setlocal EnableExtensions
title Tutor Clockwork

echo.
echo ========================================
echo    STARTING TUTOR CLOCKWORK
echo ========================================
echo.

cd /d "%~dp0"

REM ---- prerequisites --------------------------------------------------------
call node --version >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not available. Install from https://nodejs.org/
    pause
    exit /b 1
)

call npm --version >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not available. Reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)

call docker --version >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Docker is not available. Install Docker Desktop from https://www.docker.com/
    pause
    exit /b 1
)

if not exist "backend\.env" (
    echo [ERROR] backend\.env is missing.
    echo Copy backend\.env.example to backend\.env and fill in the secrets.
    pause
    exit /b 1
)

echo [OK] Node, npm and Docker found
echo.

REM ---- dependencies ---------------------------------------------------------
if not exist "node_modules" (
    echo Installing frontend deps...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install for frontend failed
        pause
        exit /b 1
    )
)

if not exist "backend\node_modules" (
    echo Installing backend deps...
    pushd backend
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install for backend failed
        popd
        pause
        exit /b 1
    )
    popd
)

echo [OK] Dependencies installed
echo.

REM ---- Postgres -------------------------------------------------------------
echo Starting Postgres...
call docker compose -f deploy\docker-compose.dev.yml up -d
if errorlevel 1 (
    echo [ERROR] Could not start Postgres. Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo Waiting for the database...
set /a PG_RETRIES=0
:WAIT_PG
call docker exec tutor-clockwork-db-dev pg_isready -U app -d tutor >nul 2>nul
if not errorlevel 1 goto PG_READY
set /a PG_RETRIES+=1
if %PG_RETRIES% gtr 30 (
    echo [ERROR] Postgres did not become ready after 30 seconds.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
goto WAIT_PG

:PG_READY
echo [OK] Postgres ready
echo.

REM ---- Prisma migrations ----------------------------------------------------
echo Applying Prisma migrations...
pushd backend
call npx prisma migrate deploy
if errorlevel 1 (
    echo [ERROR] prisma migrate deploy failed
    popd
    pause
    exit /b 1
)
popd
echo [OK] Migrations applied
echo.

REM ---- run ------------------------------------------------------------------
echo Launching app.
echo   Frontend: http://localhost:4001
echo   Backend:  http://localhost:4000
echo.
echo Backend opens in a separate window. Stop with Ctrl+C in each.
echo.

start "Backend Server" cmd /k "cd /d %CD%\backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting frontend...
call npm run dev
set "FRONTEND_EXIT=%ERRORLEVEL%"

echo.
echo ========================================
echo Frontend stopped (exit code %FRONTEND_EXIT%)
echo ========================================
echo.
echo Postgres is still running in Docker. To stop it:
echo   docker compose -f deploy\docker-compose.dev.yml down
echo.
pause
endlocal

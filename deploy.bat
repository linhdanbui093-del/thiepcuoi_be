@echo off
REM Deployment script for Wedding Invitation Backend (Windows)
REM Usage: deploy.bat [production|staging|development]

setlocal enabledelayedexpansion

set ENV=%1
if "%ENV%"=="" set ENV=production

echo 🚀 Starting deployment for environment: %ENV%

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo ✓ Node.js version:
node -v

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo ⚠️  Please update .env file with your configuration!
    ) else (
        echo ❌ .env.example file not found. Please create .env file manually.
        exit /b 1
    )
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist dist mkdir dist
if not exist logs mkdir logs
if not exist uploads mkdir uploads

REM Build TypeScript
echo 🔨 Building TypeScript...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    exit /b 1
)

if not exist dist\index.js (
    echo ❌ Build failed. dist\index.js not found.
    exit /b 1
)

echo ✓ Build completed successfully

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 📊 PM2 detected. Managing process...
    
    REM Stop existing process if running
    pm2 stop thiep-cuoi-backend 2>nul
    pm2 delete thiep-cuoi-backend 2>nul
    
    REM Start with PM2
    echo 🚀 Starting server with PM2...
    set NODE_ENV=%ENV%
    pm2 start dist\index.js --name thiep-cuoi-backend --env %ENV%
    pm2 save
    
    echo ✓ Server started with PM2
    echo 📊 Use 'pm2 status' to check server status
    echo 📊 Use 'pm2 logs thiep-cuoi-backend' to view logs
) else (
    echo ⚠️  PM2 not found. Starting server directly...
    echo ⚠️  For production, consider installing PM2: npm install -g pm2
    
    REM Kill existing process on port if any (requires additional tools)
    echo Starting server...
    set NODE_ENV=%ENV%
    start /B node dist\index.js > logs\server.log 2>&1
    echo ! > server.pid
    
    echo ✓ Server started
    echo ⚠️  Server is running in background. Check logs\server.log for output.
)

echo ✨ Deployment completed successfully!
echo 📍 Server should be running on port: 5000
echo 📍 API endpoint: http://localhost:5000/api

pause


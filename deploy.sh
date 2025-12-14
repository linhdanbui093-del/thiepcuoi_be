#!/bin/bash

# Deployment script for Wedding Invitation Backend
# Usage: ./deploy.sh [production|staging|development]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENV=${1:-production}
NODE_ENV=${NODE_ENV:-$ENV}
BUILD_DIR="./dist"
LOG_DIR="./logs"

echo -e "${GREEN}🚀 Starting deployment for environment: ${ENV}${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check Node.js version (require Node 18+)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please update .env file with your configuration!${NC}"
    else
        echo -e "${RED}❌ .env.example file not found. Please create .env file manually.${NC}"
        exit 1
    fi
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm ci --production=false

# Create necessary directories
echo -e "${GREEN}📁 Creating necessary directories...${NC}"
mkdir -p $BUILD_DIR
mkdir -p $LOG_DIR
mkdir -p uploads

# Build TypeScript
echo -e "${GREEN}🔨 Building TypeScript...${NC}"
npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A $BUILD_DIR)" ]; then
    echo -e "${RED}❌ Build failed. dist directory is empty.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"

# Check MongoDB connection (optional, can be skipped if MongoDB is on different server)
if [ -n "$MONGODB_URI" ]; then
    echo -e "${GREEN}🔍 Checking MongoDB connection...${NC}"
    # Simple check - you can enhance this
    echo -e "${YELLOW}⚠️  MongoDB connection check skipped. Please verify manually.${NC}"
fi

# Run database migrations/seeds (if needed)
if [ "$ENV" = "production" ] && [ "$RUN_SEED" != "false" ]; then
    read -p "Do you want to run seed data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}🌱 Running seed data...${NC}"
        npm run seed || echo -e "${YELLOW}⚠️  Seed failed or already exists${NC}"
    fi
fi

# Check if PM2 is installed (optional, for process management)
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}📊 PM2 detected. Managing process...${NC}"
    
    # Stop existing process if running
    pm2 stop thiep-cuoi-backend 2>/dev/null || true
    pm2 delete thiep-cuoi-backend 2>/dev/null || true
    
    # Start with PM2
    echo -e "${GREEN}🚀 Starting server with PM2...${NC}"
    pm2 start dist/index.js \
        --name thiep-cuoi-backend \
        --env $NODE_ENV \
        --log $LOG_DIR/pm2.log \
        --error $LOG_DIR/pm2-error.log \
        --out $LOG_DIR/pm2-out.log \
        --time \
        --merge-logs
    
    pm2 save
    
    echo -e "${GREEN}✓ Server started with PM2${NC}"
    echo -e "${GREEN}📊 Use 'pm2 status' to check server status${NC}"
    echo -e "${GREEN}📊 Use 'pm2 logs thiep-cuoi-backend' to view logs${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 not found. Starting server directly...${NC}"
    echo -e "${YELLOW}⚠️  For production, consider installing PM2: npm install -g pm2${NC}"
    
    # Kill existing process on port if any
    if [ -n "$PORT" ]; then
        PORT_NUM=${PORT:-5000}
        lsof -ti:$PORT_NUM | xargs kill -9 2>/dev/null || true
    fi
    
    # Start server directly
    NODE_ENV=$NODE_ENV node dist/index.js &
    echo $! > server.pid
    
    echo -e "${GREEN}✓ Server started (PID: $(cat server.pid))${NC}"
    echo -e "${YELLOW}⚠️  Server is running in background. Use 'kill $(cat server.pid)' to stop it.${NC}"
fi

# Health check
echo -e "${GREEN}🏥 Performing health check...${NC}"
sleep 3

PORT_NUM=${PORT:-5000}
HEALTH_URL="http://localhost:$PORT_NUM/api/health"

if command -v curl &> /dev/null; then
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo -e "${GREEN}✓ Server is healthy and responding${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed. Server might still be starting...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not found. Skipping health check.${NC}"
fi

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
echo -e "${GREEN}📍 Server should be running on port: ${PORT:-5000}${NC}"
echo -e "${GREEN}📍 API endpoint: http://localhost:${PORT:-5000}/api${NC}"


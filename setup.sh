#!/bin/bash

# Obsidian Share System Setup Script

set -e

echo "=== Obsidian Share System Setup ==="
echo

# Check for prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

echo "✓ Prerequisites check passed"
echo

# Create necessary directories
echo "Creating directories..."
mkdir -p backend/data backend/logs
echo "✓ Directories created"
echo

# Setup backend
echo "Setting up backend..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
cd ..
echo "✓ Backend setup complete"
echo

# Setup admin panel
echo "Setting up admin panel..."
cd admin-panel
if [ ! -d "node_modules" ]; then
    echo "Installing admin panel dependencies..."
    npm install
fi
cd ..
echo "✓ Admin panel setup complete"
echo

# Setup Obsidian plugin
echo "Setting up Obsidian plugin..."
cd obsidian-share-plugin
if [ ! -d "node_modules" ]; then
    echo "Installing plugin dependencies..."
    npm install
fi
cd ..
echo "✓ Obsidian plugin setup complete"
echo

# Build Docker images
echo "Building Docker images..."
docker-compose build
echo "✓ Docker images built"
echo

echo "=== Setup Complete ==="
echo
echo "To start the system:"
echo "1. Edit backend/.env file with your configuration"
echo "2. Run: docker-compose up -d"
echo "3. Backend API will be available at: http://localhost:3000"
echo "4. Admin panel will be available at: http://localhost:3001"
echo
echo "To install the Obsidian plugin:"
echo "1. Build the plugin: cd obsidian-share-plugin && npm run build"
echo "2. Copy the dist folder to your Obsidian vault's plugins directory"
echo "3. Enable the plugin in Obsidian settings"
echo
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123 (change this in .env file!)"
echo
echo "For more information, see README.md"
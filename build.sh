#!/bin/bash
set -e

echo "Starting build process..."

# Clear npm cache to avoid EBUSY errors
echo "Clearing npm cache..."
npm cache clean --force

# Install dependencies
echo "Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev --no-scripts --no-interaction

echo "Installing Node.js dependencies..."
npm ci

echo "Building assets..."
npm run build

echo "Build completed successfully!"

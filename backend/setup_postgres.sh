#!/bin/bash

# Define paths
BREW_PATH="/opt/homebrew/bin/brew"
if [ ! -f "$BREW_PATH" ]; then
    BREW_PATH="/usr/local/bin/brew"
fi

# Check if Brew exists
if [ ! -f "$BREW_PATH" ]; then
    echo "Error: Homebrew not found. Please install Homebrew first: https://brew.sh/"
    exit 1
fi

echo "Found Homebrew at $BREW_PATH"

# Install PostgreSQL if not found
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Installing..."
    "$BREW_PATH" install postgresql
else
    echo "PostgreSQL is already installed."
fi

# Start PostgreSQL service
echo "Starting PostgreSQL service..."
"$BREW_PATH" services start postgresql

# Wait a moment for it to start
sleep 5

# Create User and Database
# We use the 'postgres' user to execute these, or the current user if they have access
echo "Configuring Database..."

# Try to create user 'user' with password 'password' (matching database.py)
# Ignore error if exists
echo "Creating user 'user'..."
createdb colab_db 2>/dev/null || true
psql postgres -c "CREATE USER \"user\" WITH PASSWORD 'password';" 2>/dev/null || echo "User 'user' might already exist."
psql postgres -c "ALTER USER \"user\" WITH SUPERUSER;" 2>/dev/null

# Create database 'collab_db'
echo "Creating database 'collab_db'..."
createdb -U "user" collab_db 2>/dev/null || createdb collab_db 2>/dev/null || echo "Database 'collab_db' might already exist."

echo ""
echo "✅ PostgreSQL setup complete!"
echo "Connection URL: postgresql+asyncpg://user:password@localhost/collab_db"

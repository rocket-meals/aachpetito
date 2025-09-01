#!/bin/bash
set -e  # Exit on error

echo "Backend Sync Service Starting..."
echo "Current Directory: $(pwd)"

# Die Dependencies sind bereits im Docker Build installiert
# Starte die Anwendung direkt
echo "Starting backend-sync application..."
exec yarn start

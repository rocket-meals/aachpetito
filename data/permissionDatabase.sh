#!/bin/bash
echo "Setting read/write permission for uploads"
mkdir -p ./database_file_uploads/
chmod -R 777 ./database_file_uploads/

echo "Setting read/write permission for database"
# Ensure the database directory exists
mkdir -p ./database/
# Set read/write/execute permissions for all users
chmod -R 777 ./database/

echo "Setting read/write permission for database backups"
# Ensure the database backups directory exists
mkdir -p ./database_backups/
# Set read/write/execute permissions for all users
chmod -R 777 ./database_backups/

echo "Finished"

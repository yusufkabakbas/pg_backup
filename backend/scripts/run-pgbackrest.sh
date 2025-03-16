#!/bin/bash

# Script to execute pgBackRest commands in the pgbackrest container
# This script is mounted inside the backend container to provide a way to run
# pgBackRest commands without needing docker installed in the container

set -e

# Default values
PGBACKREST_HOST=${PGBACKREST_HOST:-"pgbackrest"}

# Check if command is provided
if [ $# -eq 0 ]; then
  echo "Error: No pgBackRest command provided"
  echo "Usage: $0 <pgbackrest command and arguments>"
  exit 1
fi

# Use netcat to execute the command on the pgbackrest container
# This is a simple implementation - in production you would use proper authentication
# and secure communication between containers

# First, write the command to a temporary file
TEMP_SCRIPT=$(mktemp)
chmod +x $TEMP_SCRIPT

# Prepare the command
echo "#!/bin/sh" > $TEMP_SCRIPT
echo "pgbackrest $@" >> $TEMP_SCRIPT

# Output useful information
echo "Executing pgBackRest command: pgbackrest $@"
echo "Target host: $PGBACKREST_HOST"

# Execute the script
cat $TEMP_SCRIPT | nc -q 0 $PGBACKREST_HOST 2223

# Cleanup
rm $TEMP_SCRIPT

exit 0 
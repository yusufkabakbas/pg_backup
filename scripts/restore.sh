#!/bin/bash

# Script for restoring PostgreSQL backups using pgBackRest
# Usage: ./restore.sh [stanza] [backup-set] [target-time]

set -e

STANZA=${1:-"main"}
BACKUP_SET=${2:-"latest"}
TARGET_TIME=${3:-""}
CONTAINER="pgbackrest"

echo "Starting restore operation at $(date)"
echo "Stanza: $STANZA"
echo "Backup Set: $BACKUP_SET"
echo "Target Time: $TARGET_TIME"

# Check if PostgreSQL is running and stop it if needed
echo "Checking PostgreSQL status..."
if docker exec postgres pg_isready -q; then
  echo "PostgreSQL is running. Stopping PostgreSQL..."
  docker exec postgres pg_ctl stop -m fast
  sleep 5
else
  echo "PostgreSQL is already stopped."
fi

# Build the restore command
RESTORE_CMD="pgbackrest --stanza=$STANZA restore"

if [ "$BACKUP_SET" != "latest" ]; then
  RESTORE_CMD="$RESTORE_CMD --set=$BACKUP_SET"
fi

if [ -n "$TARGET_TIME" ]; then
  RESTORE_CMD="$RESTORE_CMD --target-time=\"$TARGET_TIME\""
fi

# Run the restore
echo "Running restore command: $RESTORE_CMD"
docker exec $CONTAINER $RESTORE_CMD

# Start PostgreSQL after restore
echo "Starting PostgreSQL..."
docker exec postgres pg_ctl start

echo "Restore operation completed at $(date)"
echo "PostgreSQL should now be running with the restored data."
echo "Please verify the data integrity."

exit 0 
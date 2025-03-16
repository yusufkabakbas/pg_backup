#!/bin/bash

# Script for running PostgreSQL backups using pgBackRest
# Usage: ./backup.sh [type] [stanza]

set -e

BACKUP_TYPE=${1:-"incr"}
STANZA=${2:-"main"}
CONTAINER="pgbackrest"
LOG_FILE="/var/log/pgbackrest/backup-$(date +%Y%m%d-%H%M%S).log"

echo "Starting backup operation at $(date)" | tee -a $LOG_FILE
echo "Backup Type: $BACKUP_TYPE" | tee -a $LOG_FILE
echo "Stanza: $STANZA" | tee -a $LOG_FILE

# Validate backup type
if [[ "$BACKUP_TYPE" != "full" && "$BACKUP_TYPE" != "incr" && "$BACKUP_TYPE" != "diff" && "$BACKUP_TYPE" != "cleanup" ]]; then
  echo "Error: Invalid backup type. Must be 'full', 'incr', 'diff', or 'cleanup'." | tee -a $LOG_FILE
  exit 1
fi

# Run the appropriate command
if [[ "$BACKUP_TYPE" == "cleanup" ]]; then
  echo "Running cleanup (expire) operation..." | tee -a $LOG_FILE
  docker exec $CONTAINER pgbackrest --stanza=$STANZA expire 2>&1 | tee -a $LOG_FILE
else
  echo "Running $BACKUP_TYPE backup..." | tee -a $LOG_FILE
  docker exec $CONTAINER pgbackrest --stanza=$STANZA backup --type=$BACKUP_TYPE 2>&1 | tee -a $LOG_FILE
fi

# Check the result
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "Backup operation completed successfully at $(date)" | tee -a $LOG_FILE
  
  # Get backup info
  echo "Backup information:" | tee -a $LOG_FILE
  docker exec $CONTAINER pgbackrest info --stanza=$STANZA 2>&1 | tee -a $LOG_FILE
  
  exit 0
else
  echo "Backup operation failed at $(date)" | tee -a $LOG_FILE
  exit 1
fi 
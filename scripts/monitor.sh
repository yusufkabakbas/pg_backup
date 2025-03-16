#!/bin/bash

# Script for monitoring PostgreSQL backups
# Usage: ./monitor.sh [stanza]

set -e

STANZA=${1:-"main"}
CONTAINER="pgbackrest"
LOG_FILE="/var/log/pgbackrest/pgbackrest.log"
BACKUP_INFO_FILE="/tmp/pgbackrest_info.txt"

echo "Starting backup monitoring at $(date)"
echo "Stanza: $STANZA"

# Get backup information
echo "Getting backup information..."
docker exec $CONTAINER pgbackrest info --stanza=$STANZA > $BACKUP_INFO_FILE

# Display backup information
echo "=== Backup Information ==="
cat $BACKUP_INFO_FILE
echo "=========================="

# Check for recent backups (last 24 hours)
echo "Checking for recent backups..."
RECENT_BACKUPS=$(grep -i "backup complete" $LOG_FILE | grep -i "$(date +%Y-%m-%d)" | wc -l)
echo "Recent backups (today): $RECENT_BACKUPS"

# Check for backup failures
echo "Checking for backup failures..."
FAILURES=$(grep -i "error" $LOG_FILE | grep -i "$(date +%Y-%m-%d)" | wc -l)
echo "Backup failures (today): $FAILURES"

# Check disk space
echo "Checking disk space..."
docker exec $CONTAINER df -h /var/lib/pgbackrest

# Check PostgreSQL status
echo "Checking PostgreSQL status..."
if docker exec postgres pg_isready -q; then
  echo "PostgreSQL is running."
else
  echo "WARNING: PostgreSQL is not running!"
fi

# Check archive status
echo "Checking WAL archive status..."
docker exec postgres psql -U postgres -c "SELECT * FROM pg_stat_archiver;"

echo "Monitoring completed at $(date)"
exit 0 
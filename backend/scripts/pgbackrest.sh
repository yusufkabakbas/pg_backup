#!/bin/bash

# Simple script to execute pgBackRest commands directly from the backend
# This script relies on shared volumes and network connectivity between containers

# Log the command being executed
echo "[$(date)] Executing: pgbackrest $@" >> /tmp/pgbackrest_wrapper.log

# Execute pgbackrest command directly using the locally available configuration
pgbackrest "$@"

# Return the exit code of pgbackrest
exit $? 
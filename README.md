# PostgreSQL Backup Manager

A comprehensive solution for managing PostgreSQL backups using pgBackRest with a web-based management interface.

## Features

- **Automated Backups**: Schedule full, incremental, and differential backups
- **Optimized Performance**: Configurable resource usage to minimize impact on production systems
- **Multiple Database Support**: Manage backups for multiple PostgreSQL databases
- **Web Interface**: Monitor and manage backups through a modern React-based UI
- **Backup Monitoring**: Track backup sizes, durations, and success rates
- **Configuration Management**: Easily configure pgBackRest and backup schedules

## Architecture

The solution consists of the following components:

1. **PostgreSQL**: The database to be backed up
2. **pgBackRest**: The backup and restore tool for PostgreSQL
3. **Backend API**: NestJS application for managing backups and configurations
4. **Frontend UI**: React application for user interaction
5. **Cron Jobs**: Scheduled backup tasks

## Prerequisites

- Docker and Docker Compose
- Node.js 16+ (for development only)
- PostgreSQL 14+

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/pg-backup-manager.git
   cd pg-backup-manager
   ```

2. Configure your environment:

   - Edit `config/pgbackrest.conf` to match your PostgreSQL setup
   - Edit `config/postgresql.conf` if needed
   - Adjust backup schedules in `config/crontab`

3. Start the services:

   ```bash
   docker-compose up -d
   ```

4. Access the web interface at http://localhost

## Usage

### Initial Setup

1. Access the web interface and go to the "Databases" page
2. Add your PostgreSQL database(s) with connection details
3. Configure backup settings for each database

### Running Backups

#### Automated Backups

Backups will run automatically according to the schedule defined in the cron configuration:

- Full backups twice a day (1 AM and 1 PM)
- Incremental backups every hour
- Cleanup of old backups daily at 3 AM

#### Manual Backups

1. Go to the "Backups" page
2. Select the database and backup type
3. Click "Run Backup"

### Monitoring

The "Monitoring" page provides insights into:

- Backup sizes over time
- Backup durations
- Success/failure rates
- System resource usage during backups

### Configuration

The "Configuration" page allows you to modify:

- pgBackRest settings
- Backup schedules (cron configuration)

## Backup Commands

Here are the key commands used by the system:

### Initialize a Stanza

```bash
docker exec pgbackrest pgbackrest --stanza=main stanza-create
```

### Full Backup

```bash
docker exec pgbackrest pgbackrest --stanza=main backup --type=full
```

### Incremental Backup

```bash
docker exec pgbackrest pgbackrest --stanza=main backup --type=incr
```

### Differential Backup

```bash
docker exec pgbackrest pgbackrest --stanza=main backup --type=diff
```

### Cleanup Old Backups

```bash
docker exec pgbackrest pgbackrest --stanza=main expire
```

### View Backup Information

```bash
docker exec pgbackrest pgbackrest info --stanza=main
```

## Customization

### Adjusting Resource Usage

To optimize resource usage during backups, modify the following settings in `config/pgbackrest.conf`:

```
# Resource usage
buffer-size=16384
compress-level=6
compress-level-network=3
compress-threads=2
process-max=2
```

### Retention Policy

To change how long backups are kept, modify the `repo1-retention-full` setting in `config/pgbackrest.conf`:

```
repo1-retention-full=7
```

## Troubleshooting

### Backup Failures

1. Check the pgBackRest logs:

   ```bash
   docker exec pgbackrest cat /var/log/pgbackrest/pgbackrest.log
   ```

2. Verify PostgreSQL is accessible:

   ```bash
   docker exec pgbackrest pg_isready -h postgres -p 5432 -U postgres
   ```

3. Check the stanza status:
   ```bash
   docker exec pgbackrest pgbackrest info --stanza=main
   ```

### Web Interface Issues

1. Check the backend logs:

   ```bash
   docker logs pg_backup_backend
   ```

2. Check the frontend logs:
   ```bash
   docker logs pg_backup_frontend
   ```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

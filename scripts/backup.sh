#!/bin/sh
# Daily database backup script
# Runs via cron inside the backup container

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/apeks_backup_${TIMESTAMP}.sql.gz"

# Create backup
pg_dump -h db -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > "${BACKUP_FILE}"

# Remove backups older than 30 days
find ${BACKUP_DIR} -name "apeks_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}"

#!/bin/bash
# StudyAssist — MySQL auto backup
# Usage: bash backup-db.sh
# Cron:  0 3 * * * /var/www/studyassist/scripts/backup-db.sh >> /var/log/studyassist/backup.log 2>&1

set -euo pipefail

BACKUP_DIR="/var/backups/studyassist"
MAX_BACKUPS=14  # keep last 14 days

# Load DB credentials from .env
ENV_FILE="/var/www/studyassist/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: .env not found at $ENV_FILE"
  exit 1
fi

DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"')

# Parse mysql://user:password@host:port/dbname
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))")
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')

mkdir -p "$BACKUP_DIR"

FILENAME="$BACKUP_DIR/studyassist_$(date '+%Y%m%d_%H%M%S').sql.gz"

mysqldump \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$FILENAME"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup created: $FILENAME ($(du -sh "$FILENAME" | cut -f1))"

# Remove old backups (keep last MAX_BACKUPS)
ls -t "$BACKUP_DIR"/studyassist_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm --
REMOVED=$?
if [ $REMOVED -eq 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Old backups cleaned (keeping last $MAX_BACKUPS)"
fi

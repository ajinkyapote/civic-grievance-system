#!/bin/bash
set -e
STAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p ~/Projects/nv/civic-grievance-system/backups
mysqldump -u root -proot1234 civic_grievance_db > ~/Projects/nv/civic-grievance-system/backups/db_${STAMP}.sql
tar -czf ~/Projects/nv/civic-grievance-system/backups/uploads_${STAMP}.tar.gz -C ~/Projects/nv/civic-grievance-system/backend uploads 2>/dev/null || true
echo "Backup saved to backups/db_${STAMP}.sql"

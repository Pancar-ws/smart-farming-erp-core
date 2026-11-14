#!/usr/bin/env bash
# scripts/backup.sh — crontab: 0 23 * * * (TZ=Asia/Jakarta)
set -euo pipefail
TS=$(date +%Y%m%d_%H%M)
pg_dump -Fc -h db -U erp smartfarm > /tmp/smartfarm_$TS.dump
if [ -n "${BACKUP_PUBKEY:-}" ]; then
  age -r "$BACKUP_PUBKEY" -o /tmp/smartfarm_$TS.dump.age /tmp/smartfarm_$TS.dump
  rclone copy /tmp/smartfarm_$TS.dump.age remote:smartfarm-backup/
  rm -f /tmp/smartfarm_$TS.dump.age
fi
rm -f /tmp/smartfarm_$TS.dump


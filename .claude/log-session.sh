#!/bin/bash
cd /home/dev/pokemon-champions-assistant || exit 0

DATE=$(date +%Y-%m-%d)
TIME=$(date '+%H:%M')
LOG_DIR="session-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$DATE.md"

# 새 파일이면 헤더 작성
if [ ! -s "$LOG_FILE" ]; then
  echo "# 세션 로그 - $DATE" > "$LOG_FILE"
fi

{
  echo ""
  echo "---"
  echo ""
  echo "## $TIME"
  echo ""
  echo "**최근 커밋:**"
  git log --oneline -5 2>/dev/null || echo "(없음)"
  echo ""
  echo "**변경 상태:**"
  git status --short 2>/dev/null || echo "(변경 없음)"
} >> "$LOG_FILE"

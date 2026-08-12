#!/bin/bash
# ==============================================================================
# SQL Sync & Import Script
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_SOURCE_DIR="$PROJECT_ROOT/pkg/model/sql"
INFRA_ENV="$PROJECT_ROOT/deploy/.env.infra"

GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
CYAN='\033[36m'
RESET='\033[0m'

# 从 deploy/.env.infra 加载配置
if [ -f "$INFRA_ENV" ]; then
    set -a
    source "$INFRA_ENV"
    set +a
fi

MYSQL_CONTAINER="${MYSQL_CONTAINER:-cileme-mysql}"
MYSQL_USER="root"
MYSQL_PASSWORD="${MYSQL_ROOT_PASSWORD:-REDACTED}"
MYSQL_DATABASE="${MYSQL_DATABASE:-cileme}"

echo -e "${CYAN}=== SQL Sync & Import ===${RESET}"
echo ""

if ! docker ps | grep -q "$MYSQL_CONTAINER"; then
    echo -e "${RED}Error: MySQL container '$MYSQL_CONTAINER' is not running${RESET}"
    echo -e "${YELLOW}Please run 'make infra-up' first${RESET}"
    exit 1
fi

if [ ! -d "$SQL_SOURCE_DIR" ]; then
    echo -e "${RED}Error: SQL source directory not found: $SQL_SOURCE_DIR${RESET}"
    exit 1
fi

SQL_COUNT=$(find "$SQL_SOURCE_DIR" -name "*.sql" -type f | wc -l | tr -d ' ')

if [ "$SQL_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No SQL files found in $SQL_SOURCE_DIR${RESET}"
    exit 0
fi

echo -e "${CYAN}Found $SQL_COUNT SQL file(s)${RESET}"
echo -e "${CYAN}Target: $MYSQL_CONTAINER / $MYSQL_DATABASE${RESET}"
echo ""

TEMP_SQL=$(mktemp)
trap "rm -f $TEMP_SQL" EXIT

cat > "$TEMP_SQL" << 'EOF'
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

EOF

add_sql_file() {
    local SQL_FILE="$1"
    local FILENAME=$(basename "$SQL_FILE")

    echo -e "  ${GREEN}✓${RESET} ${FILENAME}"
    echo "" >> "$TEMP_SQL"
    echo "-- Table: ${FILENAME%.sql}" >> "$TEMP_SQL"
    cat "$SQL_FILE" >> "$TEMP_SQL"
    echo "" >> "$TEMP_SQL"
}

echo -e "${CYAN}Processing SQL files...${RESET}"

for SQL_FILE in "$SQL_SOURCE_DIR"/*.sql; do
    [ -f "$SQL_FILE" ] || continue
    add_sql_file "$SQL_FILE"
done

cat >> "$TEMP_SQL" << 'EOF'
SET FOREIGN_KEY_CHECKS = 1;
EOF

echo ""
echo -e "${CYAN}Importing to MySQL...${RESET}"

if docker exec -i "$MYSQL_CONTAINER" mysql \
    -u"$MYSQL_USER" \
    -p"$MYSQL_PASSWORD" \
    "$MYSQL_DATABASE" < "$TEMP_SQL" 2>/dev/null; then
    echo -e "${GREEN}✓ SQL imported successfully${RESET}"
else
    echo -e "${YELLOW}⚠ Import completed with warnings (some tables may already exist)${RESET}"
fi

echo ""

echo -e "${CYAN}Tables in database:${RESET}"
docker exec -i "$MYSQL_CONTAINER" mysql \
    -u"$MYSQL_USER" \
    -p"$MYSQL_PASSWORD" \
    "$MYSQL_DATABASE" \
    -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | while read table; do
        echo -e "  ${GREEN}•${RESET} $table"
    done

echo ""

#!/usr/bin/env bash

set -Eeuo pipefail

: "${PROJECT_ID:?Set PROJECT_ID to the dedicated GCP project id}"

export APP_ENVIRONMENT=staging
export SERVICE_NAME="${SERVICE_NAME:-rikms-staging}"
export SQL_INSTANCE_NAME="${SQL_INSTANCE_NAME:-rikms-staging-db}"
export SQL_TIER="${SQL_TIER:-db-g1-small}"
export DB_NAME="${DB_NAME:-rikms_staging}"
export DB_USER="${DB_USER:-rikms-staging-user}"
export SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-rikms-staging-runtime}"
export SCHEDULER_ACCOUNT_NAME="${SCHEDULER_ACCOUNT_NAME:-rikms-staging-scheduler}"
export APP_URL="${APP_URL:-https://rikms-staging.v3ra.net}"
export APP_KEY_SECRET="${APP_KEY_SECRET:-rikms-staging-app-key}"
export DB_PASSWORD_SECRET="${DB_PASSWORD_SECRET:-rikms-staging-db-password}"
export DOCUMENTS_BUCKET="${DOCUMENTS_BUCKET:-${PROJECT_ID}-rikms-staging-private}"
export SECURITY_REPORTS_BUCKET="${SECURITY_REPORTS_BUCKET:-${PROJECT_ID}-rikms-staging-security-private}"

exec "$(dirname "$0")/deploy-to-gcp.sh"

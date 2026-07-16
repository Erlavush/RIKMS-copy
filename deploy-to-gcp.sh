#!/usr/bin/env bash

set -Eeuo pipefail

# Production deployment entrypoint. This script never stores application or
# database secrets in the repository or in Cloud Run's plain-text env block.
: "${PROJECT_ID:?Set PROJECT_ID to the dedicated GCP project id}"

REGION="${REGION:-asia-east1}"
SERVICE_NAME="${SERVICE_NAME:-rikms-app}"
SQL_INSTANCE_NAME="${SQL_INSTANCE_NAME:-rikms-db}"
SQL_TIER="${SQL_TIER:-db-g1-small}"
DB_NAME="${DB_NAME:-rikms}"
DB_USER="${DB_USER:-rikms-user}"
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-rikms-runtime}"
SCHEDULER_ACCOUNT_NAME="${SCHEDULER_ACCOUNT_NAME:-rikms-scheduler}"
APP_URL="${APP_URL:-https://rikms.v3ra.net}"
APP_ENVIRONMENT="${APP_ENVIRONMENT:-production}"
APP_KEY_SECRET="${APP_KEY_SECRET:-rikms-app-key}"
DB_PASSWORD_SECRET="${DB_PASSWORD_SECRET:-rikms-db-password}"
DOCUMENTS_BUCKET="${DOCUMENTS_BUCKET:-${PROJECT_ID}-rikms-private}"
SECURITY_REPORTS_BUCKET="${SECURITY_REPORTS_BUCKET:-${PROJECT_ID}-rikms-security-private}"
RELEASE_TAG="${RELEASE_TAG:-release-candidate}"
GCLOUD_BIN="${GCLOUD_BIN:-gcloud}"
PHP_BIN="${PHP_BIN:-php}"

SERVICE_ACCOUNT="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SCHEDULER_ACCOUNT="${SCHEDULER_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
INSTANCE_CONNECTION="${PROJECT_ID}:${REGION}:${SQL_INSTANCE_NAME}"
APP_HOST="${APP_URL#*://}"
APP_HOST="${APP_HOST%%/*}"
APP_HOST_REGEX="${APP_HOST//./\\.}"

[[ "$SERVICE_NAME" =~ ^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$ ]] || { echo "SERVICE_NAME is invalid." >&2; exit 1; }
[[ "$RELEASE_TAG" =~ ^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$ ]] || { echo "RELEASE_TAG is invalid." >&2; exit 1; }

command -v "$GCLOUD_BIN" >/dev/null 2>&1 || { echo "gcloud is not available" >&2; exit 1; }
command -v "$PHP_BIN" >/dev/null 2>&1 || { echo "php is not available" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is not available" >&2; exit 1; }

if [[ -z "$($GCLOUD_BIN auth list --filter=status:ACTIVE --format='value(account)' --limit=1)" ]]; then
    echo "Authenticate gcloud before deploying." >&2
    exit 1
fi

$GCLOUD_BIN config set project "$PROJECT_ID" >/dev/null
PROJECT_NUMBER="$($GCLOUD_BIN projects describe "$PROJECT_ID" --format='value(projectNumber)')"
BUILD_ACCOUNT_EMAIL="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
BUILD_ACCOUNT="projects/${PROJECT_ID}/serviceAccounts/${BUILD_ACCOUNT_EMAIL}"
$GCLOUD_BIN services enable \
    aiplatform.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    cloudscheduler.googleapis.com \
    documentai.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    sqladmin.googleapis.com \
    storage.googleapis.com

if ! $GCLOUD_BIN iam service-accounts describe "$SERVICE_ACCOUNT" >/dev/null 2>&1; then
    $GCLOUD_BIN iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="RIKMS Cloud Run runtime"
fi
if ! $GCLOUD_BIN iam service-accounts describe "$SCHEDULER_ACCOUNT" >/dev/null 2>&1; then
    $GCLOUD_BIN iam service-accounts create "$SCHEDULER_ACCOUNT_NAME" \
        --display-name="RIKMS scheduled job invoker"
fi

$GCLOUD_BIN projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role=roles/cloudsql.client \
    --condition=None >/dev/null
$GCLOUD_BIN projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role=roles/aiplatform.user \
    --condition=None >/dev/null
$GCLOUD_BIN projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role=roles/documentai.apiUser \
    --condition=None >/dev/null
$GCLOUD_BIN projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${BUILD_ACCOUNT_EMAIL}" \
    --role=roles/run.builder \
    --condition=None >/dev/null
# New projects may grant Editor to the default compute identity. The identity is
# build-only for RIKMS and must not retain that project-wide role.
$GCLOUD_BIN projects remove-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${BUILD_ACCOUNT_EMAIL}" \
    --role=roles/editor \
    --condition=None >/dev/null 2>&1 || true

if ! $GCLOUD_BIN storage buckets describe "gs://${DOCUMENTS_BUCKET}" >/dev/null 2>&1; then
    $GCLOUD_BIN storage buckets create "gs://${DOCUMENTS_BUCKET}" \
        --location="$REGION" \
        --uniform-bucket-level-access \
        --public-access-prevention
fi
$GCLOUD_BIN storage buckets update "gs://${DOCUMENTS_BUCKET}" \
    --public-access-prevention \
    --uniform-bucket-level-access >/dev/null
$GCLOUD_BIN storage buckets add-iam-policy-binding "gs://${DOCUMENTS_BUCKET}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role=roles/storage.objectUser >/dev/null

if ! $GCLOUD_BIN storage buckets describe "gs://${SECURITY_REPORTS_BUCKET}" >/dev/null 2>&1; then
    $GCLOUD_BIN storage buckets create "gs://${SECURITY_REPORTS_BUCKET}" \
        --location="$REGION" \
        --uniform-bucket-level-access \
        --public-access-prevention
fi
$GCLOUD_BIN storage buckets update "gs://${SECURITY_REPORTS_BUCKET}" \
    --public-access-prevention \
    --uniform-bucket-level-access >/dev/null
$GCLOUD_BIN storage buckets add-iam-policy-binding "gs://${SECURITY_REPORTS_BUCKET}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role=roles/storage.objectUser >/dev/null
# Bucket creation adds project convenience grants. They are broader than the
# explicit runtime binding and can expose documents or assessment evidence.
for private_bucket in "$DOCUMENTS_BUCKET" "$SECURITY_REPORTS_BUCKET"; do
    while read -r member role; do
        $GCLOUD_BIN storage buckets remove-iam-policy-binding "gs://${private_bucket}" \
            --member="$member" \
            --role="$role" >/dev/null 2>&1 || true
    done <<EOF
projectViewer:${PROJECT_ID} roles/storage.legacyBucketReader
projectViewer:${PROJECT_ID} roles/storage.legacyObjectReader
projectEditor:${PROJECT_ID} roles/storage.legacyObjectOwner
projectOwner:${PROJECT_ID} roles/storage.legacyObjectOwner
projectEditor:${PROJECT_ID} roles/storage.legacyBucketOwner
projectOwner:${PROJECT_ID} roles/storage.legacyBucketOwner
EOF
done

if ! $GCLOUD_BIN sql instances describe "$SQL_INSTANCE_NAME" >/dev/null 2>&1; then
    $GCLOUD_BIN sql instances create "$SQL_INSTANCE_NAME" \
        --database-version=POSTGRES_15 \
        --tier="$SQL_TIER" \
        --region="$REGION" \
        --availability-type=zonal \
        --storage-type=SSD \
        --storage-size=10 \
        --storage-auto-increase \
        --backup-start-time=18:00 \
        --enable-point-in-time-recovery \
        --retained-backups-count=7 \
        --retained-transaction-log-days=7 \
        --deletion-protection
fi
$GCLOUD_BIN sql instances patch "$SQL_INSTANCE_NAME" \
    --backup-start-time=18:00 \
    --enable-point-in-time-recovery \
    --retained-backups-count=7 \
    --retained-transaction-log-days=7 \
    --storage-auto-increase \
    --ssl-mode=TRUSTED_CLIENT_CERTIFICATE_REQUIRED \
    --retain-backups-on-delete \
    --deletion-protection \
    --quiet >/dev/null

if ! $GCLOUD_BIN sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE_NAME" >/dev/null 2>&1; then
    $GCLOUD_BIN sql databases create "$DB_NAME" --instance="$SQL_INSTANCE_NAME"
fi

ensure_secret() {
    local name="$1" value="$2"
    if ! $GCLOUD_BIN secrets describe "$name" >/dev/null 2>&1; then
        $GCLOUD_BIN secrets create "$name" --replication-policy=automatic
        printf '%s' "$value" | $GCLOUD_BIN secrets versions add "$name" --data-file=- >/dev/null
    fi
    $GCLOUD_BIN secrets add-iam-policy-binding "$name" \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role=roles/secretmanager.secretAccessor >/dev/null
}

APP_KEY="$($PHP_BIN artisan key:generate --show)"
ensure_secret "$APP_KEY_SECRET" "$APP_KEY"
unset APP_KEY

DB_SECRET_CREATED=false
if [[ -n "${RIKMS_DB_PASSWORD:-}" ]]; then
    DB_PASSWORD="$RIKMS_DB_PASSWORD"
    if $GCLOUD_BIN secrets describe "$DB_PASSWORD_SECRET" >/dev/null 2>&1; then
        printf '%s' "$DB_PASSWORD" | $GCLOUD_BIN secrets versions add "$DB_PASSWORD_SECRET" --data-file=- >/dev/null
    else
        DB_SECRET_CREATED=true
        ensure_secret "$DB_PASSWORD_SECRET" "$DB_PASSWORD"
    fi
elif $GCLOUD_BIN secrets describe "$DB_PASSWORD_SECRET" >/dev/null 2>&1; then
    DB_PASSWORD="$($GCLOUD_BIN secrets versions access latest --secret="$DB_PASSWORD_SECRET")"
else
    DB_PASSWORD="$(openssl rand -base64 36 | tr -d '\n')"
    DB_SECRET_CREATED=true
    ensure_secret "$DB_PASSWORD_SECRET" "$DB_PASSWORD"
fi
ensure_secret "$DB_PASSWORD_SECRET" "$DB_PASSWORD"

if $GCLOUD_BIN sql users list --instance="$SQL_INSTANCE_NAME" --format='value(name)' | grep -Fxq "$DB_USER"; then
    if [[ "$DB_SECRET_CREATED" == true || -n "${RIKMS_DB_PASSWORD:-}" ]]; then
        $GCLOUD_BIN sql users set-password "$DB_USER" --instance="$SQL_INSTANCE_NAME" --password="$DB_PASSWORD"
    fi
else
    $GCLOUD_BIN sql users create "$DB_USER" --instance="$SQL_INSTANCE_NAME" --password="$DB_PASSWORD"
fi
unset DB_PASSWORD RIKMS_DB_PASSWORD

ENV_FILE="$(mktemp)"
PREVIOUS_REVISION="$($GCLOUD_BIN run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.latestReadyRevisionName)' 2>/dev/null || true)"
DEPLOY_TRAFFIC_ARGS=(--tag="$RELEASE_TAG")
if [[ -n "$PREVIOUS_REVISION" ]]; then
    # Cloud Run accepts --no-traffic only when updating an existing service.
    # A first staging deployment has no revision to protect, so its candidate
    # becomes the initial serving revision and is still validated below.
    DEPLOY_TRAFFIC_ARGS+=(--no-traffic)
fi
RELEASE_SUCCEEDED=false
TRAFFIC_STARTED=false
cleanup_release() {
    status=$?
    rm -f "$ENV_FILE"
    if [[ "$RELEASE_SUCCEEDED" != true && "$TRAFFIC_STARTED" == true && -n "$PREVIOUS_REVISION" ]]; then
        set +e
        echo "Release failed; restoring 100% traffic to ${PREVIOUS_REVISION}." >&2
        $GCLOUD_BIN run services update-traffic "$SERVICE_NAME" \
            --region="$REGION" \
            --to-revisions="${PREVIOUS_REVISION}=100" \
            --remove-tags="$RELEASE_TAG" \
            --quiet >/dev/null
        set -e
    fi
    return "$status"
}
trap cleanup_release EXIT
chmod 600 "$ENV_FILE"
cat >"$ENV_FILE" <<EOF
APP_NAME: RIKMS
APP_ENV: ${APP_ENVIRONMENT}
APP_DEBUG: "false"
APP_URL: ${APP_URL}
APP_TIMEZONE: Asia/Manila
TRUSTED_PROXIES: "*"
TRUSTED_HOSTS: '^${APP_HOST_REGEX}$|^${RELEASE_TAG}---${SERVICE_NAME}-[a-z0-9.-]+\\.run\\.app$|^localhost$|^127\\.0\\.0\\.1$'
CORS_ALLOWED_ORIGINS: ${APP_URL}
LOG_CHANNEL: stderr
LOG_LEVEL: warning
DB_CONNECTION: pgsql
DB_HOST: /cloudsql/${INSTANCE_CONNECTION}
DB_PORT: "5432"
DB_DATABASE: ${DB_NAME}
DB_USERNAME: ${DB_USER}
SESSION_DRIVER: database
SESSION_LIFETIME: "60"
SESSION_EXPIRE_ON_CLOSE: "true"
SESSION_ENCRYPT: "true"
SESSION_COOKIE: rikms_session
SESSION_SECURE_COOKIE: "true"
SESSION_HTTP_ONLY: "true"
SESSION_SAME_SITE: lax
CACHE_STORE: database
CACHE_PREFIX: rikms_cache_
QUEUE_CONNECTION: database
DOCUMENTS_DISK: documents
DOCUMENTS_ROOT: /mnt/rikms-documents
RIKMS_MAX_DOCUMENT_UPLOAD_KB: "25600"
RIKMS_MAX_HIGHLIGHT_UPLOAD_KB: "10240"
RIKMS_DOCUMENT_PROCESSING_AUTO_QUEUE: "true"
RIKMS_AI_ENABLED: "true"
RIKMS_AI_AUTO_QUEUE: "true"
GOOGLE_CLOUD_PROJECT: ${PROJECT_ID}
VERTEX_AI_LOCATION: global
VERTEX_AI_MODEL: gemini-3.1-flash-lite
RIKMS_AI_PROMPT_VERSION: rikms-metadata-v1
RIKMS_AI_TIMEOUT_SECONDS: "100"
DOCUMENTS_GCS_BUCKET: ${DOCUMENTS_BUCKET}
DOCUMENT_AI_LOCATION: us
RIKMS_DRIVE_SYNC_ENABLED: "false"
SECURITY_REPORTS_DISK: security-reports
SECURITY_REPORTS_PREFIX: reports
SECURITY_REPORTS_PATH: /mnt/rikms-security
SECURITY_ALLOWED_TARGETS: ${APP_URL}
SECURITY_PRODUCTION_HOST: ${APP_HOST}
SECURITY_ACTIVE_SCAN_ENABLED: "false"
CLAMAV_ENABLED: "false"
CLAMAV_REQUIRED: "false"
MAIL_MAILER: log
MAIL_FROM_ADDRESS: noreply@rikms.gov.ph
MAIL_FROM_NAME: RIKMS
EOF

$GCLOUD_BIN run deploy "$SERVICE_NAME" \
    --source=. \
    --build-service-account="$BUILD_ACCOUNT" \
    --region="$REGION" \
    --service-account="$SERVICE_ACCOUNT" \
    --allow-unauthenticated \
    --ingress=all \
    --port=8080 \
    --cpu=1 \
    --memory=512Mi \
    --concurrency=10 \
    --min-instances=0 \
    --max-instances=5 \
    --timeout=120s \
    --cpu-boost \
    --add-cloudsql-instances="$INSTANCE_CONNECTION" \
    --env-vars-file="$ENV_FILE" \
    --set-secrets="APP_KEY=${APP_KEY_SECRET}:latest,DB_PASSWORD=${DB_PASSWORD_SECRET}:latest" \
    --add-volume="name=rikms-documents,type=cloud-storage,bucket=${DOCUMENTS_BUCKET},mount-options=implicit-dirs;uid=82;gid=82;file-mode=660;dir-mode=770" \
    --add-volume-mount="volume=rikms-documents,mount-path=/mnt/rikms-documents" \
    --startup-probe="initialDelaySeconds=0,timeoutSeconds=3,periodSeconds=3,failureThreshold=20,httpGet.port=8080,httpGet.path=/up" \
    --liveness-probe="initialDelaySeconds=10,timeoutSeconds=3,periodSeconds=30,failureThreshold=3,httpGet.port=8080,httpGet.path=/up" \
    "${DEPLOY_TRAFFIC_ARGS[@]}" \
    --quiet

CANDIDATE_REVISION="$($GCLOUD_BIN run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.latestReadyRevisionName)')"
SERVICE_URL="$($GCLOUD_BIN run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)')"
CANDIDATE_URL="${SERVICE_URL/https:\/\//https:\/\/${RELEASE_TAG}---}"
CANDIDATE_IMAGE="$($GCLOUD_BIN run services describe "$SERVICE_NAME" --region="$REGION" --format='value(spec.template.spec.containers[0].image)')"

DOWNLOAD_LOG_FILTER='resource.type="cloud_run_revision" AND resource.labels.service_name="'"$SERVICE_NAME"'" AND httpRequest.requestUrl:"/download" AND httpRequest.requestUrl:"grant="'
if $GCLOUD_BIN logging sinks describe _Default --format='value(exclusions[].name)' | tr ';' '\n' | grep -Fxq rikms_download_grant_tokens; then
    $GCLOUD_BIN logging sinks update _Default \
        --update-exclusion="name=rikms_download_grant_tokens,description=Exclude bearer grant query strings while application audit events retain download evidence,filter=${DOWNLOAD_LOG_FILTER}" \
        --quiet >/dev/null
else
    $GCLOUD_BIN logging sinks update _Default \
        --add-exclusion="name=rikms_download_grant_tokens,description=Exclude bearer grant query strings while application audit events retain download evidence,filter=${DOWNLOAD_LOG_FILTER}" \
        --quiet >/dev/null
fi

# Migrations are forward-only. Seeding and migrate:fresh are deliberately absent.
$GCLOUD_BIN run jobs deploy "${SERVICE_NAME}-migrate" \
    --image="$CANDIDATE_IMAGE" \
    --region="$REGION" \
    --service-account="$SERVICE_ACCOUNT" \
    --set-cloudsql-instances="$INSTANCE_CONNECTION" \
    --env-vars-file="$ENV_FILE" \
    --set-secrets="APP_KEY=${APP_KEY_SECRET}:latest,DB_PASSWORD=${DB_PASSWORD_SECRET}:latest" \
    --command=php \
    --args=artisan,migrate,--force \
    --max-retries=1 \
    --task-timeout=10m

# Finish forward-only schema changes before the scheduler or queue can invoke
# code from the new image.
$GCLOUD_BIN run jobs execute "${SERVICE_NAME}-migrate" --region="$REGION" --wait

$GCLOUD_BIN run jobs deploy "${SERVICE_NAME}-schedule" \
    --image="$CANDIDATE_IMAGE" \
    --region="$REGION" \
    --service-account="$SERVICE_ACCOUNT" \
    --set-cloudsql-instances="$INSTANCE_CONNECTION" \
    --env-vars-file="$ENV_FILE" \
    --set-secrets="APP_KEY=${APP_KEY_SECRET}:latest,DB_PASSWORD=${DB_PASSWORD_SECRET}:latest" \
    --add-volume="name=rikms-documents,type=cloud-storage,bucket=${DOCUMENTS_BUCKET},mount-options=implicit-dirs;uid=82;gid=82;file-mode=660;dir-mode=770" \
    --add-volume-mount="volume=rikms-documents,mount-path=/mnt/rikms-documents" \
    --add-volume="name=rikms-security-reports,type=cloud-storage,bucket=${SECURITY_REPORTS_BUCKET},mount-options=implicit-dirs;uid=82;gid=82;file-mode=660;dir-mode=770" \
    --add-volume-mount="volume=rikms-security-reports,mount-path=/mnt/rikms-security" \
    --command=php \
    --args=artisan,schedule:run,--no-interaction \
    --max-retries=1 \
    --task-timeout=5m

$GCLOUD_BIN run jobs deploy "${SERVICE_NAME}-queue" \
    --image="$CANDIDATE_IMAGE" \
    --region="$REGION" \
    --service-account="$SERVICE_ACCOUNT" \
    --set-cloudsql-instances="$INSTANCE_CONNECTION" \
    --env-vars-file="$ENV_FILE" \
    --set-secrets="APP_KEY=${APP_KEY_SECRET}:latest,DB_PASSWORD=${DB_PASSWORD_SECRET}:latest" \
    --add-volume="name=rikms-documents,type=cloud-storage,bucket=${DOCUMENTS_BUCKET},mount-options=implicit-dirs;uid=82;gid=82;file-mode=660;dir-mode=770" \
    --add-volume-mount="volume=rikms-documents,mount-path=/mnt/rikms-documents" \
    --command=php \
    --args='^|^artisan|queue:work|--queue=ai,default|--stop-when-empty|--tries=3|--max-time=540|--sleep=1' \
    --max-retries=1 \
    --task-timeout=10m

for job in "${SERVICE_NAME}-schedule" "${SERVICE_NAME}-queue"; do
    $GCLOUD_BIN run jobs add-iam-policy-binding "$job" \
        --region="$REGION" \
        --member="serviceAccount:${SCHEDULER_ACCOUNT}" \
        --role=roles/run.invoker >/dev/null

    scheduler_name="${job}-every-minute"
    scheduler_uri="https://run.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/jobs/${job}:run"
    if $GCLOUD_BIN scheduler jobs describe "$scheduler_name" --location="$REGION" >/dev/null 2>&1; then
        $GCLOUD_BIN scheduler jobs update http "$scheduler_name" \
            --location="$REGION" \
            --schedule='* * * * *' \
            --time-zone=Asia/Manila \
            --uri="$scheduler_uri" \
            --http-method=POST \
            --oauth-service-account-email="$SCHEDULER_ACCOUNT" \
            --oauth-token-scope=https://www.googleapis.com/auth/cloud-platform >/dev/null
    else
        $GCLOUD_BIN scheduler jobs create http "$scheduler_name" \
            --location="$REGION" \
            --schedule='* * * * *' \
            --time-zone=Asia/Manila \
            --uri="$scheduler_uri" \
            --http-method=POST \
            --oauth-service-account-email="$SCHEDULER_ACCOUNT" \
            --oauth-token-scope=https://www.googleapis.com/auth/cloud-platform >/dev/null
    fi
done

probe_candidate() {
    local path="$1" expected="$2"
    body="$(curl --fail --silent --show-error --max-time 20 \
        --header='Accept: application/json' \
        "${CANDIDATE_URL}${path}")"
    if [[ "$body" != *"\"status\":\"${expected}\""* ]]; then
        echo "Candidate probe ${path} returned an unexpected body." >&2
        return 1
    fi
}

probe_candidate /up up
probe_candidate /ready ready

if [[ -n "$PREVIOUS_REVISION" ]]; then
    $GCLOUD_BIN run services update-traffic "$SERVICE_NAME" \
        --region="$REGION" \
        --to-tags="${RELEASE_TAG}=5" \
        --quiet
    TRAFFIC_STARTED=true
    curl --fail --silent --show-error --max-time 20 --header='Accept: application/json' "${APP_URL}/up" >/dev/null

    $GCLOUD_BIN run services update-traffic "$SERVICE_NAME" \
        --region="$REGION" \
        --to-tags="${RELEASE_TAG}=25" \
        --quiet
    # Mixed traffic must use a health route shared by the old and new revisions.
    # Candidate readiness is already verified directly through CANDIDATE_URL above.
    curl --fail --silent --show-error --max-time 20 --header='Accept: application/json' "${APP_URL}/up" >/dev/null
fi

$GCLOUD_BIN run services update-traffic "$SERVICE_NAME" \
    --region="$REGION" \
    --to-revisions="${CANDIDATE_REVISION}=100" \
    --remove-tags="$RELEASE_TAG" \
    --quiet
curl --fail --silent --show-error --max-time 20 --header='Accept: application/json' "${APP_URL}/ready" >/dev/null

RELEASE_SUCCEEDED=true
echo "Released ${CANDIDATE_REVISION} to ${APP_URL}; previous revision: ${PREVIOUS_REVISION:-none}."

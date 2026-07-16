#!/usr/bin/env bash

set -Eeuo pipefail

: "${PROJECT_ID:?Set PROJECT_ID to the dedicated GCP project id}"

GCLOUD_BIN="${GCLOUD_BIN:-gcloud}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-Erlavush/RIKMS}"
GITHUB_ENVIRONMENT="${GITHUB_ENVIRONMENT:-security-staging}"
POOL_ID="${POOL_ID:-github-actions}"
PROVIDER_ID="${PROVIDER_ID:-github}"
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-rikms-security-uploader}"
SECURITY_REPORTS_BUCKET="${SECURITY_REPORTS_BUCKET:-${PROJECT_ID}-rikms-staging-security-private}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

command -v "$GCLOUD_BIN" >/dev/null 2>&1 || { echo "gcloud is not available" >&2; exit 1; }
ACTIVE_ACCOUNT="$($GCLOUD_BIN auth list --filter=status:ACTIVE --format='value(account)' --limit=1)"
[[ -n "$ACTIVE_ACCOUNT" ]] || { echo "Authenticate gcloud before configuring OIDC." >&2; exit 1; }

$GCLOUD_BIN config set project "$PROJECT_ID" >/dev/null
PROJECT_NUMBER="$($GCLOUD_BIN projects describe "$PROJECT_ID" --format='value(projectNumber)')"

if ! $GCLOUD_BIN iam service-accounts describe "$SERVICE_ACCOUNT" >/dev/null 2>&1; then
    $GCLOUD_BIN iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="RIKMS GitHub security report uploader"
fi

if ! $GCLOUD_BIN iam workload-identity-pools describe "$POOL_ID" --location=global >/dev/null 2>&1; then
    $GCLOUD_BIN iam workload-identity-pools create "$POOL_ID" \
        --location=global \
        --display-name="GitHub Actions"
fi

if ! $GCLOUD_BIN iam workload-identity-pools providers describe "$PROVIDER_ID" \
    --workload-identity-pool="$POOL_ID" --location=global >/dev/null 2>&1; then
    $GCLOUD_BIN iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
        --workload-identity-pool="$POOL_ID" \
        --location=global \
        --issuer-uri=https://token.actions.githubusercontent.com \
        --attribute-mapping='google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref' \
        --attribute-condition="assertion.repository == '${GITHUB_REPOSITORY}'"
fi

PRINCIPAL="principal://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/subject/repo:${GITHUB_REPOSITORY}:environment:${GITHUB_ENVIRONMENT}"
$GCLOUD_BIN iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT" \
    --role=roles/iam.workloadIdentityUser \
    --member="$PRINCIPAL" >/dev/null
$GCLOUD_BIN storage buckets add-iam-policy-binding "gs://${SECURITY_REPORTS_BUCKET}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role=roles/storage.objectCreator >/dev/null

echo "Configure the security-staging GitHub environment with these non-secret variables:"
echo "GCP_PROJECT_ID=${PROJECT_ID}"
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"
echo "GCP_SECURITY_SCANNER_SERVICE_ACCOUNT=${SERVICE_ACCOUNT}"
echo "GCP_SECURITY_REPORTS_BUCKET=${SECURITY_REPORTS_BUCKET}"

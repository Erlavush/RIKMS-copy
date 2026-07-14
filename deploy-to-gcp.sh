#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# ==========================================
# Configuration (Change as needed)
# ==========================================
PROJECT_ID="bustling-art-498816-s8"
REGION="asia-east1" # Choose a region close to your team (e.g., asia-east1, us-central1)
SERVICE_NAME="rikms-app"
SQL_INSTANCE_NAME="rikms-db"
DB_NAME="rikms"
DB_USER="rikms-user"
DB_PASSWORD="SuperStrongPassword123!" # Change this!

GCLOUD_BIN="/home/eru/.local/opt/google-cloud-sdk/bin/gcloud"

echo "======================================================="
echo " Starting GCP Deployment Preparation for RIKMS         "
echo "======================================================="

# Ensure user is logged in
echo "Checking gcloud authentication..."
if ! "$GCLOUD_BIN" auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "ERROR: You need to authenticate first."
    echo "Please run: gcloud auth login"
    exit 1
fi

echo "Setting active project to: $PROJECT_ID"
"$GCLOUD_BIN" config set project "$PROJECT_ID"


# Enable Google Cloud Services APIs
echo "Enabling required Google Cloud APIs..."
"$GCLOUD_BIN" services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com

# Create database instance if not already existing
echo "Checking if Cloud SQL database instance '$SQL_INSTANCE_NAME' exists..."
if ! "$GCLOUD_BIN" sql instances list --format="value(name)" | grep -q "^$SQL_INSTANCE_NAME$"; then
    echo "Cloud SQL instance '$SQL_INSTANCE_NAME' not found. Creating a lightweight DB (db-f1-micro) for testing..."
    "$GCLOUD_BIN" sql instances create "$SQL_INSTANCE_NAME" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="$REGION"
    
    echo "Creating database '$DB_NAME'..."
    "$GCLOUD_BIN" sql databases create "$DB_NAME" --instance="$SQL_INSTANCE_NAME"

    echo "Creating database user '$DB_USER'..."
    "$GCLOUD_BIN" sql users create "$DB_USER" --instance="$SQL_INSTANCE_NAME" --password="$DB_PASSWORD"
else
    echo "Cloud SQL instance '$SQL_INSTANCE_NAME' already exists."
fi

# Secret Manager for Laravel App Key
echo "Creating application key secret..."
APP_KEY=$(php artisan key:generate --show)
if ! "$GCLOUD_BIN" secrets list --format="value(name)" | grep -q "^RIKMS_APP_KEY$"; then
    "$GCLOUD_BIN" secrets create RIKMS_APP_KEY --replication-policy="automatic"
    echo -n "$APP_KEY" | "$GCLOUD_BIN" secrets versions add RIKMS_APP_KEY --data-file=-
else
    echo "Secret RIKMS_APP_KEY already exists."
fi

# Build and Deploy using Google Cloud Build and Cloud Run
echo "Building container and deploying to Google Cloud Run..."
"$GCLOUD_BIN" run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --allow-unauthenticated \
    --add-cloudsql-instances "$PROJECT_ID:$REGION:$SQL_INSTANCE_NAME" \
    --update-env-vars="DB_CONNECTION=pgsql,DB_HOST=127.0.0.1,DB_DATABASE=$DB_NAME,DB_USERNAME=$DB_USER,DB_PASSWORD=$DB_PASSWORD,APP_ENV=staging,APP_DEBUG=true,SESSION_DRIVER=database,CACHE_STORE=database,QUEUE_CONNECTION=database" \
    --set-secrets="APP_KEY=RIKMS_APP_KEY:latest"

echo "======================================================="
echo " Deployment Complete!                                  "
echo " Next: Run migrations and seed database in the cloud.  "
echo "======================================================="

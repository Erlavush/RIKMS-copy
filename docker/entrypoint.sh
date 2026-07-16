#!/bin/sh

set -eu

# Cache only after Cloud Run has injected environment variables and secrets.
php artisan config:cache
php artisan route:cache
php artisan view:cache

# The cache commands run as the container entrypoint user and create fresh
# files after the image-level chown. PHP-FPM runs as www-data and must be able
# to refresh compiled views and write framework caches at runtime.
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

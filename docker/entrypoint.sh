#!/bin/sh
set -e

export PORT="${PORT:-8080}"
echo "[entrypoint] PORT=${PORT}"

echo "[entrypoint] ensuring storage directories exist"
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache/data storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
echo "[entrypoint] nginx config written:"
cat /etc/nginx/conf.d/default.conf

echo "[entrypoint] launching: $@"

# Run pending migrations before starting the app. --force is required
# because APP_ENV=production would otherwise prompt for confirmation,
# which has no TTY to answer in a container.
echo "[entrypoint] running migrations"
php artisan migrate --force

exec "$@"

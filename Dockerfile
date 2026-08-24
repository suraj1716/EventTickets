# --- Stage 1: build frontend assets ---

FROM node:20-slim AS frontend
WORKDIR /app

ARG VITE_APP_NAME
ENV VITE_APP_NAME=$VITE_APP_NAME

COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build


# --- Stage 2: PHP app ---

FROM php:8.3-fpm AS base

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    libicu-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP deps first (cache-friendly layer)

COPY composer.json composer.lock ./

RUN composer install \
    --optimize-autoloader \
    --no-dev \
    --no-interaction \
    --no-scripts

# Copy full app code

COPY . .

# Bring in built frontend assets from stage 1

COPY --from=frontend /app/public/build ./public/build

# Run post-install scripts now that full app + artisan is present

RUN composer run-script post-autoload-dump --no-interaction || true

# nginx + supervisor config

COPY docker/nginx.conf.template /etc/nginx/conf.d/default.conf.template

RUN rm -f /etc/nginx/sites-enabled/default

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY docker/entrypoint.sh /entrypoint.sh

COPY docker/php-fpm-pool.conf /usr/local/etc/php-fpm.d/zz-pool.conf

RUN rm -f /usr/local/etc/php-fpm.d/*.conf.default \
    /usr/local/etc/php-fpm.d/docker.conf

COPY docker/www.conf /usr/local/etc/php-fpm.d/www.conf

RUN sed -i 's/\r$//' /entrypoint.sh

RUN cat -A /entrypoint.sh

RUN chmod +x /entrypoint.sh

RUN mkdir -p \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/cache/data \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]

CMD ["sh", "-c", "php artisan config:clear && php artisan config:cache && php artisan route:cache && exec supervisord -c /etc/supervisor/conf.d/supervisord.conf"]

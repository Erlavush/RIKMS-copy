# --- Stage 1: Build Assets ---
FROM node:22-alpine AS asset-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Runtime Environment ---
FROM php:8.3-fpm-alpine
WORKDIR /var/www/html

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    bash \
    sqlite-dev \
    oniguruma-dev \
    libxml2-dev

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql pdo_pgsql pdo_sqlite gd zip opcache bcmath pcntl

# Copy application files
COPY . .
COPY --from=asset-builder /app/public/build ./public/build

# Install production PHP dependencies
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --classmap-authoritative --no-interaction --no-progress

# Set up write permissions for Laravel storage/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Copy custom configurations
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/www.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]

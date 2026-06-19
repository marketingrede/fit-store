FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY vite.config.js ./
COPY resources ./resources
RUN npm run build

FROM php:8.3-apache
RUN apt-get update && apt-get install -y \
    libsqlite3-dev \
    libffi-dev \
    unzip \
    && docker-php-ext-install pdo pdo_sqlite ffi \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/* \
    && echo "ffi.enable=true" > /usr/local/etc/php/conf.d/ffi.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .
COPY --from=assets /app/public/assets ./public/assets

RUN mkdir -p data public/uploads var/cache/twig \
    && chown -R www-data:www-data data public/uploads var

COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

ENV APP_ENV=production
ENV APP_DEBUG=false

EXPOSE 80

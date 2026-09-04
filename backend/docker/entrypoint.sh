#!/bin/sh
set -e

# Free-tier disk is ephemeral, so every boot starts from a clean, seeded
# database rather than assuming prior state survived a restart.
touch database/database.sqlite
php artisan migrate:fresh --seed --force

php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"

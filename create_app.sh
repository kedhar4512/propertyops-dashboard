#!/usr/bin/env bash
set -euo pipefail

APP_API="property_ops_api"
APP_UI="property_ops_ui"

echo "==> Checking prerequisites..."
command -v ruby >/dev/null 2>&1 || { echo "Ruby not found. Install Ruby 3.1+."; exit 1; }
command -v rails >/dev/null 2>&1 || { echo "Rails not found. Install Rails 7+ (gem install rails)."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node not found. Install Node 18+."; exit 1; }

if [ -d "$APP_API" ]; then
  echo "==> '$APP_API' already exists. Remove it if you want to regenerate."
else
  echo "==> Creating Rails API ($APP_API)..."
  rails new "$APP_API" --api --database=sqlite3

  echo "==> Applying Rails template..."
  (cd "$APP_API" && bin/rails app:template LOCATION=../rails_template.rb)

  echo "==> Installing gems, migrating, seeding..."
  (cd "$APP_API" && bundle install)
  (cd "$APP_API" && bin/rails db:migrate)
  (cd "$APP_API" && bin/rails db:seed)
fi

if [ -d "$APP_UI" ]; then
  echo "==> '$APP_UI' already exists. Skipping UI copy."
else
  echo "==> Copying React UI template to $APP_UI..."
  cp -R ./ui_template "$APP_UI"
fi

echo ""
echo "✅ Done."
echo ""
echo "Next steps:"
echo "1) Terminal A: cd $APP_API && bin/rails s"
echo "2) Terminal B: cd $APP_UI && npm install && npm run dev"
echo "Open: http://localhost:5173"

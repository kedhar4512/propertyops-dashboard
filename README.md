# PropertyOps (Full‑Stack) — React + Rails API + SQL

This repo is a **professional** portfolio project :
- Build/modify front-end features (React + HTML/CSS/JS)
- Troubleshoot/debug and document
- Work with SQL-backed data
- Write tests 

Because a complete Rails app contains many generated files, this repo uses a **repeatable generator script**
that creates the Rails API and wires in the provided React front-end.

## What you’ll build
A small property-management workflow:
- Tenants (CRUD)
- Units (CRUD)
- Maintenance Requests (Create + status updates)
- Payments (record payment + list history)
- Search/filter in the UI

## Prerequisites
- Ruby 3.1+ and Bundler
- Rails 7+
- Node 18+
- (Optional) Postgres. By default, the Rails API uses **SQLite** for easiest setup.

## Quick start (Mac/Linux/WSL)
```bash
cd property_ops_fullstack_template
bash create_app.sh
```

The script will:
1) Create `property_ops_api` (Rails API) using SQLite
2) Apply `rails_template.rb` (models, controllers, routes, seeds)
3) Install gems and run migrations
4) Start API at http://localhost:3000
5) Prepare the React front-end in `property_ops_ui` (Vite)

### Run servers
In terminal A:
```bash
cd property_ops_api
bin/rails s
```

In terminal B:
```bash
cd property_ops_ui
npm install
npm run dev
```

Open the UI:
- http://localhost:5173

## API endpoints (high level)
- GET/POST `/api/tenants`
- GET/PATCH/DELETE `/api/tenants/:id`
- GET/POST `/api/units`
- GET/POST `/api/maintenance_requests`
- PATCH `/api/maintenance_requests/:id`
- GET/POST `/api/payments`

## Seeds
The generator loads sample data (tenants, units, requests, payments).

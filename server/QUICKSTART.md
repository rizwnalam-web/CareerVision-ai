# Quick Start Guide - Server Setup

## 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer and follow setup wizard
- Remember the password you set for postgres user

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## 2. Create Database

```bash
# Using psql (easiest)
psql -U postgres

# In psql prompt:
CREATE DATABASE careervision;
\q
```

## 3. Setup Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment
# Edit .env with your database credentials
# Default should work if you just installed PostgreSQL

# Run migrations to create schema
npm run migrate
```

## 4. Start Server

```bash
# Development mode
npm run dev

# You should see:
# ✓ Database connected
# ✓ CareerVision API Server running on http://localhost:3001
```

## 5. Test It Works

```bash
# In another terminal
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"...","service":"CareerVision API"}
```

## 6. Create Sample Data

```bash
# Create a career
curl -X POST http://localhost:3001/api/careers \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "description": "Build amazing applications",
    "category": "Technology",
    "growth": "high"
  }'

# Create a user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "country": "USA"
  }'
```

## 7. Connect Frontend

Update the main app to use the server APIs instead of mock data. The frontend should call:
- `http://localhost:3001/api/careers`
- `http://localhost:3001/api/institutions`
- etc.

## Troubleshooting

**"Database connection failed"**
- Check PostgreSQL is running: `pg_isready`
- Check credentials in `server/.env`

**"Port 3001 already in use"**
- Change PORT in `.env`

**"Cannot find module 'pg'"**
- Run `npm install` in server folder

## Next Steps

1. Add authentication (JWT tokens)
2. Connect frontend to these APIs
3. Implement business logic
4. Add more validations
5. Deploy to production

For detailed information, see [README.md](./README.md)

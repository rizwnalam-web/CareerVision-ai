# CareerVision Backend Server

A PostgreSQL-backed Express.js API server for the CareerVision application. This server provides RESTful APIs for managing careers, institutions, study materials, funding opportunities, interviews, and user profiles.

## Project Structure

```
server/
├── src/
│   ├── db/
│   │   └── database.ts           # PostgreSQL connection setup
│   ├── migrations/
│   │   ├── 001_initial_schema.ts # Initial database schema
│   │   └── runMigrations.ts      # Migration runner
│   ├── routes/
│   │   ├── careers.ts            # Career paths & milestones API
│   │   ├── institutions.ts       # Institutions API
│   │   ├── materials.ts          # Study materials API
│   │   ├── funding.ts            # Funding opportunities API
│   │   ├── interviews.ts         # Interview sessions & questions API
│   │   └── users.ts              # User profiles API
│   ├── middleware/
│   │   └── errorHandler.ts       # Error handling middleware
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── index.ts                  # Main server file
├── .env                          # Environment variables
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Git

## Installation

1. **Install dependencies**
```bash
cd server
npm install
```

2. **Configure environment variables**

Edit `server/.env` and set your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=careervision
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

3. **Set up PostgreSQL database**

Create a PostgreSQL database:

```bash
createdb careervision
```

Or using psql:

```sql
CREATE DATABASE careervision;
```

4. **Run database migrations**

```bash
npm run migrate
```

This will:
- Create all necessary tables (users, career_paths, institutions, study_materials, funding_opportunities, interview_questions, interview_sessions, interview_feedbacks)
- Set up indexes for performance
- Create triggers for automatic `updated_at` timestamps

## Scripts

```bash
# Start development server
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run database migrations
npm run migrate

# Lint TypeScript
npm run lint
```

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Career Paths
- **GET** `/api/careers` - Get all career paths
- **GET** `/api/careers/:id` - Get career with milestones
- **POST** `/api/careers` - Create new career
- **PUT** `/api/careers/:id` - Update career
- **DELETE** `/api/careers/:id` - Delete career
- **GET** `/api/careers/:careerId/milestones` - Get milestones
- **POST** `/api/careers/:careerId/milestones` - Create milestone
- **DELETE** `/api/careers/milestones/:milestoneId` - Delete milestone

### Institutions
- **GET** `/api/institutions` - Get all institutions (supports filters: country, city, type)
- **GET** `/api/institutions/:id` - Get institution details
- **POST** `/api/institutions` - Create institution
- **PUT** `/api/institutions/:id` - Update institution
- **DELETE** `/api/institutions/:id` - Delete institution

### Study Materials
- **GET** `/api/materials` - Get materials (supports filters: careerId, type, region, skillLevel)
- **GET** `/api/materials/:id` - Get material details
- **POST** `/api/materials` - Create material
- **PUT** `/api/materials/:id` - Update material
- **DELETE** `/api/materials/:id` - Delete material

### Funding Opportunities
- **GET** `/api/funding` - Get funding (supports filters: category, type)
- **GET** `/api/funding/:id` - Get opportunity details
- **POST** `/api/funding` - Create opportunity
- **PUT** `/api/funding/:id` - Update opportunity
- **DELETE** `/api/funding/:id` - Delete opportunity

### Interview System
- **GET** `/api/interviews/questions` - Get interview questions (filters: tier, category, company)
- **POST** `/api/interviews/questions` - Create question
- **GET** `/api/interviews/sessions/user/:userId` - Get user's sessions
- **GET** `/api/interviews/sessions/:id` - Get session with feedbacks
- **POST** `/api/interviews/sessions` - Create session
- **PUT** `/api/interviews/sessions/:id` - Update session
- **POST** `/api/interviews/feedbacks` - Create feedback
- **PUT** `/api/interviews/feedbacks/:id` - Update feedback

### Users
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user details
- **GET** `/api/users/firebase/:firebaseUid` - Get user by Firebase UID
- **POST** `/api/users` - Create user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

## Database Schema

### Tables

1. **users** - User profiles with education and financial info
2. **career_paths** - Career opportunity definitions
3. **milestones** - Career progression milestones
4. **institutions** - Educational institutions
5. **study_materials** - Learning resources and courses
6. **funding_opportunities** - Scholarships, grants, and loans
7. **interview_questions** - Interview practice questions
8. **interview_sessions** - User interview practice sessions
9. **interview_feedbacks** - Feedback on individual answers
10. **migrations** - Track executed migrations

### Key Features
- UUID primary keys for all tables
- Automatic `created_at` and `updated_at` timestamps
- Foreign key relationships with cascade delete
- Optimized indexes for common queries
- JSONB support for flexible data storage

## Development

### Adding a New Route

1. Create a new file in `src/routes/`
2. Import and use it in `src/index.ts`
3. Follow the pattern from existing routes

### Running Migrations

If you make schema changes:

1. Create a new migration file: `002_your_change.ts`
2. Implement `up()` and `down()` functions
3. Add to migrations array in `runMigrations.ts`
4. Run `npm run migrate`

## Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists: `createdb careervision`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill existing process: `lsof -i :3001`

### Migrations Won't Run
- Check database permissions
- Run migrations with proper user: `psql -U postgres careervision`

## Testing the API

Use curl or Postman:

```bash
# Health check
curl http://localhost:3001/health

# Get all careers
curl http://localhost:3001/api/careers

# Create a career
curl -X POST http://localhost:3001/api/careers \
  -H "Content-Type: application/json" \
  -d '{"title":"Software Engineer","category":"Technology","growth":"high"}'
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use environment-specific `.env` file
3. Enable SSL: `DB_SSL=true` in `.env`
4. Run: `npm run build && npm start`
5. Use process manager like PM2: `pm2 start dist/index.js`

## Security Considerations

- Use strong database passwords
- Set `DB_SSL=true` for remote connections
- Implement authentication middleware
- Add rate limiting
- Validate all inputs on both frontend and backend
- Keep dependencies updated

## Future Enhancements

- [ ] Add authentication & JWT tokens
- [ ] Implement role-based access control
- [ ] Add request validation schemas
- [ ] Create comprehensive API documentation (Swagger/OpenAPI)
- [ ] Add email notification system
- [ ] Implement caching layer (Redis)
- [ ] Add comprehensive logging
- [ ] Create admin dashboard API

## Support

For issues or questions, create an issue in the repository.

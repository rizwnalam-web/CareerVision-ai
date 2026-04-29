# User Registration Feature - Complete Guide

This document provides an end-to-end overview of the user registration feature implemented in CareerVision.

## Overview

The registration feature allows users to create accounts using email and password authentication. The system integrates with both email/password and Google authentication providers.

## Architecture

### Backend (Express.js + PostgreSQL)

#### Database Schema Updates
- **Migration**: `002_add_password_field.ts`
- **New Columns**:
  - `password_hash`: VARCHAR(255) - Bcrypt hashed password
  - `registration_method`: VARCHAR(50) - Tracks registration method (email, google, firebase)

#### API Endpoints

##### 1. **User Registration** 
- **Route**: `POST /api/users/auth/register`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123",
  "age": 25,
  "country": "USA",
  "interests": ["Software Development", "AI"],
  "budget": 50000,
  "education": "Bachelor's Degree"
}
```
- **Response** (Success - 201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "age": 25,
    "country": "USA",
    "registrationMethod": "email",
    "createdAt": "2026-04-29T14:52:34.156Z",
    "updatedAt": "2026-04-29T14:52:34.156Z"
  }
}
```
- **Error Response** (400):
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

##### 2. **User Login**
- **Route**: `POST /api/users/auth/login`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Response** (Success - 200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "age": 25,
    "country": "USA",
    "registrationMethod": "email",
    "createdAt": "2026-04-29T14:52:34.156Z",
    "updatedAt": "2026-04-29T14:52:34.156Z"
  }
}
```
- **Error Response** (401):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### Security Features
- **Password Hashing**: Using bcryptjs with 10 salt rounds
- **Password Validation**: Minimum 6 characters
- **Duplicate Email Prevention**: Unique constraint on email field
- **Password Not Returned**: Password hash is excluded from API responses

### Frontend (React + TypeScript)

#### Components

##### 1. **RegisterScreen** (`src/components/RegisterScreen.tsx`)
A comprehensive registration form component with:
- Email validation
- Password strength requirements
- Password confirmation matching
- Optional fields (age, country, budget, education, interests)
- Real-time error display
- Loading states
- Success confirmation screen

**Props**:
```typescript
interface RegisterScreenProps {
  onBack?: () => void;
  onSuccess?: (user: any) => void;
}
```

**Features**:
- Form validation (email format, password length, password match)
- Grid layout for optional fields
- Comma-separated interests input
- Success message with redirect to login
- Accessible form controls with icons

##### 2. **Updated LoginScreen** (`src/components/Auth.tsx`)
Enhanced LoginScreen with:
- Google OAuth option (existing)
- Email/Password login option
- Link to registration screen
- Email login form with validation

**Props**:
```typescript
interface LoginScreenProps {
  onBack?: () => void;
  onShowRegister?: () => void;
}
```

#### Services

##### Authentication Service (`src/services/authService.ts`)
```typescript
// Register a new user
registerUser(data: RegistrationRequest): Promise<any>

// Login existing user
loginUser(data: LoginRequest): Promise<any>

// Fetch user profile
getUserProfile(userId: string): Promise<any>
```

#### Types (`src/types/auth.ts`)
```typescript
interface RegistrationRequest {
  email: string;
  name: string;
  password: string;
  age?: number;
  country?: string;
  interests?: string[];
  budget?: number;
  education?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  age?: number;
  country?: string;
  education?: string;
  interests?: string;
  budget?: number;
  registrationMethod?: "email" | "google" | "firebase";
  createdAt: Date;
  updatedAt: Date;
}
```

### App State Management (`src/App.tsx`)
- New state: `authMode` - tracks 'login' or 'register' view
- Conditional rendering of RegisterScreen or LoginScreen
- Routing logic for authentication flow

## User Flow Diagram

```
Landing Page
    ↓
Authentication Screen
    ├─→ Google Login → Authenticated App
    ├─→ Email Login → Login Form → Authenticated App
    └─→ Create Account → Registration Form
         ├─ Validation errors → Stay on form
         ├─ Success → Confirmation screen
         └─ Back to Login → Email Login
```

## Setup Instructions

### Backend Setup
1. **Install Dependencies**:
   ```bash
   cd server
   npm install bcryptjs @types/bcryptjs @types/cors
   ```

2. **Run Migrations**:
   ```bash
   npm run migrate
   ```

3. **Start Server**:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. **Install Dependencies** (already done):
   ```bash
   npm install
   ```

2. **Update Environment** (`.env`):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. **Start Client**:
   ```bash
   npm run dev
   ```

## Testing the Feature

### Using cURL

#### 1. Register a New User
```bash
curl -X POST http://localhost:3001/api/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "name": "Test User",
    "password": "TestPassword123",
    "country": "USA",
    "age": 25
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3001/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123"
  }'
```

#### 3. Get User Profile
```bash
curl http://localhost:3001/api/users/{userId}
```

### Using Postman

1. Create a new `POST` request to `http://localhost:3001/api/users/auth/register`
2. Set body to JSON and add registration data
3. Send and verify response

## Database Schema

```sql
-- Users table with new fields
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  age INTEGER,
  country VARCHAR(100),
  interests TEXT,
  budget DECIMAL(12, 2),
  education VARCHAR(255),
  registration_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
```

## Security Considerations

### ✅ Implemented
- Password hashing with bcryptjs (10 salt rounds)
- Password strength validation (minimum 6 characters)
- Email uniqueness constraint
- Password excluded from responses
- Input validation on frontend and backend
- CORS configured for security

### 🔄 Recommended Future Enhancements
- JWT token generation and validation
- Email verification workflow
- Password reset functionality
- Rate limiting on auth endpoints
- Two-factor authentication (2FA)
- Session management
- HTTPS enforcement in production
- Refresh token mechanism

## Error Handling

### Frontend Validation Errors
- Empty email: "Email is required"
- Invalid email format: "Invalid email format"
- Empty password: "Password is required"
- Password too short: "Password must be at least 6 characters"
- Passwords don't match: "Passwords do not match"
- Empty name: "Name is required"

### Backend Validation Errors
- Missing required fields: 400 Bad Request
- Email already exists: 400 Bad Request
- Invalid password: 401 Unauthorized
- User not found: 401 Unauthorized
- Database error: 500 Internal Server Error

## Database Migrations

### Current Migrations
1. `001_initial_schema.ts` - Initial database setup
2. `002_add_password_field.ts` - Add password and registration method

### Running Migrations
```bash
# Run all pending migrations
npm run migrate

# Migrations are tracked in the 'migrations' table
SELECT * FROM migrations;
```

## File Structure

```
server/
├── src/
│   ├── routes/
│   │   └── users.ts          # Registration & login endpoints
│   ├── migrations/
│   │   ├── 001_initial_schema.ts
│   │   └── 002_add_password_field.ts
│   ├── types/
│   │   └── index.ts          # Auth interfaces
│   └── db/
│       └── database.ts
src/
├── components/
│   ├── Auth.tsx              # LoginScreen (updated)
│   └── RegisterScreen.tsx    # New registration form
├── services/
│   └── authService.ts        # API calls
├── types/
│   └── auth.ts              # Auth types
└── App.tsx                   # Auth routing (updated)
```

## Performance Considerations

- **Password Hashing**: bcryptjs with 10 salt rounds (good security/performance balance)
- **Database Indexes**: Email and Firebase UID indexed for fast lookups
- **Input Validation**: Frontend validation reduces server load
- **Error Messages**: Generic messages prevent user enumeration attacks

## Future Enhancements

1. **Email Verification**
   - Send verification email on registration
   - Verify email before account activation

2. **Password Reset**
   - Forgot password functionality
   - Reset token via email

3. **Social Authentication**
   - Additional providers (GitHub, LinkedIn)
   - Account linking

4. **User Profile Enrichment**
   - Additional fields based on user journey
   - Profile picture upload
   - Education credentials

5. **Authentication Audit**
   - Login history
   - Device tracking
   - Suspicious activity detection

## Support & Troubleshooting

### Common Issues

**1. "User with this email already exists"**
- Solution: Use a unique email or check if account already exists

**2. "Password must be at least 6 characters"**
- Solution: Create a password with at least 6 characters

**3. "Database connection failed"**
- Solution: Verify PostgreSQL is running and .env credentials are correct

**4. "CORS error on registration"**
- Solution: Ensure CORS_ORIGIN in server .env matches frontend URL

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in server .env

## Contact & Issues
For bugs or feature requests, please create an issue in the repository.

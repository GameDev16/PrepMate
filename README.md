# PrepMate - AI Study Workspace

Turn any PDF into beautiful study notes. Upload a PDF, generate notes/flashcards/MCQs/etc in 18 different formats.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL 16 (via Docker)
- **ORM**: Drizzle ORM
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **File Upload**: multer, pdf-parse
- **AI**: Gemini REST API (optional)

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- (Optional) Gemini API key for AI-powered generation

## Setup

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Configure Environment

```bash
# Server
cd server
cp .env.example .env
# Edit .env with your settings (especially JWT_SECRET)
```

### 3. Install Dependencies

```bash
# Server
cd server
npm install

# Client (from project root)
npm install
```

### 4. Initialize Database

```bash
cd server
npx drizzle-kit push
```

### 5. Run Development Servers

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Environment Variables

### server/.env

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | Server port (default: 5000) |
| NODE_ENV | No | development or production |
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Secret for JWT signing |
| CLIENT_URL | No | Frontend URL for OAuth redirects |
| GEMINI_API_KEY | No | Enables AI generation |
| GOOGLE_CLIENT_ID | No | For Google OAuth |
| GOOGLE_CLIENT_SECRET | No | For Google OAuth |
| UNLIMITED_CREDIT_EMAILS | No | Comma-separated emails with unlimited credits |

## API Endpoints

### Auth
- POST `/api/auth/register` - Create account
- POST `/api/auth/login` - Sign in
- POST `/api/auth/logout` - Sign out
- GET `/api/auth/me` - Get current user
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password
- GET `/api/auth/google` - Google OAuth redirect
- GET `/api/auth/google/callback` - Google OAuth callback

### Core
- POST `/api/upload` - Upload PDF
- POST `/api/generate` - Generate notes from PDF
- GET `/api/dashboard` - Dashboard stats
- GET `/api/history` - Generation history

### Notebooks
- GET `/api/notebooks` - List notebooks
- POST `/api/notebooks` - Create notebook
- PATCH `/api/notebooks/:id` - Update notebook
- DELETE `/api/notebooks/:id` - Delete notebook

### Notes
- GET `/api/notes` - List notes (with filters)
- GET `/api/notes/:id` - Get single note
- PATCH `/api/notes/:id` - Update note
- DELETE `/api/notes/:id` - Delete note

### Health
- GET `/api/health` - Database health check

## 18 Study Templates

1. Long Form Notes
2. Concise Notes
3. Revision Notes
4. Bullet Points
5. Q&A Mode
6. Flashcards
7. Cheat Sheet
8. Teacher Notes
9. Beginner Mode
10. Advanced Mode
11. Interview Prep
12. Mind Map
13. Comparison Tables
14. Formula Sheet
15. MCQ Generator
16. Timeline
17. Case Study
18. Viva Preparation

## Credits System

- New users get 3 free credits
- Each generation costs 1 credit
- Unlimited credits for emails in UNLIMITED_CREDIT_EMAILS

## Production Build

```bash
# Build frontend
npm run build

# Run server (serves built frontend)
cd server
NODE_ENV=production npm start
```



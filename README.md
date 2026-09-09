# Beginner Tutor Lab

A Next.js prototype for studying how beginners learn difficult subjects through guided chat. The app lets multiple students chat about a topic, stores learning sessions, and turns each chat turn into teacher-facing evidence: readiness level, misconceptions, strengths, learning pattern, next topic, and suggested teaching move.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in real values:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=beginner_tutor_lab
```

If `OPENAI_API_KEY` is missing, the chat route uses a local heuristic analyzer so the prototype still works. If `MONGODB_URI` is missing, sessions are stored in memory and reset when the server restarts.

## Access Control

The dashboard is protected by app-owned signup and sign-in:

- New users must enter the verification code configured by `SIGNUP_VERIFICATION_CODE`.
- Passwords are salted and hashed before storage.
- Sign-in uses an HTTP-only session cookie.
- Dashboard APIs reject anonymous requests.

For local development, the default verification code is `iitg_learningscience`. Set `AUTH_SESSION_SECRET` to a long random value before using this beyond a local prototype.

## Core Routes

- `GET /auth` shows sign in and signup.
- `POST /api/auth/signup` creates an account after code verification.
- `POST /api/auth/signin` signs in.
- `POST /api/auth/signout` signs out.
- `GET /api/sessions` lists student sessions.
- `POST /api/sessions` creates a new student session.
- `POST /api/sessions/:id/chat` adds a student message, gets a tutor reply, updates learning evidence, and saves the session.
- `GET /api/cohort` summarizes cohort-level learning patterns.
# learningpattern
# learning

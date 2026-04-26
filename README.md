# Finance Manager

A multi-user budget management system with a React frontend and Flask/PostgreSQL backend.

## Project Structure

```text
Frontend/   React frontend prototype
backend/    Flask API and PostgreSQL models
```

## Frontend

```bash
cd Frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
uv sync
```

Create `backend/.env`:

```bash
SECRET_KEY=change-this-in-development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_manager
```

Run the app:

```bash
uv run flask --app main run --debug
```

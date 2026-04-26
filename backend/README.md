# Finance Manager Backend

Flask API and PostgreSQL data model for the Finance Manager system.

## Setup

```bash
uv sync
```

Create a `.env` file:

```bash
SECRET_KEY=change-this-in-development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_manager
```

Run the API:

```bash
uv run flask --app main run --debug
```

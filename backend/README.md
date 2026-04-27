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

Apply migrations:

```bash
./.venv/bin/flask --app main db upgrade
```

Run the API:

```bash
uv run flask --app main run --debug
```

## Demo Seed

```bash
./.venv/bin/python scripts/seed_demo.py
```

This creates or refreshes a sample user:

```text
Email: demo@financemanager.local
Password: DemoPass123!
```

For two more presentation-friendly personas:

```bash
./.venv/bin/python scripts/seed_demo_personas.py
```

```text
Rahul Sharma (hosteller): rahul.hosteller@financemanager.local
Arjun Mehta (corporate): arjun.corporate@financemanager.local
Password for both: PersonaDemo123!
```

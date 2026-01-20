# Backend (NestJS)

## Deploy (Docker)

1) Copy env template:

- `backend/env.example` → create your server env vars (recommended: store in your server's `.env` or secrets manager)

2) Build & run:

```bash
docker compose up -d --build
```

## Swagger

- Swagger UI: `http://localhost:3001/api`

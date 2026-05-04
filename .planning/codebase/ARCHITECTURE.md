# Codebase Map

## Project: Desafio NexusSaude

### Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React    │     │ Bootstrap │     │  Backend  │
│  Frontend  │     │ Frontend  │     │  (Node)   │
└─────┬──────┘     └─────┬──────┘     └─────┬──────┘
      │                  │                  │
      └────────┬────────┘                  │
               │                           │
               └───────────┬───────────────┘
                         ▼
                  ┌─────────────┐
                  │ PostgreSQL  │
                  │  (Docker)  │
                  └───────────┘
```

### Backend Stack

| Technology | Purpose |
|-----------|---------|
| Express.js 4.18.x | HTTP server |
| TypeScript 5.3.x | Type safety |
| Drizzle ORM 0.29.x | PostgreSQL ORM |
| Zod 3.22.x | Input validation |
| Swagger/OpenAPI 3.0 | API documentation |
| Express Rate Limit 7.1.x | Rate limiting |

### Backend Routes

| Endpoint | Description |
|----------|------------|
| `/api/:schema/:table` | Generic CRUD for any table |
| `/api/stats/*` | Statistics endpoints |
| `/api-docs` | Swagger UI |
| `/health` | Health check |

### Database Schemas

| Schema | Table | Description |
|--------|-------|------------|
| `central_teste` | `base_geral` | Agendamentos (scheduling) |
| `relacionamento_teste` | `convocacao_de_exames_geral` | Convocacoes (exam convokes) |

### Frontends

| Frontend | Stack | Status |
|---------|-------|--------|
| frontend-bootstrap | Bootstrap 5.3, Chart.js, XLSX | Working |
| frontend-react | React 18.2, Vite, TypeScript | Working |

### Technology Notes

- PostgreSQL runs via Docker (docker-compose.yml)
- Two separate schemas: `central_teste` and `relacionamento_teste`
- API key middleware protects endpoints
- Generic CRUD allows operating on any table/schema
# Desafio NexusSaude

## What This Is

Healthcare scheduling and exam convocation API with two frontends. Backend exposes REST API for managing appointments (agendamentos) and exam convokes (convocacoes), consumed by Bootstrap and React frontends. PostgreSQL database via Docker.

## Core Value

Healthcare workers can schedule exams and manage convokes efficiently through a unified API.

## Requirements

### Validated

- ✓ REST API for agendamentos (scheduling) — existing
- ✓ REST API for convocacoes (exam convokes) — existing
- ✓ PostgreSQL database — existing
- ✓ Bootstrap frontend — existing
- ✓ React frontend — existing

### Active

- [ ] New API features (to define)
- [ ] Security improvements
- [ ] UX improvements
- [ ] Performance optimization
- [ ] Code quality refactoring

### Out of Scope

- New database (PostgreSQL sufficient)

## Context

This is a brownfield project with existing:
- Express/TypeScript backend with Drizzle ORM
- Two frontends: Bootstrap and React
- PostgreSQL via Docker Compose
- API key protected endpoints
- Swagger documentation

## Constraints

- **Stack**: Node.js 20.x, Express 4.18.x, Drizzle ORM, PostgreSQL
- **Deployment**: Docker-based
- **API Security**: API key middleware

## Key Decisions

| Decision | Rationale | Outcome |
|----------|---------|---------|
| PostgreSQL | Healthcare data requires relational integrity | — Pending |
| Drizzle ORM | Type-safe SQL mapping | — Pending |

---
*Last updated: 2025-05-04 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
# Requirements: Desafio NexusSaude

**Defined:** 2025-05-04
**Core Value:** Healthcare workers can schedule exams and manage convokes efficiently through a unified API.

## v1 Requirements

### Authentication & Security

- [ ] **AUTH-01**: User can log in with email/password
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: API requires authentication for protected endpoints
- [ ] **AUTH-05**: Role-based access control (admin/user)

### API Features

- [ ] **API-01**: User can view list of agendamentos with pagination
- [ ] **API-02**: User can filter agendamentos by status/date
- [ ] **API-03**: User can view list of convocacoes with pagination
- [ ] **API-04**: User can filter convocacoes by status/date
- [ ] **API-05**: User can export data to Excel
- [ ] **API-06**: User can export data to PDF

### UX Improvements

- [ ] **UX-01**: Dashboard shows key metrics at a glance
- [ ] **UX-02**: Charts visualize exam scheduling trends
- [ ] **UX-03**: Responsive design works on mobile

### Performance

- [ ] **PERF-01**: API responses under 500ms
- [ ] **PERF-02**: Database queries optimized with indexes

### Code Quality

- [ ] **QUAL-01**: All endpoints have input validation
- [ ] **QUAL-02**: Error messages are user-friendly
- [ ] **QUAL-03**: API documentation is current

## v2 Requirements

### Notifications

- **NOTF-01**: User receives email notifications for new convokes
- **NOTF-02**: User receives SMS reminders for upcoming exams

### Advanced Features

- **ADV-01**: Calendar view of scheduled exams
- **ADV-02**: Multi-user collaboration on scheduling

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity, not core to value |
| Video calls | Out of scope for scheduling app |
| Mobile native app | Web-first, mobile later |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 2 | Pending |
| API-04 | Phase 2 | Pending |
| API-05 | Phase 3 | Pending |
| API-06 | Phase 3 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| PERF-01 | Phase 4 | Pending |
| PERF-02 | Phase 4 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2025-05-04*
*Last updated: 2025-05-04 after initial definition*
# Desafio NexusSaude - API e Frontend

Este projeto foi desenvolvido para o desafio da NexusSaude, consistindo em uma API RESTful com Node.js/Express e um frontend HTML (Bootstrap) que consome dados de um banco PostgreSQL.

## 📋 Índice

- [Stack de Tecnologias](#stack-de-tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução Local](#instalação-e-execução-local)
- [Docker Compose](#docker-compose)
- [Descrição dos Endpoints](#descrição-dos-endpoints)
- [Autenticação](#autenticação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## 🛠 Stack de Tecnologias

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Node.js | 20.x | Runtime JavaScript |
| Express | 4.18.x | Framework web |
| TypeScript | 5.3.x | Superset JavaScript |
| Drizzle ORM | 0.29.x | ORM PostgreSQL |
| Swagger/OpenAPI | 3.0 | Documentação da API |
| Zod | 3.22.x | Validação de dados |
| Express Rate Limit | 7.1.x | Rate limiting |

### Frontend HTML (Principal)
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Bootstrap | 5.3.x | Framework CSS |
| Chart.js | 4.4.x | Gráficos |
| XLSX | 0.18.x | Exportação Excel |
| JavaScript ES6+ | - | Lógica frontend |

---

## ✅ Pré-requisitos

- Node.js 20.x ou superior
- Docker e Docker Compose (opcional)
- Banco de dados PostgreSQL (fornecido no desafio)

---

## 🚀 Instalação e Execução Local

### 1. Backend (API)

```bash
# Navegar para o diretório do backend
cd backend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

**URLs do Backend:**
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api-docs
- Health: http://localhost:3000/health

---

### 2. Frontend HTML (Principal)

**Opção A - Abrir diretamente no navegador:**
```
Abra o arquivo frontend-html/index.html no navegador
```

**Opção B - Servir com servidor HTTP:**
```bash
cd frontend-html

# Python (já vem instalado)
python -m http.server 8080

# Ou com npx
npx serve .
```

Acesse: http://localhost:8080

---

### 3. (Removido)

# Executar
npm run dev
```

Acesse: http://localhost:3001

---

## 🐳 Docker Compose

Para executar todo o projeto com Docker:

```bash
# Na raiz do projeto
docker-compose up --build
```

**Serviços:**
- Backend: http://localhost:3000
- Frontend HTML: http://localhost:8080

**Parar os serviços:**
```bash
docker-compose down
```

---

## 📖 Descrição dos Endpoints

### 1. GET `/api/agendamentos`

**Descrição:** Lista todos os agendamentos com paginação, filtros, ordenação e busca.

**Parâmetros Query:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página |
| `limit` | number | 20 | Registros por página (máx: 100) |
| `sort` | string | id | Campo para ordenação |
| `order` | string | asc | Direção (`asc` ou `desc`) |
| `status` | string | - | Filtrar por status |
| `etapa` | string | - | Filtrar por etapa atual |
| `solicitante` | string | - | Buscar por nome do solicitante |
| `colaborador` | string | - | Buscar por nome do colaborador |
| `tipoExame` | string | - | Filtrar por tipo de exame |
| `cidade` | string | - | Filtrar por cidade |
| `q` | string | - | Busca geral |

**Exemplo de Requisição:**
```bash
curl -H "X-API-Key: desafio2025_nexus_key" \
  "http://localhost:3000/api/agendamentos?page=1&limit=20"
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "totalPages": 75,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. GET `/api/agendamentos/:id`

**Descrição:** Retorna os detalhes completos de um agendamento específico pelo ID.

**Parâmetros URL:**
- `id` (obrigatório): ID do agendamento

**Exemplo:**
```bash
curl -H "X-API-Key: desafio2025_nexus_key" \
  "http://localhost:3000/api/agendamentos/1"
```

---

### 3. GET `/api/convocacoes`

**Descrição:** Lista todas as convocações com paginação, filtros, ordenação e busca.

**Parâmetros Query:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página |
| `limit` | number | 20 | Registros por página |
| `sort` | string | nome | Campo para ordenação |
| `order` | string | asc | Direção |
| `cargo` | string | - | Filtrar por cargo |
| `nome` | string | - | Buscar por nome |
| `matricula` | string | - | Buscar por matrícula |
| `exame` | string | - | Filtrar por tipo de exame |
| `situacao` | string | - | Filtrar por situação |
| `cidade` | string | - | Filtrar por cidade |
| `estado` | string | - | Filtrar por estado |
| `q` | string | - | Busca geral |

**Exemplo:**
```bash
curl -H "X-API-Key: desafio2025_nexus_key" \
  "http://localhost:3000/api/convocacoes?page=1&limit=20"
```

---

### 4. GET `/api/convocacoes/:matricula`

**Descrição:** Retorna os detalhes de uma convocação específica pela matrícula.

**Parâmetros URL:**
- `matricula` (obrigatório): Matrícula do colaborador

**Exemplo:**
```bash
curl -H "X-API-Key: desafio2025_nexus_key" \
  "http://localhost:3000/api/convocacoes/123456"
```

---

### 5. GET `/api-docs`

**Descrição:** Interface interativa Swagger/OpenAPI para testar os endpoints visualmente.

**Acesso:** http://localhost:3000/api-docs

---

## 🔐 Autenticação

Todos os endpoints requerem **API Key** no header:

```bash
curl -H "X-API-Key: desafio2025_nexus_key" \
  "http://localhost:3000/api/agendamentos"
```

**Nota:** Em produção, recomenda-se usar OAuth2/JWT. A API Key é apenas para demonstração.

---

## 📁 Estrutura do Projeto

```
/desafio
├── .env                         # Variáveis de ambiente
├── docker-compose.yml           # Orquestração Docker
├── README.md                    # Este arquivo
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── Dockerfile
│   └── src/
│       ├── index.ts             # Servidor Express
│       ├── routes/api.ts        # Endpoints REST
│       ├── middleware/apiKey.ts # Autenticação
│       ├── middleware/errorHandler.ts
│       ├── db/schema.ts         # Schema Drizzle
│       └── docs/swagger.ts      # Documentação
└── frontend-html/               # Frontend principal
    ├── index.html
    ├── css/styles.css
    ├── js/api.js
    ├── js/app.js
    └── Dockerfile
```

---

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz (ou no diretório backend):

```env
# Banco de Dados PostgreSQL
DATABASE_URL=postgres://teste:sua_senha@host:5432/teste

# API Key para autenticação
API_KEY=desafio2025_nexus_key

# Porta do servidor
PORT=3000

# Ambiente
NODE_ENV=development
```

---

## 📊 Telas do Frontend

### Frontend HTML (Principal)
- Dashboard com KPIs e gráficos
- Abas para Agendamentos e Convocações
- Filtros em tempo real
- Paginação
- Exportação para Excel
- Dark Mode
- Design responsivo

---

## 📝 Licença

Este projeto foi desenvolvido para fins de avaliação no desafio NexusSaude.
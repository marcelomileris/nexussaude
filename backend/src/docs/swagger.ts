import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Desafio NexusSaude',
      version: '1.0.0',
      description: 'API RESTful para consulta de agendamentos e convocações do banco de dados PostgreSQL',
      contact: {
        name: 'Suporte',
        email: 'suporte@nexussaude.com.br',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key para autenticação. Obrigatório em todas as requisições.',
        },
      },
    },
    security: [{
      ApiKeyAuth: [],
    }],
    tags: [
      {
        name: 'Agendamentos',
        description: 'Endpoints para consulta de agendamentos',
      },
      {
        name: 'Convocações',
        description: 'Endpoints para consulta de convocações',
      },
      {
        name: 'Convocações Agrupadas',
        description: 'Endpoints para consulta de convocações agrupadas por pessoa',
      },
      {
        name: 'Estatísticas',
        description: 'Endpoints para métricas e KPIs do dashboard',
      },
    ],
    paths: {
      '/api/agendamentos': {
        get: {
          tags: ['Agendamentos'],
          summary: 'Lista todos os agendamentos',
          description: 'Retorna uma lista paginada de agendamentos com suporte a filtros, ordenação e busca.',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Número da página (padrão: 1)',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Registros por página (padrão: 20, máximo: 100)',
              schema: { type: 'integer', default: 20 },
            },
            {
              name: 'sort',
              in: 'query',
              description: 'Campo para ordenação (id, ticket, data_solicitacao, data_exame, status, etapa_atual)',
              schema: { type: 'string', default: 'id' },
            },
            {
              name: 'order',
              in: 'query',
              description: 'Direção da ordenação (asc ou desc)',
              schema: { type: 'string', default: 'asc' },
            },
            {
              name: 'status',
              in: 'query',
              description: 'Filtrar por status',
              schema: { type: 'string' },
            },
            {
              name: 'etapa',
              in: 'query',
              description: 'Filtrar por etapa atual',
              schema: { type: 'string' },
            },
            {
              name: 'q',
              in: 'query',
              description: 'Busca geral em todos os campos',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Lista de agendamentos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { type: 'object' },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          totalPages: { type: 'integer' },
                          hasNext: { type: 'boolean' },
                          hasPrev: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/agendamentos/{id}': {
        get: {
          tags: ['Agendamentos'],
          summary: 'Detalhes de um agendamento',
          description: 'Retorna os detalhes completos de um agendamento específico pelo ID.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID do agendamento',
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: {
              description: 'Detalhes do agendamento',
            },
            404: {
              description: 'Agendamento não encontrado',
            },
          },
        },
      },
      '/api/convocacoes': {
        get: {
          tags: ['Convocações'],
          summary: 'Lista todas as convocações',
          description: 'Retorna uma lista paginada de convocações com suporte a filtros, ordenação e busca.',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Número da página (padrão: 1)',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Registros por página (padrão: 20, máximo: 100)',
              schema: { type: 'integer', default: 20 },
            },
            {
              name: 'sort',
              in: 'query',
              description: 'Campo para ordenação',
              schema: { type: 'string', default: 'nome' },
            },
            {
              name: 'order',
              in: 'query',
              description: 'Direção da ordenação (asc ou desc)',
              schema: { type: 'string', default: 'asc' },
            },
            {
              name: 'situacao',
              in: 'query',
              description: 'Filtrar por situação',
              schema: { type: 'string' },
            },
            {
              name: 'q',
              in: 'query',
              description: 'Busca geral em todos os campos',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Lista de convocações',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { type: 'object' },
                      },
                      pagination: {
                        type: 'object',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/convocacoes/{matricula}': {
        get: {
          tags: ['Convocações'],
          summary: 'Detalhes de uma convocação',
          description: 'Retorna os detalhes completos de uma convocação específica pela matrícula.',
          parameters: [
            {
              name: 'matricula',
              in: 'path',
              required: true,
              description: 'Matrícula do colaborador',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Detalhes da convocação',
            },
            404: {
              description: 'Convocação não encontrada',
            },
          },
        },
      },
      '/api/convocacoes-agrupadas': {
        get: {
          tags: ['Convocações Agrupadas'],
          summary: 'Lista pessoas agrupadas por matrícula',
          description: 'Retorna uma lista de pessoas únicas com dados agregados dos exames. Carregamento rápido sem detalhes dos exames.',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Número da página (padrão: 1)',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Registros por página (padrão: 20, máximo: 100)',
              schema: { type: 'integer', default: 20 },
            },
            {
              name: 'q',
              in: 'query',
              description: 'Busca por nome ou matrícula',
              schema: { type: 'string' },
            },
            {
              name: 'situacao',
              in: 'query',
              description: 'Filtrar por situação',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Lista de pessoas agrupadas',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            matricula: { type: 'string' },
                            nome: { type: 'string' },
                            cargo: { type: 'string' },
                            qtd_exames: { type: 'integer' },
                            cidades: { type: 'string' },
                            situacao: { type: 'string' },
                          },
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          totalPages: { type: 'integer' },
                          hasNext: { type: 'boolean' },
                          hasPrev: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/convocacoes-agrupadas/{matricula}/exames': {
        get: {
          tags: ['Convocações Agrupadas'],
          summary: 'Detalhes dos exames de uma pessoa',
          description: 'Retorna a lista completa de exames de uma pessoa específica. Carregamento sob demanda (lazy loading) ao expandir na interface.',
          parameters: [
            {
              name: 'matricula',
              in: 'path',
              required: true,
              description: 'Matrícula do colaborador',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Lista de exames da pessoa',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      exames: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            exame: { type: 'string' },
                            ultimo_pedido: { type: 'string' },
                            data_resultado: { type: 'string' },
                            periodicidade: { type: 'integer' },
                            refazer_em: { type: 'string' },
                            situacao: { type: 'string' },
                            cidade_unidade: { type: 'string' },
                            estado_unidade: { type: 'string' },
                            data_referencia: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/stats/agendamentos': {
        get: {
          tags: ['Estatísticas'],
          summary: 'Estatísticas de agendamentos',
          description: 'Retorna métricas e KPIs do dashboard para agendamentos: total, pendentes, dentro/fora do prazo, concluídos, por status, top solicitantes e cidades.',
          responses: {
            200: {
              description: 'Estatísticas de agendamentos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      naoCompareceu: { type: 'integer' },
                      dentroPrazo: { type: 'integer' },
                      foraPrazo: { type: 'integer' },
                      concluidos: { type: 'integer' },
                      percentual: {
                        type: 'object',
                        properties: {
                          naoCompareceu: { type: 'string' },
                          dentroPrazo: { type: 'string' },
                          foraPrazo: { type: 'string' },
                        },
                      },
                      porStatus: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string' },
                            total: { type: 'integer' },
                          },
                        },
                      },
                      topSolicitantes: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string' },
                            total: { type: 'integer' },
                          },
                        },
                      },
                      topCidades: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string' },
                            total: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/stats/convocacoes': {
        get: {
          tags: ['Estatísticas'],
          summary: 'Estatísticas de convocações',
          description: 'Retorna métricas e KPIs do dashboard para convocações: total, ativos, por situação.',
          responses: {
            200: {
              description: 'Estatísticas de convocações',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      ativos: { type: 'integer' },
                      porSituacao: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string' },
                            total: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpecs = swaggerJsdoc(swaggerOptions);
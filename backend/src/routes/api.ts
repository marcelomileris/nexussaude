import { Router, Request, Response } from "express";
import { pool } from "../db/index.js";

const router = Router();

// =====================================================
// TIPOS
// =====================================================

interface ListParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  [key: string]: string | number;
}

interface ListOptions {
  table: string;
  schema: string;
  allowedSorts: string[];
  defaultSort: string;
  searchable?: string[];
  filters?: Record<string, string>;
  columns: string;
  baseCondition?: string;
}

// =====================================================
// HELPERS
// =====================================================

function parseIntSafe(value: unknown, fallback = 1): number {
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? fallback : parsed;
}

function buildPagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

function buildListQuery(options: ListOptions, params: ListParams) {
  const { table, schema, allowedSorts, defaultSort, searchable, filters, columns, baseCondition } = options;
  const { page, limit, sort, order, ...queryParams } = params;

  const pageNum = Math.max(1, parseIntSafe(page, 1));
  const limitNum = Math.min(100, Math.max(1, parseIntSafe(limit, 20)));
  const offset = (pageNum - 1) * limitNum;

  // Condições base + filtros dinâmicos
  const conditions: string[] = [];
  if (baseCondition) {
    conditions.push(`(${baseCondition})`);
  }
  const paramValues: (string | number)[] = [];
  let paramIndex = 1;

  for (const [key, field] of Object.entries(filters || {})) {
    const value = queryParams[key];
    if (typeof value === "string" && value.trim()) {
      if (field.endsWith("_like")) {
        conditions.push(`${field.replace("_like", "")} ILIKE $${paramIndex++}`);
        paramValues.push(`%${value.trim()}%`);
      } else if (field === "q" && searchable) {
        conditions.push(`(${searchable.map((f) => `${f} ILIKE $${paramIndex}`).join(" OR ")})`);
        paramValues.push(`%${value.trim()}%`);
        paramIndex++;
        continue;
      } else {
        conditions.push(`${field} = $${paramIndex++}`);
        paramValues.push(value.trim());
      }
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortField = allowedSorts.includes(sort) ? sort : defaultSort;
  const orderDir = String(order || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  return {
    whereClause,
    paramValues,
    sortField,
    orderDir,
    limitNum,
    offset,
    pageNum,
  };
}

// =====================================================
// ROTA GENÉRICA DE LISTAGEM
// =====================================================

async function listRoute(
  req: Request,
  res: Response,
  options: ListOptions
): Promise<void> {
  const { table, schema, columns } = options;
  const params = req.query as unknown as ListParams;

  console.log("listRoute params:", params);

  try {
    const { whereClause, paramValues, sortField, orderDir, limitNum, offset, pageNum } =
      buildListQuery(options, params);

    console.log("Query:", `SELECT COUNT(*) as total FROM ${schema}.${table} ${whereClause}`);
    console.log("Params:", paramValues);

    // Query total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM ${schema}.${table} ${whereClause}`,
      paramValues
    );
    const total = parseIntSafe(countResult.rows[0].total);

    // Query dados
    const dataQuery = `SELECT ${columns} FROM ${schema}.${table} ${whereClause} ORDER BY ${sortField} ${orderDir} LIMIT $${paramValues.length + 1} OFFSET $${paramValues.length + 2}`;
    console.log("Data Query:", dataQuery);
    const dataResult = await pool.query(
      dataQuery,
      [...paramValues, limitNum, offset]
    );

    console.log("Data returned:", dataResult.rows.length);

    res.json({
      data: dataResult.rows,
      pagination: buildPagination(pageNum, limitNum, total),
    });
  } catch (error) {
    console.error(`Erro ao buscar ${table}:`, error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// =====================================================
// ROTAS DE AGENDAMENTOS
// =====================================================

const AGENDAMENTOS_OPTIONS: ListOptions = {
  table: "base_geral",
  schema: "central_teste",
  allowedSorts: ["id", "ticket", "data_solicitacao", "data_exame", "status", "etapa_atual"],
  defaultSort: "id",
  searchable: ["solicitante", "nome_colaborador", "tipo_exame"],
  filters: {
    status: "status",
    etapa: "etapa_atual",
    solicitante_like: "solicitante",
    colaborador_like: "nome_colaborador",
    tipoExame: "tipo_exame",
    cidade: "cidade_preferencia",
    q: "q",
  },
  columns: `
    id, ticket, solicitante, data_solicitacao, etapa_atual, status,
    nome_colaborador, tipo_exame, data_exame, cidade_preferencia,
    agendar_enquadramento_pcd, possui_formulario_rac, possui_exames_complementares,
    data_conclusao_dia, status_sla_agendamento, data_ultima_alteracao,
    dados_agendamento_tipo_solicitacao
  `.replace(/\s+/g, " ").trim(),
};

router.get("/agendamentos", async (req: Request, res: Response) => {
  await listRoute(req, res, AGENDAMENTOS_OPTIONS);
});

router.get("/agendamentos/status", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT status
      FROM central_teste.base_geral
      WHERE status IS NOT NULL AND TRIM(status) != ''
      ORDER BY status
    `);
    res.json(result.rows.map(r => r.status));
  } catch (error) {
    console.error("Erro ao buscar status:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/agendamentos/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM central_teste.base_geral WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// =====================================================
// ROTAS DE CONVOCAÇÕES
// =====================================================

const CONVOCACOES_OPTIONS: ListOptions = {
  table: "convocacao_de_exames_geral",
  schema: "relacionamento_teste",
  allowedSorts: ["nome", "cargo", "matricula", "exame", "data_resultado", "situacao", "cidade_unidade"],
  defaultSort: "nome",
  searchable: ["nome", "matricula", "cargo", "exame"],
  filters: {
    cargo: "cargo",
    nome_like: "nome",
    matricula: "matricula",
    exame: "exame",
    situacao: "situacao",
    cidade: "cidade_unidade",
    estado: "estado_unidade",
    q: "q",
  },
  baseCondition: "(nome IS NOT NULL AND TRIM(nome) != '') OR (matricula IS NOT NULL AND TRIM(matricula) != '') OR (cargo IS NOT NULL AND TRIM(cargo) != '') OR (exame IS NOT NULL AND TRIM(exame) != '')",
  columns: `
    cargo, nome, matricula, exame, ultimo_pedido, data_resultado,
    periodicidade, refazer_em, dt_admissao, situacao, cidade_unidade,
    estado_unidade, dt_nascimento, data_referencia
  `.replace(/\s+/g, " ").trim(),
};

router.get("/convocacoes", async (req: Request, res: Response) => {
  await listRoute(req, res, CONVOCACOES_OPTIONS);
});

router.get("/convocacoes/situacoes", async (req: Request, res: Response) => {
  try {
    const baseFilter = `(nome IS NOT NULL AND TRIM(nome) != '') OR (matricula IS NOT NULL AND TRIM(matricula) != '') OR (cargo IS NOT NULL AND TRIM(cargo) != '') OR (exame IS NOT NULL AND TRIM(exame) != '')`;
    const result = await pool.query(`
      SELECT DISTINCT situacao
      FROM relacionamento_teste.convocacao_de_exames_geral
      WHERE situacao IS NOT NULL AND TRIM(situacao) != '' AND (${baseFilter})
      ORDER BY situacao
    `);
    res.json(result.rows.map(r => r.situacao));
  } catch (error) {
    console.error("Erro ao buscar situações:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/convocacoes/:matricula", async (req: Request, res: Response) => {
  const { matricula } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM relacionamento_teste.convocacao_de_exames_geral WHERE matricula = $1`,
      [matricula]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Convocação não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar convocação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// =====================================================
// ROTAS DE CONVOCAÇÕES AGRUPADAS
// =====================================================

router.get("/convocacoes-agrupadas", async (req: Request, res: Response) => {
  const params = req.query as unknown as ListParams;

  const baseFilter = `(nome IS NOT NULL AND TRIM(nome) != '') OR (matricula IS NOT NULL AND TRIM(matricula) != '') OR (cargo IS NOT NULL AND TRIM(cargo) != '') OR (exame IS NOT NULL AND TRIM(exame) != '')`;

  try {
    const pageNum = Math.max(1, parseIntSafe(params.page, 1));
    const limitNum = Math.min(100, Math.max(1, parseIntSafe(params.limit, 20)));
    const offset = (pageNum - 1) * limitNum;

    // Condições base + filtros dinâmicos
    const conditions: string[] = [`(${baseFilter})`];
    const paramValues: (string | number)[] = [];
    let paramIndex = 1;

    // Filtro de busca (nome ou matricula)
    const q = params.q;
    if (typeof q === "string" && q.trim()) {
      conditions.push(`(nome ILIKE $${paramIndex} OR matricula ILIKE $${paramIndex})`);
      paramValues.push(`%${q.trim()}%`);
      paramIndex++;
    }

    // Filtro de situação
    const situacao = params.situacao;
    if (typeof situacao === "string" && situacao.trim()) {
      conditions.push(`situacao = $${paramIndex++}`);
      paramValues.push(situacao.trim());
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // Query para contar total de pessoas únicas (agrupadas por matricula)
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT matricula) as total FROM relacionamento_teste.convocacao_de_exames_geral ${whereClause}`,
      paramValues
    );
    const total = parseIntSafe(countResult.rows[0].total);

    // Query com dados agrupados (sem detalhes dos exames - mais rápido)
    const dataResult = await pool.query(
      `SELECT 
        matricula,
        nome,
        cargo,
        COUNT(*) as qtd_exames,
        STRING_AGG(DISTINCT cidade_unidade, ', ' ORDER BY cidade_unidade) as cidades,
        STRING_AGG(DISTINCT situacao, ', ' ORDER BY situacao) as situacoes,
        MIN(data_resultado) as primeira_data_resultado,
        MAX(data_resultado) as ultima_data_resultado,
        MIN(refazer_em) as primeiro_refazer,
        MAX(refazer_em) as ultimo_refazer,
        MIN(data_referencia) as primeira_data_referencia,
        MAX(data_referencia) as ultima_data_referencia
      FROM relacionamento_teste.convocacao_de_exames_geral
      ${whereClause}
      GROUP BY matricula, nome, cargo
      ORDER BY nome ASC, MAX(data_referencia) ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...paramValues, limitNum, offset]
    );

    const data = dataResult.rows.map((row) => ({
      matricula: row.matricula,
      nome: row.nome,
      cargo: row.cargo,
      qtd_exames: parseInt(row.qtd_exames),
      cidades: row.cidades || "-",
      situacao: row.situacoes || "-",
      primeira_data_resultado: row.primeira_data_resultado,
      ultima_data_resultado: row.ultima_data_resultado,
      primeiro_refazer: row.primeiro_refazer,
      ultimo_refazer: row.ultimo_refazer,
    }));

    res.json({
      data,
      pagination: buildPagination(pageNum, limitNum, total),
    });
  } catch (error) {
    console.error("Erro ao buscar convocações agrupadas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Buscar detalhes dos exames de uma pessoa específica (sob demanda)
router.get("/convocacoes-agrupadas/:matricula/exames", async (req: Request, res: Response) => {
  const { matricula } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        exame,
        ultimo_pedido,
        data_resultado,
        periodicidade,
        refazer_em,
        situacao,
        cidade_unidade,
        estado_unidade,
        data_referencia
      FROM relacionamento_teste.convocacao_de_exames_geral
      WHERE matricula = $1
      ORDER BY data_referencia ASC`,
      [matricula]
    );

    res.json({ exames: result.rows });
  } catch (error) {
    console.error("Erro ao buscar detalhes dos exames:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
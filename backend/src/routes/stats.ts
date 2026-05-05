import { Router, Request, Response } from "express";
import { pool } from "../db/index.js";

const router = Router();

// =====================================================
// HELPERS
// =====================================================

const DEFAULT_FALLBACK = "-";

type Row = Record<string, unknown>;

function mapRow(row: Row, field: string, fallback = DEFAULT_FALLBACK): string {
  const value = row[field];
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

type MapRowsOptions = {
  fallback?: string;
  limit?: number;
};

function mapRows(rows: Row[], field: string, options?: MapRowsOptions): { label: string; total: number }[] {
  const { fallback = DEFAULT_FALLBACK, limit } = options || {};
  const result = rows.map((r) => ({
    label: String(r[field] || "").trim() || fallback,
    total: parseInt(String(r.total || 0), 10),
  }));
  return limit ? result.slice(0, limit) : result;
}

function toMap(rows: Row[], keyField: string, valueField = "total"): Map<string, number> {
  return new Map(
    rows.map((r) => [String(r[keyField]), parseInt(String(r[valueField] || 0), 10)])
  );
}

function parseIntSafe(value: unknown, fallback = 0): number {
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? fallback : parsed;
}

// =====================================================
// CACHE EM MEMÓRIA
// =====================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const statsCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60000;

function getCached<T>(key: string): T | null {
  const entry = statsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    statsCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  statsCache.set(key, { data, timestamp: Date.now() });
}

function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of statsCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) statsCache.delete(key);
  }
}

setInterval(clearExpiredCache, 30000);

// =====================================================
// ESTATÍSTICAS DE AGENDAMENTOS
// =====================================================

router.get("/agendamentos", async (req: Request, res: Response) => {
  const cacheKey = "stats:agendamentos";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = await Promise.all([
      pool.query("SELECT COUNT(*) as total FROM central_teste.base_geral"),
      pool.query(`
        SELECT status, COUNT(*) as total
        FROM central_teste.base_geral
        GROUP BY status ORDER BY total DESC
      `),
      pool.query(`
        SELECT tipo_exame, COUNT(*) as total
        FROM central_teste.base_geral
        GROUP BY tipo_exame ORDER BY total DESC LIMIT 10
      `),
      pool.query(`
        SELECT solicitante, COUNT(*) as total
        FROM central_teste.base_geral
        WHERE solicitante IS NOT NULL AND TRIM(solicitante) != ''
        GROUP BY solicitante ORDER BY total DESC LIMIT 5
      `),
      pool.query(`
        SELECT status_sla_agendamento, COUNT(*) as total
        FROM central_teste.base_geral
        GROUP BY status_sla_agendamento
      `),
      pool.query(`
        SELECT etapa_atual, COUNT(*) as total
        FROM central_teste.base_geral
        GROUP BY etapa_atual ORDER BY total DESC
      `),
      pool.query(`
        SELECT possui_formulario_rac, COUNT(*) as total
        FROM central_teste.base_geral
        GROUP BY possui_formulario_rac
      `),
      pool.query(`
        SELECT possui_exames_complementares, COUNT(*) as total
        FROM central_teste.base_geral
        GROUP BY possui_exames_complementares
      `),
      pool.query(`
        SELECT cidade_preferencia, COUNT(*) as total
        FROM central_teste.base_geral
        WHERE cidade_preferencia IS NOT NULL AND TRIM(cidade_preferencia) != ''
        GROUP BY cidade_preferencia ORDER BY total DESC LIMIT 5
      `),
    ]);

    const total = parseIntSafe(results[0].rows[0].total);

    const statusMap = toMap(results[1].rows, "status");
    const pendentes = (statusMap.get("Não Compareceu") || 0) +
      (statusMap.get("Pendente") || 0) +
      (statusMap.get("Em Andamento") || 0);
    const concluidos = (statusMap.get("Finalizado no SOCGED") || 0) +
      (statusMap.get("Concluído") || 0);
    const cancelados = statusMap.get("Cancelado") || 0;
    const naoCompareceu = statusMap.get("Não Compareceu") || 0;

    const slaMap = toMap(results[4].rows, "status_sla_agendamento");
    const dentroPrazo = slaMap.get("Dentro do Prazo") || 0;
    const foraPrazo = slaMap.get("Fora do Prazo") || 0;
    const slaTotal = dentroPrazo + foraPrazo;

    const response = {
      total,
      pendentes,
      concluidos,
      cancelados,
      naoCompareceu,
      dentroPrazo,
      foraPrazo,
      percentual: {
        dentroPrazo: slaTotal > 0 ? Math.round((dentroPrazo / slaTotal) * 100) : 0,
        foraPrazo: slaTotal > 0 ? Math.round((foraPrazo / slaTotal) * 100) : 0,
        naoCompareceu: total > 0 ? Math.round((naoCompareceu / total) * 100) : 0,
      },
      porStatus: mapRows(results[1].rows, "status"),
      porTipoExame: mapRows(results[2].rows, "tipo_exame"),
      porSla: mapRows(results[4].rows, "status_sla_agendamento"),
      porEtapa: mapRows(results[5].rows, "etapa_atual"),
      porFormularioRac: mapRows(results[6].rows, "possui_formulario_rac"),
      porExamesComplementares: mapRows(results[7].rows, "possui_exames_complementares"),
      topCidades: mapRows(results[8].rows, "cidade_preferencia"),
      topSolicitantes: mapRows(results[3].rows, "solicitante"),
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Erro ao buscar estatísticas de agendamentos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// =====================================================
// ESTATÍSTICAS DE CONVOCAÇÕES
// =====================================================

router.get("/convocacoes", async (req: Request, res: Response) => {
  const cacheKey = "stats:convocacoes";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const baseFilter = `(nome IS NOT NULL AND TRIM(nome) != '') OR (matricula IS NOT NULL AND TRIM(matricula) != '') OR (cargo IS NOT NULL AND TRIM(cargo) != '') OR (exame IS NOT NULL AND TRIM(exame) != '')`;

  try {
    const results = await Promise.all([
      pool.query(`SELECT COUNT(*) as total FROM relacionamento_teste.convocacao_de_exames_geral WHERE ${baseFilter}`),
      pool.query(`
        SELECT situacao, COUNT(*) as total
        FROM relacionamento_teste.convocacao_de_exames_geral
        WHERE ${baseFilter}
        GROUP BY situacao ORDER BY total DESC
      `),
      pool.query(`
        SELECT cargo, COUNT(*) as total
        FROM relacionamento_teste.convocacao_de_exames_geral
        WHERE ${baseFilter}
        GROUP BY cargo ORDER BY total DESC LIMIT 10
      `),
      pool.query(`
        SELECT exame, COUNT(*) as total
        FROM relacionamento_teste.convocacao_de_exames_geral
        WHERE ${baseFilter}
        GROUP BY exame ORDER BY total DESC
      `),
      pool.query(`
        SELECT estado_unidade, COUNT(*) as total
        FROM relacionamento_teste.convocacao_de_exames_geral
        WHERE ${baseFilter}
        GROUP BY estado_unidade ORDER BY total DESC
      `),
      pool.query(`
        SELECT cidade_unidade, COUNT(*) as total
        FROM relacionamento_teste.convocacao_de_exames_geral
        WHERE ${baseFilter} AND cidade_unidade IS NOT NULL AND TRIM(cidade_unidade) != ''
        GROUP BY cidade_unidade ORDER BY total DESC LIMIT 10
      `),
    ]);

    const total = parseIntSafe(results[0].rows[0].total);

    const situacaoMap = toMap(results[1].rows, "situacao");
    const ativos = situacaoMap.get("Ativo") || 0;
    const inativos = situacaoMap.get("Inativo") || 0;

    const response = {
      total,
      ativos,
      inativos,
      outros: total - ativos - inativos,
      percentual: {
        ativos: total > 0 ? Math.round((ativos / total) * 100) : 0,
        inativos: total > 0 ? Math.round((inativos / total) * 100) : 0,
      },
      porSituacao: mapRows(results[1].rows, "situacao"),
      porCargo: mapRows(results[2].rows, "cargo"),
      porExame: mapRows(results[3].rows, "exame"),
      porEstado: mapRows(results[4].rows, "estado_unidade"),
      porCidade: mapRows(results[5].rows, "cidade_unidade"),
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Erro ao buscar estadísticas de convocoes:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Limpar cache
router.delete("/cache", async (req: Request, res: Response) => {
  statsCache.clear();
  res.json({ message: "Cache limpo" });
});

export default router;
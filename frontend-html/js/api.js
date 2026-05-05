/**
 * Módulo de API - Wrapper para requisições HTTP
 */

const API_BASE_URL = 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 15000; // 15 segundos timeout padrão

// Obter API Key do localStorage ou config modal
function getApiKey() {
  let apiKey = localStorage.getItem('desafio_api_key');

  if (!apiKey) {
    // Tentar pegar do campo de configuração
    const configInput = document.getElementById('configApiKey');
    if (configInput && configInput.value) {
      apiKey = configInput.value;
      localStorage.setItem('desafio_api_key', apiKey);
    }
  }

  if (!apiKey) {
    throw new Error('API_KEY_NAO_CONFIGURADA');
  }

  return apiKey;
}

// Headers padrão com API Key
function getHeaders() {
  try {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': getApiKey()
    };
  } catch (error) {
    if (error.message === 'API_KEY_NAO_CONFIGURADA') {
      window.dispatchEvent(new CustomEvent('apiKeyRequired'));
      throw new Error('API Key não configurada. Por favor, configure a API Key nas configurações.');
    }
    throw error;
  }
}

// API com retry automático
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function apiGetWithRetry(endpoint, params = {}, timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await apiGet(endpoint, params, timeout);
    } catch (error) {
      lastError = error;
      console.warn(`Tentativa ${i + 1}/${retries} falhou:`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
      }
    }
  }
  throw lastError;
}

// GET request
async function apiGet(endpoint, params = {}, timeout = REQUEST_TIMEOUT) {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== '' && value !== null)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

  const queryString = new URLSearchParams(filteredParams).toString();
  const url = `${API_BASE_URL}/${endpoint}${queryString ? '?' + queryString : ''}`;

  console.log('Fetching:', url, 'with timeout:', timeout, 'ms');

  let headers;
  try {
    headers = getHeaders();
  } catch (headerError) {
    console.error('Header Error:', headerError.message);
    throw headerError;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('Timeout triggered after', timeout, 'ms');
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'Erro na requisição';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || 'Erro na requisição';
      } catch (e) {
        errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('API Error:', error.name, error.message);
    if (error.name === 'AbortError' || error.message.includes('Tempo limite')) {
      throw new Error(`Tempo limite excedido (${timeout / 1000}s). O servidor está demorando para responder.`);
    }
    throw error;
  }
}

// Buscar agendamentos com paginação e filtros (com retry)
async function getAgendamentos(params = {}) {
  return await apiGetWithRetry('agendamentos', params);
}

// Buscar uma convocação por ID/matrícula
async function getAgendamentoById(id) {
  return await apiGetWithRetry(`agendamentos/${id}`);
}

// Buscar convocações com paginação e filtros (com retry)
async function getConvocacoes(params = {}) {
  return await apiGetWithRetry('convocacoes', params);
}

// Buscar uma convocação por matrícula
async function getConvocacaoByMatricula(matricula) {
  return await apiGetWithRetry(`convocacoes/${matricula}`);
}

// Buscar convocações agrupadas por pessoa (matrícula + nome)
async function getConvocacoesAgrupadas(params = {}) {
  return await apiGetWithRetry('convocacoes-agrupadas', params);
}

// Buscar detalhes dos exames de uma pessoa específica (sob demanda)
async function getConvocacoesAgrupadasExames(matricula) {
  return await apiGetWithRetry(`convocacoes-agrupadas/${matricula}/exames`);
}

// Obter contagem de agendamentos por status (para gráficos)
async function getAgendamentosStats() {
  const LONG_TIMEOUT = 30000; // 30 segundos para operações longas
  try {
    const result = await apiGet('agendamentos', { limit: 1 }, LONG_TIMEOUT);
    const total = result.pagination.total;

    const allAgendamentos = await apiGet('agendamentos', { limit: total }, LONG_TIMEOUT);
    const statusCounts = {};

    allAgendamentos.data.forEach(item => {
      const status = item.status || 'Sem Status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return statusCounts;
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    return {};
  }
}

// Obter contagem de convocações por situação (para gráficos)
async function getConvocacoesStats() {
  const LONG_TIMEOUT = 30000;
  try {
    const result = await apiGet('convocacoes', { limit: 1 }, LONG_TIMEOUT);
    const total = result.pagination.total;

    const allConvocacoes = await apiGet('convocacoes', { limit: total }, LONG_TIMEOUT);
    const situacaoCounts = {};

    allConvocacoes.data.forEach(item => {
      const situacao = item.situacao || 'Sem Situação';
      situacaoCounts[situacao] = (situacaoCounts[situacao] || 0) + 1;
    });

    return situacaoCounts;
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    return {};
  }
}

// Novas funções de estatísticas otimizadas (com retry)
async function getAgendamentosStatsNew() {
  const LONG_TIMEOUT = 30000;
  return await apiGetWithRetry('stats/agendamentos', {}, LONG_TIMEOUT);
}

async function getConvocacoesStatsNew() {
  const LONG_TIMEOUT = 30000;
  return await apiGetWithRetry('stats/convocacoes', {}, LONG_TIMEOUT);
}

// API exports
window.API = {
  getAgendamentos,
  getAgendamentoById,
  getConvocacoes,
  getConvocacaoByMatricula,
  getConvocacoesAgrupadas,
  getConvocacoesAgrupadasExames,
  getAgendamentosStats,
  getConvocacoesStats,
  getAgendamentosStatsNew,
  getConvocacoesStatsNew,
  getApiKey
};
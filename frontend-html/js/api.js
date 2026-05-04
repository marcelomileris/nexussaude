/**
 * Módulo de API - Wrapper para requisições HTTP
 */

const API_BASE_URL = 'http://localhost:3000/api';

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
    apiKey = 'desafio2025_nexus_key'; // Default para desenvolvimento
    localStorage.setItem('desafio_api_key', apiKey);
  }

  return apiKey;
}

// Headers padrão com API Key
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': getApiKey()
  };
}

// GET request
async function apiGet(endpoint, params = {}) {
  // Filtrar valores undefined ou vazios
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== '' && value !== null)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

  const queryString = new URLSearchParams(filteredParams).toString();
  const url = `${API_BASE_URL}/${endpoint}${queryString ? '?' + queryString : ''}`;

  console.log('Fetching:', url, 'with API Key:', getApiKey().substring(0, 10) + '...');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

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
    console.error('API Error:', error);
    throw error;
  }
}

// Buscar agendamentos com paginação e filtros
async function getAgendamentos(params = {}) {
  return await apiGet('agendamentos', params);
}

// Buscar uma convocação por ID/matrícula
async function getAgendamentoById(id) {
  return await apiGet(`agendamentos/${id}`);
}

// Buscar convocações com paginação e filtros
async function getConvocacoes(params = {}) {
  return await apiGet('convocacoes', params);
}

// Buscar uma convocação por matrícula
async function getConvocacaoByMatricula(matricula) {
  return await apiGet(`convocacoes/${matricula}`);
}

// Buscar convocações agrupadas por pessoa (matrícula + nome)
async function getConvocacoesAgrupadas(params = {}) {
  return await apiGet('convocacoes-agrupadas', params);
}

// Buscar detalhes dos exames de uma pessoa específica (sob demanda)
async function getConvocacoesAgrupadasExames(matricula) {
  return await apiGet(`convocacoes-agrupadas/${matricula}/exames`);
}

// Obter contagem de agendamentos por status (para gráficos)
async function getAgendamentosStats() {
  try {
    const result = await apiGet('agendamentos', { limit: 1 });
    const total = result.pagination.total;

    // Buscar todos os statuses únicos
    const allAgendamentos = await apiGet('agendamentos', { limit: total });
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
  try {
    const result = await apiGet('convocacoes', { limit: 1 });
    const total = result.pagination.total;

    // Buscar todos para contar situações
    const allConvocacoes = await apiGet('convocacoes', { limit: total });
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

// Novas funções de estatísticas otimizadas
async function getAgendamentosStatsNew() {
  return await apiGet('stats/agendamentos');
}

async function getConvocacoesStatsNew() {
  return await apiGet('stats/convocacoes');
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
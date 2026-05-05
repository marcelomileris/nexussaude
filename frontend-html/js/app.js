// =====================================================
// STATE
// =====================================================
const state = {
  agendamentos: {
    data: [],
    pagination: {},
    currentPage: 1,
    filters: { limit: 20 },
  },
  convocacoes: {
    data: [],
    pagination: {},
    currentPage: 1,
    filters: { limit: 20, situacao: "Ativo" },
  },
  agrupadas: {
    data: [],
    pagination: {},
    currentPage: 1,
    filters: { limit: 20, situacao: "Ativo" },
    expandedRows: new Set(),
  },
  charts: { status: null, situacao: null },
  isDarkMode: false,
};

// =====================================================
// INICIALIZAÇÃO
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  // Dark mode
  const savedTheme = localStorage.getItem("desafio_theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }

  // API Key
  const apiKey = localStorage.getItem("desafio_api_key");

  initEventListeners();
  setupConfigModal();

  // Verificar se API Key está configurada
  if (!apiKey) {
    showApiKeyRequiredMessage();
    return;
  }

  // Carregar dados sequencialmente para evitar race conditions
  try {
    console.log("Loading dashboard stats...");
    await loadDashboardStats();
    console.log("Dashboard stats loaded, loading agendamentos...");
    await loadAgendamentos();
    console.log("Agendamentos loaded, loading convocacoes...");
    await loadConvocacoes();
    console.log("Convocacoes loaded, loading agrupadas...");
    await loadAgrupadas();
    console.log("All data loaded, populating filters...");
    populateFilterSelects();
    console.log("Done!");
  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Erro ao carregar dados: " + error.message, "error");
  }
}

// =====================================================
// API KEY MENSAGEM
// =====================================================
function showApiKeyRequiredMessage() {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;

  dashboard.innerHTML = `
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md">
        <i class="ph ph-key text-5xl text-yellow-600 dark:text-yellow-400 mb-4"></i>
        <h2 class="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">API Key Não Configurada</h2>
        <p class="text-yellow-700 dark:text-yellow-300 mb-4">
          Por favor, configure a API Key para acessar os dados do sistema.
        </p>
        <button onclick="openConfigModal()" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors">
          <i class="ph ph-gear mr-2"></i>Configurar API Key
        </button>
      </div>
    </div>
  `;
}

// Listener para evento de API Key necessária
window.addEventListener('apiKeyRequired', () => {
  showApiKeyRequiredMessage();
});

// Função global para abrir modal de configuração
window.openConfigModal = function() {
  document.getElementById("configModal").classList.remove("hidden");
  document.getElementById("configModal").classList.add("flex");
};

// =====================================================
// EVENT LISTENERS
// =====================================================
function initEventListeners() {
  // Dark Mode
  document.getElementById("darkModeToggle").addEventListener("click", () => {
    state.isDarkMode = !state.isDarkMode;
    document.documentElement.classList.toggle("dark", state.isDarkMode);
    document.documentElement.setAttribute(
      "data-theme",
      state.isDarkMode ? "dark" : "light",
    );
    localStorage.setItem("desafio_theme", state.isDarkMode ? "dark" : "light");
  });

  // Agendamentos
  document
    .getElementById("btnSearchAgendamentos")
    .addEventListener("click", () => searchAgendamentos());
  document
    .getElementById("btnClearAgendamentos")
    .addEventListener("click", () => clearAgendamentosFilters());
  document
    .getElementById("btnExportAgendamentos")
    .addEventListener("click", () => exportAgendamentos());
  document
    .getElementById("agendamentoLimit")
    .addEventListener("change", (e) => {
      state.agendamentos.filters.limit = e.target.value;
      searchAgendamentos();
    });
  document
    .getElementById("agendamentoSearch")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchAgendamentos();
    });

  // Convocações
  document
    .getElementById("btnSearchConvocacoes")
    .addEventListener("click", () => searchConvocacoes());
  document
    .getElementById("btnClearConvocacoes")
    .addEventListener("click", () => clearConvocacoesFilters());
  document
    .getElementById("btnExportConvocacoes")
    .addEventListener("click", () => exportConvocacoes());
  document.getElementById("convocacaoLimit").addEventListener("change", (e) => {
    state.convocacoes.filters.limit = e.target.value;
    searchConvocacoes();
  });
  document
    .getElementById("convocacaoSearch")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchConvocacoes();
    });

  // Agrupadas
  document
    .getElementById("btnSearchAgrupadas")
    .addEventListener("click", () => searchAgrupadas());
  document
    .getElementById("btnClearAgrupadas")
    .addEventListener("click", () => clearAgrupadasFilters());
  document
    .getElementById("btnExportAgrupadas")
    .addEventListener("click", () => exportAgrupadas());
  document.getElementById("agrupadasLimit").addEventListener("change", (e) => {
    state.agrupadas.filters.limit = e.target.value;
    searchAgrupadas();
  });
  document
    .getElementById("agrupadasSearch")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchAgrupadas();
    });

  // Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.remove("active", "border-primary", "text-primary");
        b.classList.add("border-transparent", "text-gray-500");
      });
      btn.classList.add("active", "border-primary", "text-primary");
      btn.classList.remove("border-transparent", "text-gray-500");

      document.querySelectorAll(".tab-panel").forEach((div) => {
        div.classList.remove("active");
      });
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

// =====================================================
// DASHBOARD STATS & CHARTS
// =====================================================
async function loadDashboardStats() {
  const hideAllLoaders = () => {
    const loaderIds = [
      "kpi1Loading", "kpi2Loading", "kpi3Loading", "kpi4Loading",
      "kpi5Loading", "kpi6Loading", "kpi7Loading", "kpi8Loading",
      "chart1Loading", "chart2Loading"
    ];
    loaderIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
  };

  // Hide all loaders initially
  hideAllLoaders();

  try {
    const agendamentosStats = await API.getAgendamentosStatsNew();
    console.log("Agendamentos Stats received:", agendamentosStats);

    document.getElementById("totalAgendamentos").textContent = formatNumber(
      agendamentosStats?.total || 0,
    );
    document.getElementById("agendamentosPendentes").textContent = formatNumber(
      agendamentosStats?.naoCompareceu || 0,
    );
    document.getElementById("kpiInside").textContent = formatNumber(
      agendamentosStats?.dentroPrazo || 0,
    );
    document.getElementById("kpiOutside").textContent = formatNumber(
      agendamentosStats?.foraPrazo || 0,
    );
    document.getElementById("kpiPercentualNaoCompareceu").textContent =
      `${agendamentosStats?.percentual?.naoCompareceu || 0}%`;
    document.getElementById("kpiConcluidos").textContent = formatNumber(
      agendamentosStats?.concluidos || 0,
    );

    (agendamentosStats.topSolicitantes || []).forEach((item, i) => {
      if (i < 5) {
        document.getElementById(`solicitante${i + 1}Label`).textContent = item.label;
        document.getElementById(`solicitante${i + 1}Total`).textContent = formatNumber(item.total);
      }
    });

    (agendamentosStats.topCidades || []).forEach((item, i) => {
      if (i < 5) {
        document.getElementById(`cidade${i + 1}Label`).textContent = item.label;
        document.getElementById(`cidade${i + 1}Total`).textContent = formatNumber(item.total);
      }
    });

    const convocacoesStats = await API.getConvocacoesStatsNew();
    console.log("Convocacoes Stats received:", convocacoesStats);

    document.getElementById("totalConvocacoes").textContent = formatNumber(
      convocacoesStats?.total || 0,
    );
    document.getElementById("convocacoesAtivas").textContent = formatNumber(
      convocacoesStats?.ativos || 0,
    );

    try {
      console.log("Creating charts...");
      createCharts(agendamentosStats, convocacoesStats);
      console.log("Charts created successfully");
    } catch (chartError) {
      console.error("Erro ao criar gráficos:", chartError);
    }
  } catch (error) {
    console.error("Erro ao carregar stats:", error);
    hideAllLoaders();
    showToast("Erro ao carregar dados do dashboard: " + error.message, "error");
  }
}

function createCharts(agendamentosStats, convocacoesStats) {
  if (state.charts.status) state.charts.status.destroy();
  if (state.charts.situacao) state.charts.situacao.destroy();

  // Chart Status
  const ctxStatus = document.getElementById("chartStatus").getContext("2d");
  state.charts.status = new Chart(ctxStatus, {
    type: "doughnut",
    data: {
      labels: agendamentosStats.porStatus.map((s) => s.label),
      datasets: [
        {
          data: agendamentosStats.porStatus.map((s) => s.total),
          backgroundColor: [
            "#3b82f6",
            "#22c55e",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#06b6d4",
            "#ec4899",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right" } },
    },
  });

  // Chart Situação
  const ctxSituacao = document.getElementById("chartSituacao").getContext("2d");
  const situacaoData = convocacoesStats.porSituacao;

  // Cores para cada situação
  const situacaoColors = {
    Pendente: "#f59e0b",
    Ativo: "#22c55e",
    Concluído: "#3b82f6",
    Vencido: "#ef4444",
    Cancelado: "#6b7280",
  };

  state.charts.situacao = new Chart(ctxSituacao, {
    type: "bar",
    data: {
      labels: situacaoData.map((s) => s.label),
      datasets: [
        {
          label: "Quantidade",
          data: situacaoData.map((s) => s.total),
          backgroundColor: situacaoData.map(
            (s) => situacaoColors[s.label] || "#3b82f6",
          ),
          borderRadius: 8,
          barThickness: Math.max(40, 500 / situacaoData.length), // Mínimo 40px
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y", // Gráfico horizontal para melhor visualização
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.05)" },
        },
        y: {
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((context.raw / total) * 100).toFixed(1);
              return `${context.raw.toLocaleString("pt-BR")} (${percent}%)`;
            },
          },
        },
      },
    },
  });
}

// =====================================================
// AGENDAMENTOS
// =====================================================
async function loadAgendamentos(page = 1) {
  const overlay = document.getElementById("loadingAgendamentosOverlay");
  overlay.classList.remove("hidden");

  try {
    const params = { page, ...state.agendamentos.filters };
    const result = await API.getAgendamentos(params);

    state.agendamentos.data = result.data;
    state.agendamentos.pagination = result.pagination;
    state.agendamentos.currentPage = page;

    renderAgendamentosTable();
    renderPagination("agendamentos", result.pagination);
  } catch (error) {
    showToast("Erro ao carregar: " + error.message, "error");
  } finally {
    overlay.classList.add("hidden");
  }
}

function renderAgendamentosTable() {
  const tbody = document.getElementById("agendamentosTableBody");
  if (state.agendamentos.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-500">Nenhum agendamento encontrado</td></tr>`;
    return;
  }
  tbody.innerHTML = state.agendamentos.data
    .map(
      (item) => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" onclick="showAgendamentoDetail(${item.id})">
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${item.id}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.ticket || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.solicitante || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.nome_colaborador || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.tipo_exame || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${formatDate(item.data_exame)}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.cidade_preferencia || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(item.status)}">${String(item.status || "-").toUpperCase()}</span></td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.etapa_atual || "-").toUpperCase()}</td>
    </tr>
  `,
    )
    .join("");
}

function searchAgendamentos() {
  const search = document.getElementById("agendamentoSearch").value;
  const status = document.getElementById("agendamentoStatus").value;

  const filters = { limit: document.getElementById("agendamentoLimit").value };
  if (search) filters.q = search;
  if (status) filters.status = status;

  state.agendamentos.filters = filters;
  loadAgendamentos(1);
}

function clearAgendamentosFilters() {
  document.getElementById("agendamentoSearch").value = "";
  document.getElementById("agendamentoStatus").value = "";
  state.agendamentos.filters = { limit: 20 };
  loadAgendamentos(1);
}

function showAgendamentoDetail(id) {
  const data = state.agendamentos.data.find((d) => d.id === id);
  if (!data) return;

  let html = Object.entries(data)
    .map(
      ([key, value]) => `
    <div class="flex py-2 border-b border-gray-100 dark:border-gray-700">
      <span class="w-40 font-medium text-gray-500">${formatKey(key)}</span>
      <span class="flex-1">${value || "-"}</span>
    </div>
  `,
    )
    .join("");

  // Show in a simple alert for now
  showToast(`Detalhes do agendamento #${id}`, "success");
}

function exportAgendamentos() {
  const data = state.agendamentos.data.map((item) => ({
    ID: item.id,
    Ticket: item.ticket,
    Solicitante: item.solicitante,
    Colaborador: item.nome_colaborador,
    "Tipo Exame": item.tipo_exame,
    "Data Exame": item.data_exame,
    Cidade: item.cidade_preferencia,
    Status: item.status,
    Etapa: item.etapa_atual,
  }));
  exportToExcel(data, "agendamentos");
  showToast("Exportado com sucesso!", "success");
}

// =====================================================
// CONVOCACOES
// =====================================================
async function loadConvocacoes(page = 1) {
  const overlay = document.getElementById("loadingConvocacoesOverlay");
  overlay.classList.remove("hidden");

  try {
    const params = { page, ...state.convocacoes.filters };
    const result = await API.getConvocacoes(params);

    state.convocacoes.data = result.data;
    state.convocacoes.pagination = result.pagination;
    state.convocacoes.currentPage = page;

    renderConvocacoesTable();
    renderPagination("convocacoes", result.pagination);
    populateFilterSelects();
  } catch (error) {
    showToast("Erro ao carregar: " + error.message, "error");
  } finally {
    overlay.classList.add("hidden");
  }
}

function renderConvocacoesTable() {
  const tbody = document.getElementById("convocacoesTableBody");
  if (state.convocacoes.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-gray-500">Nenhuma convocação encontrada</td></tr>`;
    return;
  }
  tbody.innerHTML = state.convocacoes.data
    .map(
      (item) => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" onclick="showConvocacaoDetail('${item.matricula}')">
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.matricula || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.nome || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.cargo || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.exame || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${formatDate(item.ultimo_pedido)}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${formatDate(item.data_resultado)}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${formatDate(item.refazer_em)}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.cidade_unidade || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.estado_unidade || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(item.situacao)}">${String(item.situacao || "-").toUpperCase()}</span></td>
    </tr>
  `,
    )
    .join("");
}

function searchConvocacoes() {
  const search = document.getElementById("convocacaoSearch").value;
  const situacao = document.getElementById("convocacaoSituacao").value;

  const filters = { limit: document.getElementById("convocacaoLimit").value };
  if (search) filters.q = search;
  if (situacao) filters.situacao = situacao;

  state.convocacoes.filters = filters;
  loadConvocacoes(1);
}

function clearConvocacoesFilters() {
  document.getElementById("convocacaoSearch").value = "";
  document.getElementById("convocacaoSituacao").value = "Ativo";
  state.convocacoes.filters = { limit: 20, situacao: "Ativo" };
  loadConvocacoes(1);
}

function showConvocacaoDetail(matricula) {
  showToast(`Detalhes da convocação: ${matricula}`, "success");
}

function exportConvocacoes() {
  const data = state.convocacoes.data.map((item) => ({
    Matrícula: item.matricula,
    Nome: item.nome,
    Cargo: item.cargo,
    Exame: item.exame,
    "Último Pedido": item.ultimo_pedido,
    "Data Resultado": item.data_resultado,
    Próximo: item.refazer_em,
    Cidade: item.cidade_unidade,
    Estado: item.estado_unidade,
    Situação: item.situacao,
  }));
  exportToExcel(data, "convocacoes");
  showToast("Exportado com sucesso!", "success");
}

// =====================================================
// AGRUPADAS
// =====================================================
async function loadAgrupadas(page = 1) {
  const overlay = document.getElementById("loadingAgrupadasOverlay");
  overlay.classList.remove("hidden");

  try {
    const params = { page, ...state.agrupadas.filters };
    const result = await API.getConvocacoesAgrupadas(params);

    state.agrupadas.data = result.data;
    state.agrupadas.pagination = result.pagination;
    state.agrupadas.currentPage = page;
    state.agrupadas.expandedRows.clear();

    renderAgrupadasTable();
    renderPagination("agrupadas", result.pagination);
  } catch (error) {
    showToast("Erro ao carregar: " + error.message, "error");
  } finally {
    overlay.classList.add("hidden");
  }
}

function renderAgrupadasTable() {
  const tbody = document.getElementById("agrupadasTableBody");
  if (state.agrupadas.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhum resultado encontrado</td></tr>`;
    return;
  }
  tbody.innerHTML = state.agrupadas.data
    .map(
      (item) => {
        const isExpanded = state.agrupadas.expandedRows.has(item.matricula);
        
        let examsList = "";
        if (isExpanded) {
          if (!item.exames || item.exames.length === 0) {
            examsList = `<tr><td colspan="7" class="text-center py-4 text-gray-500">Carregando...</td></tr>`;
          } else {
            examsList = item.exames
              .map(
                (exam) => `
                <tr class="bg-gray-50 dark:bg-gray-700/30">
                  <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500">${String(exam.exame || "-").toUpperCase()}</td>
                  <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${formatDate(exam.ultimo_pedido)}</td>
                  <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${formatDate(exam.data_resultado)}</td>
                  <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${formatDate(exam.refazer_em)}</td>
                  <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(exam.cidade_unidade || "-").toUpperCase()}</td>
                  <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(exam.estado_unidade || "-").toUpperCase()}</td>
                  <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(exam.situacao)}">${String(exam.situacao || "-").toUpperCase()}</span></td>
                </tr>
              `
              )
              .join("");
          }
        }

        return `
    <tr>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.matricula || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.nome || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.cargo || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs text-center"><span class="px-2 py-1 bg-primary/10 text-primary rounded font-bold">${item.qtd_exames}</span></td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs">${String(item.cidades || "-").toUpperCase()}</td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(item.situacao)}">${String(item.situacao || "-").toUpperCase()}</span></td>
      <td class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-center">
        <button onclick="toggleAgrupadasRow('${item.matricula}')" class="px-3 py-1 text-xs rounded ${isExpanded ? 'bg-gray-200 dark:bg-gray-600' : 'bg-primary text-white'} hover:opacity-80 transition-opacity">
          <i class="ph ${isExpanded ? 'ph-caret-up' : 'ph-caret-down'}"></i>
          ${isExpanded ? 'Ocultar' : 'Ver'}
        </button>
      </td>
    </tr>
    ${isExpanded ? `
    <tr>
      <td colspan="7" class="p-0 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div class="p-3">
          <table class="w-full border-collapse">
            <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase border border-gray-200 dark:border-gray-600">Exame</th>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase border border-gray-200 dark:border-gray-600">Último</th>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase border border-gray-200 dark:border-gray-600">Resultado</th>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase border border-gray-200 dark:border-gray-600">Próximo</th>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase border border-gray-200 dark:border-gray-600">Cidade</th>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase border border-gray-200 dark:border-gray-600">Estado</th>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase border border-gray-200 dark:border-gray-600">Situação</th>
              </tr>
            </thead>
            <tbody>
              ${examsList}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
    ` : ""}
  `;
      }
    )
    .join("");
}

async function toggleAgrupadasRow(matricula) {
  if (state.agrupadas.expandedRows.has(matricula)) {
    state.agrupadas.expandedRows.delete(matricula);
  } else {
    state.agrupadas.expandedRows.add(matricula);
    
    // Buscar detalhes dos exames sob demanda se ainda não foram carregados
    const item = state.agrupadas.data.find(d => d.matricula === matricula);
    if (item && !item.exames) {
      try {
        const result = await API.getConvocacoesAgrupadasExames(matricula);
        item.exames = result.exames;
      } catch (error) {
        showToast("Erro ao carregar detalhes: " + error.message, "error");
        item.exames = [];
      }
    }
  }
  renderAgrupadasTable();
}

function searchAgrupadas() {
  const search = document.getElementById("agrupadasSearch").value;
  const situacao = document.getElementById("agrupadasSituacao").value;

  const filters = { limit: document.getElementById("agrupadasLimit").value };
  if (search) filters.q = search;
  if (situacao) filters.situacao = situacao;

  state.agrupadas.filters = filters;
  state.agrupadas.expandedRows.clear();
  loadAgrupadas(1);
}

function clearAgrupadasFilters() {
  document.getElementById("agrupadasSearch").value = "";
  document.getElementById("agrupadasSituacao").value = "Ativo";
  state.agrupadas.filters = { limit: 20, situacao: "Ativo" };
  state.agrupadas.expandedRows.clear();
  loadAgrupadas(1);
}

function exportAgrupadas() {
  const data = state.agrupadas.data.flatMap((item) => {
    // Se tem exames carregados, exportar cada exame
    if (item.exames && item.exames.length > 0) {
      return item.exames.map((exam) => ({
        Matrícula: item.matricula,
        Nome: item.nome,
        Cargo: item.cargo,
        "Qtd Exames": item.qtd_exames,
        Cidades: item.cidades,
        Situação: item.situacao,
        Exame: exam.exame,
        "Último Pedido": exam.ultimo_pedido,
        "Data Resultado": exam.data_resultado,
        "Próximo": exam.refazer_em,
        Cidade: exam.cidade_unidade,
        Estado: exam.estado_unidade,
        "Situação Exame": exam.situacao,
      }));
    }
    // Se não tem exames carregados, exportar dados agregados
    return [{
      Matrícula: item.matricula,
      Nome: item.nome,
      Cargo: item.cargo,
      "Qtd Exames": item.qtd_exames,
      Cidades: item.cidades,
      Situação: item.situacao,
      Exame: "-",
      "Último Pedido": "-",
      "Data Resultado": "-",
      "Próximo": "-",
      Cidade: "-",
      Estado: "-",
      "Situação Exame": "-",
    }];
  });
  exportToExcel(data, "convocacoes_agrupadas");
  showToast("Exportado com sucesso!", "success");
}

// =====================================================
// HELPERS
// =====================================================
function populateFilterSelects() {
  const statusSet = new Set();
  const situacaoSet = new Set();

  state.agendamentos.data.forEach((item) => {
    if (item.status) statusSet.add(item.status);
  });
  state.convocacoes.data.forEach((item) => {
    if (item.situacao) situacaoSet.add(item.situacao);
  });

  const statusSelect = document.getElementById("agendamentoStatus");
  const currentStatus = statusSelect.value;
  statusSelect.innerHTML = '<option value="">Todos</option>';
  Array.from(statusSet)
    .sort()
    .forEach((s) => {
      statusSelect.innerHTML += `<option value="${s}" ${s === currentStatus ? "selected" : ""}>${s}</option>`;
    });

  const situacaoSelect = document.getElementById("convocacaoSituacao");
  const currentSituacao = situacaoSelect.value;
  situacaoSelect.innerHTML = '<option value="">Todas</option>';
  Array.from(situacaoSet)
    .sort()
    .forEach((s) => {
      situacaoSelect.innerHTML += `<option value="${s}" ${s === currentSituacao ? "selected" : ""}>${s}</option>`;
    });
}

function getLoadFunction(type) {
  switch (type) {
    case "agendamentos":
      return "loadAgendamentos";
    case "convocacoes":
      return "loadConvocacoes";
    case "agrupadas":
      return "loadAgrupadas";
    default:
      return "loadAgendamentos";
  }
}

function renderPagination(type, pagination) {
  const container = document.getElementById(`${type}Pagination`);
  const { page, totalPages, hasNext, hasPrev } = pagination;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const loadFn = getLoadFunction(type);

  let html = "";
  html += `<li class="page-item ${!hasPrev ? "opacity-50 pointer-events-none" : ""}">
    <button onclick="${loadFn}(${page - 1})" class="px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 ${page === 1 ? "bg-primary text-white" : ""}">←</button></li>`;

  for (
    let i = Math.max(1, page - 2);
    i <= Math.min(totalPages, page + 2);
    i++
  ) {
    html += `<li><button onclick="${loadFn}(${i})" class="px-3 py-1 rounded border ${i === page ? "bg-primary text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"}">${i}</button></li>`;
  }

  html += `<li class="page-item ${!hasNext ? "opacity-50 pointer-events-none" : ""}">
    <button onclick="${loadFn}(${page + 1})" class="px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700 ${page === totalPages ? "bg-primary text-white" : ""}">→</button></li>`;

  container.innerHTML = html;
}

function formatNumber(num) {
  return new Intl.NumberFormat("pt-BR").format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

function formatKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusClass(status) {
  if (!status) return "bg-gray-100 text-gray-600";
  const s = status.toLowerCase();
  if (s.includes("pendente") || s.includes("não compareceu"))
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  if (
    s.includes("ativo") ||
    s.includes("concluído") ||
    s.includes("finalizado")
  )
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (s.includes("cancelado") || s.includes("inativo"))
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

function exportToExcel(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(
    wb,
    `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  const toastIcon = document.getElementById("toastIcon");

  toastMessage.textContent = message;
  toastIcon.className =
    type === "success"
      ? "ph ph-check-circle text-green-500"
      : "ph ph-warning-circle text-red-500";
  toast.classList.remove("hidden");
  toast.classList.add("flex");

  setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("flex");
  }, 3000);
}

// =====================================================
// CONFIG MODAL
// =====================================================
function setupConfigModal() {
  document.getElementById("configButton").addEventListener("click", () => {
    document.getElementById("configModal").classList.remove("hidden");
    document.getElementById("configModal").classList.add("flex");
  });

  document.getElementById("closeConfigModal").addEventListener("click", () => {
    document.getElementById("configModal").classList.add("hidden");
    document.getElementById("configModal").classList.remove("flex");
  });

  document.getElementById("configModal").addEventListener("click", (e) => {
    if (e.target.id === "configModal") {
      document.getElementById("configModal").classList.add("hidden");
      document.getElementById("configModal").classList.remove("flex");
    }
  });

  document.getElementById("btnToggleApiKey").addEventListener("click", () => {
    const input = document.getElementById("currentApiKey");
    input.type = input.type === "password" ? "text" : "password";
  });

  document.getElementById("btnEditApiKey").addEventListener("click", () => {
    document.getElementById("newApiKeySection").classList.remove("hidden");
  });

  document
    .getElementById("btnCancelEditApiKey")
    .addEventListener("click", () => {
      document.getElementById("newApiKeySection").classList.add("hidden");
      document.getElementById("configApiKey").value = "";
    });

  document.getElementById("btnSaveApiKey").addEventListener("click", () => {
    const apiKey = document.getElementById("configApiKey").value;
    if (apiKey) {
      localStorage.setItem("desafio_api_key", apiKey);
      document.getElementById("currentApiKey").value = apiKey;
      document.getElementById("newApiKeySection").classList.add("hidden");
      showToast("API Key salva!", "success");
      initApp();
    }
  });

  // Load current API key
  document.getElementById("currentApiKey").value =
    localStorage.getItem("desafio_api_key") || "";
}

// Expose functions to global
window.loadAgendamentos = loadAgendamentos;
window.loadConvocacoes = loadConvocacoes;
window.loadAgrupadas = loadAgrupadas;
window.showAgendamentoDetail = showAgendamentoDetail;
window.showConvocacaoDetail = showConvocacaoDetail;
window.toggleAgrupadasRow = toggleAgrupadasRow;

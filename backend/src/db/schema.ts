import { pgTable, serial, integer, text, date, pgSchema } from 'drizzle-orm/pg-core';

// Schema para tabela de agendamentos
export const agendamentos = pgTable('base_geral', {
  id: serial('id').primaryKey(),
  ticket: integer('ticket'),
  solicitante: text('solicitante'),
  dataSolicitacao: date('data_solicitacao'),
  etapaAtual: text('etapa_atual'),
  status: text('status'),
  nomeColaborador: text('nome_colaborador'),
  tipoExame: text('tipo_exame'),
  dataExame: date('data_exame'),
  cidadePreferencia: text('cidade_preferencia'),
  agendarEnquadramentoPcd: text('agendar_enquadramento_pcd'),
  possuiFormularioRac: text('possui_formulario_rac'),
  possuiExamesComplementares: text('possui_exames_complementares'),
  dataConclusaoDia: date('data_conclusao_dia'),
  statusSlaAgendamento: text('status_sla_agendamento'),
  dataUltimaAlteracao: date('data_ultima_alteracao'),
  dadosAgendamentoTipoSolicitacao: text('dados_agendamento_tipo_solicitacao'),
}, { schema: 'central_teste' });

// Schema para tabela de convocações
export const convocacoes = pgTable('convocacao_de_exames_geral', {
  cargo: text('cargo'),
  nome: text('nome'),
  matricula: text('matricula').primaryKey(),
  exame: text('exame'),
  ultimoPedido: text('ultimo_pedido'),
  dataResultado: date('data_resultado'),
  periodicidade: integer('periodicidade'),
  refazerEm: text('refazer_em'),
  dtAdmissao: date('dt_admissao'),
  situacao: text('situacao'),
  cidadeUnidade: text('cidade_unidade'),
  estadoUnidade: text('estado_unidade'),
  dtNascimento: date('dt_nascimento'),
  dataReferencia: date('data_referencia'),
}, { schema: 'relacionamento_teste' });

// Tipos TypeScript derivados do schema
export type Agendamento = typeof agendamentos.$inferSelect;
export type NewAgendamento = typeof agendamentos.$inferInsert;
export type Convocacao = typeof convocacoes.$inferSelect;
export type NewConvocacao = typeof convocacoes.$inferInsert;
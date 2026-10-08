export type UserRole = 'administrador' | 'caixa' | 'atendente' | 'cozinha' | 'entregador';

export interface Usuario {
  id: string;
  uid: string;
  nome: string;
  email: string;
  funcao: UserRole;
  bloqueado: boolean;
  permissoes?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  regiaoId?: string;
  regiaoNome?: string;
  totalPedidos?: number;
  criadoEm: string;
}

export type CategoriaNome =
  | 'Marmitas'
  | 'Carnes'
  | 'Carnes Especiais'
  | 'Acompanhamentos'
  | 'Bebidas'
  | 'Porções'
  | 'Adicionais'
  | 'Buffet'
  | 'Doces e Sobremesas'
  | 'Saladas Avulsas'
  | 'Outros';

export interface Categoria {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
}

export type MarmitaTamanhoNome = 'Pequena' | 'Média' | 'Grande';
export type CanalVendaProduto = 'ambos' | 'balcao' | 'delivery';

export interface Produto {
  id: string;
  nome: string;
  categoria: CategoriaNome;
  descricao: string;
  preco: number;
  imagemUrl?: string;
  disponivel: boolean;
  ativo: boolean;
  estoque?: number;
  diasSemana?: string[];
  ehEspecial?: boolean;
  exigeSegundaCarne?: boolean;
  tamanhosPermitidos?: MarmitaTamanhoNome[];
  canalVenda?: CanalVendaProduto;
  ehDadoDemonstracao?: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

export type MesaStatus = 'livre' | 'ocupada' | 'aguardando_pagamento' | 'reservada';

export interface Mesa {
  id: string;
  numero: number;
  status: MesaStatus;
  capacidade: number;
  pessoas: number;
  comandaId?: string;
  clienteReserva?: string;
  atualizadoEm: string;
}

export type ComandaStatus = 'aberta' | 'aguardando_pagamento' | 'fechada' | 'cancelada';

export interface Comanda {
  id: string;
  codigo: string;
  mesaId: string;
  mesaNumero: number;
  status: ComandaStatus;
  pessoas: number;
  tipoBuffet?: string;
  valorPorPessoaBuffet?: number;
  valorBuffetTotal?: number;
  subtotalItens?: number;
  total: number;
  criadoPor?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface ItemComanda {
  id: string;
  comandaId: string;
  mesaNumero: number;
  produtoId: string;
  produtoNome: string;
  categoria?: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
  observacao?: string;
  criadoEm: string;
}

export type PedidoOrigem = 'delivery' | 'marmita' | 'balcao' | 'mesa';

export type PedidoStatus =
  | 'novo'
  | 'confirmando'
  | 'em_preparo'
  | 'pronto'
  | 'saiu_para_entrega'
  | 'entregue'
  | 'cancelado';

export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito';

export interface Pedido {
  id: string;
  numero: number;
  origem: PedidoOrigem;
  status: PedidoStatus;
  clienteNome: string;
  clienteTelefone?: string;
  enderecoEntrega?: string;
  regiaoId?: string;
  regiaoNome?: string;
  taxaEntrega?: number;
  formaPagamento: FormaPagamento;
  trocoPara?: number;
  subtotal: number;
  total: number;
  resumoItens?: string;
  qtdMarmitas?: number;
  observacoes?: string;
  entregadorId?: string;
  entregadorNome?: string;
  pago?: boolean;
  criadoPor?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  numeroPedido: number;
  tipo: 'marmita' | 'produto' | 'buffet';
  nome: string;
  tamanhoMarmita?: string;
  carnes?: string;
  acompanhamentos?: string;
  adicionais?: string;
  bebidas?: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
  observacao?: string;
  criadoEm: string;
}

export interface Pagamento {
  id: string;
  referenciaId: string;
  tipoReferencia: 'pedido' | 'comanda' | 'avulso';
  caixaId?: string;
  formaPagamento: FormaPagamento;
  valor: number;
  troco?: number;
  registradoPor?: string;
  criadoEm: string;
}

export interface Caixa {
  id: string;
  status: 'aberto' | 'fechado';
  saldoInicial: number;
  totalDinheiro: number;
  totalPix: number;
  totalCartaoDebito: number;
  totalCartaoCredito: number;
  totalEntradasExtras?: number;
  totalSaidasSangrias?: number;
  valorInformadoFechamento?: number;
  diferencaFechamento?: number;
  abertoPor: string;
  fechadoPor?: string;
  abertoEm: string;
  fechadoEm?: string;
  observacoes?: string;
}

export type TipoMovimentacaoCaixa =
  | 'abertura'
  | 'venda'
  | 'entrada'
  | 'retirada'
  | 'sangria'
  | 'fechamento';

export interface MovimentacaoCaixa {
  id: string;
  caixaId: string;
  tipo: TipoMovimentacaoCaixa;
  formaPagamento: FormaPagamento;
  valor: number;
  descricao: string;
  usuarioNome?: string;
  criadoEm: string;
}

export type EntregadorStatus = 'disponivel' | 'em_entrega' | 'indisponivel';

export interface Entregador {
  id: string;
  nome: string;
  telefone: string;
  status: EntregadorStatus;
  veiculo?: string;
  entregasRealizadas?: number;
  criadoEm: string;
}

export interface Entrega {
  id: string;
  pedidoId: string;
  numeroPedido: number;
  entregadorId: string;
  entregadorNome: string;
  clienteNome: string;
  clienteTelefone?: string;
  endereco: string;
  regiaoNome?: string;
  taxaEntrega?: number;
  valorTotalPedido?: number;
  formaPagamento?: string;
  status: 'atribuida' | 'saiu_para_entrega' | 'entregue' | 'cancelada';
  atribuidoEm: string;
  entregueEm?: string;
}

export interface RegiaoEntrega {
  id: string;
  nome: string;
  taxa: number;
  tempoEstimadoMin?: number;
  ativo: boolean;
  criadoEm: string;
}

export type StatusCozinha = 'novo' | 'em_preparo' | 'pronto' | 'finalizado';

export interface PedidoCozinha {
  id: string;
  referenciaId: string;
  numero: number;
  origem: 'delivery' | 'marmita' | 'mesa' | 'balcao';
  identificacao: string;
  itensTexto: string;
  observacoes?: string;
  status: StatusCozinha;
  criadoEm: string;
  atualizadoEm?: string;
}

export type SetorImpressao = 'cozinha' | 'caixa' | 'bar' | 'todos';

export interface ImpressoraTermica {
  id: string;
  nome: string;
  ip: string;
  porta: number; // padrão 9100
  setor: SetorImpressao;
  larguraBobina: '80mm' | '58mm';
  ativo: boolean;
  modelo?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface ConfiguracaoRestaurante {
  id: string;
  nomeRestaurante: string;
  telefoneRestaurante?: string;
  enderecoRestaurante?: string;
  cep?: string;
  cnpj?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  precoMarmitaP: number;
  precoMarmitaM: number;
  precoMarmitaG: number;
  precoBuffetAdulto: number;
  precoBuffetCrianca: number;
  precoBuffetKilo?: number;
  logoUrl?: string;
  bannerUrl?: string;
  corPrimaria?: string;
  corTemaNome?: string;
  corFundo?: string;
  corFundoNome?: string;
  corBotoes?: string;
  iconeTema?: string;
  iconeCustomUrl?: string;
  atualizadoEm: string;
}

export interface LogAuditoria {
  id: string;
  acao: string;
  detalhes: string;
  usuarioId: string;
  usuarioNome: string;
  criadoEm: string;
}

export interface ThermalReceiptData {
  titulo: string;
  subtitulo?: string;
  numeroDocumento?: string;
  dataHora: string;
  clienteOuMesa?: string;
  telefone?: string;
  endereco?: string;
  linhas: {
    qtd?: number;
    descricao: string;
    valor?: number;
    observacao?: string;
  }[];
  subtotal?: number;
  taxaEntrega?: number;
  total?: number;
  formaPagamento?: string;
  troco?: string;
  observacoesGerais?: string;
  rodape?: string;
}

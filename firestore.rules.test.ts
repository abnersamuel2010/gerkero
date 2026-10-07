/**
 * Firestore Security Rules Test Suite — Dirty Dozen Verification
 * Verifies that all 12 adversarial payloads defined in security_spec.md return PERMISSION_DENIED.
 */

export interface TestPayload {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'delete' | 'get';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  data?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: TestPayload[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Produto',
    collection: 'produtos',
    docId: 'prod_1',
    operation: 'create',
    auth: { uid: 'admin_1', email: 'robertokeylatomaz@gmail.com', email_verified: true },
    data: {
      nome: 'Marmita Picanha',
      categoria: 'Marmitas',
      descricao: 'Completa',
      preco: 28,
      disponivel: true,
      ativo: true,
      criadoEm: '2026-09-30T12:00:00Z',
      shadowField: 'malicious'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoofing',
    collection: 'produtos',
    docId: 'prod_1',
    operation: 'delete',
    auth: { uid: 'spoof_1', email: 'robertokeylatomaz@gmail.com', email_verified: false },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Cross-UID Self-Assigned Admin Creation',
    collection: 'usuarios',
    docId: 'victim_uid',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    data: {
      uid: 'victim_uid',
      nome: 'Attacker',
      email: 'attacker@example.com',
      funcao: 'administrador',
      bloqueado: false,
      criadoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'ID Poisoning Attack',
    collection: 'mesas',
    docId: 'invalid/id$with*chars',
    operation: 'create',
    auth: { uid: 'admin_1', email: 'robertokeylatomaz@gmail.com', email_verified: true },
    data: {
      numero: 1,
      status: 'livre',
      capacidade: 4,
      pessoas: 0,
      atualizadoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'String Overflow on Pedido Observacoes',
    collection: 'pedidos',
    docId: 'ped_1',
    operation: 'create',
    auth: { uid: 'staff_1', email: 'staff@example.com', email_verified: true },
    data: {
      numero: 101,
      origem: 'delivery',
      status: 'novo',
      clienteNome: 'João',
      formaPagamento: 'pix',
      subtotal: 30,
      total: 36,
      observacoes: 'A'.repeat(500),
      criadoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Negative Price Injection on Produto',
    collection: 'produtos',
    docId: 'prod_2',
    operation: 'create',
    auth: { uid: 'admin_1', email: 'robertokeylatomaz@gmail.com', email_verified: true },
    data: {
      nome: 'Item Negativo',
      categoria: 'Bebidas',
      descricao: 'Teste',
      preco: -15,
      disponivel: true,
      ativo: true,
      criadoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Invalid Enum on Mesa Status',
    collection: 'mesas',
    docId: 'mesa_1',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'robertokeylatomaz@gmail.com', email_verified: true },
    data: {
      numero: 1,
      status: 'explodida',
      capacidade: 4,
      pessoas: 2,
      atualizadoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Cross-User Profile Overwrite',
    collection: 'usuarios',
    docId: 'other_user',
    operation: 'update',
    auth: { uid: 'normal_user', email: 'user@example.com', email_verified: true },
    data: {
      uid: 'other_user',
      nome: 'Hacked',
      email: 'user@example.com',
      funcao: 'administrador',
      bloqueado: false,
      criadoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Unauthenticated Write to Caixa',
    collection: 'caixas',
    docId: 'caixa_1',
    operation: 'create',
    auth: null,
    data: {
      status: 'aberto',
      saldoInicial: 100,
      totalDinheiro: 0,
      totalPix: 0,
      totalCartaoDebito: 0,
      totalCartaoCredito: 0,
      abertoPor: 'Anon',
      abertoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Invalid Payment Method Enum',
    collection: 'pagamentos',
    docId: 'pag_1',
    operation: 'create',
    auth: { uid: 'admin_1', email: 'robertokeylatomaz@gmail.com', email_verified: true },
    data: {
      referenciaId: 'ped_1',
      tipoReferencia: 'pedido',
      formaPagamento: 'criptomoeda',
      valor: 50,
      criadoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Missing Required Fields on Comanda',
    collection: 'comandas',
    docId: 'com_1',
    operation: 'create',
    auth: { uid: 'admin_1', email: 'robertokeylatomaz@gmail.com', email_verified: true },
    data: {
      codigo: 'COM-01'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Value Poisoning on Entregador Update',
    collection: 'entregadores',
    docId: 'ent_1',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'robertokeylatomaz@gmail.com', email_verified: true },
    data: {
      nome: 'Carlos',
      telefone: '11999999999',
      status: 99999,
      criadoEm: '2026-09-30T12:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  }
];

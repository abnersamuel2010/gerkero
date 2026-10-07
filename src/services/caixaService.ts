import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import { Caixa, FormaPagamento, TipoMovimentacaoCaixa } from '../types';
import { generateSafeId } from '../utils/formatters';
import { registrarLogAuditoria } from './authService';

export async function abrirCaixa(
  saldoInicial: number,
  observacoes?: string
): Promise<string> {
  const id = generateSafeId('caixa');
  const path = `caixas/${id}`;
  const usuarioNome = (
    auth.currentUser?.displayName ||
    auth.currentUser?.email ||
    'Operador de Caixa'
  ).slice(0, 120);
  const agora = new Date().toISOString();

  try {
    const payload: Record<string, unknown> = {
      status: 'aberto',
      saldoInicial: Math.max(0, Number(saldoInicial) || 0),
      totalDinheiro: 0,
      totalPix: 0,
      totalCartaoDebito: 0,
      totalCartaoCredito: 0,
      totalEntradasExtras: 0,
      totalSaidasSangrias: 0,
      abertoPor: usuarioNome,
      abertoEm: agora,
    };
    if (observacoes) {
      payload.observacoes = observacoes.trim().slice(0, 300);
    }

    await setDoc(doc(db, 'caixas', id), payload);

    // Registrar movimentação inicial
    const movId = generateSafeId('mov');
    await setDoc(doc(db, 'movimentacoesCaixa', movId), {
      caixaId: id,
      tipo: 'abertura',
      formaPagamento: 'dinheiro',
      valor: Math.max(0, Number(saldoInicial) || 0),
      descricao: 'Abertura de caixa - Saldo Inicial',
      usuarioNome,
      criadoEm: agora,
    });

    await registrarLogAuditoria(
      'Abertura de Caixa',
      `Caixa aberto por ${usuarioNome} com saldo inicial de R$ ${Number(saldoInicial).toFixed(2)}`
    );
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function registrarMovimentacaoCaixa(
  caixaAtual: Caixa,
  tipo: TipoMovimentacaoCaixa,
  formaPagamento: FormaPagamento,
  valor: number,
  descricao: string,
  referenciaId?: string,
  tipoReferencia: 'pedido' | 'comanda' | 'avulso' = 'avulso',
  troco = 0
): Promise<void> {
  const valorNum = Math.max(0, Number(valor) || 0);
  const agora = new Date().toISOString();
  const usuarioNome = (
    auth.currentUser?.displayName ||
    auth.currentUser?.email ||
    'Operador'
  ).slice(0, 120);

  const movId = generateSafeId('mov');
  const movPath = `movimentacoesCaixa/${movId}`;

  try {
    await setDoc(doc(db, 'movimentacoesCaixa', movId), {
      caixaId: caixaAtual.id,
      tipo,
      formaPagamento,
      valor: valorNum,
      descricao: descricao.trim().slice(0, 240),
      usuarioNome,
      criadoEm: agora,
    });

    if (tipo === 'venda') {
      const pagId = generateSafeId('pag');
      const pagPayload: Record<string, unknown> = {
        referenciaId: (referenciaId || movId).slice(0, 128),
        tipoReferencia,
        caixaId: caixaAtual.id,
        formaPagamento,
        valor: valorNum,
        registradoPor: usuarioNome,
        criadoEm: agora,
      };
      if (troco > 0) {
        pagPayload.troco = troco;
      }
      await setDoc(doc(db, 'pagamentos', pagId), pagPayload);
    }

    // Atualizar totais do caixa
    const updateCaixa: Record<string, unknown> = {};
    if (tipo === 'venda') {
      if (formaPagamento === 'dinheiro') {
        updateCaixa.totalDinheiro = (caixaAtual.totalDinheiro || 0) + valorNum;
      } else if (formaPagamento === 'pix') {
        updateCaixa.totalPix = (caixaAtual.totalPix || 0) + valorNum;
      } else if (formaPagamento === 'cartao_debito') {
        updateCaixa.totalCartaoDebito = (caixaAtual.totalCartaoDebito || 0) + valorNum;
      } else if (formaPagamento === 'cartao_credito') {
        updateCaixa.totalCartaoCredito = (caixaAtual.totalCartaoCredito || 0) + valorNum;
      }
    } else if (tipo === 'entrada') {
      updateCaixa.totalEntradasExtras = (caixaAtual.totalEntradasExtras || 0) + valorNum;
    } else if (tipo === 'retirada' || tipo === 'sangria') {
      updateCaixa.totalSaidasSangrias = (caixaAtual.totalSaidasSangrias || 0) + valorNum;
    }

    if (Object.keys(updateCaixa).length > 0) {
      await updateDoc(doc(db, 'caixas', caixaAtual.id), updateCaixa);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, movPath);
  }
}

export async function fecharCaixa(
  caixaAtual: Caixa,
  valorInformadoFechamento: number,
  observacoes?: string
): Promise<void> {
  const path = `caixas/${caixaAtual.id}`;
  const usuarioNome = (
    auth.currentUser?.displayName ||
    auth.currentUser?.email ||
    'Operador'
  ).slice(0, 120);
  const agora = new Date().toISOString();

  const totalVendas =
    (caixaAtual.totalDinheiro || 0) +
    (caixaAtual.totalPix || 0) +
    (caixaAtual.totalCartaoDebito || 0) +
    (caixaAtual.totalCartaoCredito || 0);

  const valorEsperadoGeral =
    (caixaAtual.saldoInicial || 0) +
    totalVendas +
    (caixaAtual.totalEntradasExtras || 0) -
    (caixaAtual.totalSaidasSangrias || 0);

  const valorInformado = Math.max(0, Number(valorInformadoFechamento) || 0);
  const diferenca = Number((valorInformado - valorEsperadoGeral).toFixed(2));

  try {
    const updatePayload: Record<string, unknown> = {
      status: 'fechado',
      valorInformadoFechamento: valorInformado,
      diferencaFechamento: diferenca,
      fechadoPor: usuarioNome,
      fechadoEm: agora,
    };
    if (observacoes !== undefined) {
      updatePayload.observacoes = observacoes.trim().slice(0, 300);
    }

    await updateDoc(doc(db, 'caixas', caixaAtual.id), updatePayload);

    const movId = generateSafeId('mov');
    await setDoc(doc(db, 'movimentacoesCaixa', movId), {
      caixaId: caixaAtual.id,
      tipo: 'fechamento',
      formaPagamento: 'dinheiro',
      valor: valorInformado,
      descricao: `Fechamento de caixa (Esperado: R$ ${valorEsperadoGeral.toFixed(2)} | Informado: R$ ${valorInformado.toFixed(2)} | Dif: R$ ${diferenca.toFixed(2)})`.slice(0, 240),
      usuarioNome,
      criadoEm: agora,
    });

    await registrarLogAuditoria(
      'Fechamento de Caixa',
      `Caixa ${caixaAtual.id} fechado por ${usuarioNome}. Total Esperado: R$ ${valorEsperadoGeral.toFixed(2)}, Informado: R$ ${valorInformado.toFixed(2)}, Diferença: R$ ${diferenca.toFixed(2)}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

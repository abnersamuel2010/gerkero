export function formatCurrency(value: number | undefined | null): string {
  const safeVal = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeVal);
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getMinutesElapsed(isoString?: string): number {
  if (!isoString) return 0;
  try {
    const start = new Date(isoString).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / 60000));
  } catch {
    return 0;
  }
}

export function isToday(isoString?: string): boolean {
  if (!isoString) return false;
  try {
    const d = new Date(isoString);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

export function isWithinPeriod(
  isoString: string | undefined,
  period: 'hoje' | 'ontem' | '7dias' | 'mes_atual' | 'mes_anterior' | 'personalizado',
  customStart?: string,
  customEnd?: string
): boolean {
  if (!isoString) return false;
  try {
    const target = new Date(isoString);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'hoje') {
      return target >= startOfToday;
    }
    if (period === 'ontem') {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      return target >= startOfYesterday && target < startOfToday;
    }
    if (period === '7dias') {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return target >= sevenDaysAgo;
    }
    if (period === 'mes_atual') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return target >= startOfMonth;
    }
    if (period === 'mes_anterior') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return target >= startOfLastMonth && target < endOfLastMonth;
    }
    if (period === 'personalizado') {
      if (!customStart && !customEnd) return true;
      const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
      const end = customEnd ? new Date(`${customEnd}T23:59:59`) : new Date(8640000000000000);
      return target >= start && target <= end;
    }
    return true;
  } catch {
    return false;
  }
}

export function formatFormaPagamento(fp?: string): string {
  switch (fp) {
    case 'dinheiro':
      return 'Dinheiro';
    case 'pix':
      return 'Pix';
    case 'cartao_debito':
      return 'Cartão de Débito';
    case 'cartao_credito':
      return 'Cartão de Crédito';
    default:
      return fp || 'Não informado';
  }
}

export function formatStatusPedido(status?: string): string {
  switch (status) {
    case 'novo':
      return 'Novo';
    case 'confirmando':
      return 'Confirmando';
    case 'em_preparo':
      return 'Em Preparo';
    case 'pronto':
      return 'Pronto';
    case 'saiu_para_entrega':
      return 'Saiu para Entrega';
    case 'entregue':
      return 'Entregue';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status || '—';
  }
}

export function formatRoleName(role?: string): string {
  switch (role) {
    case 'administrador':
      return 'Administrador';
    case 'caixa':
      return 'Caixa';
    case 'atendente':
      return 'Atendente / Garçom';
    case 'cozinha':
      return 'Cozinha (KDS)';
    case 'entregador':
      return 'Entregador';
    default:
      return 'Atendente';
  }
}

export function cleanDemoTag(name?: string | null): string {
  if (!name) return '';
  return name.replace(/\s*\[Demo\]/gi, '').trim();
}

export function generateSafeId(prefix = 'id'): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `${prefix}_${timePart}_${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

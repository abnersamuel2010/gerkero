import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  Flame,
  Search,
  ChevronRight,
  ArrowLeft,
  X,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  Copy,
  Check,
  Motorbike,
  ChefHat,
  MessageCircle,
  LogIn,
  AlertCircle,
  Package,
  Calendar,
  AlertTriangle,
  Instagram,
  Facebook,
} from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  Produto,
  RegiaoEntrega,
  ConfiguracaoRestaurante,
  FormaPagamento,
  Pedido,
  PedidoStatus,
} from '../types';
import {
  criarPedidoCompleto,
  NovoItemPedidoInput,
} from '../services/pedidosService';
import { subscribeDocument } from '../services/firestoreService';
import { formatCurrency, formatTimeOnly } from '../utils/formatters';
import { IMAGENS_PADRAO } from '../services/firestoreService';
import { DIAS_DA_SEMANA, getDiaHojeKey } from '../data/cardapioOficial';

// Helper para obter a imagem de qualquer produto (usando imagemUrl do cadastro ou imagem padrão temática)
export const getImagemProduto = (prod: Produto): string => {
  if (prod.imagemUrl && prod.imagemUrl.trim().length > 0) {
    return prod.imagemUrl;
  }
  const nomeLower = prod.nome.toLowerCase();
  const catLower = (prod.categoria || '').toLowerCase();

  if (catLower.includes('carne') || catLower.includes('brasa')) {
    if (nomeLower.includes('frango')) return IMAGENS_PADRAO.marmitaFrango;
    if (nomeLower.includes('picanha')) return IMAGENS_PADRAO.marmitaPicanha;
    if (nomeLower.includes('churrasco')) return IMAGENS_PADRAO.porcaoChurrasco;
    return IMAGENS_PADRAO.carnesGrelhadas;
  }
  if (catLower.includes('salada') || nomeLower.includes('salada')) {
    return IMAGENS_PADRAO.saladaFresca;
  }
  if (
    catLower.includes('bebida') ||
    nomeLower.includes('coca') ||
    nomeLower.includes('refri') ||
    nomeLower.includes('água') ||
    nomeLower.includes('agua') ||
    nomeLower.includes('tubaína') ||
    nomeLower.includes('tubaina') ||
    nomeLower.includes('suco')
  ) {
    return IMAGENS_PADRAO.bebidasGeladas;
  }
  if (catLower.includes('porç') || catLower.includes('porco')) {
    return IMAGENS_PADRAO.porcaoChurrasco;
  }
  if (catLower.includes('marmita')) {
    if (nomeLower.includes('frango')) return IMAGENS_PADRAO.marmitaFrango;
    return IMAGENS_PADRAO.marmitaPicanha;
  }
  return IMAGENS_PADRAO.carnesGrelhadas;
};

interface PortalClienteDeliveryProps {
  produtos: Produto[];
  regioes: RegiaoEntrega[];
  config: ConfiguracaoRestaurante;
  pedidos: Pedido[];
  onIrParaLogin?: () => void;
}

export const PortalClienteDelivery: React.FC<PortalClienteDeliveryProps> = ({
  produtos,
  regioes,
  config,
  pedidos,
  onIrParaLogin,
}) => {
  // Filtros e busca (destaques como home inicial)
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('destaques');

  // Sacola de Compras
  const [sacola, setSacola] = useState<NovoItemPedidoInput[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  // Montagem interativa de Marmita (formato de seleção unificada sem Carne 2 separada)
  const [modalMarmitaAberto, setModalMarmitaAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<
    'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'
  >(getDiaHojeKey());
  const [tamMarmita, setTamMarmita] = useState<'Pequena' | 'Média' | 'Grande'>('Média');
  const [carnesEscolhidasIds, setCarnesEscolhidasIds] = useState<string[]>([]);
  const [avisoCarnesMarmita, setAvisoCarnesMarmita] = useState<string>('');
  const [acompEscolhidos, setAcompEscolhidos] = useState<string[]>([
    'Arroz',
    'Feijão',
    'Farofa',
  ]);
  const [obsMarmita, setObsMarmita] = useState('');

  // Modal de Personalização de Porção (escolher carne do dia OU acompanhamento)
  const [modalPorcaoAberto, setModalPorcaoAberto] = useState(false);
  const [porcaoSelecionada, setPorcaoSelecionada] = useState<Produto | null>(null);
  const [tipoItemPorcao, setTipoItemPorcao] = useState<'carne' | 'acompanhamento'>('carne');
  const [itemPorcaoEscolhido, setItemPorcaoEscolhido] = useState<string>('');
  const [obsPorcao, setObsPorcao] = useState<string>('');

  // Formulário de Checkout / Entrega
  const [etapaCheckout, setEtapaCheckout] = useState<'sacola' | 'dados' | 'pagamento'>('sacola');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [ruaNumero, setRuaNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [complemento, setComplemento] = useState('');
  const [regiaoSelecionadaId, setRegiaoSelecionadaId] = useState<string>('');
  const [formaPag, setFormaPag] = useState<FormaPagamento>('pix');
  const [precisaTrocoPara, setPrecisaTrocoPara] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);

  // Acompanhamento do Pedido
  const [pedidoAtivoId, setPedidoAtivoId] = useState<string | null>(() => {
    return localStorage.getItem('ultimoPedidoDeliveryId') || null;
  });
  const [pedidoAtivo, setPedidoAtivo] = useState<Pedido | null>(null);

  // Regiões ativas
  const regioesAtivas = useMemo(() => regioes.filter((r) => r.ativo), [regioes]);
  useEffect(() => {
    if (!regiaoSelecionadaId && regioesAtivas.length > 0) {
      setRegiaoSelecionadaId(regioesAtivas[0].id);
    }
  }, [regioesAtivas, regiaoSelecionadaId]);

  // Carregar dados do pedido ativo em tempo real
  useEffect(() => {
    if (!pedidoAtivoId) {
      setPedidoAtivo(null);
      return;
    }
    const unsub = subscribeDocument<Pedido>('pedidos', pedidoAtivoId, (ped) => {
      if (ped) {
        setPedidoAtivo(ped);
      }
    });
    return () => unsub();
  }, [pedidoAtivoId]);

  // Categorização de produtos (ocultar buffet completamente do delivery)
  const produtosDisponiveis = useMemo(
    () =>
      produtos.filter(
        (p) =>
          p.ativo &&
          p.disponivel &&
          p.categoria !== 'Buffet' &&
          !p.nome.toLowerCase().includes('buffet') &&
          !p.nome.toLowerCase().includes('bf livre')
      ),
    [produtos]
  );

  const carnesDisponiveis = useMemo(
    () => produtosDisponiveis.filter((p) => p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais'),
    [produtosDisponiveis]
  );

  const diaHojeKey = getDiaHojeKey();

  // Carnes de hoje
  const carnesDoDia = useMemo(() => {
    return carnesDisponiveis.filter((c) => {
      if (!c.diasSemana || c.diasSemana.length === 0) return true;
      return c.diasSemana.includes(diaHojeKey);
    });
  }, [carnesDisponiveis, diaHojeKey]);

  // Carnes filtradas para o modal de marmitas
  const carnesDoDiaModal = useMemo(() => {
    return carnesDisponiveis.filter((c) => {
      if (!c.diasSemana || c.diasSemana.length === 0) return true;
      return c.diasSemana.includes(diaSelecionado);
    });
  }, [carnesDisponiveis, diaSelecionado]);

  const acompanhamentosDisponiveis = useMemo(
    () => produtosDisponiveis.filter((p) => p.categoria === 'Acompanhamentos'),
    [produtosDisponiveis]
  );

  // Filtragem no cardápio: apenas carnes do dia de hoje aparecem para o cliente
  const produtosFiltrados = useMemo(() => {
    return produtosDisponiveis.filter((p) => {
      if (p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais') {
        if (p.diasSemana && p.diasSemana.length > 0 && !p.diasSemana.includes(diaHojeKey)) {
          return false;
        }
      }

      const matchBusca =
        !busca.trim() ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busca.toLowerCase());

      const matchCat =
        categoriaAtiva === 'todos' ||
        (categoriaAtiva === 'marmitas' && p.categoria === 'Marmitas') ||
        (categoriaAtiva === 'produtos' &&
          (p.categoria === 'Bebidas' ||
            p.categoria === 'Doces e Sobremesas' ||
            p.categoria === 'Saladas Avulsas' ||
            p.categoria === 'Porções' ||
            p.categoria === 'Outros')) ||
        (categoriaAtiva === 'carnes' && (p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais')) ||
        (categoriaAtiva === 'bebidas' && p.categoria === 'Bebidas') ||
        (categoriaAtiva === 'porcoes' && p.categoria === 'Porções') ||
        (categoriaAtiva === 'doces' && p.categoria === 'Doces e Sobremesas') ||
        (categoriaAtiva === 'saladas' && p.categoria === 'Saladas Avulsas') ||
        (categoriaAtiva === 'acompanhamentos' && p.categoria === 'Acompanhamentos') ||
        (categoriaAtiva === 'outros' && (p.categoria === 'Outros' || p.categoria === 'Adicionais'));

      return matchBusca && matchCat;
    });
  }, [produtosDisponiveis, busca, categoriaAtiva, diaHojeKey]);

  // Preço base da marmita personalizada (P: 16, M: 20, G: 25)
  const precoBaseMarmita =
    tamMarmita === 'Pequena'
      ? config.precoMarmitaP || 16
      : tamMarmita === 'Média'
      ? config.precoMarmitaM || 20
      : config.precoMarmitaG || 25;

  const carnesSelecionadasObjs = useMemo(() => {
    return carnesEscolhidasIds
      .map((id) => carnesDisponiveis.find((c) => c.id === id))
      .filter(Boolean) as Produto[];
  }, [carnesEscolhidasIds, carnesDisponiveis]);

  const temCarneEspecial = useMemo(() => {
    return carnesSelecionadasObjs.some((c) => c.ehEspecial || c.exigeSegundaCarne);
  }, [carnesSelecionadasObjs]);

  const temDuasCarnesNormais = useMemo(() => {
    return !temCarneEspecial && carnesSelecionadasObjs.length === 2;
  }, [temCarneEspecial, carnesSelecionadasObjs.length]);

  const adicionalDuasCarnesNormais = temDuasCarnesNormais ? 2.0 : 0;

  const valorExtrasCarnes = useMemo(() => {
    return (
      carnesSelecionadasObjs.reduce((acc, c) => acc + (c.preco || 0), 0) +
      adicionalDuasCarnesNormais
    );
  }, [carnesSelecionadasObjs, adicionalDuasCarnesNormais]);

  const precoTotalMarmita = precoBaseMarmita + valorExtrasCarnes;

  // Carnes divididas para o modal de marmitas
  const carnesNormaisModal = useMemo(
    () => carnesDoDiaModal.filter((c) => !c.ehEspecial && !c.exigeSegundaCarne),
    [carnesDoDiaModal]
  );
  const carnesEspeciaisModal = useMemo(
    () => carnesDoDiaModal.filter((c) => c.ehEspecial || c.exigeSegundaCarne),
    [carnesDoDiaModal]
  );

  // Cálculos da Sacola
  const regiaoObj =
    regioesAtivas.find((r) => r.id === regiaoSelecionadaId) || regioesAtivas[0];
  const taxaEntrega = regiaoObj ? regiaoObj.taxa : 0;
  const subtotalSacola = sacola.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );
  const totalSacola = subtotalSacola + (sacola.length > 0 ? taxaEntrega : 0);
  const totalItens = sacola.reduce((acc, i) => acc + i.quantidade, 0);

  // Adicionar produto comum à sacola
  const handleAdicionarProduto = (prod: Produto) => {
    setSacola((prev) => {
      const idx = prev.findIndex(
        (i) => i.nome === prod.nome && i.tipo === 'produto'
      );
      if (idx >= 0) {
        const novo = [...prev];
        novo[idx] = { ...novo[idx], quantidade: novo[idx].quantidade + 1 };
        return novo;
      }
      return [
        ...prev,
        {
          tipo: prod.categoria === 'Marmitas' ? 'marmita' : 'produto',
          nome: prod.nome,
          quantidade: 1,
          valorUnitario: prod.preco,
        },
      ];
    });
  };

  const handleAlterarQtdSacola = (index: number, delta: number) => {
    setSacola((prev) => {
      const novo = [...prev];
      const novaQtd = novo[index].quantidade + delta;
      if (novaQtd <= 0) {
        return novo.filter((_, i) => i !== index);
      }
      novo[index] = { ...novo[index], quantidade: novaQtd };
      return novo;
    });
  };

  const handleRemoverItemSacola = (index: number) => {
    setSacola((prev) => prev.filter((_, i) => i !== index));
  };

  // Alterar tamanho da marmita com regras de carne
  const handleMudarTamMarmita = (novoTam: 'Pequena' | 'Média' | 'Grande') => {
    setTamMarmita(novoTam);
    setAvisoCarnesMarmita('');
    if (novoTam === 'Pequena') {
      // Pequena só aceita 1 carne normal
      setCarnesEscolhidasIds((prev) => {
        const normais = prev.filter((id) => {
          const c = carnesDisponiveis.find((item) => item.id === id);
          return c && !c.ehEspecial && !c.exigeSegundaCarne;
        });
        return normais.slice(0, 1);
      });
    }
  };

  // Selecionar carne da marmita (formato de cards/seleção)
  const toggleCarneCliente = (carne: Produto) => {
    setAvisoCarnesMarmita('');
    const jaSelecionada = carnesEscolhidasIds.includes(carne.id);

    if (jaSelecionada) {
      setCarnesEscolhidasIds((prev) => prev.filter((id) => id !== carne.id));
      return;
    }

    const ehEstaEspecial = Boolean(carne.ehEspecial || carne.exigeSegundaCarne);

    // 1. Marmita Pequena: apenas 1 carne normal
    if (tamMarmita === 'Pequena') {
      if (ehEstaEspecial) {
        alert('Carnes especiais (Feijoada e Costela) só podem ser escolhidas na Marmita Média ou Grande.');
        return;
      }
      if (carnesEscolhidasIds.length >= 1) {
        alert('A Marmita Pequena permite apenas 1 carne normal. Para escolher 2 carnes ou carnes especiais, selecione a Marmita Média ou Grande.');
        return;
      }
      setCarnesEscolhidasIds([carne.id]);
      return;
    }

    // 2. Marmita Média ou Grande: máximo de 2 carnes
    if (carnesEscolhidasIds.length >= 2) {
      alert('Limite atingido! É permitido escolher no máximo 2 carnes por marmita.');
      return;
    }

    // 3. Regra: Não se pode colocar duas carnes especiais na mesma marmita
    const jaTemEspecial = carnesEscolhidasIds.some((id) => {
      const c = carnesDisponiveis.find((item) => item.id === id);
      return Boolean(c?.ehEspecial || c?.exigeSegundaCarne);
    });

    if (ehEstaEspecial && jaTemEspecial) {
      alert('Não é permitido colocar duas carnes especiais na mesma marmita! Combine a carne especial com uma carne tradicional.');
      return;
    }

    // 4. Se está adicionando a segunda carne normal:
    if (!ehEstaEspecial && carnesEscolhidasIds.length === 1 && !jaTemEspecial) {
      setAvisoCarnesMarmita('Aviso: Adicional de R$ 2,00 aplicado para escolher 2 carnes normais.');
    }

    setCarnesEscolhidasIds((prev) => [...prev, carne.id]);
  };

  // Abrir modal de marmita já com a carne escolhida
  const handleMontarComCarne = (carne: Produto) => {
    const ehEspecial = Boolean(carne.ehEspecial || carne.exigeSegundaCarne);
    if (ehEspecial && tamMarmita === 'Pequena') {
      setTamMarmita('Média');
    }
    setCarnesEscolhidasIds([carne.id]);
    setAvisoCarnesMarmita('');
    setModalMarmitaAberto(true);
  };

  // Adicionar marmita montada à sacola
  const handleAdicionarMarmita = () => {
    if (carnesEscolhidasIds.length === 0) {
      alert('Por favor, selecione pelo menos uma carne para a sua marmita.');
      return;
    }

    const carnesNomes = carnesSelecionadasObjs.map((c) => c.nome).join(' + ');

    const detalheCarnes = temDuasCarnesNormais
      ? ' (+R$ 2,00 2 carnes normais)'
      : temCarneEspecial
      ? ' (Carne Especial)'
      : '';

    setSacola((prev) => [
      ...prev,
      {
        tipo: 'marmita',
        nome: `Marmita ${tamMarmita} (${carnesNomes || 'Carne do Dia'}${detalheCarnes})`,
        tamanhoMarmita: tamMarmita,
        carnes: carnesNomes || 'Carne do Dia Selecionada',
        acompanhamentos:
          acompEscolhidos.length > 0
            ? acompEscolhidos.join(', ')
            : 'Arroz, Feijão e Farofa',
        quantidade: 1,
        valorUnitario: Number(precoTotalMarmita.toFixed(2)),
        observacao: obsMarmita.trim() || undefined,
      },
    ]);
    setModalMarmitaAberto(false);
    setCarnesEscolhidasIds([]);
    setAvisoCarnesMarmita('');
    setObsMarmita('');
    setCarrinhoAberto(true);
  };

  // Abrir modal de personalização da porção (escolher carne ou acompanhamento)
  const handleAbrirModalPorcao = (prod: Produto, preSelecionarItem?: string) => {
    setPorcaoSelecionada(prod);
    setTipoItemPorcao('carne');
    setItemPorcaoEscolhido(preSelecionarItem || carnesDoDia[0]?.nome || 'Carne do Dia');
    setObsPorcao('');
    setModalPorcaoAberto(true);
  };

  // Confirmar porção na sacola
  const handleConfirmarPorcao = () => {
    if (!porcaoSelecionada) return;
    if (!itemPorcaoEscolhido) {
      alert('Por favor, selecione qual carne ou acompanhamento deseja na porção.');
      return;
    }

    setSacola((prev) => [
      ...prev,
      {
        tipo: 'produto',
        nome: `${porcaoSelecionada.nome} (${itemPorcaoEscolhido})`,
        quantidade: 1,
        valorUnitario: porcaoSelecionada.preco,
        observacao: obsPorcao.trim() || undefined,
      },
    ]);
    setModalPorcaoAberto(false);
    setCarrinhoAberto(true);
  };

  // Confirmar Pedido de Entrega
  const handleEnviarPedidoFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sacola.length === 0) return;
    if (!nomeCliente.trim() || !telefoneCliente.trim() || !ruaNumero.trim()) {
      alert('Por favor, preencha seu nome, telefone e endereço completo para entrega.');
      return;
    }

    setEnviandoPedido(true);
    try {
      // Garantir autenticação anônima se cliente não estiver autenticado
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn('Login anônimo para pedido delivery:', authErr);
        }
      }

      const proximoNumero =
        pedidos.length > 0
          ? Math.max(...pedidos.map((p) => p.numero || 100)) + 1
          : 101;

      const trocoVal =
        formaPag === 'dinheiro'
          ? parseFloat(precisaTrocoPara.replace(',', '.')) || 0
          : 0;

      const enderecoFormatado = `${ruaNumero.trim()}${
        bairro.trim() ? `, ${bairro.trim()}` : ''
      }${complemento.trim() ? ` (${complemento.trim()})` : ''}`;

      const novoPedidoId = await criarPedidoCompleto({
        numero: proximoNumero,
        origem: 'delivery',
        clienteNome: nomeCliente.trim(),
        clienteTelefone: telefoneCliente.trim(),
        enderecoEntrega: enderecoFormatado,
        regiaoId: regiaoObj?.id,
        regiaoNome: regiaoObj?.nome,
        taxaEntrega,
        formaPagamento: formaPag,
        trocoPara: trocoVal > 0 ? trocoVal : undefined,
        observacoes: observacaoGeral.trim() || undefined,
        itens: sacola,
        enviarParaCozinha: true,
        registrarCliente: true,
      });

      // Salvar no estado e localStorage para rastreamento
      setPedidoAtivoId(novoPedidoId);
      localStorage.setItem('ultimoPedidoDeliveryId', novoPedidoId);
      setSacola([]);
      setCarrinhoAberto(false);
      setEtapaCheckout('sacola');
    } catch (err) {
      console.error('Erro ao enviar pedido de entrega:', err);
      alert('Ocorreu um erro ao enviar seu pedido. Por favor, tente novamente ou entre em contato pelo telefone.');
    } finally {
      setEnviandoPedido(false);
    }
  };

  const handleCopiarChavePix = () => {
    const chave = config.cnpj || '42.189.301/0001-90';
    navigator.clipboard.writeText(chave);
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2000);
  };

  const handleEnviarMsgWhatsApp = (pedido: Pedido) => {
    const tel = (config.telefoneRestaurante || '').replace(/\D/g, '') || '11999999999';
    const texto = `Olá *${config.nomeRestaurante}*! Acabei de fazer o *Pedido #${pedido.numero}* pelo Cardápio Delivery Online.\n\n📍 *Endereço:* ${pedido.enderecoEntrega || 'A combinar'}\n💰 *Total:* ${formatCurrency(pedido.total)} (${formaPag})\n🍽️ *Itens:* ${pedido.resumoItens || 'Marmita'}\n\nPoderiam confirmar o recebimento? Obrigado!`;
    const url = `https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const corFundoEfetiva = config.corFundo || '#020617';
  const corBotoesEfetiva = config.corBotoes || '#f59e0b';
  const corPrimariaEfetiva = config.corPrimaria || '#e11d48';

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950"
      style={{ backgroundColor: corFundoEfetiva }}
    >
      {/* Barra de Notificação Superior */}
      <div
        className="px-4 py-2 text-center text-xs font-semibold text-slate-950 flex items-center justify-center gap-2 shadow-xs"
        style={{ backgroundColor: corBotoesEfetiva }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Cardápio Oficial Delivery — Faça seu pedido online com entrega rápida e quentinha!</span>
      </div>

      {/* Header Principal do Restaurante */}
      <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Logo e Nome */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0 border border-white/20"
                  style={{ backgroundColor: corPrimariaEfetiva }}
                >
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt={config.nomeRestaurante || 'Logo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UtensilsCrossed className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
                      {config.nomeRestaurante || 'RESTAURANTE KERO'}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aberto
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" /> 30-45 min
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {config.enderecoRestaurante || 'Entrega em domicílio'}
                      {config.cep ? ` (${config.cep})` : ''}
                    </span>
                  </p>
                </div>
              </div>

              {/* Botão da Sacola para mobile */}
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setEtapaCheckout('sacola');
                    setCarrinhoAberto(true);
                  }}
                  className="relative p-2.5 rounded-xl text-slate-950 font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                  style={{ backgroundColor: corBotoesEfetiva }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItens > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-950 text-white font-mono">
                      {totalItens}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Barra de Pesquisa Integrada no Header */}
            <div className="flex-1 max-w-xl mx-auto w-full">
              <div className="relative">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar carnes do dia, saladas, bebidas, marmitas..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    if (e.target.value.trim().length > 0 && categoriaAtiva === 'destaques') {
                      setCategoriaAtiva('todos');
                    }
                  }}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Ações à direita */}
            <div className="hidden md:flex items-center gap-2.5">
              {pedidoAtivo && (
                <button
                  type="button"
                  onClick={() => setCarrinhoAberto(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
                >
                  <Motorbike className="w-4 h-4 text-amber-400" />
                  Pedido #{pedidoAtivo.numero}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEtapaCheckout('sacola');
                  setCarrinhoAberto(true);
                }}
                className="relative px-4 py-2.5 rounded-xl text-slate-950 font-extrabold transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-2.5"
                style={{ backgroundColor: corBotoesEfetiva }}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="text-xs font-extrabold">Sacola</span>
                {totalItens > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-white font-mono font-bold">
                    {totalItens} · {formatCurrency(subtotalSacola)}
                  </span>
                )}
              </button>

              {onIrParaLogin && (
                <button
                  type="button"
                  onClick={onIrParaLogin}
                  title="Acesso de Funcionários"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Subheader: Opções de Seleção de Categorias no Topo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-none border-t border-slate-800/80 mt-2.5">
            {[
              { id: 'destaques', label: '🏠 Destaques de Hoje' },
              { id: 'produtos', label: '🛍️ Produtos (Bebidas, Doces & Saladas)' },
              { id: 'todos', label: '🔥 Cardápio Completo' },
              { id: 'marmitas', label: '🍱 Marmitas na Brasa' },
              { id: 'carnes', label: '🥩 Carnes de Hoje' },
              { id: 'saladas', label: '🥗 Saladas Frescas' },
              { id: 'bebidas', label: '🥤 Bebidas & Água' },
              { id: 'doces', label: '🍬 Doces & Sobremesas' },
              { id: 'porcoes', label: '🍲 Porções' },
              { id: 'acompanhamentos', label: '🍚 Guarnições' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoriaAtiva(cat.id);
                  if (cat.id === 'destaques') setBusca('');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all shrink-0 ${
                  categoriaAtiva === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal — Ocupando mais espaço da tela */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Banner de Pedido em Andamento (Se houver) */}
        {pedidoAtivo && pedidoAtivo.status !== 'entregue' && pedidoAtivo.status !== 'cancelado' && (
          <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Pedido em Andamento: #{pedidoAtivo.numero}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {pedidoAtivo.status === 'novo' && 'Pedido recebido! Aguardando confirmação'}
                {pedidoAtivo.status === 'em_preparo' && 'Na cozinha! Sua marmita está sendo montada'}
                {pedidoAtivo.status === 'pronto' && 'Pedido pronto! Aguardando motoboy'}
                {pedidoAtivo.status === 'saiu_para_entrega' && `A caminho! Motoboy ${pedidoAtivo.entregadorNome || 'RESTAURANTE KERO'}`}
              </h3>
              <p className="text-xs text-slate-300">
                Endereço: {pedidoAtivo.enderecoEntrega} · Total: {formatCurrency(pedidoAtivo.total)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleEnviarMsgWhatsApp(pedidoAtivo)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp do Restaurante
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('ultimoPedidoDeliveryId');
                  setPedidoAtivoId(null);
                  setPedidoAtivo(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline px-2 py-1"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* MODO HOME / DESTAQUES DE HOJE: Vitrine Visual Grande com Fotos Individuais */}
        {categoriaAtiva === 'destaques' && !busca.trim() && (
          <div className="space-y-10">
            {/* Hero Cardápio / Montar Marmita Banner Especial */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-white/10">
              {/* Imagem de Fundo do Banner Configurado */}
              <div className="absolute inset-0 z-0">
                <img
                  src={config.bannerUrl || IMAGENS_PADRAO.porcaoChurrasco}
                  alt={config.nomeRestaurante || 'Banner do Restaurante'}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40"
                  style={{ backdropFilter: 'blur(2px)' }}
                />
              </div>

              <div className="relative z-10 max-w-2xl space-y-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-xs font-bold border border-white/10"
                  style={{ color: corBotoesEfetiva }}
                >
                  <Flame className="w-4 h-4" /> Especialidade {config.nomeRestaurante || 'RESTAURANTE KERO'}
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight text-white drop-shadow-md">
                  Marmitas na Brasa & Carnes do Dia
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl drop-shadow-sm">
                  Escolha o tamanho (Pequena, Média ou Grande), cortes nobres assados na brasa hoje ({DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey)?.nomeCompleto}),
                  arroz soltinho, feijão especial e acompanhamentos fresquinhos.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalMarmitaAberto(true)}
                    className="px-6 py-3.5 rounded-xl text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95 border border-white/20"
                    style={{ backgroundColor: corBotoesEfetiva }}
                  >
                    <Plus className="w-4 h-4" />
                    Montar Minha Marmita (A partir de {formatCurrency(config.precoMarmitaP || 16)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoriaAtiva('todos')}
                    className="px-4 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-colors border border-white/10"
                  >
                    Ver Cardápio Completo
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: CARNES DO DIA NA BRASA (Fotos Grandes para cada corte) */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white font-display flex items-center gap-2.5">
                    <Flame className="w-6 h-6 text-amber-400" />
                    Carnes na Brasa de Hoje ({DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey)?.nomeCompleto})
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Carnes assadas no ponto certo hoje. Marmita Pequena: 1 carne inclusa. Marmita Média e Grande: 1 inclusa ou 2 normais (+R$ 2,00).
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3.5 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                  Escala de {DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey)?.label}
                </span>
              </div>

              {carnesDoDia.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm">
                  Consulte os cortes especiais do dia com a nossa equipe.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {carnesDoDia.map((carne) => {
                    const imgCarne = getImagemProduto(carne);
                    return (
                      <div
                        key={carne.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-amber-500/50 hover:shadow-xl hover:shadow-black/60 transition-all"
                      >
                        <div>
                          {/* Imagem Grande em Destaque */}
                          <div className="h-48 sm:h-52 bg-slate-950 relative overflow-hidden">
                            <img
                              src={imgCarne}
                              alt={carne.nome}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                            <div className="absolute top-3 left-3 flex flex-col gap-1">
                              <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-bold text-amber-400 flex items-center gap-1 border border-amber-500/30">
                                <Flame className="w-3.5 h-3.5" /> Na Brasa
                              </span>
                              {carne.ehEspecial && (
                                <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 backdrop-blur-xs text-[11px] font-bold text-purple-300 border border-purple-500/40">
                                  🔥 Mista Especial (+R$ 2,00)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                              {carne.nome}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {carne.descricao || 'Carne nobre selecionada e grelhada na brasa com tempero artesanal.'}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 pt-0 space-y-3">
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                            <span className="text-slate-400">Opção de Marmita:</span>
                            <span className="font-mono font-bold text-amber-400">
                              {carne.ehEspecial ? '+R$ 2,00 (Média/Grande)' : 'Inclusa no Preço'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMontarComCarne(carne)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                          >
                            <Flame className="w-4 h-4" />
                            Montar Marmita com esta Carne
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SEÇÃO 2: SALADAS FRESCAS & ARTESANAIS (Fotos Grandes para cada salada) */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white font-display flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                    Saladas Frescas & Leves
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Mix de folhas higienizadas, legumes frescos e azeite especial para o seu almoço.
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                  100% Fresco do Dia
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {produtosDisponiveis
                  .filter((p) => p.categoria === 'Saladas Avulsas' || p.nome.toLowerCase().includes('salada'))
                  .map((salada) => {
                    const imgSalada = getImagemProduto(salada);
                    return (
                      <div
                        key={salada.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-black/60 transition-all"
                      >
                        <div>
                          <div className="h-44 sm:h-48 bg-slate-950 relative overflow-hidden">
                            <img
                              src={imgSalada}
                              alt={salada.nome}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-bold text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                              <Sparkles className="w-3.5 h-3.5" /> Salada Fresca
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {salada.nome}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {salada.descricao || 'Mix de folhas verdes, tomate italiano, pepino crocante e tempero caseiro.'}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 pt-0 space-y-3">
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-xs text-slate-400">Preço:</span>
                            <span className="text-base font-mono font-extrabold text-amber-400">
                              {formatCurrency(salada.preco)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdicionarProduto(salada)}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar à Sacola
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* SEÇÃO 3: BEBIDAS GELADAS & ÁGUA MINERAL (Fotos Grandes para cada bebida) */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white font-display flex items-center gap-2.5">
                    <Package className="w-6 h-6 text-sky-400" />
                    Bebidas Geladas & Água Mineral
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Água sem gás, água com gás, refrigerantes em lata e garrafa trincando de gelados.
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3.5 py-1.5 bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded-full text-xs font-bold">
                  Bebidas Trincando
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {produtosDisponiveis
                  .filter((p) => p.categoria === 'Bebidas')
                  .slice(0, 8)
                  .map((bebida) => {
                    const imgBebida = getImagemProduto(bebida);
                    const semEstoque = bebida.estoque !== undefined && bebida.estoque <= 0;
                    return (
                      <div
                        key={bebida.id}
                        className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                          semEstoque
                            ? 'border-red-950/40 opacity-60'
                            : 'border-slate-800 hover:border-sky-500/50 hover:shadow-xl hover:shadow-black/60'
                        }`}
                      >
                        <div>
                          <div className="h-44 sm:h-48 bg-slate-950 relative overflow-hidden">
                            <img
                              src={imgBebida}
                              alt={bebida.nome}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-bold text-sky-400 flex items-center gap-1 border border-sky-500/30">
                                <Package className="w-3.5 h-3.5" /> Gelada
                              </span>
                              {bebida.estoque !== undefined && (
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                                    bebida.estoque > 0
                                      ? 'bg-slate-900/90 text-slate-300 border-slate-700'
                                      : 'bg-red-950/90 text-red-300 border-red-800'
                                  }`}
                                >
                                  {bebida.estoque > 0 ? `${bebida.estoque} un` : 'Esgotado'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            <h4 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                              {bebida.nome}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {bebida.descricao || 'Bebida bem gelada pronta para entrega.'}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 pt-0 space-y-3">
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-xs text-slate-400">Preço:</span>
                            <span className="text-base font-mono font-extrabold text-amber-400">
                              {formatCurrency(bebida.preco)}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={semEstoque}
                            onClick={() => handleAdicionarProduto(bebida)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            {semEstoque ? 'Esgotado' : 'Pedir Bebida'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* SEÇÃO 4: MARMITAS TRADICIONAIS */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white font-display flex items-center gap-2.5">
                    <UtensilsCrossed className="w-6 h-6 text-amber-400" />
                    Nossas Marmitas Tradicionais
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Tamanhos Pequena, Média e Grande para satisfazer todo tipo de fome.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    tam: 'Pequena' as const,
                    preco: config.precoMarmitaP || 16,
                    regras: '1 Carne Normal Inclusa · Não aceita carnes especiais',
                    desc: 'Marmita individual perfeita para uma refeição leve e nutritiva.',
                    img: IMAGENS_PADRAO.marmitaFrango,
                  },
                  {
                    tam: 'Média' as const,
                    preco: config.precoMarmitaM || 20,
                    regras: '1 ou 2 Carnes (2 normais: +R$ 2,00) · Aceita Especial',
                    desc: 'Nosso tamanho mais pedido, equilibrado e super bem servido.',
                    img: IMAGENS_PADRAO.marmitaPicanha,
                  },
                  {
                    tam: 'Grande' as const,
                    preco: config.precoMarmitaG || 25,
                    regras: '1 ou 2 Carnes (2 normais: +R$ 2,00) · Aceita Especial',
                    desc: 'Marmita caprichada para quem tem fome de verdade na hora do almoço.',
                    img: IMAGENS_PADRAO.porcaoChurrasco,
                  },
                ].map((item) => (
                  <div
                    key={item.tam}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-amber-500/50 hover:shadow-xl transition-all"
                  >
                    <div>
                      <div className="h-44 bg-slate-950 relative overflow-hidden">
                        <img
                          src={item.img}
                          alt={`Marmita ${item.tam}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-bold text-amber-400 border border-amber-500/30">
                          Marmita {item.tam}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h4 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                          Marmita {item.tam}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                        <div className="p-2 rounded-lg bg-slate-950 text-[11px] text-amber-300/90 font-medium border border-slate-800">
                          {item.regras}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 space-y-3">
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-xs text-slate-400">A partir de:</span>
                        <span className="text-lg font-mono font-extrabold text-amber-400">
                          {formatCurrency(item.preco)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTamMarmita(item.tam);
                          setModalMarmitaAberto(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                      >
                        <Flame className="w-4 h-4" />
                        Montar Marmita {item.tam}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* MODO CARDÁPIO COMPLETO OU RESULTADOS DE BUSCA */}
        {(categoriaAtiva !== 'destaques' || busca.trim().length > 0) && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-extrabold text-white font-display flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                  {busca.trim()
                    ? `Resultados para "${busca}"`
                    : categoriaAtiva === 'produtos'
                    ? 'Produtos (Bebidas, Sobremesas & Saladas Avulsas)'
                    : categoriaAtiva === 'todos'
                    ? 'Cardápio Completo'
                    : categoriaAtiva === 'marmitas'
                    ? 'Marmitas na Brasa'
                    : categoriaAtiva === 'carnes'
                    ? 'Carnes de Hoje'
                    : categoriaAtiva === 'saladas'
                    ? 'Saladas Frescas'
                    : categoriaAtiva === 'bebidas'
                    ? 'Bebidas & Água'
                    : categoriaAtiva === 'porcoes'
                    ? 'Porções'
                    : categoriaAtiva === 'doces'
                    ? 'Doces & Sobremesas'
                    : 'Cardápio'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  {produtosFiltrados.length} itens encontrados para entrega imediata
                </p>
              </div>

              {busca && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca('');
                    setCategoriaAtiva('destaques');
                  }}
                  className="text-xs text-amber-400 hover:underline self-start sm:self-auto"
                >
                  Voltar aos Destaques
                </button>
              )}
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-base font-bold text-slate-300">
                  Nenhum prato encontrado com os termos pesquisados.
                </p>
                <p className="text-xs text-slate-400">
                  Experimente buscar por "marmita", "picanha", "coca", "salada" ou "água".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBusca('');
                    setCategoriaAtiva('destaques');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-colors"
                >
                  Ver Destaques de Hoje
                </button>
              </div>
            ) : categoriaAtiva === 'produtos' && !busca.trim() ? (
              /* EXIBIÇÃO DE PRODUTOS EM TÓPICOS DIFERENTES (Bebidas, Doces & Sobremesas, Saladas Avulsas) */
              <div className="space-y-10">
                {/* Tópico 1: Bebidas Geladas & Água */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        🥤
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          Bebidas Geladas & Água Mineral
                        </h4>
                        <p className="text-xs text-slate-400">
                          Refrigerantes de lata e 2L, sucos naturais e água para acompanhar sua refeição
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-blue-300 border border-slate-700">
                      {produtosFiltrados.filter((p) => p.categoria === 'Bebidas').length} itens
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {produtosFiltrados
                      .filter((p) => p.categoria === 'Bebidas')
                      .map((prod) => {
                        const imgProd = getImagemProduto(prod);
                        const esgotado = prod.estoque !== undefined && prod.estoque <= 0;
                        return (
                          <div
                            key={prod.id}
                            className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                              esgotado
                                ? 'border-red-950/40 opacity-70'
                                : 'border-slate-800/80 hover:border-amber-500/50 hover:shadow-xl hover:shadow-black/50'
                            }`}
                          >
                            <div>
                              <div className="w-full h-44 bg-slate-950 relative overflow-hidden">
                                <img
                                  src={imgProd}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-blue-300 border border-white/10">
                                  Bebida Gelada
                                </span>
                              </div>
                              <div className="p-4 space-y-2">
                                <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                                  {prod.nome}
                                </h4>
                                {prod.descricao && (
                                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                    {prod.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="p-4 pt-0 space-y-3">
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Preço:</span>
                                <span className="text-base font-extrabold text-amber-400 font-mono">
                                  {formatCurrency(prod.preco)}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={esgotado}
                                onClick={() => handleAdicionarProduto(prod)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                                  esgotado
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                {esgotado ? 'Esgotado' : 'Adicionar à Sacola'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Tópico 2: Doces & Sobremesas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                        🍰
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          Doces & Sobremesas Artesanais
                        </h4>
                        <p className="text-xs text-slate-400">
                          Pudins caseiros, doces em canudo, trufas e paçocas fresquinhas
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-pink-300 border border-slate-700">
                      {
                        produtosFiltrados.filter(
                          (p) =>
                            p.categoria === 'Doces e Sobremesas' ||
                            p.nome.toLowerCase().includes('doce') ||
                            p.nome.toLowerCase().includes('pudim') ||
                            p.nome.toLowerCase().includes('trufa') ||
                            p.nome.toLowerCase().includes('paçoca') ||
                            p.nome.toLowerCase().includes('canudo')
                        ).length
                      }{' '}
                      itens
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {produtosFiltrados
                      .filter(
                        (p) =>
                          p.categoria === 'Doces e Sobremesas' ||
                          p.nome.toLowerCase().includes('doce') ||
                          p.nome.toLowerCase().includes('pudim') ||
                          p.nome.toLowerCase().includes('trufa') ||
                          p.nome.toLowerCase().includes('paçoca') ||
                          p.nome.toLowerCase().includes('canudo')
                      )
                      .map((prod) => {
                        const imgProd = getImagemProduto(prod);
                        const esgotado = prod.estoque !== undefined && prod.estoque <= 0;
                        return (
                          <div
                            key={prod.id}
                            className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                              esgotado
                                ? 'border-red-950/40 opacity-70'
                                : 'border-slate-800/80 hover:border-pink-500/50 hover:shadow-xl hover:shadow-black/50'
                            }`}
                          >
                            <div>
                              <div className="w-full h-44 bg-slate-950 relative overflow-hidden">
                                <img
                                  src={imgProd}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-pink-300 border border-white/10">
                                  Sobremesa
                                </span>
                              </div>
                              <div className="p-4 space-y-2">
                                <h4 className="text-base font-bold text-white group-hover:text-pink-400 transition-colors">
                                  {prod.nome}
                                </h4>
                                {prod.descricao && (
                                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                    {prod.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="p-4 pt-0 space-y-3">
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Preço:</span>
                                <span className="text-base font-extrabold text-pink-400 font-mono">
                                  {formatCurrency(prod.preco)}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={esgotado}
                                onClick={() => handleAdicionarProduto(prod)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                                  esgotado
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                {esgotado ? 'Esgotado' : 'Adicionar à Sacola'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Tópico 3: Saladas Avulsas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        🥗
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          Saladas Avulsas & Frescas
                        </h4>
                        <p className="text-xs text-slate-400">
                          Saladas coloridas, vinagrete tradicional e folhas frescas temperadas
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                      {
                        produtosFiltrados.filter(
                          (p) =>
                            p.categoria === 'Saladas Avulsas' ||
                            p.nome.toLowerCase().includes('salada')
                        ).length
                      }{' '}
                      opções
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {produtosFiltrados
                      .filter(
                        (p) =>
                          p.categoria === 'Saladas Avulsas' ||
                          p.nome.toLowerCase().includes('salada')
                      )
                      .map((prod) => {
                        const imgProd = getImagemProduto(prod);
                        const esgotado = prod.estoque !== undefined && prod.estoque <= 0;
                        return (
                          <div
                            key={prod.id}
                            className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                              esgotado
                                ? 'border-red-950/40 opacity-70'
                                : 'border-slate-800/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-black/50'
                            }`}
                          >
                            <div>
                              <div className="w-full h-44 bg-slate-950 relative overflow-hidden">
                                <img
                                  src={imgProd}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-emerald-300 border border-white/10">
                                  Salada Fresca
                                </span>
                              </div>
                              <div className="p-4 space-y-2">
                                <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                                  {prod.nome}
                                </h4>
                                {prod.descricao && (
                                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                    {prod.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="p-4 pt-0 space-y-3">
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Preço:</span>
                                <span className="text-base font-extrabold text-emerald-400 font-mono">
                                  {formatCurrency(prod.preco)}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={esgotado}
                                onClick={() => handleAdicionarProduto(prod)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                                  esgotado
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                {esgotado ? 'Esgotado' : 'Adicionar à Sacola'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {produtosFiltrados.map((prod) => {
                  const imgProd = getImagemProduto(prod);
                  const esgotado = prod.estoque !== undefined && prod.estoque <= 0;
                  return (
                    <div
                      key={prod.id}
                      className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                        esgotado
                          ? 'border-red-950/40 opacity-70'
                          : 'border-slate-800/80 hover:border-amber-500/50 hover:shadow-xl hover:shadow-black/50'
                      }`}
                    >
                      <div>
                        {/* Imagem do Produto */}
                        <div className="w-full h-44 bg-slate-950 relative overflow-hidden">
                          <img
                            src={imgProd}
                            alt={prod.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-amber-300 border border-white/10">
                            {prod.categoria}
                          </span>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                            {prod.nome}
                          </h4>

                          {/* Badges de Estoque, Dias da Semana e Especial */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {prod.estoque !== undefined && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                  prod.estoque > 0
                                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                                    : 'bg-red-950 text-red-300 border-red-800'
                                }`}
                              >
                                <Package className="w-3 h-3 text-amber-400" />
                                {prod.estoque > 0 ? `${prod.estoque} un` : 'Esgotado'}
                              </span>
                            )}
                            {prod.ehEspecial && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                                Especial {prod.preco > 0 ? `(+${formatCurrency(prod.preco)})` : ''}
                              </span>
                            )}
                            {prod.exigeSegundaCarne && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                                Carne Mista (exige 2ª carne)
                              </span>
                            )}
                            {prod.diasSemana && prod.diasSemana.length > 0 && prod.diasSemana.length < 6 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800 text-[10px]">
                                <Calendar className="w-3 h-3 text-blue-400" />
                                {prod.diasSemana.map((d) => d.slice(0, 3)).join(', ')}
                              </span>
                            )}
                          </div>

                          {prod.descricao && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {prod.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-0 space-y-3">
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Preço:</span>
                          <span className="text-base font-extrabold text-amber-400 font-mono">
                            {prod.preco === 0 ? 'Incluso na Marmita' : formatCurrency(prod.preco)}
                          </span>
                        </div>

                        {prod.categoria === 'Marmitas' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (prod.nome.includes('Pequena')) setTamMarmita('Pequena');
                              else if (prod.nome.includes('Grande')) setTamMarmita('Grande');
                              else setTamMarmita('Média');
                              setModalMarmitaAberto(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Flame className="w-4 h-4" />
                            Montar Marmita
                          </button>
                        ) : prod.categoria === 'Porções' ? (
                          <button
                            type="button"
                            disabled={esgotado}
                            onClick={() => handleAbrirModalPorcao(prod)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Escolher Porção
                          </button>
                        ) : prod.categoria === 'Carnes' || prod.categoria === 'Carnes Especiais' ? (
                          <button
                            type="button"
                            onClick={() => handleMontarComCarne(prod)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Flame className="w-4 h-4" />
                            Montar Marmita com esta Carne
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={esgotado}
                            onClick={() => handleAdicionarProduto(prod)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                              esgotado
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            {esgotado ? 'Esgotado' : 'Adicionar à Sacola'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Botão Flutuante da Sacola (Mobile & Desktop) */}
      {totalItens > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={() => {
              setEtapaCheckout('sacola');
              setCarrinhoAberto(true);
            }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-sm transition-transform active:scale-98 border border-amber-400/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-mono text-xs">
                {totalItens}
              </div>
              <span>Ver Sacola Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-base">{formatCurrency(totalSacola)}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Modal / Drawer do Carrinho & Checkout */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col text-white shadow-2xl">
            {/* Topo do Carrinho */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-display">
                  {etapaCheckout === 'sacola' && 'Sua Sacola de Entrega'}
                  {etapaCheckout === 'dados' && 'Endereço e Contato'}
                  {etapaCheckout === 'pagamento' && 'Forma de Pagamento'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCarrinhoAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Dinâmico por Etapa */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {etapaCheckout === 'sacola' && (
                <>
                  {sacola.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400 font-medium">
                        Sua sacola está vazia.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCarrinhoAberto(false)}
                        className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
                      >
                        Escolher Pratos no Cardápio
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sacola.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-white">
                                {item.nome}
                              </h4>
                              {item.carnes && (
                                <p className="text-[11px] text-amber-300 font-medium">
                                  Carnes: {item.carnes}
                                </p>
                              )}
                              {item.acompanhamentos && (
                                <p className="text-[11px] text-slate-400 line-clamp-1">
                                  Acomp: {item.acompanhamentos}
                                </p>
                              )}
                              {item.observacao && (
                                <p className="text-[11px] text-slate-400 italic">
                                  Obs: {item.observacao}
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-bold text-amber-400 font-mono shrink-0">
                              {formatCurrency(item.valorUnitario * item.quantidade)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
                              <button
                                type="button"
                                onClick={() => handleAlterarQtdSacola(idx, -1)}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-800"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-mono font-bold px-1.5">
                                {item.quantidade}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAlterarQtdSacola(idx, 1)}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-800"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoverItemSacola(idx)}
                              className="text-red-400 hover:text-red-300 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Região de Entrega Prévia */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          Região de Entrega:
                        </label>
                        <select
                          value={regiaoSelecionadaId}
                          onChange={(e) => setRegiaoSelecionadaId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                        >
                          {regioesAtivas.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nome} (+{formatCurrency(r.taxa)} · ~{r.tempoEstimadoMin} min)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {etapaCheckout === 'dados' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      WhatsApp / Telefone com DDD *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 98765-4321"
                      value={telefoneCliente}
                      onChange={(e) => setTelefoneCliente(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      Usado para confirmação e contato do motoboy na entrega.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        Selecione a sua Rua / Bairro (Taxa de Entrega):
                      </span>
                      {taxaEntrega > 0 && (
                        <span className="text-amber-400 font-mono font-bold">
                          Taxa: {formatCurrency(taxaEntrega)}
                        </span>
                      )}
                    </label>
                    {regioesAtivas.length > 0 && (
                      <select
                        value={regiaoSelecionadaId}
                        onChange={(e) => {
                          setRegiaoSelecionadaId(e.target.value);
                          const reg = regioesAtivas.find((r) => r.id === e.target.value);
                          if (reg && !bairro) {
                            setBairro(reg.nome);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500 mb-1"
                      >
                        {regioesAtivas.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nome} — Taxa de Entrega: {formatCurrency(r.taxa)} (~{r.tempoEstimadoMin || 35} min)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Rua e Número da Residência *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Rua das Flores, 120"
                      value={ruaNumero}
                      onChange={(e) => setRuaNumero(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Bairro
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Centro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Apto / Bloco / Ref
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Apto 32"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Observações de Entrega (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Tocar o interfone, casa com portão cinza..."
                      value={observacaoGeral}
                      onChange={(e) => setObservacaoGeral(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {etapaCheckout === 'pagamento' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Como você deseja pagar?
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          id: 'pix',
                          label: 'PIX (Aprovação Instantânea)',
                          icon: QrCode,
                          desc: 'Chave CNPJ com código Copia e Cola',
                        },
                        {
                          id: 'cartao_credito',
                          label: 'Cartão na Entrega (Maquininha)',
                          icon: CreditCard,
                          desc: 'Débito ou Crédito levado pelo motoboy',
                        },
                        {
                          id: 'dinheiro',
                          label: 'Dinheiro na Entrega',
                          icon: Banknote,
                          desc: 'Pagamento em espécie com opção de troco',
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const ativo = formaPag === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormaPag(item.id as FormaPagamento)}
                            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                              ativo
                                ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 shrink-0 mt-0.5 ${
                                ativo ? 'text-amber-400' : 'text-slate-500'
                              }`}
                            />
                            <div>
                              <div className="text-xs font-bold text-white">
                                {item.label}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {item.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {formaPag === 'pix' && (
                    <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">
                          Chave PIX do Restaurante:
                        </span>
                        <button
                          type="button"
                          onClick={handleCopiarChavePix}
                          className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                        >
                          {pixCopiado ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copiar Chave
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg text-xs font-mono text-slate-200 break-all select-all">
                        {config.cnpj || '42.189.301/0001-90'}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Após finalizar, você pode enviar o comprovante diretamente no WhatsApp do restaurante.
                      </p>
                    </div>
                  )}

                  {formaPag === 'dinheiro' && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Precisa de troco para quanto? (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 50,00 ou 100,00"
                        value={precisaTrocoPara}
                        onChange={(e) => setPrecisaTrocoPara(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Resumo do Pedido antes de enviar */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-300">
                    <div className="font-semibold text-white mb-1">
                      Destino da Entrega:
                    </div>
                    <p className="text-slate-300 font-medium">{nomeCliente}</p>
                    <p className="text-slate-400">
                      {ruaNumero}{bairro ? `, ${bairro}` : ''}{complemento ? ` (${complemento})` : ''}
                    </p>
                    <p className="text-slate-400">Telefone: {telefoneCliente}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Carrinho com Totais e Botão de Ação */}
            {sacola.length > 0 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-200">
                      {formatCurrency(subtotalSacola)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega ({regiaoObj?.nome || 'Região'})</span>
                    <span className="font-mono text-slate-200">
                      {taxaEntrega > 0 ? formatCurrency(taxaEntrega) : 'Grátis'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                    <span>Total a Pagar</span>
                    <span className="font-mono text-amber-400 text-base">
                      {formatCurrency(totalSacola)}
                    </span>
                  </div>
                </div>

                {etapaCheckout === 'sacola' && (
                  <button
                    type="button"
                    onClick={() => setEtapaCheckout('dados')}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
                  >
                    <span>Continuar para Entrega</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {etapaCheckout === 'dados' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEtapaCheckout('sacola')}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!nomeCliente.trim() || !telefoneCliente.trim() || !ruaNumero.trim()}
                      onClick={() => setEtapaCheckout('pagamento')}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Escolher Pagamento</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {etapaCheckout === 'pagamento' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEtapaCheckout('dados')}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={enviandoPedido}
                      onClick={handleEnviarPedidoFinal}
                      className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all active:scale-98"
                    >
                      {enviandoPedido ? (
                        <span>Enviando Pedido...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Enviar Pedido ({formatCurrency(totalSacola)})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Interativo para Montar Marmita */}
      {modalMarmitaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col text-white shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display">
                    Montar Marmita Personalizada
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escolha tamanho, carnes na brasa e guarnições
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMarmitaAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* 1. Seleção do Dia da Semana */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  1. Dia do Cardápio Semanal:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {DIAS_DA_SEMANA.map((dia) => (
                    <button
                      key={dia.key}
                      type="button"
                      onClick={() => {
                        setDiaSelecionado(dia.key);
                        setCarnesEscolhidasIds([]);
                        setAvisoCarnesMarmita('');
                      }}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border ${
                        diaSelecionado === dia.key
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Escolha de Tamanho */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  2. Escolha o Tamanho da Marmita:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { tam: 'Pequena' as const, preco: config.precoMarmitaP || 16, desc: '1 Carne Normal' },
                    { tam: 'Média' as const, preco: config.precoMarmitaM || 20, desc: 'Até 2 Carnes' },
                    { tam: 'Grande' as const, preco: config.precoMarmitaG || 25, desc: 'Até 2 Carnes' },
                  ].map((t) => (
                    <button
                      key={t.tam}
                      type="button"
                      onClick={() => handleMudarTamMarmita(t.tam)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        tamMarmita === t.tam
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{t.tam}</div>
                      <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                        {formatCurrency(t.preco)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Seleção de Carne (Formato idêntico aos acompanhamentos: cards interativos) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                      3. Selecione a Carne ({DIAS_DA_SEMANA.find((d) => d.key === diaSelecionado)?.nomeCompleto}):
                    </label>
                    <p className="text-[11px] text-slate-400">
                      {tamMarmita === 'Pequena'
                        ? 'Marmita Pequena: escolha apenas 1 carne tradicional inclusa.'
                        : 'Marmita Média/Grande: 1 carne inclusa. Deseja 2 carnes normais? Adicional de +R$ 2,00.'}
                    </p>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800 shrink-0">
                    {carnesEscolhidasIds.length} / {tamMarmita === 'Pequena' ? '1' : '2'} carnes
                  </span>
                </div>

                {/* A. Carnes Tradicionais do Dia */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    🥩 Carnes Tradicionais ({DIAS_DA_SEMANA.find((d) => d.key === diaSelecionado)?.label}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {carnesNormaisModal.map((carne) => {
                      const marcado = carnesEscolhidasIds.includes(carne.id);
                      return (
                        <button
                          key={carne.id}
                          type="button"
                          onClick={() => toggleCarneCliente(carne)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                            marcado
                              ? 'bg-amber-500/15 border-amber-500 text-white font-bold shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                marcado
                                  ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                                  : 'border-slate-700 bg-slate-900'
                              }`}
                            >
                              {marcado && '✓'}
                            </div>
                            <span>{carne.nome}</span>
                          </div>
                          {carne.preco > 0 ? (
                            <span className="text-[11px] text-amber-400 font-mono font-bold">
                              +{formatCurrency(carne.preco)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Incluso</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* B. Carnes Especiais (Feijoada / Costela) */}
                {carnesEspeciaisModal.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                        🔥 Carnes Especiais ({DIAS_DA_SEMANA.find((d) => d.key === diaSelecionado)?.label}):
                      </span>
                      {tamMarmita === 'Pequena' ? (
                        <span className="text-[10px] text-red-400 font-semibold">
                          * Indisponível na Pequena (requer Média ou Grande)
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Carne Especial
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {carnesEspeciaisModal.map((carne) => {
                        const marcado = carnesEscolhidasIds.includes(carne.id);
                        const jaTemOutraEspecial = temCarneEspecial && !marcado;
                        const desabilitada = tamMarmita === 'Pequena' || jaTemOutraEspecial;
                        return (
                          <button
                            key={carne.id}
                            type="button"
                            disabled={desabilitada}
                            onClick={() => toggleCarneCliente(carne)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                              desabilitada
                                ? 'opacity-40 bg-slate-950 border-slate-800/60 cursor-not-allowed text-slate-500'
                                : marcado
                                ? 'bg-purple-950/40 border-purple-500 text-purple-200 font-bold shadow-sm'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                  marcado
                                    ? 'bg-purple-500 border-purple-500 text-white font-bold'
                                    : 'border-slate-700 bg-slate-900'
                                }`}
                              >
                                {marcado && '✓'}
                              </div>
                              <span>{carne.nome}</span>
                            </div>
                            <span className="text-[10px] text-purple-300 font-semibold">
                              Especial
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Avisos dinâmicos */}
                {avisoCarnesMarmita && (
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{avisoCarnesMarmita}</span>
                  </div>
                )}

                {temDuasCarnesNormais && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>2 Carnes Normais Selecionadas:</strong> Adicional de R$ 2,00 aplicado com sucesso no total da marmita.
                    </span>
                  </div>
                )}

                {temCarneEspecial && carnesEscolhidasIds.length === 1 && (
                  <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Carne Especial Selecionada:</strong> Você pode adicionar uma segunda carne normal ou manter apenas esta carne especial.
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Acompanhamentos (Guarnições Diárias) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  5. Acompanhamentos & Guarnições Diárias:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Arroz',
                    'Feijão',
                    'Macarrão',
                    'Salada',
                    'Farofa',
                    'Batata',
                    'Legumes',
                  ].map((nomeAcomp) => {
                    const marcado = acompEscolhidos.includes(nomeAcomp);
                    return (
                      <label
                        key={nomeAcomp}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          marcado
                            ? 'bg-amber-500/15 border-amber-500 text-white font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAcompEscolhidos((prev) => [...prev, nomeAcomp]);
                            } else {
                              setAcompEscolhidos((prev) =>
                                prev.filter((n) => n !== nomeAcomp)
                              );
                            }
                          }}
                          className="rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                        />
                        <span className="truncate">{nomeAcomp}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Observações da Marmita */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Observações para a Marmita:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sem cebola, feijão por cima do arroz, farofa separada..."
                  value={obsMarmita}
                  onChange={(e) => setObsMarmita(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Preço da Marmita:</span>
                <span className="text-lg font-extrabold text-amber-400 font-mono">
                  {formatCurrency(precoTotalMarmita)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAdicionarMarmita}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Adicionar à Sacola
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interativo para Escolher Carne ou Acompanhamento na Porção */}
      {modalPorcaoAberto && porcaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col text-white shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display">
                    {porcaoSelecionada.nome}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escolha se deseja uma Carne do Dia ou um Acompanhamento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPorcaoAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Opção: Carne do Dia OU Acompanhamento */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  1. O que você deseja nesta porção?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoItemPorcao('carne');
                      setItemPorcaoEscolhido(carnesDoDia[0]?.nome || '');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      tipoItemPorcao === 'carne'
                        ? 'bg-amber-500/15 border-amber-500 text-white font-bold shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    🥩 Carne do Dia
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoItemPorcao('acompanhamento');
                      setItemPorcaoEscolhido('Arroz');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      tipoItemPorcao === 'acompanhamento'
                        ? 'bg-amber-500/15 border-amber-500 text-white font-bold shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    🍚 Acompanhamento
                  </button>
                </div>
              </div>

              {/* Lista se escolheu Carne */}
              {tipoItemPorcao === 'carne' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    2. Escolha a Carne ({DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey)?.nomeCompleto}):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {carnesDoDia.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setItemPorcaoEscolhido(c.nome)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          itemPorcaoEscolhido === c.nome
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{c.nome}</span>
                        {itemPorcaoEscolhido === c.nome && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista se escolheu Acompanhamento */}
              {tipoItemPorcao === 'acompanhamento' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    2. Escolha o Acompanhamento:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Arroz',
                      'Feijão',
                      'Macarrão',
                      'Salada',
                      'Farofa',
                      'Batata',
                      'Legumes',
                    ].map((acomp) => (
                      <button
                        key={acomp}
                        type="button"
                        onClick={() => setItemPorcaoEscolhido(acomp)}
                        className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                          itemPorcaoEscolhido === acomp
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {acomp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações da Porção */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Observações para a Porção (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ponto da carne bem passado, pouco sal..."
                  value={obsPorcao}
                  onChange={(e) => setObsPorcao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Total da Porção:</span>
                <span className="text-lg font-extrabold text-amber-400 font-mono">
                  {formatCurrency(porcaoSelecionada.preco)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmarPorcao}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Adicionar à Sacola
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé do Portal com Endereço, CEP e Redes Sociais */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 space-y-3">
          <p className="font-bold text-sm text-slate-300">
            {config.nomeRestaurante || 'RESTAURANTE KERO'} — Marmitas na Brasa & Delivery Oficial
          </p>
          <p className="text-slate-400">
            {config.enderecoRestaurante || 'Atendimento Delivery'}
            {config.cep ? ` · CEP ${config.cep}` : ''}
            {config.telefoneRestaurante ? ` · Contato: ${config.telefoneRestaurante}` : ''}
          </p>

          {/* Links para Redes Sociais */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-900">
            {config.instagram && (
              <a
                href={
                  config.instagram.startsWith('http')
                    ? config.instagram
                    : `https://instagram.com/${config.instagram.replace('@', '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 transition-colors font-medium text-xs"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{config.instagram.startsWith('@') ? config.instagram : `@${config.instagram}`}</span>
              </a>
            )}

            {config.facebook && (
              <a
                href={
                  config.facebook.startsWith('http')
                    ? config.facebook
                    : `https://facebook.com/${config.facebook}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors font-medium text-xs"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
            )}

            {(config.whatsapp || config.telefoneRestaurante) && (
              <button
                type="button"
                onClick={() => {
                  const tel = (config.whatsapp || config.telefoneRestaurante || '').replace(/\D/g, '');
                  if (tel) {
                    window.open(`https://api.whatsapp.com/send?phone=55${tel}`, '_blank');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors font-medium text-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: {config.whatsapp || config.telefoneRestaurante}</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-600 pt-2">
            Sistema de Autoatendimento Delivery · CNPJ: {config.cnpj || '00.000.000/0001-00'} · Pedidos em Tempo Real
          </p>
        </div>
      </footer>
    </div>
  );
};

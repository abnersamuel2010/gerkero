import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDocs,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  ConfiguracaoRestaurante,
  Produto,
  Categoria,
  Mesa,
  Comanda,
  ItemComanda,
  Pedido,
  ItemPedido,
  Pagamento,
  Caixa,
  MovimentacaoCaixa,
  Entregador,
  Entrega,
  RegiaoEntrega,
  PedidoCozinha,
  Usuario,
  Cliente,
  LogAuditoria,
} from '../types';
import { registrarLogAuditoria } from './authService';
import { PRODUTOS_OFICIAIS } from '../data/cardapioOficial';

// Imagens geradas do restaurante
import imgMarmitaPicanha from '../assets/images/marmita_executiva_picanha_1790819586479.jpg';
import imgMarmitaFrango from '../assets/images/marmita_frango_grelhado_1790819596080.jpg';
import imgPorcaoChurrasco from '../assets/images/porcao_churrasco_misto_1790819607035.jpg';
import imgBuffetHero from '../assets/images/buffet_self_service_hero_1790819616593.jpg';
import imgSaladaFresca from '../assets/images/salada_fresca_artesanal_1791336805166.jpg';
import imgBebidasGeladas from '../assets/images/bebidas_geladas_refri_1791336818190.jpg';
import imgCarnesGrelhadas from '../assets/images/carnes_grelhadas_brasa_1791336832609.jpg';

export const IMAGENS_PADRAO = {
  marmitaPicanha: imgMarmitaPicanha,
  marmitaFrango: imgMarmitaFrango,
  porcaoChurrasco: imgPorcaoChurrasco,
  buffetHero: imgBuffetHero,
  saladaFresca: imgSaladaFresca,
  bebidasGeladas: imgBebidasGeladas,
  carnesGrelhadas: imgCarnesGrelhadas,
};

export const CONFIG_PADRAO: ConfiguracaoRestaurante = {
  id: 'geral',
  nomeRestaurante: 'RESTAURANTE KERO',
  telefoneRestaurante: '(11) 98765-4321',
  enderecoRestaurante: 'Av. Paulista, 1500 - Centro, São Paulo - SP',
  cnpj: '42.189.301/0001-90',
  precoMarmitaP: 16,
  precoMarmitaM: 20,
  precoMarmitaG: 25,
  precoBuffetAdulto: 30,
  precoBuffetCrianca: 20,
  precoBuffetKilo: 69.9,
  atualizadoEm: new Date().toISOString(),
};

export function subscribeCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const list: T[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<T, 'id'>),
      })) as T[];
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  );
}

export function subscribeDocument<T>(
  collectionName: string,
  docId: string,
  onData: (item: T | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, collectionName, docId),
    (snapshot) => {
      if (snapshot.exists()) {
        onData({ id: snapshot.id, ...(snapshot.data() as Omit<T, 'id'>) } as T);
      } else {
        onData(null);
      }
    },
    (error) => {
      console.warn(`Erro ao monitorar documento ${collectionName}/${docId}:`, error);
    }
  );
}

export async function inicializarDadosDemonstracao(): Promise<void> {
  const agora = new Date().toISOString();
  try {
    // 1. Configuração Geral
    await setDoc(doc(db, 'configuracoes', 'geral'), {
      nomeRestaurante: CONFIG_PADRAO.nomeRestaurante,
      telefoneRestaurante: CONFIG_PADRAO.telefoneRestaurante,
      enderecoRestaurante: CONFIG_PADRAO.enderecoRestaurante,
      cnpj: CONFIG_PADRAO.cnpj,
      precoMarmitaP: CONFIG_PADRAO.precoMarmitaP,
      precoMarmitaM: CONFIG_PADRAO.precoMarmitaM,
      precoMarmitaG: CONFIG_PADRAO.precoMarmitaG,
      precoBuffetAdulto: CONFIG_PADRAO.precoBuffetAdulto,
      precoBuffetCrianca: CONFIG_PADRAO.precoBuffetCrianca,
      precoBuffetKilo: CONFIG_PADRAO.precoBuffetKilo,
      atualizadoEm: agora,
    });

    // 2. Categorias
    const categoriasSeed: Omit<Categoria, 'id'>[] = [
      { nome: 'Marmitas', ordem: 1, ativo: true, criadoEm: agora },
      { nome: 'Carnes', ordem: 2, ativo: true, criadoEm: agora },
      { nome: 'Carnes Especiais', ordem: 3, ativo: true, criadoEm: agora },
      { nome: 'Acompanhamentos', ordem: 4, ativo: true, criadoEm: agora },
      { nome: 'Bebidas', ordem: 5, ativo: true, criadoEm: agora },
      { nome: 'Porções', ordem: 6, ativo: true, criadoEm: agora },
      { nome: 'Adicionais', ordem: 7, ativo: true, criadoEm: agora },
      { nome: 'Buffet', ordem: 8, ativo: true, criadoEm: agora },
      { nome: 'Outros', ordem: 9, ativo: true, criadoEm: agora },
    ];
    for (let i = 0; i < categoriasSeed.length; i++) {
      await setDoc(doc(db, 'categorias', `cat_${i + 1}`), categoriasSeed[i]);
    }

    // 3. Produtos (sempre nomes oficiais limpos sem etiqueta [Demo])
    const produtosSeed: { id: string; data: Omit<Produto, 'id'> }[] = [
      {
        id: 'prod_marmita_picanha',
        data: {
          nome: 'Marmita Executiva Picanha na Brasa',
          categoria: 'Marmitas',
          descricao: 'Acompanha arroz soltinho, feijão tropeiro, farofa crocante e vinagrete fresco.',
          preco: 28.0,
          imagemUrl: imgMarmitaPicanha,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_marmita_frango',
        data: {
          nome: 'Marmita Filé de Frango Grelhado',
          categoria: 'Marmitas',
          descricao: 'Filé de frango grelhado dourado, arroz, feijão, batata-doce assada e brócolis.',
          preco: 23.0,
          imagemUrl: imgMarmitaFrango,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_carne_frango',
        data: {
          nome: 'Filé de Frango Grelhado',
          categoria: 'Carnes',
          descricao: 'Peito de frango temperado na chapa.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_carne_bife',
        data: {
          nome: 'Bife Acebolado de Alcatra',
          categoria: 'Carnes',
          descricao: 'Alcatra macia grelhada com cebolas caramelizadas.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_carne_linguica',
        data: {
          nome: 'Linguiça Toscana na Brasa',
          categoria: 'Carnes',
          descricao: 'Linguiça suína artesanal assada na brasa.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_carne_esp_picanha',
        data: {
          nome: 'Picanha Maturada na Brasa (+R$ 6,00)',
          categoria: 'Carnes Especiais',
          descricao: 'Corte nobre de picanha assado na churrasqueira.',
          preco: 6.0,
          imagemUrl: imgMarmitaPicanha,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_carne_esp_parmegiana',
        data: {
          nome: 'Filé Mignon à Parmegiana (+R$ 7,00)',
          categoria: 'Carnes Especiais',
          descricao: 'Empanado crocante com molho de tomate rústico e muçarela gratinada.',
          preco: 7.0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_acomp_arroz',
        data: {
          nome: 'Arroz Branco Soltinho',
          categoria: 'Acompanhamentos',
          descricao: 'Arroz tipo 1 temperado com alho.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_acomp_feijao',
        data: {
          nome: 'Feijão Carioca Caseiro',
          categoria: 'Acompanhamentos',
          descricao: 'Feijão cozido no dia com tempero da casa.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_acomp_tropeiro',
        data: {
          nome: 'Feijão Tropeiro Mineiro',
          categoria: 'Acompanhamentos',
          descricao: 'Feijão com farinha, bacon, calabresa e couve.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_acomp_farofa',
        data: {
          nome: 'Farofa Crocante na Manteiga',
          categoria: 'Acompanhamentos',
          descricao: 'Farofa dourada com cebola crocante.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_acomp_fritas',
        data: {
          nome: 'Batata Frita Sequínha',
          categoria: 'Acompanhamentos',
          descricao: 'Batatas fritas na hora.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_acomp_macarrao',
        data: {
          nome: 'Espaguete ao Alho e Óleo',
          categoria: 'Acompanhamentos',
          descricao: 'Massa al dente salteada no azeite e alho.',
          preco: 0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_adic_ovo',
        data: {
          nome: 'Ovo Frito Caipira',
          categoria: 'Adicionais',
          descricao: 'Unidade de ovo frito na manteiga.',
          preco: 3.5,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_adic_queijo',
        data: {
          nome: 'Queijo Coalho Assado',
          categoria: 'Adicionais',
          descricao: 'Espetinho de queijo coalho dourado na brasa.',
          preco: 8.0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: true,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_porcao_churrasco',
        data: {
          nome: 'Tábua Churrasco Misto na Brasa (Serve 3)',
          categoria: 'Porções',
          descricao: 'Picanha fatiada, linguiça artesanal, mandioca frita crocante, farofa e vinagrete.',
          preco: 89.9,
          imagemUrl: imgPorcaoChurrasco,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_beb_coca_lata',
        data: {
          nome: 'Refrigerante Coca-Cola Lata 350ml',
          categoria: 'Bebidas',
          descricao: 'Gelada 350ml.',
          preco: 7.0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_beb_coca_2l',
        data: {
          nome: 'Coca-Cola 2 Litros',
          categoria: 'Bebidas',
          descricao: 'Garrafa 2L gelada para família.',
          preco: 16.0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_beb_suco_laranja',
        data: {
          nome: 'Suco Natural de Laranja 500ml',
          categoria: 'Bebidas',
          descricao: 'Espremido na hora, sem conservantes.',
          preco: 11.0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
      {
        id: 'prod_buffet_sobremesa',
        data: {
          nome: 'Pudim de Leite Condensado Caseiro',
          categoria: 'Outros',
          descricao: 'Fatia generosa com calda de caramelo.',
          preco: 10.0,
          disponivel: true,
          ativo: true,
          ehDadoDemonstracao: false,
          criadoEm: agora,
          atualizadoEm: agora,
        },
      },
    ];

    for (const p of produtosSeed) {
      await setDoc(doc(db, 'produtos', p.id), p.data);
    }

    // 4. Regiões de Entrega
    const regioesSeed: { id: string; data: Omit<RegiaoEntrega, 'id'> }[] = [
      {
        id: 'reg_a',
        data: {
          nome: 'Região A — Centro / Até 2km',
          taxa: 6.0,
          tempoEstimadoMin: 25,
          ativo: true,
          criadoEm: agora,
        },
      },
      {
        id: 'reg_b',
        data: {
          nome: 'Região B — Bairros Próximos / 2 a 5km',
          taxa: 8.0,
          tempoEstimadoMin: 35,
          ativo: true,
          criadoEm: agora,
        },
      },
      {
        id: 'reg_c',
        data: {
          nome: 'Região C — Zona Expandida / 5 a 9km',
          taxa: 10.0,
          tempoEstimadoMin: 50,
          ativo: true,
          criadoEm: agora,
        },
      },
    ];
    for (const r of regioesSeed) {
      await setDoc(doc(db, 'regioesEntrega', r.id), r.data);
    }

    // 5. Mesas (1 a 12)
    for (let num = 1; num <= 12; num++) {
      await setDoc(doc(db, 'mesas', `mesa_${num}`), {
        numero: num,
        status: 'livre',
        capacidade: num <= 6 ? 4 : num <= 10 ? 6 : 8,
        pessoas: 0,
        atualizadoEm: agora,
      });
    }

    // 6. Entregadores Oficiais
    const entregadoresSeed: { id: string; data: Omit<Entregador, 'id'> }[] = [
      {
        id: 'ent_1',
        data: {
          nome: 'Marcos Oliveira',
          telefone: '(11) 99111-2233',
          status: 'disponivel',
          veiculo: 'Honda CG 160 Titan - Preta',
          entregasRealizadas: 4,
          criadoEm: agora,
        },
      },
      {
        id: 'ent_2',
        data: {
          nome: 'Rafael Santos',
          telefone: '(11) 99444-5566',
          status: 'disponivel',
          veiculo: 'Yamaha Factor 150 - Vermelha',
          entregasRealizadas: 2,
          criadoEm: agora,
        },
      },
    ];
    for (const e of entregadoresSeed) {
      await setDoc(doc(db, 'entregadores', e.id), e.data);
    }

    await registrarLogAuditoria(
      'Carga de Dados de Demonstração',
      'Cardápio inicial, regiões de entrega (A, B, C), 12 mesas e entregadores de demonstração configurados no Firestore.'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_demonstracao');
  }
}

export async function sincronizarCardapioCompletoOficial(): Promise<void> {
  const agora = new Date().toISOString();
  try {
    // 1. Atualizar Configuração Geral com preços oficiais de marmitas e buffet e nome oficial do restaurante
    await setDoc(
      doc(db, 'configuracoes', 'geral'),
      {
        nomeRestaurante: 'RESTAURANTE KERO',
        precoMarmitaP: 16,
        precoMarmitaM: 20,
        precoMarmitaG: 25,
        precoBuffetAdulto: 30,
        precoBuffetCrianca: 20,
        precoBuffetKilo: 69.9,
        atualizadoEm: agora,
      },
      { merge: true }
    );

    // 2. Gravar todos os produtos oficiais (Marmitas, Bebidas com estoque, Porções, Doces com estoque, Saladas e Carnes da semana)
    for (const p of PRODUTOS_OFICIAIS) {
      await setDoc(doc(db, 'produtos', p.id), p.data);
    }

    await registrarLogAuditoria(
      'Atualização do Cardápio Oficial',
      'Cardápio semanal oficial sincronizado com sucesso no Cloud Firestore.'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'sincronizar_cardapio_oficial');
  }
}

export async function inicializarBancoDeDadosReal(
  incluirCardapioRealCompleto = true
): Promise<void> {
  const agora = new Date().toISOString();
  try {
    // 1. Configuração Oficial do Restaurante
    await setDoc(doc(db, 'configuracoes', 'geral'), {
      nomeRestaurante: CONFIG_PADRAO.nomeRestaurante,
      telefoneRestaurante: CONFIG_PADRAO.telefoneRestaurante,
      enderecoRestaurante: CONFIG_PADRAO.enderecoRestaurante,
      cnpj: CONFIG_PADRAO.cnpj,
      precoMarmitaP: CONFIG_PADRAO.precoMarmitaP,
      precoMarmitaM: CONFIG_PADRAO.precoMarmitaM,
      precoMarmitaG: CONFIG_PADRAO.precoMarmitaG,
      precoBuffetAdulto: CONFIG_PADRAO.precoBuffetAdulto,
      precoBuffetCrianca: CONFIG_PADRAO.precoBuffetCrianca,
      precoBuffetKilo: CONFIG_PADRAO.precoBuffetKilo,
      atualizadoEm: agora,
    });

    // 2. Categorias Oficiais
    const categoriasOficiais: Omit<Categoria, 'id'>[] = [
      { nome: 'Marmitas', ordem: 1, ativo: true, criadoEm: agora },
      { nome: 'Carnes', ordem: 2, ativo: true, criadoEm: agora },
      { nome: 'Carnes Especiais', ordem: 3, ativo: true, criadoEm: agora },
      { nome: 'Acompanhamentos', ordem: 4, ativo: true, criadoEm: agora },
      { nome: 'Bebidas', ordem: 5, ativo: true, criadoEm: agora },
      { nome: 'Porções', ordem: 6, ativo: true, criadoEm: agora },
      { nome: 'Doces e Sobremesas', ordem: 7, ativo: true, criadoEm: agora },
      { nome: 'Saladas Avulsas', ordem: 8, ativo: true, criadoEm: agora },
      { nome: 'Buffet', ordem: 9, ativo: true, criadoEm: agora },
      { nome: 'Adicionais', ordem: 10, ativo: true, criadoEm: agora },
      { nome: 'Outros', ordem: 11, ativo: true, criadoEm: agora },
    ];
    for (let i = 0; i < categoriasOficiais.length; i++) {
      await setDoc(doc(db, 'categorias', `cat_${i + 1}`), categoriasOficiais[i]);
    }

    // 3. Regiões de Entrega Oficiais
    const regioesOficiais: { id: string; data: Omit<RegiaoEntrega, 'id'> }[] = [
      {
        id: 'reg_a',
        data: {
          nome: 'Região A — Centro / Até 2km',
          taxa: 6.0,
          tempoEstimadoMin: 25,
          ativo: true,
          criadoEm: agora,
        },
      },
      {
        id: 'reg_b',
        data: {
          nome: 'Região B — Bairros Próximos / 2 a 5km',
          taxa: 8.0,
          tempoEstimadoMin: 35,
          ativo: true,
          criadoEm: agora,
        },
      },
      {
        id: 'reg_c',
        data: {
          nome: 'Região C — Zona Expandida / 5 a 9km',
          taxa: 10.0,
          tempoEstimadoMin: 50,
          ativo: true,
          criadoEm: agora,
        },
      },
    ];
    for (const r of regioesOficiais) {
      await setDoc(doc(db, 'regioesEntrega', r.id), r.data);
    }

    // 4. Mesas Oficiais do Salão (1 a 12)
    for (let num = 1; num <= 12; num++) {
      await setDoc(doc(db, 'mesas', `mesa_${num}`), {
        numero: num,
        status: 'livre',
        capacidade: num <= 6 ? 4 : num <= 10 ? 6 : 8,
        pessoas: 0,
        atualizadoEm: agora,
      });
    }

    // 5. Entregadores Oficiais
    const entregadoresOficiais: { id: string; data: Omit<Entregador, 'id'> }[] = [
      {
        id: 'ent_1',
        data: {
          nome: 'Marcos Oliveira',
          telefone: '(11) 99111-2233',
          status: 'disponivel',
          veiculo: 'Honda CG 160 Titan - Preta',
          entregasRealizadas: 0,
          criadoEm: agora,
        },
      },
      {
        id: 'ent_2',
        data: {
          nome: 'Rafael Santos',
          telefone: '(11) 99444-5566',
          status: 'disponivel',
          veiculo: 'Yamaha Factor 150 - Vermelha',
          entregasRealizadas: 0,
          criadoEm: agora,
        },
      },
    ];
    for (const e of entregadoresOficiais) {
      await setDoc(doc(db, 'entregadores', e.id), e.data);
    }

    // 6. Produtos Reais Oficiais (SEM tag de demonstração)
    if (incluirCardapioRealCompleto) {
      await sincronizarCardapioCompletoOficial();
    }
    if (false as boolean) {
      const produtosReais: { id: string; data: Omit<Produto, 'id'> }[] = [
        {
          id: 'prod_marmita_picanha',
          data: {
            nome: 'Marmita Executiva Picanha na Brasa',
            categoria: 'Marmitas',
            descricao: 'Acompanha arroz soltinho, feijão tropeiro, farofa crocante e vinagrete fresco.',
            preco: 28.0,
            imagemUrl: imgMarmitaPicanha,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_marmita_frango',
          data: {
            nome: 'Marmita Filé de Frango Grelhado',
            categoria: 'Marmitas',
            descricao: 'Filé de frango grelhado dourado, arroz, feijão, batata-doce assada e brócolis.',
            preco: 23.0,
            imagemUrl: imgMarmitaFrango,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_carne_frango',
          data: {
            nome: 'Filé de Frango Grelhado',
            categoria: 'Carnes',
            descricao: 'Peito de frango temperado na chapa.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_carne_bife',
          data: {
            nome: 'Bife Acebolado de Alcatra',
            categoria: 'Carnes',
            descricao: 'Alcatra macia grelhada com cebolas caramelizadas.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_carne_linguica',
          data: {
            nome: 'Linguiça Toscana na Brasa',
            categoria: 'Carnes',
            descricao: 'Linguiça suína artesanal assada na brasa.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_carne_esp_picanha',
          data: {
            nome: 'Picanha Maturada na Brasa (+R$ 6,00)',
            categoria: 'Carnes Especiais',
            descricao: 'Corte nobre de picanha assado na churrasqueira.',
            preco: 6.0,
            imagemUrl: imgMarmitaPicanha,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_carne_esp_parmegiana',
          data: {
            nome: 'Filé Mignon à Parmegiana (+R$ 7,00)',
            categoria: 'Carnes Especiais',
            descricao: 'Empanado crocante com molho de tomate rústico e muçarela gratinada.',
            preco: 7.0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_acomp_arroz',
          data: {
            nome: 'Arroz Branco Soltinho',
            categoria: 'Acompanhamentos',
            descricao: 'Arroz tipo 1 temperado com alho.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_acomp_feijao',
          data: {
            nome: 'Feijão Carioca Caseiro',
            categoria: 'Acompanhamentos',
            descricao: 'Feijão cozido no dia com tempero da casa.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_acomp_tropeiro',
          data: {
            nome: 'Feijão Tropeiro Mineiro',
            categoria: 'Acompanhamentos',
            descricao: 'Feijão com farinha, bacon, calabresa e couve.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_acomp_farofa',
          data: {
            nome: 'Farofa Crocante na Manteiga',
            categoria: 'Acompanhamentos',
            descricao: 'Farofa dourada com cebola crocante.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_acomp_fritas',
          data: {
            nome: 'Batata Frita Sequínha',
            categoria: 'Acompanhamentos',
            descricao: 'Batatas fritas na hora.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_acomp_macarrao',
          data: {
            nome: 'Espaguete ao Alho e Óleo',
            categoria: 'Acompanhamentos',
            descricao: 'Massa al dente salteada no azeite e alho.',
            preco: 0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_adic_ovo',
          data: {
            nome: 'Ovo Frito Caipira',
            categoria: 'Adicionais',
            descricao: 'Unidade de ovo frito na manteiga.',
            preco: 3.5,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_adic_queijo',
          data: {
            nome: 'Queijo Coalho Assado',
            categoria: 'Adicionais',
            descricao: 'Espetinho de queijo coalho dourado na brasa.',
            preco: 8.0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_porcao_churrasco',
          data: {
            nome: 'Tábua Churrasco Misto na Brasa (Serve 3)',
            categoria: 'Porções',
            descricao: 'Picanha fatiada, linguiça artesanal, mandioca frita crocante, farofa e vinagrete.',
            preco: 89.9,
            imagemUrl: imgPorcaoChurrasco,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_beb_coca_lata',
          data: {
            nome: 'Refrigerante Coca-Cola Lata 350ml',
            categoria: 'Bebidas',
            descricao: 'Gelada 350ml.',
            preco: 7.0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_beb_coca_2l',
          data: {
            nome: 'Coca-Cola 2 Litros',
            categoria: 'Bebidas',
            descricao: 'Garrafa 2L gelada para família.',
            preco: 16.0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_beb_suco_laranja',
          data: {
            nome: 'Suco Natural de Laranja 500ml',
            categoria: 'Bebidas',
            descricao: 'Espremido na hora, sem conservantes.',
            preco: 11.0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
        {
          id: 'prod_buffet_sobremesa',
          data: {
            nome: 'Pudim de Leite Condensado Caseiro',
            categoria: 'Outros',
            descricao: 'Fatia generosa com calda de caramelo.',
            preco: 10.0,
            disponivel: true,
            ativo: true,
            ehDadoDemonstracao: false,
            criadoEm: agora,
            atualizadoEm: agora,
          },
        },
      ];

      for (const p of produtosReais) {
        await setDoc(doc(db, 'produtos', p.id), p.data);
      }
    }

    await registrarLogAuditoria(
      'Inicialização do Banco de Dados Real',
      incluirCardapioRealCompleto
        ? 'Banco de dados real oficial inicializado com 12 mesas, cardápio oficial limpo, regiões e entregadores.'
        : 'Banco de dados real limpo inicializado com 12 mesas, categorias e regiões base (cardápio zerado).'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'inicializar_banco_real');
  }
}

export async function converterDemonstracaoParaReal(): Promise<number> {
  let alterados = 0;
  try {
    const snap = await getDocs(collection(db, 'produtos'));
    for (const d of snap.docs) {
      const data = d.data() as Produto;
      if (data.ehDadoDemonstracao || data.nome.includes('[Demo]')) {
        const novoNome = data.nome.replace(/\s*\[Demo\]/gi, '').trim();
        await setDoc(
          doc(db, 'produtos', d.id),
          {
            ...data,
            nome: novoNome,
            ehDadoDemonstracao: false,
            atualizadoEm: new Date().toISOString(),
          },
          { merge: true }
        );
        alterados++;
      }
    }

    const snapEnt = await getDocs(collection(db, 'entregadores'));
    for (const d of snapEnt.docs) {
      const data = d.data() as Entregador;
      if (data.nome.includes('[Demo]')) {
        const novoNome = data.nome.replace(/\s*\[Demo\]/gi, '').trim();
        await setDoc(
          doc(db, 'entregadores', d.id),
          {
            ...data,
            nome: novoNome,
          },
          { merge: true }
        );
      }
    }

    const snapPed = await getDocs(collection(db, 'pedidos'));
    for (const d of snapPed.docs) {
      const data = d.data() as Pedido;
      if (data.clienteNome.includes('[Demo]')) {
        const novoNome = data.clienteNome.replace(/\s*\[Demo\]/gi, '').trim();
        await setDoc(
          doc(db, 'pedidos', d.id),
          {
            ...data,
            clienteNome: novoNome,
          },
          { merge: true }
        );
      }
    }

    await registrarLogAuditoria(
      'Conversão para Banco Real',
      `${alterados} itens de demonstração foram convertidos em produtos oficiais reais sem marcações de teste.`
    );
    return alterados;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'converter_demo_para_real');
  }
}

export async function limparItensDemonstracao(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'produtos'));
    for (const d of snap.docs) {
      const data = d.data();
      if (data.ehDadoDemonstracao === true) {
        await deleteDoc(doc(db, 'produtos', d.id));
      }
    }
    await registrarLogAuditoria(
      'Remoção de Produtos Demo',
      'Produtos marcados como Dados de Demonstração foram removidos.'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'produtos');
  }
}

export async function limparHistoricoPedidosEComandas(): Promise<void> {
  try {
    const pedsSnap = await getDocs(collection(db, 'pedidos'));
    for (const d of pedsSnap.docs) {
      await deleteDoc(doc(db, 'pedidos', d.id));
    }
    const ipedsSnap = await getDocs(collection(db, 'itensPedido'));
    for (const d of ipedsSnap.docs) {
      await deleteDoc(doc(db, 'itensPedido', d.id));
    }
    const cmdsSnap = await getDocs(collection(db, 'comandas'));
    for (const d of cmdsSnap.docs) {
      await deleteDoc(doc(db, 'comandas', d.id));
    }
    const icmdsSnap = await getDocs(collection(db, 'itensComanda'));
    for (const d of icmdsSnap.docs) {
      await deleteDoc(doc(db, 'itensComanda', d.id));
    }
    const kdsSnap = await getDocs(collection(db, 'pedidosCozinha'));
    for (const d of kdsSnap.docs) {
      await deleteDoc(doc(db, 'pedidosCozinha', d.id));
    }
    const entSnap = await getDocs(collection(db, 'entregas'));
    for (const d of entSnap.docs) {
      await deleteDoc(doc(db, 'entregas', d.id));
    }

    // Resetar status de todas as mesas para livre
    const mesasSnap = await getDocs(collection(db, 'mesas'));
    for (const d of mesasSnap.docs) {
      const m = d.data() as Mesa;
      await setDoc(
        doc(db, 'mesas', d.id),
        {
          numero: m.numero,
          capacidade: m.capacidade,
          status: 'livre',
          pessoas: 0,
          atualizadoEm: new Date().toISOString(),
        }
      );
    }

    await registrarLogAuditoria(
      'Limpeza de Histórico Operacional',
      'Todos os pedidos, comandas, entregas e ordens de cozinha foram resetados. As mesas foram liberadas.'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'limpeza_historico');
  }
}

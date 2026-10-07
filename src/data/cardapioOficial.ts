import { Produto } from '../types';

export interface DiaSemanaItem {
  key: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
  label: string;
  nomeCompleto: string;
}

export const DIAS_DA_SEMANA: DiaSemanaItem[] = [
  { key: 'segunda', label: 'Segunda', nomeCompleto: 'Segunda-feira' },
  { key: 'terca', label: 'Terça', nomeCompleto: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta', nomeCompleto: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta', nomeCompleto: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta', nomeCompleto: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado', nomeCompleto: 'Sábado' },
];

export function getDiaHojeKey(): 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' {
  const diaNum = new Date().getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  switch (diaNum) {
    case 1:
      return 'segunda';
    case 2:
      return 'terca';
    case 3:
      return 'quarta';
    case 4:
      return 'quinta';
    case 5:
      return 'sexta';
    case 6:
      return 'sabado';
    default:
      // No domingo abre a escala de segunda como padrão
      return 'segunda';
  }
}

const agora = new Date().toISOString();

export const PRODUTOS_OFICIAIS: { id: string; data: Omit<Produto, 'id'> }[] = [
  // 🍱 1. Marmitas
  {
    id: 'prod_marmita_p',
    data: {
      nome: 'Marmita Pequena',
      categoria: 'Marmitas',
      descricao: 'Marmita individual pequena. Monta 1 carne do dia + acompanhamentos à vontade.',
      preco: 16.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_marmita_m',
    data: {
      nome: 'Marmita Média',
      categoria: 'Marmitas',
      descricao: 'Marmita tamanho padrão. Monta até 2 carnes do dia + acompanhamentos à vontade.',
      preco: 20.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_marmita_g',
    data: {
      nome: 'Marmita Grande',
      categoria: 'Marmitas',
      descricao: 'Marmita reforçada grande. Monta até 2 carnes do dia + acompanhamentos à vontade.',
      preco: 25.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // 🥤 2. Refrigerantes e Bebidas (com controle de estoque)
  {
    id: 'prod_refri_coca_lata',
    data: {
      nome: 'Coca-Cola Lata',
      categoria: 'Bebidas',
      descricao: 'Refrigerante Coca-Cola em lata 350ml gelada.',
      preco: 6.0,
      estoque: 48,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_refri_coca_600',
    data: {
      nome: 'Coca-Cola 600 ml',
      categoria: 'Bebidas',
      descricao: 'Garrafa individual 600ml bem gelada.',
      preco: 8.0,
      estoque: 30,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_refri_coca_1l',
    data: {
      nome: 'Coca-Cola 1 L',
      categoria: 'Bebidas',
      descricao: 'Garrafa média 1 Litro gelada.',
      preco: 10.0,
      estoque: 24,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_refri_coca_2l',
    data: {
      nome: 'Coca-Cola 2 L',
      categoria: 'Bebidas',
      descricao: 'Garrafa 2 Litros família gelada.',
      preco: 15.0,
      estoque: 36,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_refri_tubaina_local',
    data: {
      nome: 'Tubaína (no local)',
      categoria: 'Bebidas',
      descricao: 'Tubaína tradicional servida no restaurante.',
      preco: 6.0,
      estoque: 20,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_refri_tubaina_levar',
    data: {
      nome: 'Tubaína (para levar)',
      categoria: 'Bebidas',
      descricao: 'Tubaína embalada para viagem / delivery.',
      preco: 7.0,
      estoque: 20,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_refri_sabores',
    data: {
      nome: 'Refri (diversos sabores)',
      categoria: 'Bebidas',
      descricao: 'Guaraná Antarctica, Fanta Laranja ou Soda 2L.',
      preco: 12.0,
      estoque: 18,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_agua_sem_gas',
    data: {
      nome: 'Água sem Gás',
      categoria: 'Bebidas',
      descricao: 'Garrafa 500ml de água mineral natural.',
      preco: 5.0,
      estoque: 40,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_agua_com_gas',
    data: {
      nome: 'Água com Gás',
      categoria: 'Bebidas',
      descricao: 'Garrafa 500ml de água mineral gasosa.',
      preco: 6.0,
      estoque: 30,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // 🍲 3. Porções
  {
    id: 'prod_porcao_p',
    data: {
      nome: 'Porção Pequena',
      categoria: 'Porções',
      descricao: 'Porção individual bem servida.',
      preco: 15.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_porcao_m',
    data: {
      nome: 'Porção Média',
      categoria: 'Porções',
      descricao: 'Porção média ideal para compartilhar.',
      preco: 30.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_bf_livre_inteiro',
    data: {
      nome: 'BF Livre Inteiro',
      categoria: 'Buffet',
      descricao: 'Buffet livre self-service completo à vontade (adulto).',
      preco: 30.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_bf_livre_meia',
    data: {
      nome: 'BF Livre Meia',
      categoria: 'Buffet',
      descricao: 'Buffet livre meia porção / infantil.',
      preco: 20.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // 🍬 4. Doces e Sobremesas (com controle de estoque)
  {
    id: 'prod_doce_canudo',
    data: {
      nome: 'Doce Canudo',
      categoria: 'Doces e Sobremesas',
      descricao: 'Canudinho crocante com doce de leite caseiro cremoso.',
      preco: 7.0,
      estoque: 25,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_doce_pacoca',
    data: {
      nome: 'Doce Paçoca',
      categoria: 'Doces e Sobremesas',
      descricao: 'Paçoca artesanal cremosa de amendoim.',
      preco: 5.0,
      estoque: 30,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_doce_diversos',
    data: {
      nome: 'Doce (diversos sabores)',
      categoria: 'Doces e Sobremesas',
      descricao: 'Doces caseiros variados (cocada, pé de moleque, doce de abóbora).',
      preco: 5.0,
      estoque: 25,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_doce_trufa',
    data: {
      nome: 'Trufa',
      categoria: 'Doces e Sobremesas',
      descricao: 'Trufa artesanal de chocolate nobre recheada.',
      preco: 6.0,
      estoque: 35,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // 🥗 5. Saladas Avulsas
  {
    id: 'prod_salada_p',
    data: {
      nome: 'Salada Pequena',
      categoria: 'Saladas Avulsas',
      descricao: 'Salada fresca individual.',
      preco: 8.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'prod_salada_m',
    data: {
      nome: 'Salada Média',
      categoria: 'Saladas Avulsas',
      descricao: 'Salada fresca média com mix de folhas e legumes.',
      preco: 12.0,
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // 🥩 6. Carnes do Cardápio Semanal (Máximo de 2 carnes por marmita)
  // Segunda-feira
  {
    id: 'carne_frango_molho',
    data: {
      nome: 'Frango ao molho',
      categoria: 'Carnes',
      descricao: 'Frango cozido macio com tempero da casa.',
      preco: 0,
      diasSemana: ['segunda'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'carne_panqueca',
    data: {
      nome: 'Panqueca',
      categoria: 'Carnes',
      descricao: 'Panqueca de carne com molho especial.',
      preco: 0,
      diasSemana: ['segunda'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'carne_linguica',
    data: {
      nome: 'Linguiça',
      categoria: 'Carnes',
      descricao: 'Linguiça grelhada acebolada.',
      preco: 0,
      diasSemana: ['segunda', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'carne_picadinho',
    data: {
      nome: 'Picadinho',
      categoria: 'Carnes',
      descricao: 'Picadinho tradicional de carne macia.',
      preco: 0,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // Terça-feira
  {
    id: 'carne_frango_frito',
    data: {
      nome: 'Frango frito',
      categoria: 'Carnes',
      descricao: 'Frango crocante dourado.',
      preco: 0,
      diasSemana: ['terca', 'quinta', 'sexta'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'carne_porco_tacho',
    data: {
      nome: 'Porco no tacho',
      categoria: 'Carnes',
      descricao: 'Carne suína frita no tacho temperada.',
      preco: 0,
      diasSemana: ['terca', 'quinta'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'carne_carne_molho',
    data: {
      nome: 'Carne ao molho',
      categoria: 'Carnes',
      descricao: 'Carne bovina macia de panela ao molho encorpado.',
      preco: 0,
      diasSemana: ['terca', 'quarta', 'quinta'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // Quarta-feira
  {
    id: 'carne_frango_assado',
    data: {
      nome: 'Frango assado',
      categoria: 'Carnes',
      descricao: 'Frango assado dourado com ervas.',
      preco: 0,
      diasSemana: ['quarta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'carne_file_frango_grelhado',
    data: {
      nome: 'Filé de frango grelhado',
      categoria: 'Carnes Especiais',
      descricao: 'Filé de frango grelhado na chapa (adicional +R$ 1,00).',
      preco: 1.0,
      ehEspecial: true,
      diasSemana: ['quarta'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'carne_lasanha_frango',
    data: {
      nome: 'Lasanha de frango',
      categoria: 'Carnes',
      descricao: 'Lasanha recheada com frango e queijo gratinado.',
      preco: 0,
      diasSemana: ['quarta'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // Quinta-feira
  {
    id: 'carne_strogonoff',
    data: {
      nome: 'Strogonoff',
      categoria: 'Carnes',
      descricao: 'Strogonoff cremoso caseiro.',
      preco: 0,
      diasSemana: ['quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // Sexta-feira
  {
    id: 'carne_porco_assado',
    data: {
      nome: 'Porco assado',
      categoria: 'Carnes',
      descricao: 'Lombo suíno assado fatiado.',
      preco: 0,
      diasSemana: ['sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'carne_feijoada',
    data: {
      nome: 'Feijoada',
      categoria: 'Carnes Especiais',
      descricao: 'Carne Mista/Especial: adicional +R$ 2,00. Exige obrigatoriamente a combinação com uma segunda carne.',
      preco: 2.0,
      ehEspecial: true,
      exigeSegundaCarne: true,
      diasSemana: ['sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // Sábado
  {
    id: 'carne_costela',
    data: {
      nome: 'Costela',
      categoria: 'Carnes Especiais',
      descricao: 'Carne Mista/Especial: adicional +R$ 2,00. Exige obrigatoriamente a combinação com uma segunda carne.',
      preco: 2.0,
      ehEspecial: true,
      exigeSegundaCarne: true,
      diasSemana: ['sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },

  // 🥗 7. Acompanhamentos (Guarnições Diárias de Segunda a Sábado)
  {
    id: 'acomp_arroz',
    data: {
      nome: 'Arroz',
      categoria: 'Acompanhamentos',
      descricao: 'Arroz branco soltinho.',
      preco: 0,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'acomp_feijao',
    data: {
      nome: 'Feijão',
      categoria: 'Acompanhamentos',
      descricao: 'Feijão carioca temperado caseiro.',
      preco: 0,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'acomp_macarrao',
    data: {
      nome: 'Macarrão',
      categoria: 'Acompanhamentos',
      descricao: 'Macarrão do dia.',
      preco: 0,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'acomp_salada',
    data: {
      nome: 'Salada',
      categoria: 'Acompanhamentos',
      descricao: 'Salada fresca do dia.',
      preco: 0,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'acomp_farofa',
    data: {
      nome: 'Farofa',
      categoria: 'Acompanhamentos',
      descricao: 'Farofa crocante da casa.',
      preco: 0,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'acomp_batata',
    data: {
      nome: 'Batata',
      categoria: 'Acompanhamentos',
      descricao: 'Batata frita crocante ou sauté.',
      preco: 0,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
  {
    id: 'acomp_legumes',
    data: {
      nome: 'Legumes',
      categoria: 'Acompanhamentos',
      descricao: 'Legumes selecionados cozidos no vapor.',
      preco: 0,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      disponivel: true,
      ativo: true,
      ehDadoDemonstracao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  },
];

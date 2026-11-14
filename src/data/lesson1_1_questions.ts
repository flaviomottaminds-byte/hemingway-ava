import type { AssessmentQuestion } from '../types'

/**
 * 15 Questões Oficiais da Hemingway School — Aula 1.1: FOH vs. BOH (Hospitality)
 */
export const LESSON_1_1_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'foh-boh-q1',
    sequence_order: 1,
    statement:
      'Texto-base: Na indústria da hospitalidade nos Estados Unidos, a divisão clássica de um restaurante ou hotel é frequentemente comparada à dinâmica de um espetáculo teatral. O público no salão assiste à encenação sem ter visão do que ocorre nos bastidores.\n\nEnunciado: Com base nessa analogia, qual a principal distinção operacional e conceitual entre o Front of the House (FOH) e o Back of the House (BOH)?',
    points: 1,
    feedback:
      'O FOH engloba tudo o que está à vista do cliente (salão, bar, recepção), priorizando a experiência e o relacionamento. O BOH sustenta a operação nos bastidores (cozinha, preparo, governança e manutenção), garantindo velocidade e qualidade técnica.',
    is_expanded: true,
    options: [
      {
        id: 'foh-boh-q1-a',
        option_letter: 'A',
        text: 'O FOH atua apenas no controle de estoque e auditoria contábil, enquanto o BOH realiza o atendimento presencial no salão.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q1-b',
        option_letter: 'B',
        text: 'O BOH é responsável pelo contato imediato com os hóspedes, enquanto o FOH gerencia exclusivamente caldeiras e lavanderia.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q1-c',
        option_letter: 'C',
        text: 'O FOH engloba tudo o que está à vista do cliente (salão, bar, recepção), priorizando a experiência e o relacionamento. O BOH sustenta a operação nos bastidores (cozinha, preparo, governança e manutenção), garantindo velocidade e qualidade técnica.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q1-d',
        option_letter: 'D',
        text: 'O FOH atua apenas em turnos noturnos em eventos privados, ao passo que o BOH funciona unicamente no turno matutino.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q1-e',
        option_letter: 'E',
        text: 'Ambos compartilham exatamente as mesmas tarefas de cozinha e salão sem qualquer especialização de papéis.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q2',
    sequence_order: 2,
    statement:
      'Texto-base: No salão de restaurantes com alto volume de clientes nos EUA, o ritmo com que mesas são liberadas, higienizadas e preparadas para os próximos clientes define a rentabilidade do turno.\n\nEnunciado: Qual é a função primordial do Busser (ou Server Assistant) e por que ela é considerada estratégica no FOH?',
    points: 1,
    feedback:
      'O Busser (ou Server Assistant) é o responsável pelo table turnover no salão, sendo uma das melhores portas de entrada no FOH para quem está aperfeiçoando o inglês funcional.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q2-a',
        option_letter: 'A',
        text: 'Cozinhar as carnes nobre na grelha e validar a comanda térmica na expedição da cozinha.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q2-b',
        option_letter: 'B',
        text: 'O Busser (ou Server Assistant) é o responsável pelo table turnover no salão, sendo uma das melhores portas de entrada no FOH para quem está aperfeiçoando o inglês funcional.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q2-c',
        option_letter: 'C',
        text: 'Definir os preços do cardápio e auditar o fechamento financeiro do restaurante.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q2-d',
        option_letter: 'D',
        text: 'Gerenciar a contratação de pessoal e aprovação das horas extras semanais da equipe.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q2-e',
        option_letter: 'E',
        text: 'Substituir o Chef executivo na montagem de molhos clássicos e finalização de sobremesas.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q3',
    sequence_order: 3,
    statement:
      'Texto-base: Durante o rush do almoço ou jantar, pratos quentes não podem esperar na linha sob lâmpadas de calor, sob risco de perderem temperatura e textura ideais.\n\nEnunciado: Como se define a área conhecida como "The Pass" e qual o papel do Food Runner nessa dinâmica?',
    points: 1,
    feedback:
      'The Pass (a janela de expedição) é o ponto físico de encontro entre BOH e FOH. O Expo valida o padrão do prato e o Food Runner executa a entrega precisa na mesa, servindo como degrau natural antes do cargo de Server.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q3-a',
        option_letter: 'A',
        text: 'The Pass é o vestiário dos funcionários onde são conferidos os uniformes antes do turno.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q3-b',
        option_letter: 'B',
        text: 'The Pass é a entrada principal do salão onde os clientes aguardam na fila de espera com o Host.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q3-c',
        option_letter: 'C',
        text: 'The Pass (a janela de expedição) é o ponto físico de encontro entre BOH e FOH. O Expo valida o padrão do prato e o Food Runner executa a entrega precisa na mesa, servindo como degrau natural antes do cargo de Server.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q3-d',
        option_letter: 'D',
        text: 'The Pass é a área de lavagem pesada onde o Dishwasher organiza as panelas de ferro fundido.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q3-e',
        option_letter: 'E',
        text: 'The Pass é a sala de contabilidade onde são emitidas as faturas de fornecedores de hortifrúti.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q4',
    sequence_order: 4,
    statement:
      'Texto-base: Considere as duas asserções a respeito das práticas de remuneração no setor de hospitalidade nos Estados Unidos:\nI. Servidores e Bartenders dependem primariamente das gorjetas (Tips) recebidas dos clientes e frequentemente realizam a partilha de percentuais (Tip-out) com bussers e runners.\nPORQUE\nII. A equipe do BOH (cozinheiros, prep cooks e stewards) historicamente recebe salários com base em taxa horária fixa sem participação direta nas gorjetas do salão.\n\nEnunciado: A respeito dessas asserções, assinale a opção correta:',
    points: 1,
    feedback:
      'Ambas as afirmações descrevem fielmente a estrutura salarial dos EUA, mas a II não é a causa da I — elas são duas lógicas de remuneração distintas (variável por comissão/gorjeta no FOH vs. fixa por hora no BOH).',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q4-a',
        option_letter: 'A',
        text: 'As asserções I e II são proposições falsas segundo as leis trabalhistas federais dos EUA.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q4-b',
        option_letter: 'B',
        text: 'Ambas as afirmações descrevem fielmente a estrutura salarial dos EUA, mas a II não é a causa da I — elas são duas lógicas de remuneração distintas (variável por comissão/gorjeta no FOH vs. fixa por hora no BOH).',
        is_correct: true,
      },
      {
        id: 'foh-boh-q4-c',
        option_letter: 'C',
        text: 'A asserção I é verdadeira e a II é falsa, pois todo o BOH divide gorjetas obrigatoriamente por lei federal.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q4-d',
        option_letter: 'D',
        text: 'A asserção I é falsa, pois nos EUA gorjetas são estritamente proibidas em restaurantes com serviço de mesa.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q4-e',
        option_letter: 'E',
        text: 'A asserção II é a justificativa direta e causa mecânica da asserção I.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q5',
    sequence_order: 5,
    statement:
      'Texto-base: Antes da abertura do salão para o público, caixas de vegetais, proteínas frescas e caldos precisam ser higienizados, cortados em padrões rigorosos e armazenados nas cubas refrigeradas.\n\nEnunciado: No contexto do BOH, qual a função primordial do Prep Cook e a importância do conceito de "Mise en Place"?',
    points: 1,
    feedback:
      'O Prep Cook (auxiliar de preparo) garante o Mise en Place (tudo no seu devido lugar) para que os Line Cooks consigam montar os pratos em poucos minutos durante o movimento.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q5-a',
        option_letter: 'A',
        text: 'Atender reservas telefônicas e imprimir comandas térmicas para a equipe de garçons.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q5-b',
        option_letter: 'B',
        text: 'Polir os copos de cristal e organizar os guardanapos de tecido nas mesas do salão.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q5-c',
        option_letter: 'C',
        text: 'O Prep Cook (auxiliar de preparo) garante o Mise en Place (tudo no seu devido lugar) para que os Line Cooks consigam montar os pratos em poucos minutos durante o movimento.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q5-d',
        option_letter: 'D',
        text: 'Higienizar os banheiros sociais e substituir os aromas de ambiente antes do rush.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q5-e',
        option_letter: 'E',
        text: 'Realizar auditoria de estoques de vinhos raros e controlar a temperatura da adega.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q6',
    sequence_order: 6,
    statement:
      'Texto-base: Em cozinhas profissionais de grande porte, a linha de cocção quente é subdividida em estações especializadas para garantir sincronia e tempo de execução.\n\nEnunciado: Quais são as atribuições dos Line Cooks e como suas estações operam tipicamente na cozinha?',
    points: 1,
    feedback:
      'Line Cooks são os especialistas das estações de cocção (Grill = grelha, Sauté = frigideiras/molhos, Fry = fritadeira, Pantry/Garde Manger = saladas e entradas frias).',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q6-a',
        option_letter: 'A',
        text: 'Line Cooks cuidam exclusivamente da recepção dos clientes e fechamento de contas no terminal POS.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q6-b',
        option_letter: 'B',
        text: 'Line Cooks são os especialistas das estações de cocção (Grill = grelha, Sauté = frigideiras/molhos, Fry = fritadeira, Pantry/Garde Manger = saladas e entradas frias).',
        is_correct: true,
      },
      {
        id: 'foh-boh-q6-c',
        option_letter: 'C',
        text: 'Line Cooks supervisionam o estacionamento com manobristas (Valet) e a segurança predial externa.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q6-d',
        option_letter: 'D',
        text: 'Line Cooks são garçons iniciantes encarregados de repor jarras de água com gelo nas mesas.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q6-e',
        option_letter: 'E',
        text: 'Line Cooks realizam exclusivamente a lavagem automatizada de bandejas industriais na esteira.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q7',
    sequence_order: 7,
    statement:
      'Texto-base: Em um resort ou hotel executivo, a experiência impecável do hóspede exige harmonia absoluta entre o Front Desk e a Governança.\n\nEnunciado: Quais posições exemplificam os pilares fundamentais do Back of the House (BOH) na hotelaria?',
    points: 1,
    feedback:
      'Camareiras (Room Attendants), auxiliares de corredor/enxoval (Housepersons) e técnicos de manutenção (Maintenance) compõem a espinha dorsal do BOH hoteleiro.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q7-a',
        option_letter: 'A',
        text: 'Concierge, Hostess e Sommelier do restaurante principal.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q7-b',
        option_letter: 'B',
        text: 'Camareiras (Room Attendants), auxiliares de corredor/enxoval (Housepersons) e técnicos de manutenção (Maintenance) compõem a espinha dorsal do BOH hoteleiro.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q7-c',
        option_letter: 'C',
        text: 'Gerente geral de relações públicas e recepcionista bilíngue do turno diurno.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q7-d',
        option_letter: 'D',
        text: 'Valet parking attendants e bartenders do lobby lounge.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q7-e',
        option_letter: 'E',
        text: 'Vendedores de pacotes de timeshare e guias turísticos locais credenciados.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q8',
    sequence_order: 8,
    statement:
      'Texto-base: O sistema de gestão hoteleira (PMS) utiliza códigos de status universais para coordenar a liberação de apartamentos em tempo real entre a Governança e a Recepção.\n\nEnunciado: O que significa a alteração do status de um apartamento de "VD" (Vacant Dirty) para "VR" (Vacant Ready)?',
    points: 1,
    feedback:
      'A transição de VD (Vacant Dirty) para VR (Vacant Ready) é o sinal verde no sistema do hotel que autoriza o Front Desk a realizar o check-in de um novo hóspede.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q8-a',
        option_letter: 'A',
        text: 'O quarto foi bloqueado judicialmente para reformas estruturais de longa duração.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q8-b',
        option_letter: 'B',
        text: 'A transição de VD (Vacant Dirty) para VR (Vacant Ready) é o sinal verde no sistema do hotel que autoriza o Front Desk a realizar o check-in de um novo hóspede.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q8-c',
        option_letter: 'C',
        text: 'O hóspede solicitou serviço de despertador e café da manhã servido na cama.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q8-d',
        option_letter: 'D',
        text: 'O quarto está ocupado por hóspede com animal de estimação não cadastrado previamente.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q8-e',
        option_letter: 'E',
        text: 'O quarto apresentou vazamento no ar-condicionado e aguarda inspeção do corpo de bombeiros.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q9',
    sequence_order: 9,
    statement:
      'Texto-base: Em cozinhas de alta pressão e corredores estreitos com portas de vai-e-vem, a comunicação verbal rápida e alta é a principal ferramenta para prevenir queimaduras e acidentes graves.\n\nEnunciado: Qual o significado dos comandos de voz obrigatórios "Behind!" e "Corner!" nos ambientes de BOH e FOH?',
    points: 1,
    feedback:
      '\'Behind!\' alerta que há alguém passando pelas costas do colega (evitando que ele dê um passo para trás ou vire com algo quente), e \'Corner!\' previne colisões frontais em curvas sem visibilidade.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q9-a',
        option_letter: 'A',
        text: 'São códigos para anunciar a chegada de clientes VIP no salão do restaurante.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q9-b',
        option_letter: 'B',
        text: '\'Behind!\' alerta que há alguém passando pelas costas do colega (evitando que ele dê um passo para trás ou vire com algo quente), e \'Corner!\' previne colisões frontais em curvas sem visibilidade.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q9-c',
        option_letter: 'C',
        text: 'Indicam que o horário de almoço da equipe da grelha foi adiado em trinta minutos.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q9-d',
        option_letter: 'D',
        text: 'Sinalizam que o gerente de plantão está inspecionando o corte correto dos legumes.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q9-e',
        option_letter: 'E',
        text: 'Trata-se de gírias informais sem qualquer relação com segurança do trabalho.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q10',
    sequence_order: 10,
    statement:
      'Texto-base: Durante o pico de vendas de um jantar de sábado, o chef expedidor grita para o salão e para a linha: "Eighty-Six the Ribeye!".\n\nEnunciado: No jargão operacional norte-americano, qual a ação imediata esperada de garçons e cozinheiros após esse aviso?',
    points: 1,
    feedback:
      'O código \'86\' significa que determinado item do cardápio acabou e deve ser retirado imediatamente das vendas do turno.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q10-a',
        option_letter: 'A',
        text: 'Oferecer desconto de 86% no prato de costela bovina para todos os clientes da casa.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q10-b',
        option_letter: 'B',
        text: 'Preparar imediatamente 86 porções extras de costela para atender à fila de espera.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q10-c',
        option_letter: 'C',
        text: 'O código \'86\' significa que determinado item do cardápio acabou e deve ser retirado imediatamente das vendas do turno.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q10-d',
        option_letter: 'D',
        text: 'Cozinhar o bife de costela por mais 86 segundos para atingir o ponto bem-passado.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q10-e',
        option_letter: 'E',
        text: 'Encaminhar o lote de carnes para incineração sanitária pelo departamento de saúde.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q11',
    sequence_order: 11,
    statement:
      'Texto-base: Expressões idiomáticas do dia a dia da hospitalidade nos EUA resumem o nível de estresse e a velocidade das tarefas operacionais.\n\nEnunciado: O que significam respectivamente os termos "On the fly" e "In the weeds"?',
    points: 1,
    feedback:
      '\'On the fly\' indica prioridade máxima na linha de produção para corrigir um atraso ou erro; \'In the weeds\' é o pedido universal de socorro entre colegas de salão ou cozinha quando o volume de tarefas ultrapassa a capacidade individual.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q11-a',
        option_letter: 'A',
        text: '\'On the fly\' indica prioridade máxima na linha de produção para corrigir um atraso ou erro; \'In the weeds\' é o pedido universal de socorro entre colegas de salão ou cozinha quando o volume de tarefas ultrapassa a capacidade individual.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q11-b',
        option_letter: 'B',
        text: '\'On the fly\' refere-se ao descarte de sobras orgânicas; \'In the weeds\' significa que as saladas foram colhidas na horta local.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q11-c',
        option_letter: 'C',
        text: '\'On the fly\' é o descanso de 15 minutos do cozinheiro; \'In the weeds\' indica aplicação de desinfetante no piso da cozinha.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q11-d',
        option_letter: 'D',
        text: '\'On the fly\' significa entrega de refeição por drone; \'In the weeds\' significa atendimento na área externa do jardim.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q11-e',
        option_letter: 'E',
        text: 'Ambas as expressões são sinônimos formais de encerramento do expediente bancário do hotel.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q12',
    sequence_order: 12,
    statement:
      'Texto-base: Muitos imigrantes iniciam suas trajetórias profissionais nos EUA em posições que não exigem inglês fluente inicial (como Dishwasher ou Prep Cook) e buscam evoluir para posições de atendimento ao público com maior rentabilidade de gorjetas.\n\nEnunciado: Qual é a principal estratégia para viabilizar essa progressão profissional interna com sucesso?',
    points: 1,
    feedback:
      'O Cross-Training (treinamento cruzado) conquistado após consistência e pontualidade é a principal alavanca de crescimento interno nos EUA, permitindo transitar do BOH para o FOH com segurança.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q12-a',
        option_letter: 'A',
        text: 'Recusar-se a ajudar colegas de outras áreas e focar estritamente na própria bancada sem conversar com ninguém.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q12-b',
        option_letter: 'B',
        text: 'O Cross-Training (treinamento cruzado) conquistado após consistência e pontualidade é a principal alavanca de crescimento interno nos EUA, permitindo transitar do BOH para o FOH com segurança.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q12-c',
        option_letter: 'C',
        text: 'Trocar de restaurante a cada duas semanas sem aviso prévio à gerência de operações.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q12-d',
        option_letter: 'D',
        text: 'Exigir promoção imediata a gerente geral durante o primeiro mês de experiência.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q12-e',
        option_letter: 'E',
        text: 'Evitar aprender termos funcionais em inglês para não assumir novas responsabilidades operacionais.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q13',
    sequence_order: 13,
    statement:
      'Texto-base: Em hotéis de alta rotatividade, a eficiência das camareiras depende de não terem que interromper a arrumação para descer aos depósitos centrais em busca de lençóis, toalhas ou produtos químicos.\n\nEnunciado: De que forma o Houseperson viabiliza a produtividade do time de Governança nos andares?',
    points: 1,
    feedback:
      'O Houseperson mantém a logística dos andares funcionando para que as Room Attendants foquem exclusivamente na limpeza e inspeção dos apartamentos.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q13-a',
        option_letter: 'A',
        text: 'Vendendo ingressos de parques temáticos e aluguel de carros no saguão principal do hotel.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q13-b',
        option_letter: 'B',
        text: 'O Houseperson mantém a logística dos andares funcionando para que as Room Attendants foquem exclusivamente na limpeza e inspeção dos apartamentos.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q13-c',
        option_letter: 'C',
        text: 'Inspecionando passaportes internacionais e emitindo cartões-chave magnéticos para hóspedes.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q13-d',
        option_letter: 'D',
        text: 'Preparando o buffet de café da manhã continental na cozinha quente do restaurante do hotel.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q13-e',
        option_letter: 'E',
        text: 'Supervisionando a equipe de salva-vidas e regulando a temperatura da piscina aquecida.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q14',
    sequence_order: 14,
    statement:
      'Texto-base: Ao aproximar-se da porta do apartamento 412 para a limpeza matinal programada, a camareira encontra a placa "DND" (Do Not Disturb) pendurada na maçaneta externa.\n\nEnunciado: Qual o procedimento correto e ético a ser adotado conforme os padrões internacionais de hotelaria?',
    points: 1,
    feedback:
      'O protocolo DND (Do Not Disturb) protege a privacidade e a segurança do hóspede; a camareira registra o horário no relatório para que a supervisão saiba por que o quarto não foi limpo naquele horário.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q14-a',
        option_letter: 'A',
        text: 'Bater com força repetidamente até que o hóspede responda e abra a porta.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q14-b',
        option_letter: 'B',
        text: 'Utilizar a chave mestra de emergência para entrar em silêncio e retirar o lixo da lixeira do banheiro.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q14-c',
        option_letter: 'C',
        text: 'O protocolo DND (Do Not Disturb) protege a privacidade e a segurança do hóspede; a camareira registra o horário no relatório para que a supervisão saiba por que o quarto não foi limpo naquele horário.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q14-d',
        option_letter: 'D',
        text: 'Chamar a polícia local imediatamente para abrir o quarto forçadamente.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q14-e',
        option_letter: 'E',
        text: 'Retirar a placa da maçaneta e guardar no bolso sem comunicar à governança ou à recepção.',
        is_correct: false,
      },
    ],
  },
  {
    id: 'foh-boh-q15',
    sequence_order: 15,
    statement:
      'Texto-base: Um cliente sinaliza ao garçom no salão que tem alergia grave a frutos do mar e amendoim. O garçom não anota a observação na comanda eletrônica (POS) por pressa, e o cozinheiro utiliza a mesma frigideira para grelhar um filé de frango.\n\nEnunciado: O que essa situação ilustra sobre a relação de interdependência entre Front of the House e Back of the House?',
    points: 1,
    feedback:
      'A engrenagem só gira com segurança quando há comunicação precisa entre quem ouve o cliente (FOH) e quem prepara o alimento (BOH). Falhas nesse elo colocam em risco a saúde do hóspede e a reputação do estabelecimento.',
    is_expanded: false,
    options: [
      {
        id: 'foh-boh-q15-a',
        option_letter: 'A',
        text: 'Mostra que a responsabilidade sobre alergias alimentares cabe exclusivamente ao cliente do restaurante.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q15-b',
        option_letter: 'B',
        text: 'A engrenagem só gira com segurança quando há comunicação precisa entre quem ouve o cliente (FOH) e quem prepara o alimento (BOH). Falhas nesse elo colocam em risco a saúde do hóspede e a reputação do estabelecimento.',
        is_correct: true,
      },
      {
        id: 'foh-boh-q15-c',
        option_letter: 'C',
        text: 'Demonstra que o cozinheiro deve adivinhar restrições alimentares sem necessidade de anotações no sistema.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q15-d',
        option_letter: 'D',
        text: 'Prova que equipamentos de cozinha não sofrem contaminação cruzada sob altas temperaturas de óleo.',
        is_correct: false,
      },
      {
        id: 'foh-boh-q15-e',
        option_letter: 'E',
        text: 'Indica que falhas de comunicação no FOH não afetam de nenhuma maneira o trabalho técnico do BOH.',
        is_correct: false,
      },
    ],
  },
]

/**
 * Representação textual bruta no padrão exato da Hemingway School
 * (Texto-base, Enunciado, - A a - E, Gabarito Comentado)
 */
export const LESSON_1_1_RAW_TEXT: string = LESSON_1_1_QUESTIONS.map((q) => {
  const optionsText = q.options.map((opt) => `- ${opt.option_letter}) ${opt.text}`).join('\n')
  const correctOpt = q.options.find((o) => o.is_correct)?.option_letter || 'A'
  return `Questão ${q.sequence_order}\n${q.statement}\n${optionsText}\nGabarito Comentado: Alternativa ${correctOpt}. ${q.feedback || ''}`
}).join('\n\n')

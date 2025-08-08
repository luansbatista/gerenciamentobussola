export interface SubjectTopic {
  id: string
  name: string
}

export interface Subject {
  id: string
  name: string
  topics: SubjectTopic[]
  color: string
}

export const subjectsData: Subject[] = [
  {
    id: 'portugues',
    name: 'Língua Portuguesa',
    color: '#ef4444',
    topics: [
      { id: 'compreensao-textos', name: 'Compreensão e interpretação de textos' },
      { id: 'tipologia-textual', name: 'Tipologia textual e gêneros textuais' },
      { id: 'ortografia', name: 'Ortografia oficial' },
      { id: 'acentuacao', name: 'Acentuação gráfica' },
      { id: 'classes-palavras', name: 'Classes de palavras' },
      { id: 'crase', name: 'Uso do sinal indicativo de crase' },
      { id: 'sintaxe', name: 'Sintaxe da oração e do período' },
      { id: 'pontuacao', name: 'Pontuação' },
      { id: 'concordancia', name: 'Concordância nominal e verbal' },
      { id: 'regencia', name: 'Regência nominal e verbal' },
      { id: 'significacao', name: 'Significação das palavras' }
    ]
  },
  {
    id: 'historia',
    name: 'História do Brasil',
    color: '#f97316',
    topics: [
      { id: 'descobrimento', name: 'Descobrimento do Brasil (1500)' },
      { id: 'brasil-colonia', name: 'Brasil Colônia (1530-1815)' },
      { id: 'independencia', name: 'Independência do Brasil (1822)' },
      { id: 'primeiro-reinado', name: 'Primeiro Reinado (1822-1831)' },
      { id: 'segundo-reinado', name: 'Segundo Reinado (1831-1840)' },
      { id: 'primeira-republica', name: 'Primeira República (1889-1930)' },
      { id: 'revolucao-1930', name: 'Revolução de 1930' },
      { id: 'era-vargas', name: 'Era Vargas (1930-1945)' },
      { id: 'presidentes-1964', name: 'Os Presidentes do Brasil de 1964 à atualidade' },
      { id: 'historia-bahia', name: 'História da Bahia' },
      { id: 'independencia-bahia', name: 'Independência da Bahia' },
      { id: 'canudos', name: 'Revolta de Canudos' },
      { id: 'males', name: 'Revolta dos Malês' },
      { id: 'conjuracao-baiana', name: 'Conjuração Baiana' },
      { id: 'sabinada', name: 'Sabinada' }
    ]
  },
  {
    id: 'geografia',
    name: 'Geografia do Brasil',
    color: '#22c55e',
    topics: [
      { id: 'relevo', name: 'Relevo brasileiro' },
      { id: 'urbanizacao', name: 'Urbanização' },
      { id: 'energia', name: 'Tipos de fontes de energia brasileira' },
      { id: 'problemas-ambientais', name: 'Problemas Ambientais' },
      { id: 'climas', name: 'Climas' },
      { id: 'geografia-bahia', name: 'Geografia da Bahia' }
    ]
  },
  {
    id: 'matematica',
    name: 'Matemática',
    color: '#3b82f6',
    topics: [
      { id: 'conjuntos', name: 'Conjuntos numéricos' },
      { id: 'algebra', name: 'Álgebra' },
      { id: 'funcoes', name: 'Funções' },
      { id: 'sistemas-lineares', name: 'Sistemas lineares, Matrizes e Determinantes' },
      { id: 'analise-combinatoria', name: 'Análise Combinatória' },
      { id: 'geometria', name: 'Geometria e Medidas' },
      { id: 'trigonometria', name: 'Trigonometria' }
    ]
  },
  {
    id: 'atualidades',
    name: 'Atualidades',
    color: '#8b5cf6',
    topics: [
      { id: 'globalizacao', name: 'Globalização' },
      { id: 'multiculturalidade', name: 'Multiculturalidade, Pluralidade e Diversidade Cultural' },
      { id: 'tecnologias', name: 'Tecnologias de Informação e Comunicação' }
    ]
  },
  {
    id: 'informatica',
    name: 'Informática',
    color: '#06b6d4',
    topics: [
      { id: 'editores-texto', name: 'Conceitos e modos de utilização de aplicativos para edição de textos' },
      { id: 'sistemas-operacionais', name: 'Sistemas operacionais Windows 7, Windows 10 e Linux' },
      { id: 'organizacao-arquivos', name: 'Organização e gerenciamento de informações, arquivos, pastas e programas' },
      { id: 'atalhos-teclado', name: 'Atalhos de teclado, ícones, área de trabalho e lixeira' },
      { id: 'internet-intranet', name: 'Conceitos básicos e modos de utilização de tecnologias, ferramentas, aplicativos e procedimentos associados à Internet e intranet' },
      { id: 'correio-eletronico', name: 'Correio eletrônico' },
      { id: 'computacao-nuvem', name: 'Computação em nuvem' }
    ]
  },
  {
    id: 'direito-constitucional',
    name: 'Direito Constitucional',
    color: '#dc2626',
    topics: [
      { id: 'principios-fundamentais-1', name: 'Dos princípios fundamentais (Parte 1)' },
      { id: 'direitos-garantias-1', name: 'Dos Direitos e garantias fundamentais (Parte 1)' },
      { id: 'organizacao-estado', name: 'Da organização do Estado' },
      { id: 'administracao-publica-1', name: 'Da Administração Pública (Parte 1)' },
      { id: 'militares-estados', name: 'Dos militares dos Estados, do Distrito Federal e dos Territórios' },
      { id: 'seguranca-publica-1', name: 'Da Segurança Pública (Parte 1)' },
      { id: 'principios-fundamentais-2', name: 'Dos princípios fundamentais (Parte 2)' },
      { id: 'direitos-garantias-2', name: 'Direitos e garantias fundamentais (Parte 2)' },
      { id: 'servidores-publicos-militares', name: 'Dos Servidores Públicos Militares' },
      { id: 'seguranca-publica-2', name: 'Da Segurança Pública (Parte 2)' }
    ]
  },
  {
    id: 'direitos-humanos',
    name: 'Direitos Humanos',
    color: '#7c3aed',
    topics: [
      { id: 'declaracao-universal', name: 'A Declaração Universal dos Direitos Humanos/1948' },
      { id: 'convencao-americana', name: 'Convenção Americana sobre Direitos Humanos/1969 (Pacto de São José da Costa Rica) (art. 1° ao 32)' },
      { id: 'pacto-internacional', name: 'Pacto Internacional dos Direitos Econômicos, Sociais e Culturais (art. 1° ao 15)' },
      { id: 'declaracao-pequim', name: 'Declaração de Pequim Adotada pela Quarta Conferência Mundial sobre as Mulheres' }
    ]
  },
  {
    id: 'direito-administrativo',
    name: 'Direito Administrativo',
    color: '#059669',
    topics: [
      { id: 'administracao-publica', name: 'Administração Pública' },
      { id: 'principios-fundamentais', name: 'Princípios fundamentais da administração pública' },
      { id: 'poderes-deveres', name: 'Poderes e deveres dos administradores públicos' },
      { id: 'servidores-publicos', name: 'Servidores públicos: cargo, emprego e função públicos' },
      { id: 'regime-militar', name: 'Regime jurídico do militar estadual: Estatuto dos Policiais Militares do Estado da Bahia (Lei estadual nº 7.990 - arts 1º ao 59)' }
    ]
  },
  {
    id: 'direito-penal',
    name: 'Direito Penal',
    color: '#dc2626',
    topics: [
      { id: 'elementos', name: 'Elementos' },
      { id: 'consumacao-tentativa', name: 'Consumação e tentativa' },
      { id: 'desistencia-voluntaria', name: 'Desistência voluntária e arrependimento eficaz' },
      { id: 'arrependimento-posterior', name: 'Arrependimento posterior' },
      { id: 'crime-impossivel', name: 'Crime impossível' },
      { id: 'exclusao-ilicitude', name: 'Causas de exclusão de ilicitude e culpabilidade' },
      { id: 'contravencao', name: 'Contravenção' },
      { id: 'crimes-vida', name: 'Dos crimes contra a vida' },
      { id: 'crimes-liberdade', name: 'Dos crimes contra a liberdade pessoal' },
      { id: 'crimes-patrimonio', name: 'Dos crimes contra o patrimônio' },
      { id: 'crimes-dignidade-sexual', name: 'Dos crimes contra a dignidade sexual' },
      { id: 'corrupcao-ativa', name: 'Corrupção ativa' },
      { id: 'corrupcao-passiva', name: 'Corrupção passiva' },
      { id: 'crimes-tortura', name: 'Lei n° 9.455 (Crimes de tortura)' }
    ]
  },
  {
    id: 'direito-penal-militar',
    name: 'Direito Penal Militar',
    color: '#b91c1c',
    topics: [
      { id: 'crimes-autoridade', name: 'Dos crimes contra a autoridade ou disciplina militar' },
      { id: 'violencia-superior', name: 'Da violência contra superior ou militar de serviço' },
      { id: 'desrespeito-superior', name: 'Desrespeito a superior' },
      { id: 'recusa-obediencia', name: 'Recusa de obediência' },
      { id: 'reuniao-ilicita', name: 'Reunião ilícita' },
      { id: 'publicacao-critica', name: 'Publicação ou crítica indevida' },
      { id: 'resistencia-ameaca', name: 'Resistência mediante ameaça ou violência' },
      { id: 'crimes-servico-militar', name: 'Dos crimes contra o serviço militar e o dever militar' },
      { id: 'crimes-administracao', name: 'Crimes contra a Administração Militar' },
      { id: 'crimes-dever-funcional', name: 'Dos crimes contra o dever funcional' }
    ]
  },
  {
    id: 'igualdade-racial',
    name: 'Igualdade Racial e de Gênero',
    color: '#7c2d12',
    topics: [
      { id: 'constituicao-federal', name: 'Constituição da República Federativa do Brasil (art. 1°, 3°, 4° e 5°)' },
      { id: 'constituicao-bahia', name: 'Constituição do Estado da Bahia, (Cap. XXIII “Do Negro”)' },
      { id: 'lei-12288', name: 'Lei n° 12.288' },
      { id: 'lei-7716', name: 'Lei nº 7.716 e Lei n° 9.459' },
      { id: 'decreto-65810', name: 'Decreto n° 65.810' },
      { id: 'decreto-4377', name: 'Decreto n° 4.377' },
      { id: 'lei-11340', name: 'Lei nº 11.340' },
      { id: 'codigo-penal-140', name: 'Código Penal Brasileiro (art. 140)' },
      { id: 'lei-9455', name: 'Lei n° 9.455' }
    ]
  }
]

export const getSubjectById = (id: string): Subject | undefined => {
  return subjectsData.find(subject => subject.id === id)
}

export const getTopicById = (subjectId: string, topicId: string): SubjectTopic | undefined => {
  const subject = getSubjectById(subjectId)
  return subject?.topics.find(topic => topic.id === topicId)
}

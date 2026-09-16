// =============================================================================
// ARQUIVO SOMENTE PARA DEMONSTRAÇÃO VISUAL — não faz parte do site "de verdade".
// Ele finge as respostas do servidor com dados de exemplo, para dar pra ver
// a interface completa (incluindo alunos, notas, chamada e boletim) sem
// precisar instalar o Node.js nem fazer login.
// =============================================================================

function paraISODemo(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function inicioDaSemanaDemo(data) {
  const nova = new Date(data);
  const diaSemana = nova.getDay();
  const deslocamento = diaSemana === 0 ? 1 : diaSemana === 6 ? -5 : 1 - diaSemana;
  nova.setDate(nova.getDate() + deslocamento);
  nova.setHours(0, 0, 0, 0);
  return nova;
}

const inicioSemDemo = inicioDaSemanaDemo(new Date());
function diaDemo(offset) {
  const d = new Date(inicioSemDemo);
  d.setDate(d.getDate() + offset);
  return paraISODemo(d);
}
function diaAtrasDemo(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return paraISODemo(d);
}

const USUARIO_DEMO = {
  id: 1,
  nome: "Maria Oliveira",
  email: "maria@escola.com.br",
  papel: "professor",
  cor: "#7C6FF0",
};

const DADOS_DEMO = {
  turmas: [
    { id: 1, nome: "6º Ano B", serie_ano: "Ensino Fundamental II", disciplina: "Matemática", cor: "#14B8A6", criado_por: 1, criado_por_nome: "Maria Oliveira", total_aulas: 3 },
    { id: 2, nome: "9º Ano A", serie_ano: "Ensino Fundamental II", disciplina: "História", cor: "#FF6B6B", criado_por: 1, criado_por_nome: "Maria Oliveira", total_aulas: 2 },
    { id: 3, nome: "3º Ano C", serie_ano: "Ensino Médio", disciplina: "Matemática", cor: "#4C6EF5", criado_por: 1, criado_por_nome: "Maria Oliveira", total_aulas: 1 },
    { id: 4, nome: "7º Ano A", serie_ano: "Ensino Fundamental II", disciplina: "Ciências", cor: "#F5A623", criado_por: 1, criado_por_nome: "Maria Oliveira", total_aulas: 1 },
  ],

  aulas: [
    {
      id: 1, professor_id: 1, professor_nome: "Maria Oliveira", professor_cor: "#7C6FF0",
      turma_id: 1, turma_nome: "6º Ano B", turma_cor: "#14B8A6",
      titulo: "Introdução a frações", conteudo: "Conceito de fração como parte de um todo, usando exemplos de pizza e chocolate divididos em partes iguais.",
      objetivos: "Reconhecer frações no dia a dia e representar frações simples usando desenhos.",
      metodologia: "Aula expositiva seguida de atividade em dupla com material concreto (barras de fração de papel).",
      recursos: "Barras de fração impressas, quadro branco, projetor.",
      avaliacao: "Observação da participação e uma lista de exercícios curta ao final da aula.",
      data: diaDemo(0), horario_inicio: "07:30:00", horario_fim: "08:20:00", status: "planejada",
      sugestoes_ia: null,
    },
    {
      id: 2, professor_id: 1, professor_nome: "Maria Oliveira", professor_cor: "#7C6FF0",
      turma_id: 2, turma_nome: "9º Ano A", turma_cor: "#FF6B6B",
      titulo: "Revolução Industrial: causas e consequências", conteudo: "Contexto histórico da Revolução Industrial na Inglaterra, mudanças no trabalho e na vida urbana.",
      objetivos: "Relacionar mudanças tecnológicas do século XVIII/XIX com transformações sociais que ainda vemos hoje.",
      metodologia: "Roda de debate a partir de um vídeo curto, seguida de registro em mapa mental.",
      recursos: "Vídeo documentário (10 min), projetor, cartolina para mapa mental.",
      avaliacao: "Mapa mental produzido em grupo, entregue ao final da aula.",
      data: diaDemo(1), horario_inicio: "09:00:00", horario_fim: "09:50:00", status: "planejada",
      sugestoes_ia: JSON.stringify({
        pontos_fortes: [
          "Uso de recurso audiovisual para engajar a turma antes da discussão teórica",
          "Avaliação formativa integrada à atividade, sem prova separada",
        ],
        sugestoes: [
          { titulo: "Conectar com o presente", descricao: "Peça que os alunos relacionem a automação da Revolução Industrial com a automação e IA de hoje — cria ponte com a realidade deles." },
          { titulo: "Diferenciação para diferentes ritmos", descricao: "Para alunos que terminarem o mapa mental antes, prepare uma pergunta extra sobre condições de trabalho infantil na época." },
          { titulo: "Fechamento estruturado", descricao: "Reserve os últimos 5 minutos para cada grupo apresentar 1 ideia do mapa mental em voz alta, consolidando o aprendizado." },
        ],
        pergunta_reflexao: "Como você vai garantir que os alunos mais quietos também participem da roda de debate?",
      }),
    },
    {
      id: 3, professor_id: 1, professor_nome: "Maria Oliveira", professor_cor: "#7C6FF0",
      turma_id: 3, turma_nome: "3º Ano C", turma_cor: "#4C6EF5",
      titulo: "Funções do 2º grau: gráfico da parábola", conteudo: "Construção do gráfico de uma função quadrática e identificação de vértice, raízes e concavidade.",
      objetivos: "Esboçar o gráfico de uma função do 2º grau a partir dos coeficientes a, b e c.",
      metodologia: "Demonstração no quadro seguida de exercícios práticos com calculadora gráfica.",
      recursos: "Calculadoras gráficas, papel quadriculado.",
      avaliacao: "Exercícios resolvidos em sala, corrigidos em conjunto.",
      data: diaDemo(3), horario_inicio: "13:40:00", horario_fim: "14:30:00", status: "planejada",
      sugestoes_ia: null,
    },
    {
      id: 4, professor_id: 1, professor_nome: "Maria Oliveira", professor_cor: "#7C6FF0",
      turma_id: 4, turma_nome: "7º Ano A", turma_cor: "#F5A623",
      titulo: "Ciclo da água", conteudo: "Etapas do ciclo da água: evaporação, condensação, precipitação e infiltração.",
      objetivos: "Explicar com palavras próprias cada etapa do ciclo da água e sua importância ambiental.",
      metodologia: "Experimento simples com água quente e um prato frio para demonstrar condensação.",
      recursos: "Copo, água quente, prato, gelo.",
      avaliacao: "Desenho do ciclo da água com legendas, feito em sala.",
      data: diaDemo(4), horario_inicio: "10:10:00", horario_fim: "11:00:00", status: "realizada",
      sugestoes_ia: null,
    },
    {
      id: 5, professor_id: 1, professor_nome: "Maria Oliveira", professor_cor: "#7C6FF0",
      turma_id: 1, turma_nome: "6º Ano B", turma_cor: "#14B8A6",
      titulo: "Frações equivalentes", conteudo: "Como identificar e criar frações equivalentes usando multiplicação e divisão.",
      objetivos: "Simplificar frações e reconhecer frações equivalentes em situações do cotidiano.",
      metodologia: "Jogo em grupos com cartas de frações para formar pares equivalentes.",
      recursos: "Cartas de frações impressas.",
      avaliacao: "Observação do jogo em grupo.",
      data: diaDemo(2), horario_inicio: "08:20:00", horario_fim: "09:10:00", status: "planejada",
      sugestoes_ia: null,
    },
  ],

  alunos: [
    { id: 1, turma_id: 1, nome: "Ana Beatriz Souza", matricula: "2026001", ativo: true },
    { id: 2, turma_id: 1, nome: "Bruno Costa Lima", matricula: "2026002", ativo: true },
    { id: 3, turma_id: 1, nome: "Carla Mendes Rocha", matricula: "2026003", ativo: true },
    { id: 4, turma_id: 1, nome: "Diego Fernandes", matricula: "2026004", ativo: true },
    { id: 5, turma_id: 1, nome: "Elisa Prado Santos", matricula: "2026005", ativo: true },
    { id: 6, turma_id: 2, nome: "Felipe Araújo", matricula: "2026006", ativo: true },
    { id: 7, turma_id: 2, nome: "Gabriela Nunes", matricula: "2026007", ativo: true },
    { id: 8, turma_id: 2, nome: "Henrique Dias", matricula: "2026008", ativo: true },
    { id: 9, turma_id: 2, nome: "Isabela Martins", matricula: "2026009", ativo: true },
    { id: 10, turma_id: 3, nome: "João Pedro Alves", matricula: "2026010", ativo: true },
    { id: 11, turma_id: 3, nome: "Karina Ribeiro", matricula: "2026011", ativo: true },
    { id: 12, turma_id: 3, nome: "Lucas Teixeira", matricula: "2026012", ativo: true },
    { id: 13, turma_id: 4, nome: "Mariana Castro", matricula: "2026013", ativo: true },
    { id: 14, turma_id: 4, nome: "Nicolas Barbosa", matricula: "2026014", ativo: true },
    { id: 15, turma_id: 4, nome: "Olívia Farias", matricula: "2026015", ativo: true },
  ],

  avaliacoes: [
    { id: 1, turma_id: 1, bimestre: 1, titulo: "Prova bimestral", peso: 3, data: diaAtrasDemo(10), criado_por: 1 },
    { id: 2, turma_id: 1, bimestre: 1, titulo: "Trabalho em grupo", peso: 1, data: diaAtrasDemo(18), criado_por: 1 },
    { id: 3, turma_id: 1, bimestre: 1, titulo: "Participação", peso: 1, data: null, criado_por: 1 },
  ],

  notas: [
    { id: 1, avaliacao_id: 1, aluno_id: 1, valor: 8.5 },
    { id: 2, avaliacao_id: 1, aluno_id: 2, valor: 6.0 },
    { id: 3, avaliacao_id: 1, aluno_id: 3, valor: 9.0 },
    { id: 4, avaliacao_id: 1, aluno_id: 4, valor: 4.5 },
    { id: 5, avaliacao_id: 1, aluno_id: 5, valor: 7.0 },
    { id: 6, avaliacao_id: 2, aluno_id: 1, valor: 9.0 },
    { id: 7, avaliacao_id: 2, aluno_id: 2, valor: 8.0 },
    { id: 8, avaliacao_id: 2, aluno_id: 3, valor: 10 },
    { id: 9, avaliacao_id: 2, aluno_id: 4, valor: 7.0 },
    { id: 10, avaliacao_id: 2, aluno_id: 5, valor: 8.5 },
    { id: 11, avaliacao_id: 3, aluno_id: 1, valor: 10 },
    { id: 12, avaliacao_id: 3, aluno_id: 2, valor: 7.0 },
    { id: 13, avaliacao_id: 3, aluno_id: 3, valor: 10 },
    { id: 14, avaliacao_id: 3, aluno_id: 5, valor: 9.0 },
  ],

  chamadas: {
    [`1-${diaAtrasDemo(3)}`]: {
      id: 1,
      presencas: { 1: "presente", 2: "presente", 3: "falta", 4: "presente", 5: "falta_justificada" },
    },
    [`1-${diaAtrasDemo(10)}`]: {
      id: 2,
      presencas: { 1: "presente", 2: "falta", 3: "presente", 4: "presente", 5: "presente" },
    },
    [`1-${diaAtrasDemo(17)}`]: {
      id: 3,
      presencas: { 1: "presente", 2: "presente", 3: "presente", 4: "falta", 5: "presente" },
    },
  },
};

let proximoIdTurma = 5;
let proximoIdAula = 6;
let proximoIdAluno = 16;
let proximoIdAvaliacao = 4;
let proximoIdNota = 15;
let proximoIdChamada = 4;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calcularBoletimDemo(turmaId, bimestre) {
  const turma = DADOS_DEMO.turmas.find((t) => t.id === turmaId);
  const alunos = DADOS_DEMO.alunos.filter((a) => a.turma_id === turmaId && a.ativo);
  const avaliacoes = DADOS_DEMO.avaliacoes.filter((av) => av.turma_id === turmaId && av.bimestre === bimestre);
  const somaPesos = avaliacoes.reduce((soma, a) => soma + a.peso, 0);

  const chamadasDaTurma = Object.entries(DADOS_DEMO.chamadas).filter(([chave]) => chave.startsWith(`${turmaId}-`));

  const boletim = alunos.map((aluno) => {
    const notasDoAluno = avaliacoes.map((av) => {
      const nota = DADOS_DEMO.notas.find((n) => n.avaliacao_id === av.id && n.aluno_id === aluno.id);
      return { avaliacao_id: av.id, titulo: av.titulo, peso: av.peso, valor: nota ? nota.valor : null };
    });
    const lancadas = notasDoAluno.filter((n) => n.valor !== null && n.valor !== undefined);
    const pesoLancado = lancadas.reduce((soma, n) => soma + n.peso, 0);
    const media = pesoLancado > 0 ? Math.round((lancadas.reduce((soma, n) => soma + n.valor * n.peso, 0) / pesoLancado) * 100) / 100 : null;

    let presentes = 0, faltas = 0, faltasJustificadas = 0, total = 0;
    chamadasDaTurma.forEach(([, chamada]) => {
      const status = chamada.presencas[aluno.id];
      if (status) {
        total++;
        if (status === "presente") presentes++;
        else if (status === "falta") faltas++;
        else if (status === "falta_justificada") faltasJustificadas++;
      }
    });
    const freqPercentual = total > 0 ? Math.round(((presentes + faltasJustificadas) / total) * 1000) / 10 : null;

    return {
      aluno_id: aluno.id, aluno_nome: aluno.nome, matricula: aluno.matricula,
      notas: notasDoAluno, media,
      completo: lancadas.length === avaliacoes.length && avaliacoes.length > 0,
      frequencia_percentual: freqPercentual, total_faltas: faltas,
    };
  });

  return {
    turma: { id: turma.id, nome: turma.nome, serie_ano: turma.serie_ano, disciplina: turma.disciplina },
    bimestre, avaliacoes, peso_total: somaPesos, boletim,
  };
}

api.get = async function (caminho) {
  await esperar(250);
  const [rota, queryString] = caminho.split("?");
  const params = new URLSearchParams(queryString || "");

  if (rota === "/turmas") {
    const turmasComExtras = DADOS_DEMO.turmas.map((t) => {
      const totalAlunos = DADOS_DEMO.alunos.filter((a) => a.turma_id === t.id && a.ativo).length;
      const datasChamada = Object.keys(DADOS_DEMO.chamadas).filter((chave) => chave.startsWith(`${t.id}-`)).map((chave) => chave.split("-").slice(1).join("-"));
      const ultimaChamada = datasChamada.length ? datasChamada.sort().pop() : null;
      return { ...t, total_alunos: totalAlunos, ultima_chamada: ultimaChamada };
    });
    return { turmas: turmasComExtras };
  }
  if (rota === "/aulas") return { aulas: DADOS_DEMO.aulas };

  if (rota === "/alunos") {
    const turmaId = Number(params.get("turma_id"));
    return { alunos: DADOS_DEMO.alunos.filter((a) => a.turma_id === turmaId && a.ativo) };
  }

  if (rota === "/avaliacoes") {
    const turmaId = Number(params.get("turma_id"));
    const bimestre = Number(params.get("bimestre"));
    return { avaliacoes: DADOS_DEMO.avaliacoes.filter((av) => av.turma_id === turmaId && av.bimestre === bimestre) };
  }

  const notasAvaliacao = rota.match(/^\/avaliacoes\/(\d+)\/notas$/);
  if (notasAvaliacao) {
    const avaliacaoId = Number(notasAvaliacao[1]);
    const avaliacao = DADOS_DEMO.avaliacoes.find((av) => av.id === avaliacaoId);
    const alunosDaTurma = DADOS_DEMO.alunos.filter((a) => a.turma_id === avaliacao.turma_id && a.ativo);
    const notas = alunosDaTurma.map((a) => {
      const nota = DADOS_DEMO.notas.find((n) => n.avaliacao_id === avaliacaoId && n.aluno_id === a.id);
      return { aluno_id: a.id, aluno_nome: a.nome, valor: nota ? nota.valor : null };
    });
    return { avaliacao, notas };
  }

  if (rota === "/chamada") {
    const turmaId = Number(params.get("turma_id"));
    const data = params.get("data");
    const alunosDaTurma = DADOS_DEMO.alunos.filter((a) => a.turma_id === turmaId && a.ativo);
    const chamada = DADOS_DEMO.chamadas[`${turmaId}-${data}`];
    const alunos = alunosDaTurma.map((a) => ({
      id: a.id, nome: a.nome, matricula: a.matricula,
      status: (chamada && chamada.presencas[a.id]) || "presente",
    }));
    return { chamada_id: chamada ? chamada.id : null, ja_feita: Boolean(chamada), alunos };
  }

  const boletimTurma = rota.match(/^\/boletim\/(\d+)$/);
  if (boletimTurma) {
    const turmaId = Number(boletimTurma[1]);
    const bimestre = Number(params.get("bimestre")) || 1;
    return calcularBoletimDemo(turmaId, bimestre);
  }

  if (rota === "/auth/usuarios") {
    return { usuarios: [{ id: 1, nome: USUARIO_DEMO.nome, email: USUARIO_DEMO.email, papel: USUARIO_DEMO.papel, cor: USUARIO_DEMO.cor }] };
  }

  if (rota === "/atividade") {
    const atividade = [
      { tipo: "chamada", descricao: diaAtrasDemo(3), turma_nome: "6º Ano B", professor_nome: USUARIO_DEMO.nome, quando: new Date(Date.now() - 3 * 3600 * 1000).toISOString().replace("T", " ").slice(0, 19) },
      { tipo: "nota", descricao: "Prova bimestral", turma_nome: "6º Ano B", professor_nome: USUARIO_DEMO.nome, quando: new Date(Date.now() - 26 * 3600 * 1000).toISOString().replace("T", " ").slice(0, 19) },
      { tipo: "aula", descricao: "Revolução Industrial: causas e consequências", turma_nome: "9º Ano A", professor_nome: USUARIO_DEMO.nome, quando: new Date(Date.now() - 50 * 3600 * 1000).toISOString().replace("T", " ").slice(0, 19) },
    ];
    return { atividade };
  }

  if (rota === "/painel/resumo") {
    const turmasSemChamada = DADOS_DEMO.turmas
      .map((t) => {
        const datasChamada = Object.keys(DADOS_DEMO.chamadas).filter((chave) => chave.startsWith(`${t.id}-`)).map((chave) => chave.split("-").slice(1).join("-"));
        const ultimaChamada = datasChamada.length ? datasChamada.sort().pop() : null;
        const dias = ultimaChamada ? Math.floor((Date.now() - new Date(ultimaChamada + "T00:00:00").getTime()) / 86400000) : null;
        return { id: t.id, nome: t.nome, cor: t.cor, ultima_chamada: ultimaChamada, dias };
      })
      .filter((t) => t.dias === null || t.dias > 7);

    const avaliacoesPendentes = DADOS_DEMO.avaliacoes
      .map((av) => {
        const totalAlunos = DADOS_DEMO.alunos.filter((a) => a.turma_id === av.turma_id && a.ativo).length;
        const notasLancadas = DADOS_DEMO.notas.filter((n) => n.avaliacao_id === av.id && n.valor !== null && n.valor !== undefined).length;
        const turma = DADOS_DEMO.turmas.find((t) => t.id === av.turma_id);
        return { id: av.id, titulo: av.titulo, turma_id: av.turma_id, turma_nome: turma.nome, turma_cor: turma.cor, total_alunos: totalAlunos, notas_lancadas: notasLancadas };
      })
      .filter((av) => av.total_alunos > 0 && av.notas_lancadas < av.total_alunos);

    return { turmas_sem_chamada_recente: turmasSemChamada, avaliacoes_pendentes: avaliacoesPendentes };
  }

  return {};
};

api.post = async function (caminho, body) {
  await esperar(500);
  const [rota] = caminho.split("?");

  if (rota === "/turmas") {
    const nova = { id: proximoIdTurma++, criado_por: 1, criado_por_nome: USUARIO_DEMO.nome, total_aulas: 0, cor: "#F783AC", ...body };
    DADOS_DEMO.turmas.push(nova);
    return { turma: nova };
  }

  if (rota === "/aulas") {
    const turma = DADOS_DEMO.turmas.find((t) => t.id === Number(body.turma_id));
    const nova = {
      id: proximoIdAula++, professor_id: 1, professor_nome: USUARIO_DEMO.nome, professor_cor: USUARIO_DEMO.cor,
      turma_nome: turma.nome, turma_cor: turma.cor, sugestoes_ia: null, status: "planejada", ...body,
    };
    DADOS_DEMO.aulas.push(nova);
    return { aula: nova };
  }

  if (rota === "/ia/sugestoes") {
    return {
      sugestoes: {
        pontos_fortes: [
          "O conteúdo está claro e adequado para a série informada",
          "Já existe uma forma de avaliação prevista, o que facilita acompanhar a aprendizagem",
        ],
        sugestoes: [
          { titulo: "Comece com uma pergunta disparadora", descricao: "Abra a aula perguntando algo que conecte o conteúdo à vivência dos alunos — isso aumenta o engajamento inicial." },
          { titulo: "Inclua um momento de trabalho em dupla", descricao: "Alunos aprendem bem explicando uns para os outros; reserve 5-10 minutos para isso no meio da aula." },
          { titulo: "Preveja uma atividade extra", descricao: "Tenha algo pronto para quem terminar antes, evitando dispersão da turma." },
        ],
        pergunta_reflexao: "Essa aula ficaria mais rica se os alunos produzissem algo, além de ouvir e responder?",
      },
    };
  }

  if (rota === "/alunos") {
    const novo = { id: proximoIdAluno++, ativo: true, ...body, turma_id: Number(body.turma_id) };
    DADOS_DEMO.alunos.push(novo);
    return { aluno: novo };
  }

  if (rota === "/alunos/lote") {
    const turmaId = Number(body.turma_id);
    (body.nomes || []).forEach((nome) => {
      DADOS_DEMO.alunos.push({ id: proximoIdAluno++, turma_id: turmaId, nome, matricula: null, ativo: true });
    });
    return { alunos: DADOS_DEMO.alunos.filter((a) => a.turma_id === turmaId && a.ativo) };
  }

  if (rota === "/avaliacoes") {
    const nova = { id: proximoIdAvaliacao++, criado_por: 1, ...body, turma_id: Number(body.turma_id), bimestre: Number(body.bimestre), peso: Number(body.peso) || 1 };
    DADOS_DEMO.avaliacoes.push(nova);
    return { avaliacao: nova };
  }

  const salvarNotas = rota.match(/^\/avaliacoes\/(\d+)\/notas$/);
  if (salvarNotas) {
    const avaliacaoId = Number(salvarNotas[1]);
    (body.notas || []).forEach((item) => {
      const valor = item.valor === "" || item.valor === null || item.valor === undefined ? null : Number(item.valor);
      const existente = DADOS_DEMO.notas.find((n) => n.avaliacao_id === avaliacaoId && n.aluno_id === Number(item.aluno_id));
      if (existente) existente.valor = valor;
      else DADOS_DEMO.notas.push({ id: proximoIdNota++, avaliacao_id: avaliacaoId, aluno_id: Number(item.aluno_id), valor });
    });
    return { ok: true };
  }

  if (rota === "/chamada") {
    const chave = `${body.turma_id}-${body.data}`;
    if (!DADOS_DEMO.chamadas[chave]) DADOS_DEMO.chamadas[chave] = { id: proximoIdChamada++, presencas: {} };
    (body.presencas || []).forEach((p) => {
      DADOS_DEMO.chamadas[chave].presencas[p.aluno_id] = p.status;
    });
    return { ok: true, chamada_id: DADOS_DEMO.chamadas[chave].id };
  }

  const redefinirSenha = rota.match(/^\/auth\/usuarios\/(\d+)\/redefinir-senha$/);
  if (redefinirSenha) {
    return { ok: true };
  }

  return {};
};

api.put = async function (caminho, body) {
  await esperar(500);
  const id = Number(caminho.split("/").pop());

  if (caminho.startsWith("/aulas/")) {
    const aula = DADOS_DEMO.aulas.find((a) => a.id === id);
    if (aula) {
      Object.assign(aula, body);
      if (body.turma_id) {
        const turma = DADOS_DEMO.turmas.find((t) => t.id === Number(body.turma_id));
        aula.turma_nome = turma.nome;
        aula.turma_cor = turma.cor;
      }
    }
    return { aula };
  }

  if (caminho.startsWith("/turmas/")) {
    const turma = DADOS_DEMO.turmas.find((t) => t.id === id);
    if (turma) Object.assign(turma, body);
    return { turma };
  }

  if (caminho === "/auth/perfil") {
    USUARIO_DEMO.nome = body.nome || USUARIO_DEMO.nome;
    return { usuario: { ...USUARIO_DEMO } };
  }

  if (caminho === "/auth/senha") {
    return { ok: true };
  }

  return { ok: true };
};

api.delete = async function (caminho) {
  await esperar(400);

  if (caminho.startsWith("/aulas/")) {
    const id = Number(caminho.split("/").pop());
    DADOS_DEMO.aulas = DADOS_DEMO.aulas.filter((a) => a.id !== id);
  }
  if (caminho.startsWith("/turmas/")) {
    const id = Number(caminho.split("/").pop());
    DADOS_DEMO.turmas = DADOS_DEMO.turmas.filter((t) => t.id !== id);
    DADOS_DEMO.aulas = DADOS_DEMO.aulas.filter((a) => a.turma_id !== id);
  }
  if (caminho.startsWith("/alunos/")) {
    const id = Number(caminho.split("/").pop());
    const aluno = DADOS_DEMO.alunos.find((a) => a.id === id);
    if (aluno) aluno.ativo = false;
  }
  if (caminho.startsWith("/avaliacoes/")) {
    const id = Number(caminho.split("/").pop());
    DADOS_DEMO.avaliacoes = DADOS_DEMO.avaliacoes.filter((av) => av.id !== id);
    DADOS_DEMO.notas = DADOS_DEMO.notas.filter((n) => n.avaliacao_id !== id);
  }

  return { ok: true };
};

document.addEventListener("DOMContentLoaded", () => {
  const avisoDemo = document.createElement("div");
  avisoDemo.textContent = "🎨 Modo de demonstração — dados fictícios, nada é salvo de verdade";
  avisoDemo.style.cssText = "position:fixed; bottom:0; left:0; right:0; background:#1B1D2A; color:#FFC857; text-align:center; font-size:0.8rem; padding:8px; z-index:999; font-family:Inter, sans-serif;";
  document.body.appendChild(avisoDemo);

  iniciarApp(USUARIO_DEMO);
});

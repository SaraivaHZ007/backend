const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DIAS_UTEIS_INDICES = [1, 2, 3, 4, 5, 6]; // segunda a sábado

const estado = {
  usuario: null,
  turmas: [],
  aulas: [],
  vista: "dashboard",
  inicioSemana: inicioDaSemana(new Date()),
  filtroTurma: "",
  filtroStatus: "",
  // navegação dentro do detalhe de uma turma (alunos / notas / chamada / boletim)
  turmaDetalheId: null,
  abaTurmaDetalhe: "alunos",
  bimestreSelecionado: 1,
  dataChamada: null,
  chamadaAtual: [],
};

// ============================================================================
// Inicialização do app depois do login
// ============================================================================

async function iniciarApp(usuario) {
  estado.usuario = usuario;

  document.getElementById("tela-login")?.classList.add("oculto");
  document.getElementById("tela-cadastro")?.classList.add("oculto");
  document.getElementById("app").classList.remove("oculto");

  document.getElementById("nome-usuario").textContent = usuario.nome;
  document.getElementById("papel-usuario").textContent = usuario.papel;
  const avatar = document.getElementById("avatar-usuario");
  avatar.style.background = usuario.cor;
  avatar.textContent = usuario.nome.trim().charAt(0).toUpperCase();

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => mudarVista(btn.dataset.vista));
  });

  document.getElementById("btn-menu-mobile").addEventListener("click", () => {
    abrirFecharMenuMobile();
  });
  document.getElementById("fundo-menu-mobile").addEventListener("click", () => {
    fecharMenuMobile();
  });

  await Promise.all([carregarTurmas(), carregarAulas()]);
  mudarVista("dashboard");
}

function abrirFecharMenuMobile() {
  const aberto = document.getElementById("barra-lateral").classList.toggle("aberta");
  document.getElementById("fundo-menu-mobile").classList.toggle("visivel", aberto);
}

function fecharMenuMobile() {
  document.getElementById("barra-lateral").classList.remove("aberta");
  document.getElementById("fundo-menu-mobile").classList.remove("visivel");
}

function mudarVista(vista) {
  estado.vista = vista;
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("ativo", btn.dataset.vista === vista);
  });
  fecharMenuMobile();

  const renderizadores = {
    dashboard: renderizarDashboard,
    semana: renderizarSemana,
    aulas: renderizarAulas,
    turmas: renderizarTurmas,
  };
  renderizadores[vista]();
}

async function carregarTurmas() {
  const { turmas } = await api.get("/turmas");
  estado.turmas = turmas;
}

async function carregarAulas() {
  const { aulas } = await api.get("/aulas");
  estado.aulas = aulas;
}

function mapaturmaPorId(id) {
  return estado.turmas.find((t) => t.id === Number(id));
}

// ============================================================================
// Dashboard
// ============================================================================

async function renderizarDashboard() {
  const raiz = document.getElementById("vista-conteudo");
  const hojeISO = paraISO(new Date());
  const inicioSem = estado.inicioSemana;
  const fimSem = somarDias(inicioSem, 5);

  const aulasHoje = estado.aulas.filter((a) => a.data === hojeISO);
  const aulasSemana = estado.aulas.filter((a) => a.data >= paraISO(inicioSem) && a.data <= paraISO(fimSem));
  const proximasAulas = estado.aulas
    .filter((a) => a.data >= hojeISO && a.status === "planejada")
    .sort((a, b) => (a.data + a.horario_inicio).localeCompare(b.data + b.horario_inicio))
    .slice(0, 6);

  raiz.innerHTML = `
    <div class="topo-pagina">
      <div>
        <h1>Olá, ${escaparHtml(primeiroNome(estado.usuario.nome))} 👋</h1>
        <p class="legenda">${estado.usuario.papel === "coordenador" ? "Aqui está a visão geral de toda a equipe." : "Aqui está o resumo do seu planejamento."}</p>
      </div>
      <button class="btn btn-primario" onclick="abrirModalAula()">${icones.mais} Nova aula</button>
    </div>

    <div class="grade-resumo">
      <div class="cartao cartao-resumo" style="background:var(--primary-soft); color:var(--primary-dark);">
        <span class="numero">${aulasHoje.length}</span>
        <span class="rotulo">Aulas hoje</span>
      </div>
      <div class="cartao cartao-resumo" style="background:var(--teal-soft); color:#0D8A7A;">
        <span class="numero">${aulasSemana.length}</span>
        <span class="rotulo">Aulas nesta semana</span>
      </div>
      <div class="cartao cartao-resumo" style="background:var(--amarelo-soft); color:#8A5A00;">
        <span class="numero">${estado.turmas.length}</span>
        <span class="rotulo">Turmas cadastradas</span>
      </div>
      <div class="cartao cartao-resumo" style="background:var(--rosa-soft); color:#B4477A;">
        <span class="numero">${estado.aulas.filter((a) => a.sugestoes_ia).length}</span>
        <span class="rotulo">Aulas com sugestões da IA</span>
      </div>
    </div>

    <div id="secao-pendencias"></div>

    <div style="display:grid; grid-template-columns: 1.3fr 1fr; gap:20px; align-items:flex-start;" id="grade-dashboard-inferior">
      <div class="cartao">
        <h3 style="margin-bottom:14px;">Próximas aulas planejadas</h3>
        ${proximasAulas.length ? `<div class="lista-aulas">${proximasAulas.map((a) => cartaoAulaHtml(a)).join("")}</div>` : estadoVazioHtml("Nenhuma aula planejada pela frente. Que tal criar uma agora?")}
      </div>
      <div class="cartao">
        <h3 style="margin-bottom:6px;">${icones.pulso} Atividade recente</h3>
        <div id="lista-atividade">${skeletonListaHtml(3)}</div>
      </div>
    </div>
  `;

  // ajusta o layout inferior para uma coluna em telas estreitas
  const mediaQuery = window.matchMedia("(max-width: 900px)");
  const ajustarColunas = () => {
    document.getElementById("grade-dashboard-inferior").style.gridTemplateColumns = mediaQuery.matches ? "1fr" : "1.3fr 1fr";
  };
  ajustarColunas();
  mediaQuery.addEventListener("change", ajustarColunas);

  carregarPendencias();
  carregarAtividadeRecente();
}

async function carregarPendencias() {
  try {
    const resumo = await api.get("/painel/resumo");
    const container = document.getElementById("secao-pendencias");
    if (!container) return;

    const pendencias = [
      ...resumo.turmas_sem_chamada_recente.map((t) => ({
        cor: t.cor, turma: t.nome,
        texto: `Sem chamada registrada${t.ultima_chamada ? " há mais de 7 dias" : " ainda"}`,
        aoClicar: `abrirTurmaDetalhe(${t.id})`,
      })),
      ...resumo.avaliacoes_pendentes.map((av) => ({
        cor: av.turma_cor, turma: av.turma_nome,
        texto: `"${av.titulo}" com notas pendentes (${av.notas_lancadas}/${av.total_alunos} lançadas)`,
        aoClicar: `abrirTurmaDetalhe(${av.turma_id})`,
      })),
    ];

    if (pendencias.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <div class="cartao" style="margin-bottom:22px;">
        <h3 style="margin-bottom:10px;">${icones.aviso} Pendências</h3>
        <div>
          ${pendencias.slice(0, 6).map((p) => `
            <div class="cartao-pendencia" style="cursor:pointer;" onclick="${p.aoClicar}">
              <span class="pilula-turma" style="background:${p.cor}"></span>
              <span class="texto-pendencia"><b>${escaparHtml(p.turma)}</b>${escaparHtml(p.texto)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } catch {
    const container = document.getElementById("secao-pendencias");
    if (container) container.innerHTML = "";
  }
}

async function carregarAtividadeRecente() {
  try {
    const { atividade } = await api.get("/atividade");
    const container = document.getElementById("lista-atividade");
    if (!container) return;

    if (!atividade.length) {
      container.innerHTML = `<p class="legenda">Nenhuma atividade registrada ainda.</p>`;
      return;
    }

    const iconePorTipo = { aula: { icone: icones.livro, bg: "var(--primary-soft)", cor: "var(--primary-dark)" }, chamada: { icone: icones.presenca, bg: "var(--teal-soft)", cor: "#0D8A7A" }, nota: { icone: icones.lapis, bg: "var(--amarelo-soft)", cor: "#8A5A00" } };
    const textoPorTipo = (item) => {
      if (item.tipo === "aula") return `Aula <b>${escaparHtml(item.descricao)}</b> atualizada em ${escaparHtml(item.turma_nome)}`;
      if (item.tipo === "chamada") return `Chamada feita em <b>${escaparHtml(item.turma_nome)}</b> (${formatarDataCurta(item.descricao)})`;
      if (item.tipo === "nota") return `Notas de <b>${escaparHtml(item.descricao)}</b> lançadas em ${escaparHtml(item.turma_nome)}`;
      return "";
    };

    container.innerHTML = atividade.map((item) => {
      const estilo = iconePorTipo[item.tipo] || iconePorTipo.aula;
      return `
        <div class="item-atividade">
          <div class="icone-atividade" style="background:${estilo.bg}; color:${estilo.cor};">${estilo.icone}</div>
          <div>
            <div class="texto-atividade">${textoPorTipo(item)}</div>
            <div class="quando-atividade">${escaparHtml(item.professor_nome)} · ${tempoRelativo(item.quando)}</div>
          </div>
        </div>
      `;
    }).join("");
  } catch {
    const container = document.getElementById("lista-atividade");
    if (container) container.innerHTML = `<p class="legenda">Não foi possível carregar a atividade recente.</p>`;
  }
}

function tempoRelativo(dataHoraSQL) {
  if (!dataHoraSQL) return "";
  const data = new Date(dataHoraSQL.replace(" ", "T") + "Z");
  const diffMin = Math.round((Date.now() - data.getTime()) / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  const diffDias = Math.round(diffHoras / 24);
  return `há ${diffDias} dia${diffDias === 1 ? "" : "s"}`;
}

function primeiroNome(nomeCompleto) {
  return nomeCompleto.split(" ")[0];
}

// ============================================================================
// Minha Semana (grade estilo agenda)
// ============================================================================

function renderizarSemana() {
  const raiz = document.getElementById("vista-conteudo");
  const inicioSem = estado.inicioSemana;
  const dias = DIAS_UTEIS_INDICES.map((_, i) => somarDias(inicioSem, i));
  const horas = ["07:00", "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  const aulasDaSemana = estado.aulas.filter((a) => {
    const d = a.data;
    return d >= paraISO(inicioSem) && d <= paraISO(somarDias(inicioSem, 5));
  });

  raiz.innerHTML = `
    <div class="topo-pagina">
      <div>
        <h1>Minha Semana</h1>
        <p class="legenda">${formatarDataCurta(paraISO(inicioSem))} — ${formatarDataCurta(paraISO(somarDias(inicioSem, 5)))}</p>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secundario btn-peq" onclick="navegarSemana(-1)">← Anterior</button>
        <button class="btn btn-secundario btn-peq" onclick="irParaSemanaAtual()">Hoje</button>
        <button class="btn btn-secundario btn-peq" onclick="navegarSemana(1)">Próxima →</button>
        <button class="btn btn-primario btn-peq" onclick="abrirModalAula()">${icones.mais} Nova aula</button>
      </div>
    </div>

    <div class="planner-semana">
      <div class="celula cabecalho-dia"></div>
      ${dias.map((d) => `
        <div class="celula cabecalho-dia">
          <div class="dia-nome">${DIAS_SEMANA[d.getDay()]}</div>
          <div class="dia-data">${d.getDate()}/${d.getMonth() + 1}</div>
        </div>
      `).join("")}

      ${horas.map((hora) => `
        <div class="celula rotulo-hora">${hora}</div>
        ${dias.map((d) => {
          const iso = paraISO(d);
          const aulasNaHora = aulasDaSemana.filter((a) => a.data === iso && a.horario_inicio.slice(0, 5) <= hora && a.horario_fim.slice(0, 5) > hora && a.horario_inicio.slice(0,5) === hora);
          return `<div class="celula">${aulasNaHora.map((a) => blocoAulaHtml(a)).join("")}</div>`;
        }).join("")}
      `).join("")}
    </div>
  `;
}

function blocoAulaHtml(aula) {
  return `
    <div class="bloco-aula" style="background:${aula.turma_cor}22; border-color:${aula.turma_cor}; color:${escurecerCor(aula.turma_cor)}" onclick="abrirModalAula(${aula.id})">
      <span class="titulo-bloco">${aula.horario_inicio.slice(0,5)} · ${escaparHtml(aula.titulo)}</span>
      <span class="turma-bloco">${escaparHtml(aula.turma_nome)}</span>
    </div>
  `;
}

function navegarSemana(direcao) {
  estado.inicioSemana = somarDias(estado.inicioSemana, direcao * 7);
  renderizarSemana();
}

function irParaSemanaAtual() {
  estado.inicioSemana = inicioDaSemana(new Date());
  renderizarSemana();
}

// ============================================================================
// Lista de aulas com filtros
// ============================================================================

function renderizarAulas() {
  const raiz = document.getElementById("vista-conteudo");

  let lista = [...estado.aulas].sort((a, b) => (b.data + b.horario_inicio).localeCompare(a.data + a.horario_inicio));
  if (estado.filtroTurma) lista = lista.filter((a) => String(a.turma_id) === estado.filtroTurma);
  if (estado.filtroStatus) lista = lista.filter((a) => a.status === estado.filtroStatus);

  raiz.innerHTML = `
    <div class="topo-pagina">
      <div>
        <h1>Aulas</h1>
        <p class="legenda">${estado.usuario.papel === "coordenador" ? "Todas as aulas planejadas pela equipe." : "Todas as suas aulas planejadas."}</p>
      </div>
      <button class="btn btn-primario" onclick="abrirModalAula()">${icones.mais} Nova aula</button>
    </div>

    <div class="filtros">
      <select id="filtro-turma">
        <option value="">Todas as turmas</option>
        ${estado.turmas.map((t) => `<option value="${t.id}" ${estado.filtroTurma === String(t.id) ? "selected" : ""}>${escaparHtml(t.nome)}</option>`).join("")}
      </select>
      <select id="filtro-status">
        <option value="">Todos os status</option>
        <option value="planejada" ${estado.filtroStatus === "planejada" ? "selected" : ""}>Planejada</option>
        <option value="realizada" ${estado.filtroStatus === "realizada" ? "selected" : ""}>Realizada</option>
        <option value="cancelada" ${estado.filtroStatus === "cancelada" ? "selected" : ""}>Cancelada</option>
      </select>
    </div>

    <div class="lista-aulas">
      ${lista.length ? lista.map((a) => cartaoAulaHtml(a, true)).join("") : estadoVazioHtml("Nenhuma aula encontrada com esse filtro.")}
    </div>
  `;

  document.getElementById("filtro-turma").addEventListener("change", (e) => { estado.filtroTurma = e.target.value; renderizarAulas(); });
  document.getElementById("filtro-status").addEventListener("change", (e) => { estado.filtroStatus = e.target.value; renderizarAulas(); });
}

function cartaoAulaHtml(aula, comAcoes = false) {
  const selos = { planejada: "selo-planejada", realizada: "selo-realizada", cancelada: "selo-cancelada" };
  const rotulos = { planejada: "Planejada", realizada: "Realizada", cancelada: "Cancelada" };
  return `
    <div class="cartao cartao-aula">
      <div class="faixa-cor" style="background:${aula.turma_cor}"></div>
      <div class="miolo" style="cursor:pointer" onclick="abrirModalAula(${aula.id})">
        <div class="linha-topo">
          <span class="titulo-aula">${escaparHtml(aula.titulo)}</span>
          <span class="selo ${selos[aula.status]}">${rotulos[aula.status]}</span>
          ${aula.sugestoes_ia ? `<span class="selo" style="background:var(--rosa-soft); color:#B4477A;">${icones.varinha} IA</span>` : ""}
        </div>
        <div class="meta">
          <span>${icones.livro} ${escaparHtml(aula.turma_nome)}</span>
          <span>${icones.calendario} ${formatarDataLegivel(aula.data)}</span>
          <span>${icones.relogio} ${aula.horario_inicio.slice(0,5)} – ${aula.horario_fim.slice(0,5)}</span>
          ${estado.usuario.papel === "coordenador" ? `<span>${icones.usuarios} ${escaparHtml(aula.professor_nome)}</span>` : ""}
        </div>
      </div>
      <div class="acoes">
        <button class="btn btn-icone" title="Excluir" onclick="excluirAula(event, ${aula.id})">${icones.lixeira}</button>
      </div>
    </div>
  `;
}

async function excluirAula(evento, id) {
  evento.stopPropagation();
  if (!(await confirmarAcao("Tem certeza que quer excluir essa aula?"))) return;
  await api.delete(`/aulas/${id}`);
  await carregarAulas();
  mostrarToast("Aula excluída.", "sucesso");
  renderizadorAtual();
}

// ============================================================================
// Turmas
// ============================================================================

function renderizarTurmas() {
  const raiz = document.getElementById("vista-conteudo");

  raiz.innerHTML = `
    <div class="topo-pagina">
      <div>
        <h1>Turmas</h1>
        <p class="legenda">Cadastre as turmas para poder vinculá-las às suas aulas.</p>
      </div>
      <button class="btn btn-primario" onclick="abrirModalTurma()">${icones.mais} Nova turma</button>
    </div>

    <div class="grade-turmas">
      ${estado.turmas.length ? estado.turmas.map((t) => `
        <div class="cartao cartao-turma" style="border-top-color:${t.cor}; cursor:pointer;" onclick="abrirTurmaDetalhe(${t.id})">
          <span class="nome-turma">${escaparHtml(t.nome)}</span>
          <span class="detalhe-turma">${escaparHtml(t.serie_ano || "Série não informada")}${t.disciplina ? " · " + escaparHtml(t.disciplina) : ""}</span>
          ${diasDesde(t.ultima_chamada) === null || diasDesde(t.ultima_chamada) > 7 ? `<span class="selo-alerta">${icones.aviso} ${t.ultima_chamada ? "Sem chamada há " + diasDesde(t.ultima_chamada) + " dias" : "Nenhuma chamada feita"}</span>` : ""}
          <div class="rodape-turma">
            <span class="contagem">${t.total_aulas} aula${t.total_aulas === 1 ? "" : "s"} · ${t.total_alunos || 0} aluno${t.total_alunos === 1 ? "" : "s"}</span>
            <div style="display:flex; gap:2px;">
              <button class="btn btn-icone" title="Editar turma" onclick="event.stopPropagation(); abrirModalEditarTurma(${t.id})">${icones.lapis}</button>
              <button class="btn btn-icone" title="Excluir turma" onclick="event.stopPropagation(); excluirTurma(${t.id})">${icones.lixeira}</button>
            </div>
          </div>
        </div>
      `).join("") : `<div style="grid-column:1/-1;">${estadoVazioHtml("Nenhuma turma cadastrada ainda.")}</div>`}
    </div>
  `;
}

function diasDesde(dataISO) {
  if (!dataISO) return null;
  const diff = Date.now() - new Date(dataISO + "T00:00:00").getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

async function excluirTurma(id) {
  if (!(await confirmarAcao("Excluir essa turma vai excluir também todas as aulas vinculadas a ela. Continuar?"))) return;
  try {
    await api.delete(`/turmas/${id}`);
    await Promise.all([carregarTurmas(), carregarAulas()]);
    mostrarToast("Turma excluída.", "sucesso");
    renderizarTurmas();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

function abrirModalEditarTurma(turmaId) {
  const turma = mapaturmaPorId(turmaId);
  abrirModal(`
    <div class="modal-cabecalho"><h2>Editar turma</h2><button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button></div>
    <form id="form-editar-turma">
      <div class="modal-corpo">
        <div class="campo"><label for="edit-turma-nome">Nome da turma</label><input type="text" id="edit-turma-nome" value="${escaparHtml(turma.nome)}" required /></div>
        <div class="grade-2col">
          <div class="campo"><label for="edit-turma-serie">Série / ano</label><input type="text" id="edit-turma-serie" value="${escaparHtml(turma.serie_ano || "")}" /></div>
          <div class="campo"><label for="edit-turma-disciplina">Disciplina</label><input type="text" id="edit-turma-disciplina" value="${escaparHtml(turma.disciplina || "")}" /></div>
        </div>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Salvar alterações</button>
      </div>
    </form>
  `);

  document.getElementById("form-editar-turma").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.put(`/turmas/${turmaId}`, {
        nome: document.getElementById("edit-turma-nome").value,
        serie_ano: document.getElementById("edit-turma-serie").value,
        disciplina: document.getElementById("edit-turma-disciplina").value,
      });
      await carregarTurmas();
      fecharModal();
      mostrarToast("Turma atualizada.", "sucesso");
      renderizarTurmas();
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  });
}

// ============================================================================
// Detalhe da turma: Alunos, Notas, Chamada e Boletim
// ============================================================================

async function abrirTurmaDetalhe(turmaId) {
  estado.turmaDetalheId = turmaId;
  estado.abaTurmaDetalhe = "alunos";
  if (!estado.dataChamada) estado.dataChamada = paraISO(new Date());
  document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.toggle("ativo", btn.dataset.vista === "turmas"));
  fecharMenuMobile();
  await renderizarTurmaDetalhe();
}

async function renderizarTurmaDetalhe() {
  const turma = mapaturmaPorId(estado.turmaDetalheId);
  if (!turma) { mudarVista("turmas"); return; }

  const raiz = document.getElementById("vista-conteudo");
  raiz.innerHTML = `
    <button class="voltar-link" onclick="mudarVista('turmas')">${icones.voltar} Voltar para Turmas</button>
    <div class="cabecalho-turma">
      <span class="pilula-turma" style="background:${turma.cor}"></span>
      <h1>${escaparHtml(turma.nome)}</h1>
    </div>
    <p class="legenda" style="margin-bottom:20px;">${escaparHtml(turma.serie_ano || "Série não informada")}${turma.disciplina ? " · " + escaparHtml(turma.disciplina) : ""}</p>

    <div class="abas">
      <button class="aba ${estado.abaTurmaDetalhe === "alunos" ? "ativa" : ""}" onclick="mudarAbaTurma('alunos')">${icones.usuarios} Alunos</button>
      <button class="aba ${estado.abaTurmaDetalhe === "notas" ? "ativa" : ""}" onclick="mudarAbaTurma('notas')">${icones.lapis} Notas</button>
      <button class="aba ${estado.abaTurmaDetalhe === "chamada" ? "ativa" : ""}" onclick="mudarAbaTurma('chamada')">${icones.presenca} Chamada</button>
      <button class="aba ${estado.abaTurmaDetalhe === "boletim" ? "ativa" : ""}" onclick="mudarAbaTurma('boletim')">${icones.boletim} Boletim</button>
    </div>

    <div id="conteudo-aba-turma"><div class="vazio">Carregando...</div></div>
  `;

  const renderizadoresAba = { alunos: renderAbaAlunos, notas: renderAbaNotas, chamada: renderAbaChamada, boletim: renderAbaBoletim };
  await renderizadoresAba[estado.abaTurmaDetalhe](turma);
}

function mudarAbaTurma(aba) {
  estado.abaTurmaDetalhe = aba;
  renderizarTurmaDetalhe();
}

function mudarBimestre(bimestre) {
  estado.bimestreSelecionado = bimestre;
  const turma = mapaturmaPorId(estado.turmaDetalheId);
  if (estado.abaTurmaDetalhe === "notas") renderAbaNotas(turma);
  else if (estado.abaTurmaDetalhe === "boletim") renderAbaBoletim(turma);
}

// ---- Aba Alunos -------------------------------------------------------------

async function renderAbaAlunos(turma) {
  const container = document.getElementById("conteudo-aba-turma");
  const { alunos } = await api.get(`/alunos?turma_id=${turma.id}`);
  estado.alunosDaTurma = alunos;

  container.innerHTML = `
    <div class="topo-pagina" style="margin-bottom:14px;">
      <p class="legenda">${alunos.length} aluno${alunos.length === 1 ? "" : "s"} cadastrado${alunos.length === 1 ? "" : "s"} nessa turma.</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-secundario btn-peq" onclick="abrirModalAlunosLote(${turma.id})">${icones.colar} Colar lista de nomes</button>
        <button class="btn btn-primario btn-peq" onclick="abrirModalAluno(${turma.id})">${icones.mais} Adicionar aluno</button>
      </div>
    </div>
    ${alunos.length > 4 ? `
    <div class="campo-busca">
      ${icones.busca}
      <input type="text" id="busca-aluno" placeholder="Buscar aluno pelo nome..." />
    </div>` : ""}
    <div class="cartao" style="padding:0;" id="lista-alunos-container">
      ${alunosParaHtml(alunos, turma.id)}
    </div>
  `;

  const campoBusca = document.getElementById("busca-aluno");
  if (campoBusca) {
    campoBusca.addEventListener("input", (e) => {
      const termo = e.target.value.trim().toLowerCase();
      const filtrados = alunos.filter((a) => a.nome.toLowerCase().includes(termo));
      document.getElementById("lista-alunos-container").innerHTML = alunosParaHtml(filtrados, turma.id, alunos);
    });
  }
}

function alunosParaHtml(alunos, turmaId, listaCompleta) {
  if (!alunos.length) {
    return estadoVazioHtml(listaCompleta ? "Nenhum aluno encontrado com esse nome." : "Nenhum aluno cadastrado ainda. Adicione um por um ou cole a lista completa da turma.");
  }
  const baseParaNumero = listaCompleta || alunos;
  return alunos.map((a) => `
    <div class="linha-aluno">
      <div class="avatar-aluno">${baseParaNumero.indexOf(a) + 1}</div>
      <span class="nome-aluno">${escaparHtml(a.nome)}</span>
      ${a.matricula ? `<span class="matricula-aluno">Matrícula ${escaparHtml(a.matricula)}</span>` : ""}
      <button class="btn btn-icone" title="Remover aluno" onclick="excluirAluno(${a.id}, ${turmaId})">${icones.lixeira}</button>
    </div>
  `).join("");
}

function abrirModalAluno(turmaId) {
  abrirModal(`
    <div class="modal-cabecalho"><h2>Adicionar aluno</h2><button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button></div>
    <form id="form-aluno">
      <div class="modal-corpo">
        <div class="campo"><label for="aluno-nome">Nome completo</label><input type="text" id="aluno-nome" required /></div>
        <div class="campo"><label for="aluno-matricula">Matrícula (opcional)</label><input type="text" id="aluno-matricula" /></div>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Adicionar</button>
      </div>
    </form>
  `);

  document.getElementById("form-aluno").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.post("/alunos", {
        turma_id: turmaId,
        nome: document.getElementById("aluno-nome").value,
        matricula: document.getElementById("aluno-matricula").value,
      });
      fecharModal();
      mostrarToast("Aluno adicionado.", "sucesso");
      renderAbaAlunos(mapaturmaPorId(turmaId));
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  });
}

function abrirModalAlunosLote(turmaId) {
  abrirModal(`
    <div class="modal-cabecalho"><h2>Colar lista de alunos</h2><button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button></div>
    <form id="form-alunos-lote">
      <div class="modal-corpo">
        <div class="campo">
          <label for="lote-nomes">Um nome por linha</label>
          <textarea id="lote-nomes" style="min-height:180px;" placeholder="Ana Beatriz Souza&#10;Bruno Costa Lima&#10;Carla Mendes" required></textarea>
        </div>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Adicionar todos</button>
      </div>
    </form>
  `);

  document.getElementById("form-alunos-lote").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nomes = document.getElementById("lote-nomes").value.split("\n").map((n) => n.trim()).filter(Boolean);
    if (!nomes.length) return;
    try {
      await api.post("/alunos/lote", { turma_id: turmaId, nomes });
      fecharModal();
      mostrarToast(`${nomes.length} aluno(s) adicionados.`, "sucesso");
      renderAbaAlunos(mapaturmaPorId(turmaId));
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  });
}

async function excluirAluno(id, turmaId) {
  if (!(await confirmarAcao("Remover esse aluno da turma? O histórico de notas e chamada dele será mantido."))) return;
  await api.delete(`/alunos/${id}`);
  mostrarToast("Aluno removido.", "sucesso");
  renderAbaAlunos(mapaturmaPorId(turmaId));
}

// ---- Aba Notas ---------------------------------------------------------------

async function renderAbaNotas(turma) {
  const container = document.getElementById("conteudo-aba-turma");
  const { avaliacoes } = await api.get(`/avaliacoes?turma_id=${turma.id}&bimestre=${estado.bimestreSelecionado}`);

  container.innerHTML = `
    <div class="pills-bimestre">
      ${[1, 2, 3, 4].map((b) => `<button class="pill-bimestre ${estado.bimestreSelecionado === b ? "ativa" : ""}" onclick="mudarBimestre(${b})">${b}º Bimestre</button>`).join("")}
    </div>
    <div class="topo-pagina" style="margin-bottom:14px;">
      <p class="legenda">Cada avaliação pode ter um peso diferente na média final do bimestre.</p>
      <button class="btn btn-primario btn-peq" onclick="abrirModalAvaliacao(${turma.id})">${icones.mais} Nova avaliação</button>
    </div>
    <div class="lista-aulas">
      ${avaliacoes.length ? avaliacoes.map((av) => `
        <div class="cartao cartao-avaliacao">
          <div class="info-avaliacao">
            <span class="titulo-avaliacao">${escaparHtml(av.titulo)}</span>
            <span class="meta-avaliacao">Peso ${av.peso}${av.data ? " · " + formatarDataCurta(av.data) : ""}</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secundario btn-peq" onclick="abrirModalLancarNotas(${av.id}, ${turma.id})">${icones.lapis} Lançar notas</button>
            <button class="btn btn-icone" title="Excluir avaliação" onclick="excluirAvaliacao(${av.id}, ${turma.id})">${icones.lixeira}</button>
          </div>
        </div>
      `).join("") : estadoVazioHtml("Nenhuma avaliação cadastrada nesse bimestre ainda.")}
    </div>
  `;
}

function abrirModalAvaliacao(turmaId) {
  abrirModal(`
    <div class="modal-cabecalho"><h2>Nova avaliação — ${estado.bimestreSelecionado}º bimestre</h2><button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button></div>
    <form id="form-avaliacao">
      <div class="modal-corpo">
        <div class="campo"><label for="av-titulo">Título</label><input type="text" id="av-titulo" placeholder="Ex: Prova bimestral, Trabalho em grupo..." required /></div>
        <div class="grade-2col">
          <div class="campo"><label for="av-peso">Peso</label><input type="number" id="av-peso" min="0.5" step="0.5" value="1" required /></div>
          <div class="campo"><label for="av-data">Data (opcional)</label><input type="date" id="av-data" /></div>
        </div>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Criar avaliação</button>
      </div>
    </form>
  `);

  document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.post("/avaliacoes", {
        turma_id: turmaId,
        bimestre: estado.bimestreSelecionado,
        titulo: document.getElementById("av-titulo").value,
        peso: document.getElementById("av-peso").value,
        data: document.getElementById("av-data").value,
      });
      fecharModal();
      mostrarToast("Avaliação criada.", "sucesso");
      renderAbaNotas(mapaturmaPorId(turmaId));
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  });
}

async function excluirAvaliacao(id, turmaId) {
  if (!(await confirmarAcao("Excluir essa avaliação vai apagar também as notas já lançadas nela. Continuar?"))) return;
  await api.delete(`/avaliacoes/${id}`);
  mostrarToast("Avaliação excluída.", "sucesso");
  renderAbaNotas(mapaturmaPorId(turmaId));
}

async function abrirModalLancarNotas(avaliacaoId, turmaId) {
  abrirModal(`
    <div class="modal-cabecalho"><h2>Lançar notas</h2><button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button></div>
    <div class="modal-corpo"><div class="vazio">Carregando alunos...</div></div>
  `);

  const { avaliacao, notas } = await api.get(`/avaliacoes/${avaliacaoId}/notas`);

  const corpoModal = document.querySelector(".modal .modal-corpo");
  corpoModal.innerHTML = `
    <p class="legenda" style="margin-bottom:14px;">${escaparHtml(avaliacao.titulo)} · peso ${avaliacao.peso} · notas de 0 a 10</p>
    <div class="tabela-scroll">
      <table class="tabela-notas">
        <thead><tr><th>Aluno</th><th>Nota</th></tr></thead>
        <tbody>
          ${notas.map((n) => `
            <tr>
              <td class="col-nome">${escaparHtml(n.aluno_nome)}</td>
              <td><input type="number" class="input-nota" min="0" max="10" step="0.1" data-aluno-id="${n.aluno_id}" value="${n.valor ?? ""}" /></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  const modal = document.querySelector(".modal");
  const rodape = document.createElement("div");
  rodape.className = "modal-rodape";
  rodape.innerHTML = `<button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button><button type="button" class="btn btn-primario" id="btn-salvar-notas">Salvar notas</button>`;
  modal.appendChild(rodape);

  document.getElementById("btn-salvar-notas").addEventListener("click", async () => {
    const botao = document.getElementById("btn-salvar-notas");
    const notasParaSalvar = Array.from(document.querySelectorAll(".input-nota")).map((inp) => ({
      aluno_id: Number(inp.dataset.alunoId),
      valor: inp.value,
    }));

    botao.disabled = true;
    botao.innerHTML = `<span class="spinner spinner-escuro"></span> Salvando...`;
    try {
      await api.post(`/avaliacoes/${avaliacaoId}/notas`, { notas: notasParaSalvar });
      fecharModal();
      mostrarToast("Notas salvas.", "sucesso");
      if (estado.abaTurmaDetalhe === "notas") renderAbaNotas(mapaturmaPorId(turmaId));
    } catch (err) {
      mostrarToast(err.message, "erro");
      botao.disabled = false;
      botao.textContent = "Salvar notas";
    }
  });
}

// ---- Aba Chamada --------------------------------------------------------------

async function renderAbaChamada(turma) {
  const container = document.getElementById("conteudo-aba-turma");
  if (!estado.dataChamada) estado.dataChamada = paraISO(new Date());

  const { alunos, ja_feita } = await api.get(`/chamada?turma_id=${turma.id}&data=${estado.dataChamada}`);
  estado.chamadaAtual = alunos;

  container.innerHTML = `
    <div class="chamada-topo">
      <input type="date" id="input-data-chamada" value="${estado.dataChamada}" />
      ${ja_feita
        ? `<span class="selo selo-realizada">Chamada já registrada nesse dia</span>`
        : `<span class="selo" style="background:var(--azul-soft); color:var(--azul);">Chamada ainda não feita nesse dia</span>`}
    </div>
    <div class="cartao" style="padding:0;">
      ${alunos.length ? alunos.map((a) => `
        <div class="linha-chamada" data-aluno-id="${a.id}">
          <span class="nome-aluno">${escaparHtml(a.nome)}</span>
          <div class="grupo-status">
            <button type="button" class="botao-status status-presente ${a.status === "presente" ? "ativo" : ""}" onclick="marcarPresenca(${a.id}, 'presente')">Presente</button>
            <button type="button" class="botao-status status-falta ${a.status === "falta" ? "ativo" : ""}" onclick="marcarPresenca(${a.id}, 'falta')">Falta</button>
            <button type="button" class="botao-status status-falta_justificada ${a.status === "falta_justificada" ? "ativo" : ""}" onclick="marcarPresenca(${a.id}, 'falta_justificada')">Justificada</button>
          </div>
        </div>
      `).join("") : estadoVazioHtml("Cadastre alunos nessa turma antes de fazer a chamada.")}
    </div>
    ${alunos.length ? `<div style="margin-top:16px;"><button class="btn btn-primario" id="btn-salvar-chamada">${icones.checklist} Salvar chamada</button></div>` : ""}
  `;

  document.getElementById("input-data-chamada").addEventListener("change", (e) => {
    estado.dataChamada = e.target.value;
    renderAbaChamada(turma);
  });

  const btnSalvar = document.getElementById("btn-salvar-chamada");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", async () => {
      btnSalvar.disabled = true;
      btnSalvar.innerHTML = `<span class="spinner spinner-escuro"></span> Salvando...`;
      const presencas = estado.chamadaAtual.map((a) => ({ aluno_id: a.id, status: a.status }));
      try {
        await api.post("/chamada", { turma_id: turma.id, data: estado.dataChamada, presencas });
        mostrarToast("Chamada salva.", "sucesso");
        renderAbaChamada(turma);
      } catch (err) {
        mostrarToast(err.message, "erro");
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = `${icones.checklist} Salvar chamada`;
      }
    });
  }
}

function marcarPresenca(alunoId, status) {
  const aluno = estado.chamadaAtual.find((a) => a.id === alunoId);
  if (aluno) aluno.status = status;
  const linha = document.querySelector(`.linha-chamada[data-aluno-id="${alunoId}"]`);
  linha.querySelectorAll(".botao-status").forEach((btn) => btn.classList.remove("ativo"));
  linha.querySelector(`.status-${status}`).classList.add("ativo");
}

// ---- Aba Boletim ---------------------------------------------------------------

async function renderAbaBoletim(turma) {
  const container = document.getElementById("conteudo-aba-turma");
  const dados = await api.get(`/boletim/${turma.id}?bimestre=${estado.bimestreSelecionado}`);
  estado.boletimAtual = dados;
  estado.turmaBoletimAtual = turma;

  const mediasValidas = dados.boletim.map((l) => l.media).filter((m) => m !== null);
  const faixas = [
    { rotulo: "0-4,9", cor: "var(--coral)", qtd: mediasValidas.filter((m) => m < 5).length },
    { rotulo: "5-6,9", cor: "var(--amarelo)", qtd: mediasValidas.filter((m) => m >= 5 && m < 7).length },
    { rotulo: "7-8,9", cor: "var(--azul)", qtd: mediasValidas.filter((m) => m >= 7 && m < 9).length },
    { rotulo: "9-10", cor: "var(--teal)", qtd: mediasValidas.filter((m) => m >= 9).length },
  ];
  const freqValidas = dados.boletim.map((l) => l.frequencia_percentual).filter((f) => f !== null);
  const freqMedia = freqValidas.length ? Math.round((freqValidas.reduce((s, f) => s + f, 0) / freqValidas.length) * 10) / 10 : null;
  const mediaTurma = mediasValidas.length ? Math.round((mediasValidas.reduce((s, m) => s + m, 0) / mediasValidas.length) * 100) / 100 : null;

  container.innerHTML = `
    <div class="pills-bimestre">
      ${[1, 2, 3, 4].map((b) => `<button class="pill-bimestre ${estado.bimestreSelecionado === b ? "ativa" : ""}" onclick="mudarBimestre(${b})">${b}º Bimestre</button>`).join("")}
    </div>
    <div class="topo-pagina" style="margin-bottom:14px;">
      <p class="legenda">Média ponderada pelo peso de cada avaliação, e frequência geral do aluno na turma.</p>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secundario btn-peq" onclick="window.print()">${icones.impressora} Imprimir</button>
        <button class="btn btn-primario btn-peq" onclick="gerarPdfBoletim()">${icones.pdf} Baixar PDF</button>
      </div>
    </div>

    ${mediasValidas.length ? `
    <div class="resumo-turma-grid">
      <div class="cartao">
        <h3 style="font-size:0.9rem; margin-bottom:4px;">Distribuição de médias</h3>
        <p class="legenda" style="margin-bottom:0;">Média da turma: <b style="color:var(--ink);">${mediaTurma ?? "—"}</b></p>
        <div class="grafico-barras">
          ${faixas.map((f) => `
            <div class="barra-item">
              <span class="valor-barra">${f.qtd}</span>
              <div class="barra" style="height:${Math.max(4, (f.qtd / Math.max(...faixas.map((x) => x.qtd), 1)) * 90)}px; background:${f.cor};"></div>
              <span class="rotulo-barra">${f.rotulo}</span>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="cartao">
        <h3 style="font-size:0.9rem; margin-bottom:4px;">Frequência da turma</h3>
        <p class="legenda" style="margin-bottom:14px;">Média geral: <b style="color:${freqMedia !== null && freqMedia < 75 ? "#C0392B" : "var(--ink)"};">${freqMedia !== null ? freqMedia + "%" : "—"}</b></p>
        <div class="grafico-barras">
          ${dados.boletim.map((l) => `
            <div class="barra-item">
              <span class="valor-barra" style="font-size:0.65rem;">${l.frequencia_percentual !== null ? l.frequencia_percentual + "%" : "—"}</span>
              <div class="barra" style="height:${Math.max(4, (l.frequencia_percentual || 0) * 0.9)}px; background:${l.frequencia_percentual !== null && l.frequencia_percentual < 75 ? "var(--coral)" : "var(--teal)"};"></div>
              <span class="rotulo-barra" style="font-size:0.65rem;">${escaparHtml(l.aluno_nome.split(" ")[0])}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
    ` : ""}

    ${dados.avaliacoes.length === 0 ? estadoVazioHtml("Cadastre avaliações nesse bimestre (na aba Notas) para calcular o boletim.") : `
    <div class="tabela-scroll">
      <table class="tabela-notas">
        <thead>
          <tr>
            <th>Aluno</th>
            ${dados.avaliacoes.map((av) => `<th>${escaparHtml(av.titulo)} <span style="font-weight:400;">(peso ${av.peso})</span></th>`).join("")}
            <th>Média</th>
            <th>Frequência</th>
          </tr>
        </thead>
        <tbody>
          ${dados.boletim.map((linha) => `
            <tr>
              <td class="col-nome">${escaparHtml(linha.aluno_nome)}</td>
              ${linha.notas.map((n) => `<td>${n.valor !== null && n.valor !== undefined ? n.valor : "—"}</td>`).join("")}
              <td class="media-celula ${linha.media !== null ? (linha.media >= 6 ? "media-boa" : "media-baixa") : ""}">${linha.media !== null ? linha.media : "—"}</td>
              <td class="${linha.frequencia_percentual !== null && linha.frequencia_percentual < 75 ? "freq-baixa" : ""}">${linha.frequencia_percentual !== null ? linha.frequencia_percentual + "%" : "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    `}
  `;
}

function gerarPdfBoletim() {
  if (!window.jspdf) {
    mostrarToast("Não foi possível carregar o gerador de PDF (é preciso estar conectado à internet).", "erro");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const dados = estado.boletimAtual;
  const turma = estado.turmaBoletimAtual;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Boletim escolar", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Turma: ${turma.nome}${turma.disciplina ? " · " + turma.disciplina : ""}`, 14, 26);
  doc.text(`${dados.bimestre}º Bimestre`, 14, 32);

  let y = 44;
  const colunaAluno = 14;
  const larguraColunaNota = 22;

  doc.setFont("helvetica", "bold");
  doc.text("Aluno", colunaAluno, y);
  let x = colunaAluno + 60;
  dados.avaliacoes.forEach((av) => {
    doc.text(av.titulo.slice(0, 12), x, y);
    x += larguraColunaNota;
  });
  doc.text("Média", x, y);
  doc.text("Frequência", x + larguraColunaNota, y);
  y += 4;
  doc.setLineWidth(0.2);
  doc.line(colunaAluno, y, x + larguraColunaNota + 20, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  dados.boletim.forEach((linha) => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(linha.aluno_nome.slice(0, 32), colunaAluno, y);
    x = colunaAluno + 60;
    linha.notas.forEach((n) => {
      doc.text(n.valor !== null && n.valor !== undefined ? String(n.valor) : "—", x, y);
      x += larguraColunaNota;
    });
    doc.text(linha.media !== null ? String(linha.media) : "—", x, y);
    doc.text(linha.frequencia_percentual !== null ? linha.frequencia_percentual + "%" : "—", x + larguraColunaNota, y);
    y += 7;
  });

  doc.save(`boletim-${turma.nome.replace(/\s+/g, "-").toLowerCase()}-${dados.bimestre}bim.pdf`);
}

function abrirModalTurma() {
  abrirModal(`
    <div class="modal-cabecalho">
      <h2>Nova turma</h2>
      <button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button>
    </div>
    <form id="form-turma">
      <div class="modal-corpo">
        <div class="campo">
          <label for="turma-nome">Nome da turma</label>
          <input type="text" id="turma-nome" placeholder="Ex: 6º Ano B" required />
        </div>
        <div class="grade-2col">
          <div class="campo">
            <label for="turma-serie">Série / ano</label>
            <input type="text" id="turma-serie" placeholder="Ex: Ensino Fundamental II" />
          </div>
          <div class="campo">
            <label for="turma-disciplina">Disciplina</label>
            <input type="text" id="turma-disciplina" placeholder="Ex: Matemática" />
          </div>
        </div>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Criar turma</button>
      </div>
    </form>
  `);

  document.getElementById("form-turma").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.post("/turmas", {
        nome: document.getElementById("turma-nome").value,
        serie_ano: document.getElementById("turma-serie").value,
        disciplina: document.getElementById("turma-disciplina").value,
      });
      await carregarTurmas();
      fecharModal();
      mostrarToast("Turma criada.", "sucesso");
      renderizarTurmas();
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  });
}

// ============================================================================
// Modal de aula (criar / editar / sugestões de IA)
// ============================================================================

function abrirModalAula(idAula = null) {
  if (estado.turmas.length === 0) {
    mostrarToast("Cadastre uma turma antes de criar uma aula.", "aviso");
    abrirModalTurma();
    return;
  }

  const aula = idAula ? estado.aulas.find((a) => a.id === idAula) : null;
  const podeEditar = !aula || aula.professor_id === estado.usuario.id || estado.usuario.papel === "coordenador";

  abrirModal(`
    <div class="modal-cabecalho">
      <h2>${aula ? "Editar aula" : "Nova aula"}</h2>
      <button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button>
    </div>
    <form id="form-aula">
      <div class="modal-corpo">
        <div class="grade-2col">
          <div class="campo">
            <label for="aula-turma">Turma</label>
            <select id="aula-turma" required ${podeEditar ? "" : "disabled"}>
              ${estado.turmas.map((t) => `<option value="${t.id}" ${aula?.turma_id === t.id ? "selected" : ""}>${escaparHtml(t.nome)}</option>`).join("")}
            </select>
          </div>
          <div class="campo">
            <label for="aula-status">Status</label>
            <select id="aula-status" ${podeEditar ? "" : "disabled"}>
              <option value="planejada" ${aula?.status === "planejada" || !aula ? "selected" : ""}>Planejada</option>
              <option value="realizada" ${aula?.status === "realizada" ? "selected" : ""}>Realizada</option>
              <option value="cancelada" ${aula?.status === "cancelada" ? "selected" : ""}>Cancelada</option>
            </select>
          </div>
        </div>

        <div class="campo">
          <label for="aula-titulo">Título da aula</label>
          <input type="text" id="aula-titulo" placeholder="Ex: Introdução a frações" value="${aula ? escaparHtml(aula.titulo) : ""}" required ${podeEditar ? "" : "disabled"} />
        </div>

        <div class="grade-2col">
          <div class="campo">
            <label for="aula-data">Data</label>
            <input type="date" id="aula-data" value="${aula ? aula.data : ""}" required ${podeEditar ? "" : "disabled"} />
          </div>
          <div class="campo" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
              <label for="aula-inicio">Início</label>
              <input type="time" id="aula-inicio" value="${aula ? aula.horario_inicio.slice(0,5) : ""}" required ${podeEditar ? "" : "disabled"} />
            </div>
            <div>
              <label for="aula-fim">Fim</label>
              <input type="time" id="aula-fim" value="${aula ? aula.horario_fim.slice(0,5) : ""}" required ${podeEditar ? "" : "disabled"} />
            </div>
          </div>
        </div>

        <div class="campo">
          <label for="aula-conteudo">Conteúdo da aula</label>
          <textarea id="aula-conteudo" placeholder="O que será ensinado nessa aula?" required ${podeEditar ? "" : "disabled"}>${aula ? escaparHtml(aula.conteudo) : ""}</textarea>
        </div>
        <div class="campo">
          <label for="aula-objetivos">Objetivos de aprendizagem</label>
          <textarea id="aula-objetivos" placeholder="O que os alunos devem saber fazer ao final?" ${podeEditar ? "" : "disabled"}>${aula?.objetivos ? escaparHtml(aula.objetivos) : ""}</textarea>
        </div>
        <div class="grade-2col">
          <div class="campo">
            <label for="aula-metodologia">Metodologia</label>
            <textarea id="aula-metodologia" placeholder="Como a aula será conduzida?" ${podeEditar ? "" : "disabled"}>${aula?.metodologia ? escaparHtml(aula.metodologia) : ""}</textarea>
          </div>
          <div class="campo">
            <label for="aula-recursos">Recursos</label>
            <textarea id="aula-recursos" placeholder="Materiais, equipamentos..." ${podeEditar ? "" : "disabled"}>${aula?.recursos ? escaparHtml(aula.recursos) : ""}</textarea>
          </div>
        </div>
        <div class="campo">
          <label for="aula-avaliacao">Avaliação</label>
          <textarea id="aula-avaliacao" placeholder="Como você vai avaliar a aprendizagem?" ${podeEditar ? "" : "disabled"}>${aula?.avaliacao ? escaparHtml(aula.avaliacao) : ""}</textarea>
        </div>

        <button type="button" class="btn btn-secundario" id="btn-gerar-ia" onclick="gerarSugestoesIA(${aula ? aula.id : "null"})">
          ${icones.varinha} Pedir sugestões de melhoria à IA
        </button>

        <div id="area-sugestoes-ia">
          ${aula?.sugestoes_ia ? painelIaHtml(JSON.parse(aula.sugestoes_ia)) : ""}
        </div>
      </div>
      <div class="modal-rodape">
        ${aula ? `<button type="button" class="btn btn-perigo" style="margin-right:auto" onclick="excluirAulaModal(${aula.id})">${icones.lixeira} Excluir</button>` : ""}
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        ${podeEditar ? `<button type="submit" class="btn btn-primario">${aula ? "Salvar alterações" : "Criar aula"}</button>` : ""}
      </div>
    </form>
  `);

  document.getElementById("form-aula").addEventListener("submit", async (e) => {
    e.preventDefault();
    const corpo = {
      turma_id: Number(document.getElementById("aula-turma").value),
      status: document.getElementById("aula-status").value,
      titulo: document.getElementById("aula-titulo").value,
      data: document.getElementById("aula-data").value,
      horario_inicio: document.getElementById("aula-inicio").value,
      horario_fim: document.getElementById("aula-fim").value,
      conteudo: document.getElementById("aula-conteudo").value,
      objetivos: document.getElementById("aula-objetivos").value,
      metodologia: document.getElementById("aula-metodologia").value,
      recursos: document.getElementById("aula-recursos").value,
      avaliacao: document.getElementById("aula-avaliacao").value,
    };

    const botaoSalvar = e.target.querySelector('button[type="submit"]');
    botaoSalvar.disabled = true;
    botaoSalvar.innerHTML = `<span class="spinner"></span> Salvando...`;

    try {
      if (aula) {
        await api.put(`/aulas/${aula.id}`, corpo);
      } else {
        await api.post("/aulas", corpo);
      }
      await carregarAulas();
      fecharModal();
      mostrarToast(aula ? "Aula atualizada." : "Aula criada.", "sucesso");
      renderizadorAtual();
    } catch (err) {
      mostrarToast(err.message, "erro");
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = aula ? "Salvar alterações" : "Criar aula";
    }
  });
}

async function excluirAulaModal(id) {
  if (!(await confirmarAcao("Tem certeza que quer excluir essa aula?"))) return;
  await api.delete(`/aulas/${id}`);
  await carregarAulas();
  fecharModal();
  mostrarToast("Aula excluída.", "sucesso");
  renderizadorAtual();
}

async function gerarSugestoesIA(idAula) {
  const botao = document.getElementById("btn-gerar-ia");
  const area = document.getElementById("area-sugestoes-ia");
  const textoOriginal = botao.innerHTML;
  botao.disabled = true;
  botao.innerHTML = `<span class="spinner spinner-escuro"></span> Analisando o plano de aula...`;

  const turmaSelecionada = mapaturmaPorId(document.getElementById("aula-turma").value);

  try {
    const { sugestoes } = await api.post("/ia/sugestoes", {
      titulo: document.getElementById("aula-titulo").value,
      conteudo: document.getElementById("aula-conteudo").value,
      objetivos: document.getElementById("aula-objetivos").value,
      metodologia: document.getElementById("aula-metodologia").value,
      recursos: document.getElementById("aula-recursos").value,
      avaliacao: document.getElementById("aula-avaliacao").value,
      serie_ano: turmaSelecionada?.serie_ano,
      disciplina: turmaSelecionada?.disciplina,
    });

    area.innerHTML = painelIaHtml(sugestoes);

    if (idAula) {
      await api.post(`/aulas/${idAula}/sugestoes`, { sugestoes: JSON.stringify(sugestoes) });
      await carregarAulas();
    }
  } catch (err) {
    area.innerHTML = `<div class="alerta alerta-erro">${escaparHtml(err.message)}</div>`;
  } finally {
    botao.disabled = false;
    botao.innerHTML = textoOriginal;
  }
}

function painelIaHtml(s) {
  return `
    <div class="painel-ia">
      <div class="cabecalho-ia">${icones.varinha} Sugestões da IA para essa aula</div>
      ${s.pontos_fortes?.length ? `
        <div class="bloco-ia">
          <div class="rotulo-ia">✓ Pontos fortes</div>
          <ul>${s.pontos_fortes.map((p) => `<li>${escaparHtml(p)}</li>`).join("")}</ul>
        </div>` : ""}
      ${s.sugestoes?.length ? `
        <div class="bloco-ia">
          <div class="rotulo-ia">Sugestões de melhoria</div>
          <ul>${s.sugestoes.map((sg) => `<li class="item-sugestao"><b>${escaparHtml(sg.titulo)}</b>${escaparHtml(sg.descricao)}</li>`).join("")}</ul>
        </div>` : ""}
      ${s.pergunta_reflexao ? `
        <div class="bloco-ia">
          <div class="rotulo-ia">Para refletir</div>
          <p class="pergunta-reflexao">"${escaparHtml(s.pergunta_reflexao)}"</p>
        </div>` : ""}
    </div>
  `;
}

// ============================================================================
// Modal de Perfil / Configurações da conta
// ============================================================================

function abrirModalPerfil() {
  abrirModal(`
    <div class="modal-cabecalho"><h2>Configurações da conta</h2><button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button></div>
    <div class="modal-corpo">
      <div class="perfil-cabecalho">
        <div class="avatar" style="background:${estado.usuario.cor};">${estado.usuario.nome.trim().charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:700;">${escaparHtml(estado.usuario.nome)}</div>
          <div class="legenda" style="margin-top:2px;">${escaparHtml(estado.usuario.email)} · ${escaparHtml(estado.usuario.papel)}</div>
        </div>
      </div>

      <form id="form-perfil-nome" style="margin-bottom:22px;">
        <div class="campo">
          <label for="perfil-nome">Nome completo</label>
          <input type="text" id="perfil-nome" value="${escaparHtml(estado.usuario.nome)}" required />
        </div>
        <button type="submit" class="btn btn-secundario btn-peq">Salvar nome</button>
      </form>

      <form id="form-perfil-senha" style="margin-bottom:${estado.usuario.papel === "coordenador" ? "22px" : "0"};">
        <h3 style="font-size:0.9rem; margin-bottom:10px;">${icones.cadeado} Alterar senha</h3>
        <div class="grade-2col">
          <div class="campo"><label for="senha-atual">Senha atual</label><input type="password" id="senha-atual" required /></div>
          <div class="campo"><label for="senha-nova">Nova senha</label><input type="password" id="senha-nova" minlength="6" required /></div>
        </div>
        <button type="submit" class="btn btn-secundario btn-peq">Atualizar senha</button>
      </form>

      ${estado.usuario.papel === "coordenador" ? `
      <div id="secao-equipe">
        <h3 style="font-size:0.9rem; margin-bottom:10px;">${icones.equipe} Equipe</h3>
        <div class="legenda" style="margin-bottom:10px;">Como coordenador(a), você pode redefinir a senha de um professor que a esqueceu.</div>
        <div class="lista-equipe" id="lista-equipe"><div class="vazio">Carregando...</div></div>
      </div>` : ""}
    </div>
  `);

  document.getElementById("form-perfil-nome").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const { usuario, token } = await api.put("/auth/perfil", { nome: document.getElementById("perfil-nome").value });
      estado.usuario = usuario;
      localStorage.setItem("usuario", JSON.stringify(usuario));
      if (token) localStorage.setItem("token", token);
      document.getElementById("nome-usuario").textContent = usuario.nome;
      mostrarToast("Nome atualizado.", "sucesso");
      fecharModal();
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  });

  document.getElementById("form-perfil-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/senha", {
        senha_atual: document.getElementById("senha-atual").value,
        senha_nova: document.getElementById("senha-nova").value,
      });
      mostrarToast("Senha atualizada.", "sucesso");
      fecharModal();
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  });

  if (estado.usuario.papel === "coordenador") carregarEquipe();
}

async function carregarEquipe() {
  try {
    const { usuarios } = await api.get("/auth/usuarios");
    const container = document.getElementById("lista-equipe");
    if (!container) return;
    container.innerHTML = usuarios.map((u) => `
      <div class="linha-equipe">
        <div class="avatar" style="width:28px; height:28px; font-size:0.72rem; background:${u.cor};">${u.nome.trim().charAt(0).toUpperCase()}</div>
        <div class="info-membro">
          <div class="nome-membro">${escaparHtml(u.nome)}${u.id === estado.usuario.id ? " (você)" : ""}</div>
          <div class="papel-membro">${escaparHtml(u.papel)}</div>
        </div>
        ${u.id !== estado.usuario.id ? `<button class="btn btn-secundario btn-peq" onclick="abrirModalRedefinirSenha(${u.id}, '${escaparHtml(u.nome).replace(/'/g, "\\'")}')">Redefinir senha</button>` : ""}
      </div>
    `).join("");
  } catch (err) {
    const container = document.getElementById("lista-equipe");
    if (container) container.innerHTML = `<div class="vazio">${escaparHtml(err.message)}</div>`;
  }
}

function abrirModalRedefinirSenha(usuarioId, nomeUsuario) {
  abrirModal(`
    <div class="modal-cabecalho"><h2>Redefinir senha</h2><button class="btn btn-icone" onclick="fecharModal()">${icones.x}</button></div>
    <form id="form-redefinir-senha">
      <div class="modal-corpo">
        <p class="legenda" style="margin-bottom:14px;">Defina uma nova senha temporária para <b>${escaparHtml(nomeUsuario)}</b>. Avise a pessoa para trocá-la depois no perfil dela.</p>
        <div class="campo"><label for="nova-senha-equipe">Nova senha</label><input type="password" id="nova-senha-equipe" minlength="6" required /></div>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Redefinir</button>
      </div>
    </form>
  `);

  document.getElementById("form-redefinir-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.post(`/auth/usuarios/${usuarioId}/redefinir-senha`, { senha_nova: document.getElementById("nova-senha-equipe").value });
      mostrarToast("Senha redefinida.", "sucesso");
      abrirModalPerfil();
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  });
}

// ============================================================================
// Modal genérico
// ============================================================================

function abrirModal(conteudoHtml) {
  const raiz = document.getElementById("raiz-modal");
  raiz.innerHTML = `<div class="sobreposicao" id="sobreposicao-modal"><div class="modal">${conteudoHtml}</div></div>`;
  document.getElementById("sobreposicao-modal").addEventListener("click", (e) => {
    if (e.target.id === "sobreposicao-modal") fecharModal();
  });
}

function fecharModal() {
  document.getElementById("raiz-modal").innerHTML = "";
}

// ---- Toasts (substituem alert()) e confirmação customizada (substitui confirm()) ----

function mostrarToast(mensagem, tipo = "info") {
  const caixa = document.getElementById("caixa-toasts");
  if (!caixa) return;
  const icone = tipo === "sucesso" ? icones.sucesso : tipo === "erro" ? icones.erroToast : icones.aviso;
  const toast = document.createElement("div");
  toast.className = `toast ${tipo === "sucesso" ? "toast-sucesso" : tipo === "erro" ? "toast-erro" : ""}`;
  toast.innerHTML = `${icone}<span>${escaparHtml(mensagem)}</span><button class="fechar-toast" onclick="this.parentElement.remove()">${icones.x}</button>`;
  caixa.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function confirmarAcao(mensagem) {
  return new Promise((resolve) => {
    const raiz = document.getElementById("raiz-modal");
    raiz.innerHTML = `
      <div class="sobreposicao" id="sobreposicao-confirmacao">
        <div class="modal modal-confirmacao">
          <div class="modal-corpo">
            <div class="icone-alerta">${icones.aviso}</div>
            <p>${escaparHtml(mensagem)}</p>
          </div>
          <div class="modal-rodape">
            <button class="btn btn-secundario" id="btn-cancelar-confirmacao">Cancelar</button>
            <button class="btn btn-perigo" id="btn-confirmar-confirmacao">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    const finalizar = (resultado) => { fecharModal(); resolve(resultado); };
    document.getElementById("btn-cancelar-confirmacao").onclick = () => finalizar(false);
    document.getElementById("btn-confirmar-confirmacao").onclick = () => finalizar(true);
    document.getElementById("sobreposicao-confirmacao").addEventListener("click", (e) => {
      if (e.target.id === "sobreposicao-confirmacao") finalizar(false);
    });
  });
}

function skeletonListaHtml(qtd = 3) {
  return Array.from({ length: qtd }).map(() => `<div class="skeleton skeleton-cartao"></div>`).join("");
}

function renderizadorAtual() {
  const renderizadores = { dashboard: renderizarDashboard, semana: renderizarSemana, aulas: renderizarAulas, turmas: renderizarTurmas };
  renderizadores[estado.vista]();
}

function estadoVazioHtml(mensagem) {
  return `<div class="vazio">${icones.vazio}<p>${mensagem}</p></div>`;
}

// ============================================================================
// Utilidades de data
// ============================================================================

function paraISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function somarDias(data, dias) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function inicioDaSemana(data) {
  const nova = new Date(data);
  const diaSemana = nova.getDay(); // 0 = domingo
  const deslocamento = diaSemana === 0 ? 1 : diaSemana === 6 ? -5 : 1 - diaSemana;
  nova.setDate(nova.getDate() + deslocamento);
  nova.setHours(0, 0, 0, 0);
  return nova;
}

function escurecerCor(hex) {
  // Retorna a mesma cor escurecida ~35% para uso como texto sobre fundo claro
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - 70);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - 70);
  const b = Math.max(0, (num & 0x0000ff) - 70);
  return `rgb(${r},${g},${b})`;
}

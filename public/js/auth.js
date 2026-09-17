function mostrarErro(idElemento, mensagem) {
  const el = document.getElementById(idElemento);
  el.textContent = mensagem;
  el.classList.remove("oculto");
}

function esconderErro(idElemento) {
  document.getElementById(idElemento).classList.add("oculto");
}

function alternarCarregando(idBotao, carregando, textoNormal) {
  const btn = document.getElementById(idBotao);
  btn.disabled = carregando;
  btn.innerHTML = carregando ? `<span class="spinner"></span> Aguarde...` : textoNormal;
}

// ---- Navegação entre telas de autenticação -------------------------------

document.getElementById("ir-para-cadastro").addEventListener("click", () => {
  document.getElementById("tela-login").classList.add("oculto");
  document.getElementById("tela-cadastro").classList.remove("oculto");
});

document.getElementById("ir-para-login").addEventListener("click", () => {
  document.getElementById("tela-cadastro").classList.add("oculto");
  document.getElementById("tela-login").classList.remove("oculto");
});

// ---- Login -----------------------------------------------------------------

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  esconderErro("erro-login");
  alternarCarregando("btn-login", true);

  try {
    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;
    const dados = await api.post("/auth/login", { email, senha });
    entrarNaConta(dados);
  } catch (err) {
    mostrarErro("erro-login", err.message);
  } finally {
    alternarCarregando("btn-login", false, "Entrar");
  }
});

// ---- Cadastro ----------------------------------------------------------------

document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
  e.preventDefault();
  esconderErro("erro-cadastro");
  alternarCarregando("btn-cadastro", true);

  try {
    const nome = document.getElementById("cad-nome").value;
    const email = document.getElementById("cad-email").value;
    const senha = document.getElementById("cad-senha").value;
    const papel = document.querySelector('input[name="papel"]:checked').value;
    const codigo_convite = document.getElementById("cad-convite").value;
    const dados = await api.post("/auth/registrar", { nome, email, senha, papel, codigo_convite });
    entrarNaConta(dados);
  } catch (err) {
    mostrarErro("erro-cadastro", err.message);
  } finally {
    alternarCarregando("btn-cadastro", false, "Criar conta");
  }
});

// Se a pessoa abriu um link de convite (ex: seusite.com/?convite=ABC123DE),
// já leva direto pra tela de cadastro com o código preenchido.
(function preencherConviteDaURL() {
  const codigo = new URLSearchParams(window.location.search).get("convite");
  if (codigo) {
    document.getElementById("tela-login").classList.add("oculto");
    document.getElementById("tela-cadastro").classList.remove("oculto");
    document.getElementById("cad-convite").value = codigo.toUpperCase();
  }
})();

function entrarNaConta({ token, usuario }) {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
  iniciarApp(usuario);
}

document.getElementById("btn-sair").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.reload();
});

// ---- Checagem inicial: já está logado? -------------------------------------

(function checarSessao() {
  const token = api.pegarToken();
  const usuarioSalvo = localStorage.getItem("usuario");
  if (token && usuarioSalvo) {
    iniciarApp(JSON.parse(usuarioSalvo));
  }
})();

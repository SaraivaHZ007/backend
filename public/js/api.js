const api = (() => {
  function pegarToken() {
    return localStorage.getItem("token");
  }

  async function requisitar(caminho, opcoes = {}) {
    const token = pegarToken();
    const cabecalhos = { "Content-Type": "application/json" };
    if (token) cabecalhos["Authorization"] = `Bearer ${token}`;

    const resposta = await fetch(`/api${caminho}`, {
      ...opcoes,
      headers: { ...cabecalhos, ...(opcoes.headers || {}) },
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      if (resposta.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }
      throw new Error(dados.erro || "Algo deu errado. Tente novamente.");
    }
    return dados;
  }

  return {
    get: (caminho) => requisitar(caminho, { method: "GET" }),
    post: (caminho, body) => requisitar(caminho, { method: "POST", body }),
    put: (caminho, body) => requisitar(caminho, { method: "PUT", body }),
    delete: (caminho) => requisitar(caminho, { method: "DELETE" }),
    pegarToken,
  };
})();

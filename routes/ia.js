const express = require("express");
const { autenticar } = require("../middleware/auth");

const router = express.Router();
router.use(autenticar);

const PROMPT_SISTEMA = `Você é um coordenador pedagógico experiente, especializado em ajudar professores da educação básica brasileira a melhorar seus planos de aula.

Dado o plano de aula que o professor descrever, responda SOMENTE com um objeto JSON válido (sem markdown, sem crases, sem texto antes ou depois), no seguinte formato:

{
  "pontos_fortes": ["string curta", "string curta"],
  "sugestoes": [
    { "titulo": "string curta", "descricao": "1-2 frases explicando a sugestão de forma prática e aplicável" }
  ],
  "pergunta_reflexao": "uma pergunta curta para o professor refletir sobre a aula"
}

Regras:
- "pontos_fortes": 2 a 3 itens, reconhecendo o que já está bom no plano.
- "sugestoes": 3 a 5 itens, específicas para o conteúdo e a série informados (nada genérico como "use mais recursos visuais" sem dizer quais).
- Considere: clareza dos objetivos, adequação à faixa etária/série, metodologias ativas, avaliação formativa, inclusão e diferenciação pedagógica, gestão do tempo de aula.
- Tom: encorajador, direto e prático. Nunca condescendente.
- Responda em português do Brasil.`;

router.post("/sugestoes", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("xxxx")) {
    return res.status(500).json({
      erro: "A chave da API da Anthropic ainda não foi configurada no arquivo .env do servidor (ANTHROPIC_API_KEY).",
    });
  }

  const { titulo, conteudo, objetivos, metodologia, recursos, avaliacao, serie_ano, disciplina } = req.body;
  if (!titulo || !conteudo) {
    return res.status(400).json({ erro: "Preencha ao menos o título e o conteúdo da aula antes de pedir sugestões." });
  }

  const descricaoAula = `
Título da aula: ${titulo}
Turma / série: ${serie_ano || "não informado"}
Disciplina: ${disciplina || "não informado"}
Conteúdo a ser trabalhado: ${conteudo}
Objetivos de aprendizagem: ${objetivos || "não informado"}
Metodologia planejada: ${metodologia || "não informado"}
Recursos que serão usados: ${recursos || "não informado"}
Forma de avaliação: ${avaliacao || "não informado"}
  `.trim();

  try {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1200,
        system: PROMPT_SISTEMA,
        messages: [{ role: "user", content: descricaoAula }],
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      console.error("Erro da API Anthropic:", detalhe);
      return res.status(502).json({ erro: "Não foi possível gerar as sugestões agora. Tente novamente em instantes." });
    }

    const dados = await resposta.json();
    const textoResposta = dados.content?.find((bloco) => bloco.type === "text")?.text || "";

    let sugestoesJson;
    try {
      const textoLimpo = textoResposta.replace(/```json|```/g, "").trim();
      sugestoesJson = JSON.parse(textoLimpo);
    } catch (erroParse) {
      console.error("Não foi possível interpretar a resposta da IA:", textoResposta);
      return res.status(502).json({ erro: "A IA respondeu em um formato inesperado. Tente novamente." });
    }

    res.json({ sugestoes: sugestoesJson });
  } catch (erro) {
    console.error("Erro ao chamar a API da Anthropic:", erro);
    res.status(502).json({ erro: "Falha de conexão com o serviço de IA. Verifique sua internet e tente novamente." });
  }
});

module.exports = router;

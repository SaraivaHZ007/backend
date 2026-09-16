require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { iniciarBanco } = require("./db");

const app = express();
const PORTA = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error("\n⚠️  Faltou configurar o arquivo .env — copie .env.example para .env antes de iniciar.\n");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/turmas", require("./routes/turmas"));
app.use("/api/aulas", require("./routes/aulas"));
app.use("/api/ia", require("./routes/ia"));
app.use("/api/alunos", require("./routes/alunos"));
app.use("/api/avaliacoes", require("./routes/avaliacoes"));
app.use("/api/chamada", require("./routes/chamada"));
app.use("/api/boletim", require("./routes/boletim"));
app.use("/api/atividade", require("./routes/atividade"));
app.use("/api/painel", require("./routes/painel"));

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Middleware de erro central: qualquer erro não tratado numa rota (ex: falha
// de rede com o banco Turso) cai aqui em vez de travar a requisição.
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ erro: "Erro interno do servidor. Tente novamente em instantes." });
});

// O banco (Turso) é remoto, então precisamos confirmar que as tabelas já
// existem antes de aceitar qualquer requisição.
iniciarBanco()
  .then(() => {
    app.listen(PORTA, () => {
      console.log(`\n✅ Planejador de Aulas rodando em http://localhost:${PORTA}\n`);
    });
  })
  .catch((erro) => {
    console.error("\n❌ Não foi possível conectar ao banco de dados (Turso). Verifique TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no .env.\n", erro.message);
    process.exit(1);
  });

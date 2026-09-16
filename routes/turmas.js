const express = require("express");
const db = require("../db");
const { autenticar } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(autenticar);

const CORES_TURMA = ["#14B8A6", "#FF6B6B", "#FFC857", "#7C6FF0", "#4C6EF5", "#F783AC", "#2FB380"];

router.get("/", asyncHandler(async (req, res) => {
  const turmas = await db
    .prepare(
      `SELECT t.*, u.nome AS criado_por_nome,
        (SELECT COUNT(*) FROM aulas WHERE aulas.turma_id = t.id) AS total_aulas,
        (SELECT COUNT(*) FROM alunos WHERE alunos.turma_id = t.id AND alunos.ativo = 1) AS total_alunos,
        (SELECT MAX(data) FROM chamadas WHERE chamadas.turma_id = t.id) AS ultima_chamada
       FROM turmas t
       JOIN usuarios u ON u.id = t.criado_por
       ORDER BY t.nome COLLATE NOCASE`
    )
    .all();
  res.json({ turmas });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { nome, serie_ano, disciplina } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: "Informe o nome da turma." });
  }

  const cor = CORES_TURMA[Math.floor(Math.random() * CORES_TURMA.length)];
  const resultado = await db
    .prepare("INSERT INTO turmas (nome, serie_ano, disciplina, cor, criado_por) VALUES (?, ?, ?, ?, ?)")
    .run(nome.trim(), serie_ano || null, disciplina || null, cor, req.usuario.id);

  const turma = await db.prepare("SELECT * FROM turmas WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json({ turma });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const turma = await db.prepare("SELECT * FROM turmas WHERE id = ?").get(req.params.id);
  if (!turma) return res.status(404).json({ erro: "Turma não encontrada." });
  if (turma.criado_por !== req.usuario.id && req.usuario.papel !== "coordenador") {
    return res.status(403).json({ erro: "Só quem criou a turma (ou um coordenador) pode editá-la." });
  }

  const { nome, serie_ano, disciplina } = req.body;
  await db.prepare("UPDATE turmas SET nome = ?, serie_ano = ?, disciplina = ? WHERE id = ?").run(
    nome?.trim() || turma.nome,
    serie_ano !== undefined ? serie_ano : turma.serie_ano,
    disciplina !== undefined ? disciplina : turma.disciplina,
    req.params.id
  );

  const atualizada = await db.prepare("SELECT * FROM turmas WHERE id = ?").get(req.params.id);
  res.json({ turma: atualizada });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const turma = await db.prepare("SELECT * FROM turmas WHERE id = ?").get(req.params.id);
  if (!turma) return res.status(404).json({ erro: "Turma não encontrada." });

  if (turma.criado_por !== req.usuario.id && req.usuario.papel !== "coordenador") {
    return res.status(403).json({ erro: "Só quem criou a turma (ou um coordenador) pode excluí-la." });
  }

  await db.prepare("DELETE FROM turmas WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
}));

module.exports = router;

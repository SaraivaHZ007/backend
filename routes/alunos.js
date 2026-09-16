const express = require("express");
const db = require("../db");
const { autenticar } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(autenticar);

router.get("/", asyncHandler(async (req, res) => {
  const { turma_id } = req.query;
  if (!turma_id) return res.status(400).json({ erro: "Informe a turma." });

  const alunos = await db
    .prepare("SELECT * FROM alunos WHERE turma_id = ? AND ativo = 1 ORDER BY nome COLLATE NOCASE")
    .all(turma_id);
  res.json({ alunos });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { turma_id, nome, matricula } = req.body;
  if (!turma_id || !nome || !nome.trim()) {
    return res.status(400).json({ erro: "Informe a turma e o nome do aluno." });
  }

  const resultado = await db
    .prepare("INSERT INTO alunos (turma_id, nome, matricula) VALUES (?, ?, ?)")
    .run(turma_id, nome.trim(), matricula || null);

  const aluno = await db.prepare("SELECT * FROM alunos WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json({ aluno });
}));

// Cadastro rápido de vários alunos de uma vez (um nome por linha)
router.post("/lote", asyncHandler(async (req, res) => {
  const { turma_id, nomes } = req.body;
  if (!turma_id || !Array.isArray(nomes) || nomes.length === 0) {
    return res.status(400).json({ erro: "Informe a turma e ao menos um nome." });
  }

  const nomesLimpos = nomes.map((n) => n.trim()).filter(Boolean);
  await db.emLote(
    nomesLimpos.map((nome) => ({
      sql: "INSERT INTO alunos (turma_id, nome) VALUES (?, ?)",
      args: [turma_id, nome],
    }))
  );

  const alunos = await db.prepare("SELECT * FROM alunos WHERE turma_id = ? AND ativo = 1 ORDER BY nome COLLATE NOCASE").all(turma_id);
  res.status(201).json({ alunos });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const { nome, matricula } = req.body;
  const aluno = await db.prepare("SELECT * FROM alunos WHERE id = ?").get(req.params.id);
  if (!aluno) return res.status(404).json({ erro: "Aluno não encontrado." });

  await db.prepare("UPDATE alunos SET nome = ?, matricula = ? WHERE id = ?").run(
    nome?.trim() || aluno.nome,
    matricula !== undefined ? matricula : aluno.matricula,
    req.params.id
  );

  const atualizado = await db.prepare("SELECT * FROM alunos WHERE id = ?").get(req.params.id);
  res.json({ aluno: atualizado });
}));

// "Exclusão" apenas marca como inativo, para não perder o histórico de notas/chamada
router.delete("/:id", asyncHandler(async (req, res) => {
  const aluno = await db.prepare("SELECT * FROM alunos WHERE id = ?").get(req.params.id);
  if (!aluno) return res.status(404).json({ erro: "Aluno não encontrado." });

  await db.prepare("UPDATE alunos SET ativo = 0 WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
}));

module.exports = router;

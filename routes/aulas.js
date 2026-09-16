const express = require("express");
const db = require("../db");
const { autenticar } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(autenticar);

const SELECT_BASE = `
  SELECT a.*, t.nome AS turma_nome, t.cor AS turma_cor, u.nome AS professor_nome, u.cor AS professor_cor
  FROM aulas a
  JOIN turmas t ON t.id = a.turma_id
  JOIN usuarios u ON u.id = a.professor_id
`;

router.get("/", asyncHandler(async (req, res) => {
  const { turma_id, data_inicio, data_fim, professor_id } = req.query;
  const condicoes = [];
  const params = [];

  if (req.usuario.papel !== "coordenador") {
    condicoes.push("a.professor_id = ?");
    params.push(req.usuario.id);
  } else if (professor_id) {
    condicoes.push("a.professor_id = ?");
    params.push(professor_id);
  }

  if (turma_id) {
    condicoes.push("a.turma_id = ?");
    params.push(turma_id);
  }
  if (data_inicio) {
    condicoes.push("a.data >= ?");
    params.push(data_inicio);
  }
  if (data_fim) {
    condicoes.push("a.data <= ?");
    params.push(data_fim);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const aulas = await db.prepare(`${SELECT_BASE} ${where} ORDER BY a.data, a.horario_inicio`).all(...params);

  res.json({ aulas });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const aula = await db.prepare(`${SELECT_BASE} WHERE a.id = ?`).get(req.params.id);
  if (!aula) return res.status(404).json({ erro: "Aula não encontrada." });
  if (aula.professor_id !== req.usuario.id && req.usuario.papel !== "coordenador") {
    return res.status(403).json({ erro: "Você não pode ver essa aula." });
  }
  res.json({ aula });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { turma_id, titulo, conteudo, objetivos, metodologia, recursos, avaliacao, data, horario_inicio, horario_fim } = req.body;

  if (!turma_id || !titulo || !conteudo || !data || !horario_inicio || !horario_fim) {
    return res.status(400).json({ erro: "Preencha turma, título, conteúdo, data e horários." });
  }
  if (horario_fim <= horario_inicio) {
    return res.status(400).json({ erro: "O horário final precisa ser depois do horário inicial." });
  }

  const conflito = await db
    .prepare(
      `SELECT id FROM aulas
       WHERE professor_id = ? AND data = ?
       AND NOT (horario_fim <= ? OR horario_inicio >= ?)`
    )
    .get(req.usuario.id, data, horario_inicio, horario_fim);

  if (conflito) {
    return res.status(409).json({ erro: "Você já tem outra aula planejada nesse mesmo horário." });
  }

  const resultado = await db
    .prepare(
      `INSERT INTO aulas
        (professor_id, turma_id, titulo, conteudo, objetivos, metodologia, recursos, avaliacao, data, horario_inicio, horario_fim)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.usuario.id, turma_id, titulo.trim(), conteudo.trim(), objetivos || null, metodologia || null, recursos || null, avaliacao || null, data, horario_inicio, horario_fim);

  const aula = await db.prepare(`${SELECT_BASE} WHERE a.id = ?`).get(resultado.lastInsertRowid);
  res.status(201).json({ aula });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const aulaAtual = await db.prepare("SELECT * FROM aulas WHERE id = ?").get(req.params.id);
  if (!aulaAtual) return res.status(404).json({ erro: "Aula não encontrada." });
  if (aulaAtual.professor_id !== req.usuario.id && req.usuario.papel !== "coordenador") {
    return res.status(403).json({ erro: "Você não pode editar essa aula." });
  }

  const campos = ["turma_id", "titulo", "conteudo", "objetivos", "metodologia", "recursos", "avaliacao", "data", "horario_inicio", "horario_fim", "status"];
  const atualizacoes = {};
  for (const campo of campos) {
    if (req.body[campo] !== undefined) atualizacoes[campo] = req.body[campo];
  }

  const sets = Object.keys(atualizacoes).map((c) => `${c} = ?`);
  if (sets.length === 0) return res.status(400).json({ erro: "Nada para atualizar." });

  const valores = Object.values(atualizacoes);
  await db.prepare(`UPDATE aulas SET ${sets.join(", ")}, atualizado_em = datetime('now') WHERE id = ?`).run(...valores, req.params.id);

  const aula = await db.prepare(`${SELECT_BASE} WHERE a.id = ?`).get(req.params.id);
  res.json({ aula });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const aula = await db.prepare("SELECT * FROM aulas WHERE id = ?").get(req.params.id);
  if (!aula) return res.status(404).json({ erro: "Aula não encontrada." });
  if (aula.professor_id !== req.usuario.id && req.usuario.papel !== "coordenador") {
    return res.status(403).json({ erro: "Você não pode excluir essa aula." });
  }

  await db.prepare("DELETE FROM aulas WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
}));

router.post("/:id/sugestoes", asyncHandler(async (req, res) => {
  const { sugestoes } = req.body;
  const aula = await db.prepare("SELECT * FROM aulas WHERE id = ?").get(req.params.id);
  if (!aula) return res.status(404).json({ erro: "Aula não encontrada." });
  if (aula.professor_id !== req.usuario.id && req.usuario.papel !== "coordenador") {
    return res.status(403).json({ erro: "Você não pode editar essa aula." });
  }

  await db.prepare("UPDATE aulas SET sugestoes_ia = ?, atualizado_em = datetime('now') WHERE id = ?").run(sugestoes, req.params.id);
  res.json({ ok: true });
}));

module.exports = router;

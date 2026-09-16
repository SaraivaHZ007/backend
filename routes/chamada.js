const express = require("express");
const db = require("../db");
const { autenticar } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(autenticar);

router.get("/", asyncHandler(async (req, res) => {
  const { turma_id, data } = req.query;
  if (!turma_id || !data) return res.status(400).json({ erro: "Informe a turma e a data." });

  const chamada = await db.prepare("SELECT * FROM chamadas WHERE turma_id = ? AND data = ?").get(turma_id, data);

  const alunos = await db
    .prepare("SELECT id, nome, matricula FROM alunos WHERE turma_id = ? AND ativo = 1 ORDER BY nome COLLATE NOCASE")
    .all(turma_id);

  let statusPorAluno = {};
  if (chamada) {
    const presencas = await db.prepare("SELECT aluno_id, status FROM presencas WHERE chamada_id = ?").all(chamada.id);
    statusPorAluno = Object.fromEntries(presencas.map((p) => [p.aluno_id, p.status]));
  }

  const lista = alunos.map((a) => ({ ...a, status: statusPorAluno[a.id] || "presente" }));
  res.json({ chamada_id: chamada?.id || null, ja_feita: Boolean(chamada), alunos: lista });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { turma_id, data, aula_id, presencas } = req.body;
  if (!turma_id || !data || !Array.isArray(presencas)) {
    return res.status(400).json({ erro: "Informe turma, data e a lista de presenças." });
  }

  let chamada = await db.prepare("SELECT * FROM chamadas WHERE turma_id = ? AND data = ?").get(turma_id, data);

  if (!chamada) {
    const resultado = await db
      .prepare("INSERT INTO chamadas (turma_id, aula_id, data, criado_por) VALUES (?, ?, ?, ?)")
      .run(turma_id, aula_id || null, data, req.usuario.id);
    chamada = { id: resultado.lastInsertRowid };
  }

  const comandos = presencas.map((item) => ({
    sql: `INSERT INTO presencas (chamada_id, aluno_id, status)
          VALUES (?, ?, ?)
          ON CONFLICT (chamada_id, aluno_id) DO UPDATE SET status = excluded.status`,
    args: [chamada.id, item.aluno_id, item.status],
  }));

  if (comandos.length > 0) await db.emLote(comandos);

  res.status(201).json({ ok: true, chamada_id: chamada.id });
}));

router.get("/historico", asyncHandler(async (req, res) => {
  const { turma_id } = req.query;
  if (!turma_id) return res.status(400).json({ erro: "Informe a turma." });

  const historico = await db
    .prepare(
      `SELECT c.data,
        SUM(CASE WHEN p.status = 'presente' THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN p.status = 'falta' THEN 1 ELSE 0 END) AS faltas,
        SUM(CASE WHEN p.status = 'falta_justificada' THEN 1 ELSE 0 END) AS faltas_justificadas
       FROM chamadas c
       JOIN presencas p ON p.chamada_id = c.id
       WHERE c.turma_id = ?
       GROUP BY c.id
       ORDER BY c.data DESC`
    )
    .all(turma_id);

  res.json({ historico });
}));

module.exports = router;

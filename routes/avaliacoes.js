const express = require("express");
const db = require("../db");
const { autenticar } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(autenticar);

// ---- Avaliações (provas, trabalhos etc, cada uma com um peso) -------------

router.get("/", asyncHandler(async (req, res) => {
  const { turma_id, bimestre } = req.query;
  if (!turma_id || !bimestre) return res.status(400).json({ erro: "Informe a turma e o bimestre." });

  const avaliacoes = await db
    .prepare("SELECT * FROM avaliacoes WHERE turma_id = ? AND bimestre = ? ORDER BY data, id")
    .all(turma_id, bimestre);
  res.json({ avaliacoes });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { turma_id, bimestre, titulo, peso, data } = req.body;
  if (!turma_id || !bimestre || !titulo || !titulo.trim()) {
    return res.status(400).json({ erro: "Informe turma, bimestre e título da avaliação." });
  }
  const pesoNumerico = Number(peso) > 0 ? Number(peso) : 1;

  const resultado = await db
    .prepare("INSERT INTO avaliacoes (turma_id, bimestre, titulo, peso, data, criado_por) VALUES (?, ?, ?, ?, ?, ?)")
    .run(turma_id, bimestre, titulo.trim(), pesoNumerico, data || null, req.usuario.id);

  const avaliacao = await db.prepare("SELECT * FROM avaliacoes WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json({ avaliacao });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const avaliacao = await db.prepare("SELECT * FROM avaliacoes WHERE id = ?").get(req.params.id);
  if (!avaliacao) return res.status(404).json({ erro: "Avaliação não encontrada." });

  const { titulo, peso, data } = req.body;
  await db.prepare("UPDATE avaliacoes SET titulo = ?, peso = ?, data = ? WHERE id = ?").run(
    titulo?.trim() || avaliacao.titulo,
    Number(peso) > 0 ? Number(peso) : avaliacao.peso,
    data !== undefined ? data : avaliacao.data,
    req.params.id
  );

  const atualizada = await db.prepare("SELECT * FROM avaliacoes WHERE id = ?").get(req.params.id);
  res.json({ avaliacao: atualizada });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const avaliacao = await db.prepare("SELECT * FROM avaliacoes WHERE id = ?").get(req.params.id);
  if (!avaliacao) return res.status(404).json({ erro: "Avaliação não encontrada." });

  await db.prepare("DELETE FROM avaliacoes WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
}));

// ---- Notas de uma avaliação específica -------------------------------------

router.get("/:id/notas", asyncHandler(async (req, res) => {
  const avaliacao = await db.prepare("SELECT * FROM avaliacoes WHERE id = ?").get(req.params.id);
  if (!avaliacao) return res.status(404).json({ erro: "Avaliação não encontrada." });

  const linhas = await db
    .prepare(
      `SELECT al.id AS aluno_id, al.nome AS aluno_nome, n.valor
       FROM alunos al
       LEFT JOIN notas n ON n.aluno_id = al.id AND n.avaliacao_id = ?
       WHERE al.turma_id = ? AND al.ativo = 1
       ORDER BY al.nome COLLATE NOCASE`
    )
    .all(req.params.id, avaliacao.turma_id);

  res.json({ avaliacao, notas: linhas });
}));

// Salva (ou atualiza) as notas de vários alunos de uma vez para essa avaliação
router.post("/:id/notas", asyncHandler(async (req, res) => {
  const avaliacao = await db.prepare("SELECT * FROM avaliacoes WHERE id = ?").get(req.params.id);
  if (!avaliacao) return res.status(404).json({ erro: "Avaliação não encontrada." });

  const { notas } = req.body; // [{ aluno_id, valor }]
  if (!Array.isArray(notas)) return res.status(400).json({ erro: "Formato de notas inválido." });

  const comandos = notas.map((item) => {
    const valorNumerico = item.valor === "" || item.valor === null || item.valor === undefined ? null : Number(item.valor);
    return {
      sql: `INSERT INTO notas (avaliacao_id, aluno_id, valor, atualizado_em)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT (avaliacao_id, aluno_id) DO UPDATE SET valor = excluded.valor, atualizado_em = datetime('now')`,
      args: [req.params.id, item.aluno_id, valorNumerico],
    };
  });

  if (comandos.length > 0) await db.emLote(comandos);

  res.json({ ok: true });
}));

module.exports = router;

const express = require("express");
const db = require("../db");
const { autenticar } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(autenticar);

router.get("/:turma_id", asyncHandler(async (req, res) => {
  const { turma_id } = req.params;
  const bimestre = Number(req.query.bimestre) || 1;

  const turma = await db.prepare("SELECT * FROM turmas WHERE id = ?").get(turma_id);
  if (!turma) return res.status(404).json({ erro: "Turma não encontrada." });

  const alunos = await db
    .prepare("SELECT id, nome, matricula FROM alunos WHERE turma_id = ? AND ativo = 1 ORDER BY nome COLLATE NOCASE")
    .all(turma_id);

  const avaliacoes = await db
    .prepare("SELECT * FROM avaliacoes WHERE turma_id = ? AND bimestre = ? ORDER BY data, id")
    .all(turma_id, bimestre);

  const idsAvaliacoes = avaliacoes.map((a) => a.id);
  let notas = [];
  if (idsAvaliacoes.length > 0) {
    const marcadores = idsAvaliacoes.map(() => "?").join(",");
    notas = await db.prepare(`SELECT * FROM notas WHERE avaliacao_id IN (${marcadores})`).all(...idsAvaliacoes);
  }

  const presencasPorAluno = await db
    .prepare(
      `SELECT p.aluno_id,
        SUM(CASE WHEN p.status = 'presente' THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN p.status = 'falta' THEN 1 ELSE 0 END) AS faltas,
        SUM(CASE WHEN p.status = 'falta_justificada' THEN 1 ELSE 0 END) AS faltas_justificadas,
        COUNT(*) AS total
       FROM presencas p
       JOIN chamadas c ON c.id = p.chamada_id
       WHERE c.turma_id = ?
       GROUP BY p.aluno_id`
    )
    .all(turma_id);
  const frequenciaPorAluno = Object.fromEntries(presencasPorAluno.map((f) => [f.aluno_id, f]));

  const somaPesos = avaliacoes.reduce((soma, a) => soma + a.peso, 0);

  const boletim = alunos.map((aluno) => {
    const notasDoAluno = avaliacoes.map((av) => {
      const nota = notas.find((n) => n.avaliacao_id === av.id && n.aluno_id === aluno.id);
      return { avaliacao_id: av.id, titulo: av.titulo, peso: av.peso, valor: nota ? nota.valor : null };
    });

    const notasLancadas = notasDoAluno.filter((n) => n.valor !== null && n.valor !== undefined);
    const pesoLancado = notasLancadas.reduce((soma, n) => soma + n.peso, 0);
    const mediaPonderada = pesoLancado > 0
      ? notasLancadas.reduce((soma, n) => soma + n.valor * n.peso, 0) / pesoLancado
      : null;

    const freq = frequenciaPorAluno[aluno.id];
    const percentualFrequencia = freq && freq.total > 0
      ? Math.round(((freq.presentes + freq.faltas_justificadas) / freq.total) * 1000) / 10
      : null;

    return {
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      matricula: aluno.matricula,
      notas: notasDoAluno,
      media: mediaPonderada !== null ? Math.round(mediaPonderada * 100) / 100 : null,
      completo: notasLancadas.length === avaliacoes.length && avaliacoes.length > 0,
      frequencia_percentual: percentualFrequencia,
      total_faltas: freq ? freq.faltas : 0,
    };
  });

  res.json({
    turma: { id: turma.id, nome: turma.nome, serie_ano: turma.serie_ano, disciplina: turma.disciplina },
    bimestre,
    avaliacoes,
    peso_total: somaPesos,
    boletim,
  });
}));

module.exports = router;

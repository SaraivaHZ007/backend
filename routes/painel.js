const express = require("express");
const db = require("../db");
const { autenticar } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(autenticar);

router.get("/resumo", asyncHandler(async (req, res) => {
  const souCoordenador = req.usuario.papel === "coordenador";

  const filtroTurma = souCoordenador ? "" : "AND t.criado_por = ?";
  const paramsTurma = souCoordenador ? [] : [req.usuario.id];

  const turmasSemChamadaRecente = await db
    .prepare(
      `SELECT t.id, t.nome, t.cor, (SELECT MAX(data) FROM chamadas WHERE chamadas.turma_id = t.id) AS ultima_chamada
       FROM turmas t
       WHERE 1=1 ${filtroTurma}
       HAVING ultima_chamada IS NULL OR julianday('now') - julianday(ultima_chamada) > 7`
    )
    .all(...paramsTurma);

  const mesAtual = new Date().getMonth() + 1;
  const bimestreAtual = mesAtual <= 3 ? 1 : mesAtual <= 6 ? 2 : mesAtual <= 9 ? 3 : 4;

  const filtroAval = souCoordenador ? "" : "AND av.criado_por = ?";
  const paramsAval = souCoordenador ? [bimestreAtual] : [bimestreAtual, req.usuario.id];

  const avaliacoesPendentes = await db
    .prepare(
      `SELECT av.id, av.titulo, t.id AS turma_id, t.nome AS turma_nome, t.cor AS turma_cor,
        (SELECT COUNT(*) FROM alunos WHERE alunos.turma_id = t.id AND alunos.ativo = 1) AS total_alunos,
        (SELECT COUNT(*) FROM notas WHERE notas.avaliacao_id = av.id AND notas.valor IS NOT NULL) AS notas_lancadas
       FROM avaliacoes av
       JOIN turmas t ON t.id = av.turma_id
       WHERE av.bimestre = ? ${filtroAval}
       HAVING total_alunos > 0 AND notas_lancadas < total_alunos`
    )
    .all(...paramsAval);

  res.json({ bimestre_atual: bimestreAtual, turmas_sem_chamada_recente: turmasSemChamadaRecente, avaliacoes_pendentes: avaliacoesPendentes });
}));

module.exports = router;

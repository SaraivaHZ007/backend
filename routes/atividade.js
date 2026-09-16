const express = require("express");
const db = require("../db");
const { autenticar } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(autenticar);

router.get("/", asyncHandler(async (req, res) => {
  const souCoordenador = req.usuario.papel === "coordenador";
  const filtroProfessor = souCoordenador ? "" : "WHERE a.professor_id = ?";
  const filtroProfessorChamada = souCoordenador ? "" : "WHERE c.criado_por = ?";
  const filtroProfessorNota = souCoordenador ? "" : "WHERE av.criado_por = ?";
  const params = souCoordenador ? [] : [req.usuario.id];

  const aulasRecentes = await db
    .prepare(
      `SELECT 'aula' AS tipo, a.titulo AS descricao, t.nome AS turma_nome, u.nome AS professor_nome, a.atualizado_em AS quando
       FROM aulas a JOIN turmas t ON t.id = a.turma_id JOIN usuarios u ON u.id = a.professor_id
       ${filtroProfessor}
       ORDER BY a.atualizado_em DESC LIMIT 8`
    )
    .all(...params);

  const chamadasRecentes = await db
    .prepare(
      `SELECT 'chamada' AS tipo, c.data AS descricao, t.nome AS turma_nome, u.nome AS professor_nome, c.criado_em AS quando
       FROM chamadas c JOIN turmas t ON t.id = c.turma_id JOIN usuarios u ON u.id = c.criado_por
       ${filtroProfessorChamada}
       ORDER BY c.criado_em DESC LIMIT 8`
    )
    .all(...params);

  const notasRecentes = await db
    .prepare(
      `SELECT 'nota' AS tipo, av.titulo AS descricao, t.nome AS turma_nome, u.nome AS professor_nome, MAX(n.atualizado_em) AS quando
       FROM notas n
       JOIN avaliacoes av ON av.id = n.avaliacao_id
       JOIN turmas t ON t.id = av.turma_id
       JOIN usuarios u ON u.id = av.criado_por
       ${filtroProfessorNota}
       GROUP BY n.avaliacao_id
       ORDER BY quando DESC LIMIT 8`
    )
    .all(...params);

  const atividade = [...aulasRecentes, ...chamadasRecentes, ...notasRecentes]
    .sort((a, b) => (a.quando < b.quando ? 1 : -1))
    .slice(0, 12);

  res.json({ atividade });
}));

module.exports = router;

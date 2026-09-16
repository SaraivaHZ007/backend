const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { autenticar, apenasCoordenador } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

const CORES_DISPONIVEIS = ["#7C6FF0", "#FF6B6B", "#14B8A6", "#FFC857", "#4C6EF5", "#F783AC"];

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel, cor: usuario.cor },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/registrar", asyncHandler(async (req, res) => {
  const { nome, email, senha, papel } = req.body;

  if (!nome || !email || !senha || !papel) {
    return res.status(400).json({ erro: "Preencha nome, email, senha e papel." });
  }
  if (!["professor", "coordenador"].includes(papel)) {
    return res.status(400).json({ erro: "Papel inválido. Use 'professor' ou 'coordenador'." });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: "A senha precisa ter pelo menos 6 caracteres." });
  }

  const existente = await db.prepare("SELECT id FROM usuarios WHERE email = ?").get(email.toLowerCase().trim());
  if (existente) {
    return res.status(409).json({ erro: "Já existe uma conta com esse email." });
  }

  const senhaHash = bcrypt.hashSync(senha, 10);
  const cor = CORES_DISPONIVEIS[Math.floor(Math.random() * CORES_DISPONIVEIS.length)];

  const resultado = await db
    .prepare("INSERT INTO usuarios (nome, email, senha_hash, papel, cor) VALUES (?, ?, ?, ?, ?)")
    .run(nome.trim(), email.toLowerCase().trim(), senhaHash, papel, cor);

  const usuario = await db.prepare("SELECT id, nome, email, papel, cor FROM usuarios WHERE id = ?").get(resultado.lastInsertRowid);
  const token = gerarToken(usuario);

  res.status(201).json({ token, usuario });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Informe email e senha." });
  }

  const usuario = await db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email.toLowerCase().trim());
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: "Email ou senha incorretos." });
  }

  const token = gerarToken(usuario);
  delete usuario.senha_hash;

  res.json({ token, usuario });
}));

router.get("/eu", autenticar, asyncHandler(async (req, res) => {
  const usuario = await db.prepare("SELECT id, nome, email, papel, cor FROM usuarios WHERE id = ?").get(req.usuario.id);
  res.json({ usuario });
}));

// ---- Perfil (nome) e senha --------------------------------------------------

router.put("/perfil", autenticar, asyncHandler(async (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ erro: "Informe um nome." });

  await db.prepare("UPDATE usuarios SET nome = ? WHERE id = ?").run(nome.trim(), req.usuario.id);
  const usuario = await db.prepare("SELECT id, nome, email, papel, cor FROM usuarios WHERE id = ?").get(req.usuario.id);
  const token = gerarToken(usuario);
  res.json({ usuario, token });
}));

router.put("/senha", autenticar, asyncHandler(async (req, res) => {
  const { senha_atual, senha_nova } = req.body;
  if (!senha_atual || !senha_nova) return res.status(400).json({ erro: "Informe a senha atual e a nova senha." });
  if (senha_nova.length < 6) return res.status(400).json({ erro: "A nova senha precisa ter pelo menos 6 caracteres." });

  const usuario = await db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.usuario.id);
  if (!bcrypt.compareSync(senha_atual, usuario.senha_hash)) {
    return res.status(401).json({ erro: "A senha atual informada está incorreta." });
  }

  const novoHash = bcrypt.hashSync(senha_nova, 10);
  await db.prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?").run(novoHash, req.usuario.id);
  res.json({ ok: true });
}));

// ---- Área do coordenador: ver a equipe e redefinir senha de alguém ----------

router.get("/usuarios", autenticar, apenasCoordenador, asyncHandler(async (req, res) => {
  const usuarios = await db.prepare("SELECT id, nome, email, papel, cor, criado_em FROM usuarios ORDER BY nome COLLATE NOCASE").all();
  res.json({ usuarios });
}));

router.post("/usuarios/:id/redefinir-senha", autenticar, apenasCoordenador, asyncHandler(async (req, res) => {
  const { senha_nova } = req.body;
  if (!senha_nova || senha_nova.length < 6) {
    return res.status(400).json({ erro: "Informe uma nova senha com pelo menos 6 caracteres." });
  }

  const usuario = await db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.params.id);
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });

  const novoHash = bcrypt.hashSync(senha_nova, 10);
  await db.prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?").run(novoHash, req.params.id);
  res.json({ ok: true });
}));

module.exports = router;

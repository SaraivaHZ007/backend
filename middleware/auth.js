const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: "Você precisa estar logado para fazer isso." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, nome, email, papel }
    next();
  } catch (err) {
    return res.status(401).json({ erro: "Sua sessão expirou. Faça login novamente." });
  }
}

function apenasCoordenador(req, res, next) {
  if (req.usuario.papel !== "coordenador") {
    return res.status(403).json({ erro: "Apenas coordenadores podem fazer isso." });
  }
  next();
}

module.exports = { autenticar, apenasCoordenador };

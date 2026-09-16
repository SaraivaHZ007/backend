// O Express não sabe lidar sozinho com erros lançados dentro de uma rota
// "async" — sem isso, um erro de rede com o banco (Turso) travaria a
// requisição sem nunca responder ao navegador. Este empacotador resolve isso:
// qualquer erro dentro da rota é automaticamente encaminhado para o
// middleware de erro central (definido em server.js).
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const { createClient } = require("@libsql/client");

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("\n⚠️  Faltou configurar TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no arquivo .env.\n" +
    "   Crie um banco gratuito em https://turso.tech e copie as credenciais de lá.\n");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ---------------------------------------------------------------------------
// Pequena camada de compatibilidade: o Turso é um banco remoto (toda consulta
// é uma chamada de rede), então tudo aqui é assíncrono — diferente do
// better-sqlite3 original, que era síncrono por ser um arquivo local.
// Por isso, toda rota que usa o banco agora precisa de "await".
// ---------------------------------------------------------------------------

function prepare(sql) {
  return {
    async get(...args) {
      const resultado = await client.execute({ sql, args });
      return resultado.rows[0];
    },
    async all(...args) {
      const resultado = await client.execute({ sql, args });
      return resultado.rows;
    },
    async run(...args) {
      const resultado = await client.execute({ sql, args });
      return {
        lastInsertRowid: Number(resultado.lastInsertRowid),
        changes: resultado.rowsAffected,
      };
    },
  };
}

// Executa vários comandos como uma transação (tudo funciona, ou nada é salvo)
async function emLote(comandos) {
  return client.batch(
    comandos.map((c) => ({ sql: c.sql, args: c.args || [] })),
    "write"
  );
}

async function iniciarBanco() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      papel TEXT NOT NULL CHECK (papel IN ('professor', 'coordenador')),
      cor TEXT NOT NULL DEFAULT '#7C6FF0',
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS turmas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      serie_ano TEXT,
      disciplina TEXT,
      cor TEXT NOT NULL DEFAULT '#14B8A6',
      criado_por INTEGER NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS aulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professor_id INTEGER NOT NULL,
      turma_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      objetivos TEXT,
      metodologia TEXT,
      recursos TEXT,
      avaliacao TEXT,
      data TEXT NOT NULL,
      horario_inicio TEXT NOT NULL,
      horario_fim TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada', 'realizada', 'cancelada')),
      sugestoes_ia TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (professor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_aulas_data ON aulas(data);
    CREATE INDEX IF NOT EXISTS idx_aulas_professor ON aulas(professor_id);
    CREATE INDEX IF NOT EXISTS idx_aulas_turma ON aulas(turma_id);

    CREATE TABLE IF NOT EXISTS alunos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      turma_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      matricula TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS avaliacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      turma_id INTEGER NOT NULL,
      bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
      titulo TEXT NOT NULL,
      peso REAL NOT NULL DEFAULT 1,
      data TEXT,
      criado_por INTEGER NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
      FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      avaliacao_id INTEGER NOT NULL,
      aluno_id INTEGER NOT NULL,
      valor REAL,
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id) ON DELETE CASCADE,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
      UNIQUE (avaliacao_id, aluno_id)
    );

    CREATE TABLE IF NOT EXISTS chamadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      turma_id INTEGER NOT NULL,
      aula_id INTEGER,
      data TEXT NOT NULL,
      criado_por INTEGER NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
      FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE SET NULL,
      FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE (turma_id, data)
    );

    CREATE TABLE IF NOT EXISTS presencas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chamada_id INTEGER NOT NULL,
      aluno_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('presente', 'falta', 'falta_justificada')),
      FOREIGN KEY (chamada_id) REFERENCES chamadas(id) ON DELETE CASCADE,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
      UNIQUE (chamada_id, aluno_id)
    );

    CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos(turma_id);
    CREATE INDEX IF NOT EXISTS idx_avaliacoes_turma ON avaliacoes(turma_id, bimestre);
    CREATE INDEX IF NOT EXISTS idx_notas_avaliacao ON notas(avaliacao_id);
    CREATE INDEX IF NOT EXISTS idx_chamadas_turma ON chamadas(turma_id, data);
    CREATE INDEX IF NOT EXISTS idx_presencas_chamada ON presencas(chamada_id);

    CREATE TABLE IF NOT EXISTS convites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      criado_por INTEGER NOT NULL,
      usado_por INTEGER,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      usado_em TEXT,
      FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (usado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    );
  `);
}

module.exports = { prepare, emLote, iniciarBanco, client };

// Programador: Neumar Moraes
// Data : 19/03/2025
// Descrição: Backend para cadastro de produtos

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const firebird = require('node-firebird');

const app = express();
const port = 3000;

app.use(cors()); // ← AQUI!
app.use(express.json());

// Conectar ao banco de dados MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // Substitua com seu usuário MySQL
  password: '',  // Substitua com sua senha
  database: 'sisvendas'  // Substitua com o nome do seu banco de dados
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados sisvendas: ' + err.stack);
    return;
  }
  console.log('Conectado ao banco de dados sisvendas com ID: ' + db.threadId);
});

// Configuração do Firebird
const firebirdOptions = {
  host: 'localhost',      // Endereço do servidor Firebird
  port: 3050,            // Porta padrão do Firebird
  database: 'C:/NOBERTO/BANCO.FDB', // Caminho completo do banco de dados Firebird
  user: 'SYSDBA',        // Usuário do Firebird
  password: 'masterkey', // Senha do Firebird
};

// Endpoint para cadastrar produtos
app.post('/api/produtos', (req, res) => {
  console.log('Requisição recebida:', req.body); // Log de teste

  const { nome, descricao, preco } = req.body;
  const fornecedorCodigo = 1; // Valor fixo

  const query = 'INSERT INTO produtos (nome, descricao, preco, fornecedor_codigo) VALUES (?, ?, ?, ?)';
  db.query(query, [nome, descricao, preco, fornecedorCodigo], (err, result) => {
    if (err) {
      console.error('Erro ao cadastrar produto:', err);
      return res.status(500).json({ message: 'Erro ao cadastrar produto' });
    }
    res.status(201).json({ message: 'Produto cadastrado com sucesso', id: result.insertId });
  });
});

// Endpoint para consultar produtos
app.get('/api/produtos', (req, res) => {
  db.query('SELECT * FROM produtos', (err, result) => {
    if (err) {
      console.error('Não existem produtos na lista !!', err);
      return res.status(500).json({ message: 'Erro ao listar produtos' });
    }
    res.json(result);
  });
});

// Endpoint para buscar produto por nome (item único)
app.get('/api/produtos/buscar', (req, res) => {
  const { nome } = req.query;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ message: 'Parâmetro "nome" é obrigatório' });
  }

  const query = 'SELECT * FROM produtos WHERE nome LIKE ? LIMIT 1';
  db.query(query, [`%${nome}%`], (err, results) => {
    if (err) {
      console.error('Erro ao buscar produto por nome:', err);
      return res.status(500).json({ message: 'Erro ao buscar produto' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(results[0]); // Retorna o primeiro produto encontrado
  });
});

// Endpoint para alterar produtos

app.put('/produtos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, fornecedor_codigo } = req.body;

  const sql = `
    UPDATE produtos 
    SET nome = ?, preco = ?, descricao = ?, preco = ? , fornecedor_codigo = ?
    WHERE id = ?
  `;

  db.query(sql, [nome, preco, descricao, estoque, id], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar produto:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar produto' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado' });
    }

    res.json({ mensagem: 'Produto atualizado com sucesso' });
  });
});

// Endpoint para excluir produtos

app.delete('/api/produtos/:codigo', async (req, res) => {
  const { codigo } = req.params; // Obtém o código do produto da URL

  // Validação do código do produto
  if (!codigo || isNaN(codigo)) {
    return res.status(400).json({ message: 'Código do produto inválido !!' });
  }

  try {
    // Consultar e excluir o produto
    const result = await new Promise((resolve, reject) => {
      db.query('DELETE FROM produtos WHERE codigo = ?', [codigo], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // Verifica se algum produto foi excluído
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Retorna a resposta de sucesso
    res.json({ message: 'Produto excluído com sucesso.' });

  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    res.status(500).json({ message: 'Erro interno do servidor ao excluir produto.' });
  }
});

// Endpoint para consultar produtos do Firebird
app.get('/api/produtos-firebird', (req, res) => {
  firebird.attach(firebirdOptions, (err, db) => {
    if (err) {
      console.error('Erro ao conectar ao Firebird:', err);
      return res.status(500).json({ message: 'Erro ao conectar ao Firebird' });
    }

    db.query('SELECT COD_PRO, NOME_PRO, VALOR_PRO FROM PRODUTO', (err, result) => {
      if (err) {
        db.detach();
        console.error('Erro ao consultar produtos no Firebird:', err);
        return res.status(500).json({ message: 'Erro ao listar produtos no Firebird' });
      }

      db.detach();
      res.json(result); // Retorna os dados do Firebird para o frontend
    });
  });
}); // fim do firebird

// Atualizar produtos
app.post('/api/produtos/:codigo', async (req, res) => {
  const { codigo } = req.params; // Obtém o código do produto da URL
  const { nome } = req.body; // Obtém o nome do produto a ser atualizado do corpo da requisição

  // Validação do código do produto
  if (!codigo || isNaN(codigo)) {
    return res.status(400).json({ message: 'Código do produto inválido !!' });
  }

  // Validação do nome
  if (!nome) {
    return res.status(400).json({ message: 'Nome do produto é obrigatório !' });
  }

  try {
    // Alterar o produto
    const result = await new Promise((resolve, reject) => {
      db.query(
        'UPDATE produtos SET nome = ? WHERE codigo = ?',
        [nome, codigo], // Passando o nome e o código para a consulta
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // Verifica se algum produto foi alterado
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado !!' });
    }

    // Retorna a resposta de sucesso
    res.json({ message: 'Produto alterado com sucesso !!' });

  } catch (err) {
    console.error('Erro ao alterar o produto:', err);
    res.status(500).json({ message: 'Erro interno do servidor ao alterar produto !!' });
  }
});

// Endpoint de login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
  }

  const query = 'SELECT * FROM tbl_usuarios WHERE TRIM(LOWER(usuario)) = TRIM(LOWER(?)) AND senha = ?';
  db.query(query, [usuario, senha], (err, results) => {
    if (err) {
      console.error('Erro ao consultar usuário:', err);
      return res.status(500).json({ erro: 'Erro ao verificar usuário' });
    }

    if (results.length > 0) {
      res.json({ sucesso: true, usuario: results[0] });
    } else {
      res.status(401).json({ erro: 'Usuário ou senha inválidos !' });
    }
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta 3000');
});

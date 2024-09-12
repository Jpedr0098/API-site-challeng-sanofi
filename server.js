const express = require('express')
const oracledb = require('oracledb')
const cors = require('cors')
const multer = require('multer')
const fs = require('fs')

require('dotenv').config() // Carrega variáveis de ambiente do arquivo .env
const upload = multer({ dest: 'uploads/' }); // Diretório temporário de upload
const app = express()
const port = 3000

//oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Configurações de conexão com o banco de dados usando variáveis de ambiente
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING
}

// Função para obter uma conexão com o banco de dados
async function getConnection() {
    return oracledb.getConnection(dbConfig)
}

app.use(cors())
app.use(express.json())


app.get('/api/v1/users', async (req, res) => {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT * FROM usuarios`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
        res.json(result.rows)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Database error' })

    } finally {
        if (connection) {
            await connection.close()
        }
    }
})

// Função auxiliar para encontrar um usuário por ID
async function findUser(id) {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT * FROM usuarios WHERE id = :id`,
            [id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
        return result.rows[0]
    } catch (err) {
        console.error(err)
        throw err

    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

// GET /api/users/:id - Obter detalhes de um usuário específico
app.get('/api/v1/users/:id', async (req, res) => {
    try {
        const user = await findUser(req.params.id)
        user ? res.json(user) : res.status(404).json({ message: 'User not found' })
    } catch (err) {
        res.status(500).json({ message: 'Database error' })
    }
})

// POST /api/users - Adicionar um novo usuário
app.post('/api/v1/users', async (req, res) => {
    const { usuario, senha, acesso } = req.body
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `INSERT INTO users (usuario, senha, nivel_acesso, pri_login) VALUES (:usuario, :senha ,:acesso, false) RETURNING id INTO :id`,
            [usuario, senha, acesso, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }],
            { autoCommit: true }
        )
        res.status(201).json({ id: result.outBinds.id[0], usuario, nivel_acesso})

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Database error' })

    } finally {
        if (connection) {
            await connection.close()
        }
    }
})

// PUT /api/users/:id - Atualizar um usuário existente
app.put('/api/v1/users/:id', async (req, res) => {
    const { senha, nivel_acesso } = req.body
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `UPDATE usuarios SET senha = :senha, nivel_acesso = :nivel_acesso WHERE user_id = :id`,
            [senha, nivel_acesso, req.params.id],
            { autoCommit: true }
        )
        if (result.rowsAffected > 0) {
            res.json({ id: req.params.id, senha, nivel_acesso })
            
        } else {
            res.status(404).json({ message: 'User not found' })
        }

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Database error' })

    } finally {
        if (connection) {
            await connection.close()
        }
    }
})

app.put('/api/v1/users/login/:id', async (req, res) => {
    const { senha } = req.body
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `UPDATE usuarios SET senha = :senha WHERE user_id = :id`,
            [senha, req.params.id],
            { autoCommit: true }
        )
        if (result.rowsAffected > 0) {
            res.json({ id: req.params.id, senha })
        } else {
            res.status(404).json({ message: 'User not found' })
        }

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Database error' })

    } finally {
        if (connection) {
            await connection.close()
        }
    }
})

// DELETE /api/users/:id - Deletar um usuário
app.delete('/api/v1/users/:user', async (req, res) => {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `DELETE FROM usuarios WHERE usuario = :user`,
            [req.params.id],
            { autoCommit: true }
        )
        result.rowsAffected > 0 ? res.status(204).end() : res.status(404).json({ message: 'User not found' })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Database error' })

    } finally {
        if (connection) {
            await connection.close()
        }
    }
})

//TESTES
//==============================================================================
// Função auxiliar para encontrar um usuário por ID
async function findUser(id) {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT * FROM usuarios WHERE user = :id`,
            [id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        return result.rows[0]
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

app.get('/api/v2/users/:id', async (req, res) => {
    try {
        const user = await findUser(req.params.id)
        user ? res.json(user) : res.status(404).json({ message: 'User not found' })
    } catch (err) {
        res.status(500).json({ message: 'Database error' })
    }
})

//=====================================================
// Upload de arquivos
app.post('/upload', upload.single('file'), async (req, res) => {
    const { file } = req;
    let connection;

    try {
        connection = await getConnection();
        const fileData = fs.readFileSync(file.path)

        const result = await connection.execute(
            `INSERT INTO pdf_files (file_name, file_data) VALUES (:file_name, EMPTY_BLOB()) RETURNING file_data INTO :file_data`,
            {
                file_name: file.originalname,
                file_data: { type: oracledb.BLOB, dir: oracledb.BIND_OUT }
            },
            { autoCommit: false }
        )

        const lob = result.outBinds.file_data[0]
        lob.write(fileData, async (err) => {
            if (err) {
                return res.status(500).send('Erro ao escrever no BLOB.');
            }
            lob.close()
            await connection.commit()
            res.send({ success: true })
        })
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro ao enviar o arquivo.')
    } finally {
        fs.unlinkSync(file.path) // Remove o arquivo temporário
        if (connection) await connection.close()
    }
})

// Listar arquivos
app.get('/list-files', async (req, res) => {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(`SELECT id, file_name FROM pdf_files`);
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro ao listar arquivos.')
    } finally {
        if (connection) await connection.close()
    }
})

// Download de arquivo
app.get('/download/:id', async (req, res) => {
    const fileId = req.params.id
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT file_name, file_data FROM pdf_files WHERE id = :id`,
            [fileId]
        )

        if (result.rows.length === 0) {
            return res.status(404).send('Arquivo não encontrado.')
        }

        const { file_name, file_data } = result.rows[0]
        const lob = file_data

        res.setHeader('Content-Disposition', `attachment; filename=${file_name}`)
        lob.on('data', (chunk) => res.write(chunk))
        lob.on('end', () => res.end())
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro ao fazer download do arquivo.')
    } finally {
        if (connection) await connection.close()
    }
})


// Inicia o servidor
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`))

const express = require('express')
const oracledb = require('oracledb')
const cors = require('cors')

require('dotenv').config()
const app = express()
const port = 3000

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

//Funções de pesquisa em banco - tabela de usuarios

//Puxa todos os dados da tabela de usuarios
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
async function findUser(user_name) {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT * FROM usuarios WHERE usuario = :user_name`,
            [user_name],
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
app.get('/api/v1/users/login', async (req, res) => {
    const { name, password } = req.body
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT * FROM usuarios WHERE usuario = :name and senha = :password`,
            [name, password]
        )

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Database error' })

    } finally {
        if (connection) {
            await connection.close()
        }
    }
})

// POST /api/users - Adicionar um novo usuário
app.post('/api/v1/users', async (req, res) => {
    const { name, password } = req.body
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `INSERT INTO users (name, password) VALUES (:name, :password) RETURNING id INTO :id`,
            [name, password, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }],
            { autoCommit: true }
        )
        res.status(201).json({ id: result.outBinds.id[0], name, password })

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
    const { password } = req.body
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `UPDATE usuarios SET senha = :password WHERE user_id = :id`,
            [password, req.params.id],
            { autoCommit: true }
        )
        if (result.rowsAffected > 0) {
            res.json({ id: req.params.id, password })
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
app.delete('/api/v1/users/:id', async (req, res) => {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `DELETE FROM usuarios WHERE id = :id`,
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

// Inicia o servidor
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`))
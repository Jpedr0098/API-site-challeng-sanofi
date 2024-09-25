const express = require('express')
const oracledb = require('oracledb')
const cors = require('cors')

require('dotenv').config() // Carrega variáveis de ambiente do arquivo .env

const app = express()
const port = 3000

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
app.get('/api/users/:id', async (req, res) => {
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
        res.status(201).json({ id: result.outBinds.id[0]})

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
async function findUser2(id) {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT * FROM usuariosv2 WHERE usuario = :id`,
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
        const user = await findUser2(req.params.id)
        user ? res.json(user) : res.status(404).json({ message: 'User not found' })
    } catch (err) {
        res.status(500).json({ message: 'Database error' })
    }
})

async function findFunc(id) {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT * FROM funcionarios WHERE USUARIOS_ID_USER = :id`,
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

app.get('/api/v2/funcio/:id', async (req, res) => {
    try {
        const user = await findFunc(req.params.id)
        user ? res.json(user) : res.status(404).json({ message: 'User not found' })
    } catch (err) {
        res.status(500).json({ message: 'Database error' })
    }
})

async function findSolicitacao(id) {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT * FROM solicitacao WHERE FUNCIONARIOS_ID_FUNC = :id ORDER BY ID_SOLIC DESC`,
            [id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        return result.rows
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

app.get('/api/v2/solic/:id', async (req, res) => {
    try {
        const user = await findSolicitacao(req.params.id)
        user ? res.json(user) : res.status(404).json({ message: 'User not found' })
    } catch (err) {
        res.status(500).json({ message: 'Database error' })
    }
})

async function findSolicitacaoAprovacoes(ids) {
    let connection

    try {
        connection = await getConnection()
        const placeholders = ids.map((_, index) => `:id${index}`).join(', ')
        const result = await connection.execute(
            `SELECT * FROM solicitacao WHERE STATUS = 'solicitado' AND FUNCIONARIOS_ID_FUNC IN ${placeholders}`,
            [ids],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        return result.rows
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

app.get('/api/v2/solicAprov', async (req, res) => {
    try {
        const ids = req.query.ids.split(',').map(id => Number(id.trim())) // Converte os IDs da query string em um array de números
        const solicAprovacoes = await findSolicitacaoAprovacoes(ids)
        solicAprovacoes.length ? res.json(solicAprovacoes) : res.status(404).json({ message: 'No aprovacoes found' })
    } catch (err) {
        res.status(500).json({ message: 'Database error' })
    }
})

async function findliderados(id) {
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `SELECT id_func, (nome || ' ' || sobrenome) AS nome_completo, email FROM funcionarios WHERE id_lider = :id`,
            [id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        return result.rows
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

app.get('/api/v2/liderados/:id', async (req, res) => {
    try {
        const user = await findliderados(req.params.id)
        user ? res.json(user) : res.status(404).json({ message: 'User not found' })
    } catch (err) {
        res.status(500).json({ message: 'Database error' })
    }
})

// async function findSolicitacao(id) {
//     let connection

//     try {
//         connection = await getConnection()
//         const result = await connection.execute(
//             `SELECT * FROM solicitacao WHERE FUNCIONARIOS_ID_FUNC = :id ORDER BY DESC`,
//             [id],
//             { outFormat: oracledb.OUT_FORMAT_OBJECT }
//         )

//         return result.rows
//     } catch (err) {
//         console.error(err)
//         throw err
//     } finally {
//         if (connection) {
//             await connection.close()
//         }
//     }
// }

// async function findEvent(id) {
//     let connection

//     try {
//         connection = await getConnection()
//         const result = await connection.execute(
//             `SELECT * FROM eventos WHERE ID_EVENT = :id`,
//             [id],
//             { outFormat: oracledb.OUT_FORMAT_OBJECT }
//         )

//         return result.rows
//     } catch (err) {
//         console.error(err)
//         throw err
//     } finally {
//         if (connection) {
//             await connection.close()
//         }
//     }
// }

// app.get('/api/v2/event/:id', async (req, res) => {
//     try {
//         const user = await findEvent(req.params.id)
//         user ? res.json(user) : res.status(404).json({ message: 'User not found' })
//     } catch (err) {
//         res.status(500).json({ message: 'Database error' })
//     }
// })


async function findEvents(ids) {
    let connection

    try {
        connection = await getConnection()
        // Cria uma string de placeholders para a lista de IDs, como ":id0, :id1, :id2, ..."
        const placeholders = ids.map((_, index) => `:id${index}`).join(', ')
        
        // Executa a query com os placeholders e passa os valores da lista de IDs
        const result = await connection.execute(
            `SELECT * FROM eventos WHERE ID_EVENT IN (${placeholders})`,
            ids,  // Passa a lista diretamente
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        return result.rows
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (connection) {
            await connection.close()
        }
    }
}

app.get('/api/v3/events', async (req, res) => {
    try {
        const ids = req.query.ids.split(',').map(id => Number(id.trim())) // Converte os IDs da query string em um array de números
        const events = await findEvents(ids)
        events.length ? res.json(events) : res.status(404).json({ message: 'No events found' })
    } catch (err) {
        res.status(500).json({ message: 'Database error' })
    }
})


app.post('/api/v2/solicitacao', async (req, res) => {
    const { motivo, idFuncio, endereco } = req.body
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `INSERT INTO solicitacao (ID_SOLIC, DT_SOLIC, MOTIVO, STATUS, FUNCIONARIOS_ID_FUNC, ENDERECO) VALUES (seq_solicitacao.NEXTVAL, SYSDATE, :motivo, 'solicitado', :idFuncio, :endereco)`,
            [motivo, idFuncio, endereco],
            { autoCommit: true }
        )
        res.status(201)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Database error' })

    } finally {
        if (connection) {
            await connection.close()
        }
    }
})


app.put('/api/v2/solicitacao/:id', async (req, res) => {
    const { aprovacao } = req.body
    let connection

    try {
        connection = await getConnection()
        const result = await connection.execute(
            `UPDATE solicitacao SET STATUS = :aprovacao WHERE ID_SOLIC = :id`,
            [aprovacao, req.params.id],
            { autoCommit: true }
        )
        if (result.rowsAffected > 0) {
            res.json({ id: req.params.id, aprovacao })

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


app.post('/api/v2/solicitacao/equipamentos', async (req, res) => {
    const {solicID, equipID, Qdte} = req.body
    let connection

    try {
        connection = await getConnection()
        await connection.execute(
            `INSERT INTO solic_equip (SOLIC_ID_SOLIC, EQUIP_ID_EQUIP, QUANTIDADE) VALUES (:solicID, :equipID, :Qdte)`,
            [solicID, equipID, Qdte],
            { autoCommit: true }
        )
        res.status(201)

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

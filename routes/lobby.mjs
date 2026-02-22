import express, {json} from "express"
const router = express.Router()
router.use(json())
import bodyParser from "body-parser"
router.use(bodyParser.json())

import pool from "../db.mjs"


// CREATE new lobby
router.post("/newLobby", async (req, res, next) => {
  const { title } = req.body

  if (!title) {
    return res.status(400).json({ message: "Tous les champs sont requis." })
  }

  const sqlQuery = "INSERT INTO lobby (title) VALUES (?)"
  const values = [title]

  try {
    await pool.query(sqlQuery, values)
    return res
      .status(201)
      .json({ message: "Le lobby a été créé avec succès !" })
  } catch (err) {
    console.error("Erreur lors de la création du lobby :", err)
    return res.status(500).json({
      message: "Une erreur est survenue lors de la création du lobby.",
    })
  }
})

// @desc      Create a message in a lobby
// @route     POST /api/lobby/:lobbyId
// @acces
//router.post("/:lobbyId", async (req, res, next) => {
//  const { user_id, content, timeStamp } = req.body
//  const lobbyId = req.params.lobbyId

//  if (!user_id || !content || !timeStamp || !lobbyId) {
//    return res.status(400).json({ message: "Tous les champs sont requis." })
//  }

//  const userLobbyCheckQuery =
//    "SELECT * FROM lobbies_has_users WHERE users_id = ? AND lobby_id = ?"
//  const userLobbyCheckValues = [user_id, lobbyId]
//  const userLobbyCheckResult = await pool.query(
//    userLobbyCheckQuery,
//    userLobbyCheckValues
//  )

//  if (userLobbyCheckResult.length === 0) {
//    return res
//      .status(403)
//      .json({ message: "Vous n'êtes pas autorisé à poster dans ce lobby." })
//  }

//  const query =
//    "INSERT INTO messages (user_id, content, timeStamp, lobby_id) VALUES (?, ?, ?, ?)"
//  const values = [user_id, content, timeStamp, lobbyId]

//  try {
//    await pool.query(query, values)
//    return res
//      .status(201)
//      .json({ message: "Le message a été enregistré avec succès !" })
//  } catch (err) {
//    console.error("Erreur lors de l'insertion du message :", err)
//    return res.status(500).json({
//      message: "Une erreur est survenue lors de l'enregistrement du message.",
//    })
//  }
//  next()
//})
router.post("/:lobbyId", async (req, res, next) => {
  // Si l'utilisateur n'est pas connecté, on le renvoie au login
  if (!req.user) {
    return res.redirect('/api/login')
  }  
  const { content } = req.body  // on ne prend plus user_id du formulaire
  const lobbyId = req.params.lobbyId
  const user_id = req.user.id   // on le récupère depuis la session
  const timeStamp = new Date()  // on génère la date automatiquement
  

  if (!content) {
    return res.status(400).json({ message: "Le message ne peut pas être vide." })
  }

  try {
    await pool.query(
      'INSERT INTO messages (user_id, content, timeStamp, lobby_id) VALUES (?, ?, ?, ?)',
      [user_id, content, timeStamp, lobbyId]
    )
    // On redirige vers le même lobby pour voir le nouveau message
    return res.redirect(`/api/lobby/${lobbyId}`)
  } catch (err) {
    console.error("Erreur lors de l'insertion du message :", err)
    return res.status(500).json({ message: "Erreur serveur." })
  }
})

// EJS ok
// GET all the users from a lobby
router.get("/:lobbyId/users", async (req, res, next) => {
  const lobbyId = req.params.lobbyId
  try {
    //const result = await pool.query(
    //  `SELECT users.name FROM users left join lobbies_has_users on users.id = lobbies_has_users.users_id 
    //    where lobbies_has_users.lobby_id = ${lobbyId}`
    //)
    const result = await pool.query(
      'SELECT users.name FROM users LEFT JOIN lobbies_has_users ON users.id = lobbies_has_users.users_id WHERE lobbies_has_users.lobby_id = ?',
      [lobbyId]
    )    
    res.render("users", {result})
    console.log(result)
  } catch (err) {
    console.error("Error fetching usernames", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// GET all the messages from a lobby

//router.get("/:lobbyId", async (req, res, next) => {
//  const lobbyId = req.params.lobbyId
//  try {
//    //const result = await pool.query(
//    //  `SELECT content FROM messages WHERE lobby_id = ${lobbyId}`
//    //)
//    const result = await pool.query(
//      'SELECT content FROM messages WHERE lobby_id = ?',
//      [lobbyId]
//    )    
//    res.json(result)
//    console.log(result)
//  } catch (err) {
//    console.error("Error fetching messages", err)
//    res.status(500).json({ error: "Internal Server Error" })
//  }
//})
router.get("/:lobbyId", async (req, res, next) => {
  if (!req.user) return res.redirect('/api/login')
  
  const lobbyId = req.params.lobbyId
  try {
    const lobbyResult = await pool.query(
      'SELECT * FROM lobby WHERE id = ?',
      [lobbyId]
    )
    const messagesResult = await pool.query(
      `SELECT messages.content, messages.timeStamp, users.name 
       FROM messages 
       LEFT JOIN users ON messages.user_id = users.id 
       WHERE messages.lobby_id = ?
       ORDER BY messages.timeStamp ASC`,
      [lobbyId]
    )

    res.render('lobby', {
      lobby: lobbyResult[0],
      messages: messagesResult,
      user: req.user  // ← NOUVEAU
    })

  } catch (err) {
    console.error("Erreur lors de la récupération du lobby :", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// GET a specific message from a specific lobby

router.get('/:lobbyId/:messageId', async (req, res, next) => {
  const lobbyId = req.params.lobbyId
  const messageId = req.params.messageId
  try {
    const result = await pool.query(
      `SELECT content FROM messages WHERE lobby_id = ${lobbyId} AND id = ${messageId}`
    )
    console.log(result)
    res.json(result)
  } catch (err) {
    console.error("Error fetching messages", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// Create a new user in a specific lobby (create a new lobby if it doesn't already exist)
router.post('/:lobbyId/add-user', async (req, res, next) => {
  const lobbyId = req.params.lobbyId
  const { name, email, password, role } = req.body

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Tous les champs sont requis." })
  }

  try {
    // Ce lobby existe-t-il?
    const lobbyCheckQuery = "SELECT * FROM lobby WHERE id = ?"
    const lobbyCheckResult = await pool.query(lobbyCheckQuery, [lobbyId])

    if (lobbyCheckResult.length === 0) {
      // Si pas, on le créé
      const createLobbyQuery = "INSERT INTO lobby (id, title) VALUES (?, ?)"
      const createLobbyValues = [lobbyId, `Lobby ${lobbyId}`]
      await pool.query(createLobbyQuery, createLobbyValues)
    }

    // Insérer le nouvel user dans "users"
    const userQuery =
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)"
    const userValues = [name, email, password, role]
    const userResult = await pool.query(userQuery, userValues)

    // Récupérer son ID 
    const userId = userResult.insertId

    // insérer la relation dans "lobbies_has_users"
    const lobbiesHasUsersQuery =
      "INSERT INTO lobbies_has_users (users_id, lobby_id) VALUES (?, ?)"
    const lobbiesHasUsersValues = [userId, lobbyId]
    await pool.query(lobbiesHasUsersQuery, lobbiesHasUsersValues)

    return res
      .status(201)
      .json({ message: "Le nouvel utilisateur a été créé avec succès !" })
  } catch (err) {
    console.error("Erreur lors de la création de l'utilisateur :", err)
    return res.status(500).json({
      message: "Une erreur est survenue lors de la création de l'utilisateur.",
    })
  }
})

// Remove a specific user from a specific lobby
router.post("/:lobbyId/remove-user/:userId", async (req, res, next) => {
  const lobbyId = req.params.lobbyId
  const userId = req.params.userId

  try {
    const lobbyCheckQuery = "SELECT * FROM lobby WHERE id = ?"
    const lobbyCheckResult = await pool.query(lobbyCheckQuery, [lobbyId])

    if (lobbyCheckResult.length === 0) {
      return res
        .status(404)
        .json({ message: "Le lobby spécifié n'existe pas." })
    }

    const userCheckQuery = "SELECT * FROM users WHERE id = ?"
    const userCheckResult = await pool.query(userCheckQuery, [userId])

    if (userCheckResult.length === 0) {
      return res
        .status(404)
        .json({ message: "L'utilisateur spécifié n'existe pas." })
    }

    const removeUserFromLobbyQuery =
      "DELETE FROM lobbies_has_users WHERE users_id = ? AND lobby_id = ?"
    await pool.query(removeUserFromLobbyQuery, [userId, lobbyId])

    return res
      .status(200)
      .json({ message: "L'utilisateur a été supprimé du lobby avec succès !" })
  } catch (err) {
    console.error(
      "Erreur lors de la suppression de l'utilisateur du lobby :",
      err
    )
    return res.status(500).json({
      message:
        "Une erreur est survenue lors de la suppression de l'utilisateur du lobby.",
    })
  }
  next()
})

export default router


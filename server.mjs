import dotenv from "dotenv"
dotenv.config()

import express from "express"
const app = express()

// ← NOUVEAU : on crée un serveur HTTP explicitement
import { createServer } from "http"
const httpServer = createServer(app)

// ← NOUVEAU : on attache Socket.io à ce serveur
import { Server } from "socket.io"
const io = new Server(httpServer)

import expressLayouts from "express-ejs-layouts"
import session from "express-session"
import flash from "express-flash"
import passport from "passport"
import pool from "./db.mjs"
import initializePassport from "./passport-config.mjs"

const getUserByEmail = async (email) => {
    const rows = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    return rows[0] || null
}

const getUserById = async (id) => {
    const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id])
    return rows[0] || null
}

initializePassport(passport, getUserByEmail, getUserById)

app.set("view engine", "ejs")
app.set("views", "/home/alizee/becode_exo/hill/expressAdvanced" + "/views")
app.set("layout", "layouts/layout")
app.use(expressLayouts)
app.use(express.static("public"))

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

import indexRouter from "./routes/index.mjs"

app.get("/", (req, res) => {
    res.render("index")
})
app.use("/api", indexRouter)

// ← NOUVEAU : la logique Socket.io
io.on("connection", (socket) => {
    console.log("Un utilisateur s'est connecté ✅")

    // L'utilisateur rejoint la "room" du lobby
    socket.on("joinLobby", (lobbyId) => {
        socket.join(lobbyId)
        console.log(`Un utilisateur a rejoint le lobby ${lobbyId}`)
    })

    // L'utilisateur envoie un message
    socket.on("newMessage", (data) => {
        // On renvoie le message à tous les utilisateurs du même lobby
        io.to(data.lobbyId).emit("receiveMessage", data)
    })

    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté")
    })
})

// ← NOUVEAU : c'est httpServer qui écoute, plus app
httpServer.listen(process.env.PORT || 3000, () => {
    console.log("Serveur démarré sur le port 3000 🚀")
})


////////////////////////////////////////////////////////////////////////////////////////

// npm init -y
// npm i express ejs express-ejs-layouts  ==> json/main : server.mjs
// npm i --save-dev nodemon ==> json/scripts : start/dev
// npm i mariadb
// npm install dotenv
// npm i bcrypt
// npm i passport passport-local express-session express-flash

// TUTOS :
// application setUp : https://www.youtube.com/watch?v=qj2oDkvc4dQ
// login/register : https://www.youtube.com/watch?v=-RCnNyD0L-s
//

// ISSUES AND HOW TO FIX THEM :
// __dirname in ECMAS : https://stackabuse.com/bytes/fix-dirname-is-not-defined-in-es-module-scope-in-javascript-node/
//import path from 'path';
//import url from 'url';

//const __filename = url.fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

//console.log(__filename);
//console.log(__dirname);

// connect MariaDb to express : https://mariadb.com/resources/blog/getting-started-with-connector-node-js/

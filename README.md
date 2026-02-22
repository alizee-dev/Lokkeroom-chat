# ExpressAdvanced-Lokkeroom

> "Real gossips are spread in the locker room!"

A real-time chat platform for sports clubs. Coaches can create private lobbies for their team, add members, and everyone can chat instantly — their team only.

Built as part of a BeCode challenge (Express Advanced).


## Demo

![Demo](screenshots/demo.gif)

![Home page](screenshots/home.png)

![Lobby chat](screenshots/lobby.png)


## Features

- Sign up & log in with email and password
- Create a message lobby and become its admin
- Add team members to a lobby
- View and post messages within your lobby
- Real-time messaging — no page reload needed (Socket.io)
- Passwords hashed with bcrypt, persistent sessions with Passport.js


## Tech Stack

**Server:** Node.js, Express.js, Socket.io, Passport.js, bcrypt, MariaDB, express-session

**Client:** EJS templating, HTML, CSS


## What I learned

- Structuring an Express app with separated route files
- Full authentication flow with Passport.js and the importance of middleware order
- Relational database design with many-to-many relationships (lobbies ↔ users) and SQL JOINs
- Preventing SQL injection with parameterized queries
- Real-time communication with WebSockets and Socket.io rooms


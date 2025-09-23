const express = require("express");
const app = express();
const Database = require("better-sqlite3");
const db = new Database("brukere.db");

app.use(express.static("public")); // Serve statiske filer frå public-mappa
app.use(express.json()); // Legg til innebygd body-parser middleware

// Eksempel på å hente brukarar frå databasen (besøk http://localhost:3000/users)
app.get("/users", (req, res) => {
    const users = db.prepare("SELECT * FROM brukere").all();
    res.json(users);
});

// Rute for å legge til ein ny brukar
app.post("/addUser", (req, res) => {
    const { brukernavn, passord } = req.body;
    const stmt = db.prepare("INSERT INTO brukere (brukernavn, passord) VALUES (?, ?)");
    const info = stmt.run(brukernavn, passord);
    if (info.changes > 0) {
        res.status(201).send("Brukar lagt til");
    } else {
        res.status(500).send("Feil ved lagring av bruker");
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
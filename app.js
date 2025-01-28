const express = require("express");
const app = express();
const Database = require("better-sqlite3");
const db = new Database("ventpaatur.db");

app.use(express.static("public")); // Serve statiske filer frå public-mappa
app.use(express.json()); // Legg til innebygd body-parser middleware

const PORT = 80;

// Eksempel på å hente brukarar frå databasen (besøk http://localhost:3000/users)
app.get("/users", (req, res) => {
    const users = db.prepare("SELECT * FROM person").all();
    res.json(users);
});

// Rute for å legge til ein ny brukar
app.post("/addUser", (req, res) => {
    const { navn } = req.body;
    const stmt = db.prepare("INSERT INTO person (navn, ferdig) VALUES (?, ?)");
    const info = stmt.run(navn, "false");
    if (info.changes > 0) {
        res.status(201).send("Person lagt i kø.");
    } else {
        res.status(500).send("Feil ved lagring av person til køen.");
    }
});

app.listen(PORT, () => {
    console.log(`Server køyrer: http://localhost:${PORT}`);
});
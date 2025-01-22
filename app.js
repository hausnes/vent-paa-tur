const express = require("express");
const app = express();
const Database = require("better-sqlite3");
const db = new Database("brukere.db");

app.use(express.static("public")); // Serve statiske filer frå public-mappa

// const bodyParser = require("body-parser");
// app.use(bodyParser.json()); // Legg til body-parser middleware

// Eksempel på å hente brukarar frå databasen (besøk http://localhost:3000/users)
app.get("/users", (req, res) => {
    const users = db.prepare("SELECT * FROM brukere").all();
    res.json(users);
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
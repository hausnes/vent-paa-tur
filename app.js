const express = require("express");
const app = express();
const Database = require("better-sqlite3");
const db = new Database("brukere.db");

const bcrypt = require("bcrypt");
const session = require("express-session");

// Initialiser databasen og opprett tabellen dersom den ikkje finst
db.exec(`
    CREATE TABLE IF NOT EXISTS person (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        navn TEXT NOT NULL,
        epost TEXT UNIQUE NOT NULL,
        passord TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fagko (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fagnavn TEXT NOT NULL,
        person_id INTEGER NOT NULL,
        aktiv INTEGER DEFAULT 1,
        opprettet DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kooppforinger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fagko_id INTEGER NOT NULL,
        elevnavn TEXT NOT NULL,
        tidsbruk INTEGER CHECK(tidsbruk IN (1, 2)),
        registrert DATETIME DEFAULT CURRENT_TIMESTAMP,
        ferdig INTEGER DEFAULT 0,
        FOREIGN KEY (fagko_id) REFERENCES fagko(id) ON DELETE CASCADE
    );
`);

app.use(express.static("public")); // Serve statiske filer frå public-mappa
app.use(express.json()); // Legg til innebygd body-parser middleware

// Session-oppsett
app.use(session({
    secret: "ditt-hemmelige-nøkkel-bytt-meg",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Sett til true med HTTPS
}));

// API: Registrer ny lærer
app.post("/api/registrer", async (req, res) => {
    const { navn, epost, passord } = req.body;
    
    if (!navn || !epost || !passord) {
        return res.status(400).json({ error: "Alle felt må fylles ut" });
    }

    try {
        const hashetPassord = await bcrypt.hash(passord, 10);
        const stmt = db.prepare("INSERT INTO person (navn, epost, passord) VALUES (?, ?, ?)");
        const result = stmt.run(navn, epost, hashetPassord);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT") {
            res.status(400).json({ error: "E-post er allerede registrert" });
        } else {
            res.status(500).json({ error: "Noko gjekk gale" });
        }
    }
});

// API: Logg inn
app.post("/api/login", async (req, res) => {
    const { epost, passord } = req.body;
    
    if (!epost || !passord) {
        return res.status(400).json({ error: "E-post og passord må fylles ut" });
    }

    try {
        const stmt = db.prepare("SELECT * FROM person WHERE epost = ?");
        const person = stmt.get(epost);

        if (!person) {
            return res.status(401).json({ error: "Ugyldig e-post eller passord" });
        }

        const match = await bcrypt.compare(passord, person.passord);
        if (!match) {
            return res.status(401).json({ error: "Ugyldig e-post eller passord" });
        }

        req.session.personId = person.id;
        req.session.navn = person.navn;
        res.json({ success: true, navn: person.navn });
    } catch (error) {
        res.status(500).json({ error: "Noko gjekk gale" });
    }
});

// API: Sjekk om bruker er innlogget
app.get("/api/sjekk-innlogging", (req, res) => {
    if (req.session.personId) {
        res.json({ loggetInn: true, navn: req.session.navn });
    } else {
        res.json({ loggetInn: false });
    }
});

// API: Logg ut
app.post("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Beskytt privat-mappa
app.use("/privat", (req, res, next) => {
    if (req.session.personId) {
        next();
    } else {
        res.status(401).sendFile(__dirname + "/public/login.html");
    }
});

app.use("/privat", express.static("privat"));

// API: Hent alle fagkøer for innlogget bruker
app.get("/api/fagkoer", (req, res) => {
    if (!req.session.personId) {
        return res.status(401).json({ error: "Ikkje innlogget" });
    }

    const stmt = db.prepare("SELECT * FROM fagko WHERE person_id = ? ORDER BY opprettet DESC");
    const fagkoer = stmt.all(req.session.personId);
    res.json(fagkoer);
});

// API: Opprett ny fagkø
app.post("/api/fagkoer", (req, res) => {
    if (!req.session.personId) {
        return res.status(401).json({ error: "Ikkje innlogget" });
    }

    const { fagnavn } = req.body;

    if (!fagnavn) {
        return res.status(400).json({ error: "Fagnavn må fylles ut" });
    }

    try {
        const stmt = db.prepare("INSERT INTO fagko (fagnavn, person_id) VALUES (?, ?)");
        const result = stmt.run(fagnavn, req.session.personId);
        res.json({ success: true, id: result.lastInsertRowid, fagnavn });
    } catch (error) {
        res.status(500).json({ error: "Noko gjekk gale" });
    }
});

// API: Hent detaljer om en spesifikk fagkø (offentlig - ingen autentisering nødvendig)
app.get("/api/fagko/:id", (req, res) => {
    const { id } = req.params;
    
    try {
        const stmt = db.prepare("SELECT * FROM fagko WHERE id = ? AND aktiv = 1");
        const fagko = stmt.get(id);
        
        if (!fagko) {
            return res.status(404).json({ error: "Fagkø ikkje funne" });
        }
        
        res.json(fagko);
    } catch (error) {
        res.status(500).json({ error: "Noko gjekk gale" });
    }
});

// API: Hent alle køoppføringer for en fagkø (offentlig)
app.get("/api/fagko/:id/ko", (req, res) => {
    const { id } = req.params;
    
    try {
        const stmt = db.prepare(`
            SELECT * FROM kooppforinger 
            WHERE fagko_id = ? AND ferdig = 0 
            ORDER BY registrert ASC
        `);
        const ko = stmt.all(id);
        res.json(ko);
    } catch (error) {
        res.status(500).json({ error: "Noko gjekk gale" });
    }
});

// API: Registrer elev i køen
app.post("/api/fagko/:id/registrer-elev", (req, res) => {
    const { id } = req.params;
    const { elevnavn, tidsbruk } = req.body;
    
    if (!elevnavn || !tidsbruk) {
        return res.status(400).json({ error: "Namn og tidsbruk må fylles ut" });
    }
    
    if (![1, 2].includes(parseInt(tidsbruk))) {
        return res.status(400).json({ error: "Ugyldig tidsbruk" });
    }
    
    try {
        // Sjekk at fagkøen eksisterer
        const fagkoStmt = db.prepare("SELECT id FROM fagko WHERE id = ? AND aktiv = 1");
        const fagko = fagkoStmt.get(id);
        
        if (!fagko) {
            return res.status(404).json({ error: "Fagkø ikkje funne" });
        }
        
        const stmt = db.prepare(
            "INSERT INTO kooppforinger (fagko_id, elevnavn, tidsbruk) VALUES (?, ?, ?)"
        );
        const result = stmt.run(id, elevnavn, tidsbruk);
        
        res.json({ 
            success: true, 
            id: result.lastInsertRowid,
            elevnavn,
            tidsbruk
        });
    } catch (error) {
        res.status(500).json({ error: "Noko gjekk gale" });
    }
});

// API: Marker køoppføring som ferdig (krever innlogging og eierskap)
app.patch("/api/fagko/:id/ko/:oppforingId/ferdig", (req, res) => {
    if (!req.session.personId) return res.status(401).json({ error: "Ikkje innlogget" });

    const { id, oppforingId } = req.params;

    const fagko = db.prepare("SELECT person_id FROM fagko WHERE id = ? AND aktiv = 1").get(id);
    if (!fagko) return res.status(404).json({ error: "Fagkø ikkje funne" });
    if (fagko.person_id !== req.session.personId) return res.status(403).json({ error: "Manglar tilgang" });

    const stmt = db.prepare("UPDATE kooppforinger SET ferdig = 1 WHERE id = ? AND fagko_id = ?");
    const result = stmt.run(oppforingId, id);

    if (result.changes === 0) return res.status(404).json({ error: "Køoppføring ikkje funne" });
    res.json({ success: true });
});

// API: Hent statistikk for en fagkø (kun antall ganger hjulpet)
app.get("/api/fagko/:id/statistikk", (req, res) => {
    if (!req.session.personId) return res.status(401).json({ error: "Ikkje innlogget" });

    const { id } = req.params;
    
    const fagko = db.prepare("SELECT person_id FROM fagko WHERE id = ?").get(id);
    if (!fagko) return res.status(404).json({ error: "Fagkø ikkje funne" });
    if (fagko.person_id !== req.session.personId) return res.status(403).json({ error: "Manglar tilgang" });

    try {
        const elevStats = db.prepare(`
            SELECT 
                elevnavn,
                COUNT(*) as antallGonger
            FROM kooppforinger
            WHERE fagko_id = ? AND ferdig = 1
            GROUP BY elevnavn
            ORDER BY antallGonger DESC
        `).all(id);

        res.json(elevStats);
    } catch (error) {
        res.status(500).json({ error: "Noko gjekk gale" });
    }
});

// API: Slett fagkø (krever innlogging og eierskap)
app.delete("/api/fagkoer/:id", (req, res) => {
    if (!req.session.personId) return res.status(401).json({ error: "Ikkje innlogget" });

    const { id } = req.params;
    
    const fagko = db.prepare("SELECT person_id FROM fagko WHERE id = ?").get(id);
    if (!fagko) return res.status(404).json({ error: "Fagkø ikkje funne" });
    if (fagko.person_id !== req.session.personId) return res.status(403).json({ error: "Manglar tilgang" });

    const stmt = db.prepare("DELETE FROM fagko WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) return res.status(404).json({ error: "Fagkø ikkje funne" });
    res.json({ success: true });
});

// Serve ko.html for alle /ko/:id ruter (må være før app.listen)
app.get("/ko/:id", (req, res) => {
    res.sendFile(__dirname + "/public/ko.html");
});

app.listen(3000, () => {
    console.log("Server is running! http://localhost:3000");
});
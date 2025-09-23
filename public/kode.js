// Ved å kommentere inn denne koden hentar me brukarar frå db med ein gong sida lastar.
// document.addEventListener("DOMContentLoaded", async () => {
//     await hentOgOppdaterBrukarar();
// });

// Denne delen gjer det mogleg å hente brukarar frå databasen ved å trykke på ein knapp
const knappHentBrukarar = document.getElementById("knappHentBrukarar");
knappHentBrukarar.addEventListener("click", async () => {
    await hentOgOppdaterBrukarar();
});

// Denne funksjonen hentar brukarar frå databasen og oppdaterar lista på nettsida
async function hentOgOppdaterBrukarar() {
    const response = await fetch("/users"); // Hent brukarar frå server via /users-ruta
    const users = await response.json(); // Konverter responsen til JSON

    const liste = document.getElementById("liste");
    liste.innerHTML = ""; // Tøm eksisterande innhald

    if (users.length === 0) { // Dersom det ikkje er nokon brukarar i databasen
        const li = document.createElement("li");
        li.textContent = "Ingen i kø endå! Spring og registrer deg.";
        liste.appendChild(li);
    } else { // Dersom det er brukarar i databasen
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const li = document.createElement("li");
            li.textContent = user.brukernavn + " (" + user.passord + " )";
            liste.appendChild(li);
        }
    }
}

// Legg til event listener for form submission
const formLeggTilBruker = document.getElementById("formLeggTilBruker");
formLeggTilBruker.addEventListener("submit", async (event) => {
    event.preventDefault(); // Hindre standard form submission (SPA)

    const brukernavn = document.getElementById("brukernavn").value;
    const passord = document.getElementById("passord").value;

    const response = await fetch("/addUser", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ brukernavn, passord })
    });

    if (response.ok) {
        await hentOgOppdaterBrukarar(); // Oppdater lista med brukarar
    } else {
        console.error("Feil ved lagring av bruker");
    }
});

// Alternativ til for-løkka over:
//     users.forEach(user => {
//         const li = document.createElement("li");
//         li.textContent = user.brukernavn;
//         liste.appendChild(li);
//     });
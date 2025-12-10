document.getElementById("formLeggTilBruker").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const navn = document.getElementById("navn").value;
    const epost = document.getElementById("epost").value;
    const passord = document.getElementById("passord").value;

    try {
        const response = await fetch("/api/registrer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ navn, epost, passord })
        });

        const data = await response.json();
        const melding = document.getElementById("melding");

        if (response.ok) {
            melding.textContent = "Registrering vellykka! Omdirigerer til innlogging...";
            melding.style.color = "green";
            setTimeout(() => window.location.href = "login.html", 2000);
        } else {
            melding.textContent = data.error;
            melding.style.color = "red";
        }
    } catch (error) {
        document.getElementById("melding").textContent = "Noko gjekk gale";
        document.getElementById("melding").style.color = "red";
    }
});

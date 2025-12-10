const fagkoId = window.location.pathname.split('/').pop();
let autoRefreshInterval;

async function lastFagko() {
    try {
        const response = await fetch(`/api/fagko/${fagkoId}`);
        
        if (!response.ok) {
            document.getElementById("fagnamn").textContent = "Fagkø ikkje funne";
            return;
        }
        
        const fagko = await response.json();
        document.getElementById("fagnamn").textContent = `Køen for ${fagko.fagnavn}` ;
        lastKo();
        
        // Start auto-refresh etter første lasting - 3 sekund for raskare oppdatering
        if (!autoRefreshInterval) {
            autoRefreshInterval = setInterval(lastKo, 3000); // Oppdater kvar 3. sekund
        }
    } catch (error) {
        console.error("Feil:", error);
        document.getElementById("fagnamn").textContent = "Feil ved lasting av fagkø";
    }
}

async function lastKo() {
    try {
        const response = await fetch(`/api/fagko/${fagkoId}/ko`);
        const ko = await response.json();
        const liste = document.getElementById("koListe");
        
        // Tøm lista
        liste.innerHTML = "";
        
        if (ko.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Ingen i køen! Du kan registrere deg.";
            liste.appendChild(li);
        } else {
            ko.forEach((oppforing, index) => {
                const li = document.createElement("li");
                li.textContent = oppforing.elevnavn;
                
                const small = document.createElement("small");
                small.textContent = ` (${oppforing.tidsbruk === 1 ? "kort" : "lang"})`;
                
                li.appendChild(small);
                liste.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Feil:", error);
        document.getElementById("koListe").innerHTML = "<li>Feil ved lasting av køen</li>";
    }
}

document.getElementById("formRegistrerElev").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const elevnavn = document.getElementById("elevnavn").value;
    const tidsbruk = document.getElementById("tidsbruk").value;
    const melding = document.getElementById("meldingRegistrering");
    
    try {
        const response = await fetch(`/api/fagko/${fagkoId}/registrer-elev`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ elevnavn, tidsbruk })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            melding.textContent = "Du er registrert i køen!";
            melding.style.color = "green";
            melding.style.backgroundColor = "#d4edda";
            melding.style.border = "1px solid #c3e6cb";
            document.getElementById("formRegistrerElev").reset();
            lastKo(); // Oppdater køen med ein gong
            setTimeout(() => {
                melding.textContent = "";
            }, 3000);
        } else {
            melding.textContent = data.error;
            melding.style.color = "#721c24";
            melding.style.backgroundColor = "#f8d7da";
            melding.style.border = "1px solid #f5c6cb";
        }
    } catch (error) {
        melding.textContent = "Noko gjekk gale";
        melding.style.color = "#721c24";
        melding.style.backgroundColor = "#f8d7da";
    }
});

// Last fagkø og køen når siden lastar
lastFagko();

// Stopp auto-refresh når bruker forlèt sida
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

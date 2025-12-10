async function sjekkInnlogging() {
    const response = await fetch("/api/sjekk-innlogging");
    const data = await response.json();
    
    if (!data.loggetInn) {
        window.location.href = "/login.html";
    } else {
        document.getElementById("brukerNavn").textContent = data.navn;
        lastFagkoer();
    }
}

let valgtFagkoId = null;
let autoRefreshInterval;

async function lastFagkoer() {
    try {
        const response = await fetch("/api/fagkoer");
        const fagkoer = await response.json();
        const container = document.getElementById("fagkoerContainer");

        if (fagkoer.length === 0) {
            container.innerHTML = "<p>Du har ingen fagkøer ennå. Opprett ein!</p>";
        } else {
            container.innerHTML = "<ul>" + fagkoer.map(fk => `
                <li>
                    <strong>${fk.fagnavn}</strong>
                    <br>
                    <small>Opprettet: ${new Date(fk.opprettet).toLocaleDateString('no-NO')}</small>
                    <br>
                    <small>Delbar lenke: <code>${window.location.origin}/ko/${fk.id}</code></small>
                    <br>
                    <button class="kopierLenke" data-lenke="${window.location.origin}/ko/${fk.id}">Kopier lenke</button>
                    <button class="apneKo" data-id="${fk.id}" data-navn="${fk.fagnavn}">Åpne kø</button>
                    <button class="slettKo" data-id="${fk.id}" data-navn="${fk.fagnavn}">Slett</button>
                </li>
            `).join("") + "</ul>";

            // Legg til event listeners for kopier-knapper
            document.querySelectorAll(".kopierLenke").forEach(btn => {
                btn.addEventListener("click", () => {
                    const lenke = btn.getAttribute("data-lenke");
                    navigator.clipboard.writeText(lenke);
                    btn.textContent = "Kopiert!";
                    setTimeout(() => btn.textContent = "Kopier lenke", 2000);
                });
            });

            document.querySelectorAll(".apneKo").forEach(btn => {
                btn.addEventListener("click", () => {
                    valgtFagkoId = btn.getAttribute("data-id");
                    visKo(btn.getAttribute("data-navn"));
                });
            });

            document.querySelectorAll(".slettKo").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const fagkoId = btn.getAttribute("data-id");
                    const fagkoNavn = btn.getAttribute("data-navn");
                    if (confirm(`Er du sikker på at du vil slette "${fagkoNavn}"?`)) {
                        try {
                            const response = await fetch(`/api/fagkoer/${fagkoId}`, {
                                method: "DELETE"
                            });
                            if (response.ok) {
                                lastFagkoer();
                            } else {
                                alert("Feil ved sletting av fagkø");
                            }
                        } catch (error) {
                            alert("Noko gjekk gale");
                        }
                    }
                });
            });
        }
    } catch (error) {
        document.getElementById("fagkoerContainer").textContent = "Feil ved lasting av fagkøer";
    }
}

async function visKo(fagnavn) {
    if (!valgtFagkoId) return;
    const panel = document.getElementById("koAdmin");
    const liste = document.getElementById("koListeAdmin");
    document.getElementById("koTittel").textContent = `Kø for ${fagnavn}`;
    panel.style.display = "block";

    // Last køen første gong
    await oppdaterKoOgStatistikk();

    // Start auto-refresh - 3 sekund for raskare oppdatering
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    autoRefreshInterval = setInterval(oppdaterKoOgStatistikk, 3000); // Oppdater kvar 3. sekund
}

async function oppdaterKoOgStatistikk() {
    if (!valgtFagkoId) return;
    
    try {
        const response = await fetch(`/api/fagko/${valgtFagkoId}/ko`);
        const ko = await response.json();
        const liste = document.getElementById("koListeAdmin");

        liste.innerHTML = "";
        if (ko.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Ingen i køen.";
            liste.appendChild(li);
        } else {
            ko.forEach(oppf => {
                const li = document.createElement("li");
                li.textContent = `${oppf.elevnavn} (${oppf.tidsbruk === 1 ? "kort" : "lang"}) `;
                const chk = document.createElement("input");
                chk.type = "checkbox";
                chk.title = "Marker som ferdig";
                chk.addEventListener("change", () => markerFerdig(oppf.id));
                li.appendChild(chk);
                liste.appendChild(li);
            });
        }

        // Oppdater statistikk
        await lastStatistikk();
    } catch (error) {
        console.error("Feil ved oppdatering:", error);
    }
}

async function lastStatistikk() {
    if (!valgtFagkoId) return;
    const container = document.getElementById("statistikkContainer");

    try {
        const response = await fetch(`/api/fagko/${valgtFagkoId}/statistikk`);
        const stats = await response.json();

        if (!Array.isArray(stats) || stats.length === 0) {
            container.innerHTML = "<p style='color: #999; font-size: 14px;'>Ingen har fått hjelp ennå.</p>";
            return;
        }

        let html = "<p style='font-size: 14px; color: #666; margin-bottom: 10px;'>Antal gonger hjulpet:</p>";
        html += "<ul style='list-style: none; padding: 0;'>";
        
        stats.forEach(stat => {
            html += `<li style='padding: 6px 10px; margin: 5px 0; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #667eea; font-size: 14px;'>`;
            html += `<strong>${stat.elevnavn}</strong>: ${stat.antallGonger} ${stat.antallGonger === 1 ? 'gong' : 'gonger'}`;
            html += `</li>`;
        });

        html += "</ul>";
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = "<p style='color: #999; font-size: 14px;'>Feil ved lasting av statistikk.</p>";
    }
}

async function markerFerdig(oppforingId) {
    if (!valgtFagkoId) return;
    try {
        const response = await fetch(`/api/fagko/${valgtFagkoId}/ko/${oppforingId}/ferdig`, {
            method: "PATCH"
        });
        if (response.ok) {
            oppdaterKoOgStatistikk(); // Oppdater med ein gong
        }
    } catch (error) {
        console.error("Feil ved oppdatering:", error);
    }
}

document.getElementById("formNyFagko").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const fagnavn = document.getElementById("fagnavn").value;

    try {
        const response = await fetch("/api/fagkoer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fagnavn })
        });

        const data = await response.json();
        const melding = document.getElementById("meldingFagko");

        if (response.ok) {
            melding.textContent = "Fagkø oppretta!";
            melding.style.color = "green";
            document.getElementById("fagnavn").value = "";
            setTimeout(() => {
                melding.textContent = "";
                lastFagkoer();
            }, 1500);
        } else {
            melding.textContent = data.error;
            melding.style.color = "red";
        }
    } catch (error) {
        document.getElementById("meldingFagko").textContent = "Noko gjekk gale";
        document.getElementById("meldingFagko").style.color = "red";
    }
});

document.getElementById("loggUt").addEventListener("click", async () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login.html";
});

sjekkInnlogging();

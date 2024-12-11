let first = true; // For å sjekke om det allerede ligg nokon i lista til å begynne med

function lagOgLeggTilListeElement(elev) {
    let tid = new Date(); // Hent ut tida no
    let listeElement = document.createElement('li'); // Lag eit nytt liste-element
    listeElement.innerHTML = '<b>' + elev + '</b> (' + tid.toLocaleTimeString() + ')'; // Set innhaldet i liste-elementet
    document.getElementById("liste").appendChild(listeElement); // Legg til liste-elementet i HTML-lista
}

document.getElementById("skjema").addEventListener("submit", function (evt) {
    evt.preventDefault(); // SPA - Single Page Application

    if (first) { // Første gangen me legg til ein elev, fjern plassholdertekst
        document.getElementById("liste").innerHTML = "";
        first = false;
    }

    let elev = document.getElementById("navn").value; // Hent ut verdien frå input-feltet
    lagOgLeggTilListeElement(elev); // Lag og legg til eit nytt liste-element
});
async function sjekkInnlogging() {
    try {
        const response = await fetch("/api/sjekk-innlogging");
        const data = await response.json();

        const adminLenke = document.getElementById("adminLenke");
        const registrerLenke = document.getElementById("registrerLenke");

        if (data.loggetInn) {
            adminLenke.textContent = "Administrer køar";
            adminLenke.href = "/privat/dashboard.html";
            registrerLenke.style.display = "none";
        } else {
            registrerLenke.style.display = "block";
        }
    } catch (error) {
        console.error("Feil ved sjekk av innlogging:", error);
    }
}

sjekkInnlogging();
document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const epost = document.getElementById("epost").value;
    const passord = document.getElementById("passord").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ epost, passord })
        });

        const data = await response.json();
        const melding = document.getElementById("melding");

        if (response.ok) {
            melding.textContent = "Innlogging vellykka! Omdirigerer...";
            melding.style.color = "green";
            setTimeout(() => window.location.href = "/privat/dashboard.html", 1000);
        } else {
            melding.textContent = data.error;
            melding.style.color = "red";
        }
    } catch (error) {
        document.getElementById("melding").textContent = "Noko gjekk gale";
        document.getElementById("melding").style.color = "red";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const counts = {
        alerts: 'alerts.html',
        soundEffects: 'soundeffects.html',
        tts: 'tts.html',
        redeems: 'noobpoints.html'  // Voeg de URL van de redeems-pagina toe
    };

    Object.entries(counts).forEach(([key, url]) => {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                let rowCount;

                // Check welke pagina we aan het verwerken zijn
                if (key === 'alerts') {
                    rowCount = doc.querySelectorAll('#alertTable tr').length;
                } else if (key === 'soundEffects') {
                    rowCount = doc.querySelectorAll('#soundEffectsTable tr').length;
                } else if (key === 'redeems') {  // Voeg 'redeems' toe
                    rowCount = doc.querySelectorAll('#redeemTable tr').length;
                } else if (key === 'tts') {
                    rowCount = doc.querySelectorAll('#ttsTable tr').length;
                }

                // Werk de teller bij in de hoofdpagina
                document.getElementById(`${key}Count`).textContent = rowCount;
            })
            .catch(() => {
                document.getElementById(`${key}Count`).textContent = '0';
            });
    });
});
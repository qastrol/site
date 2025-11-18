document.addEventListener("DOMContentLoaded", () => {
    const counts = {
        alerts: 'alerts.html',
        soundEffects: 'soundeffects.html',
        tts: 'tts.html',
        redeems: 'noobpoints.html'  // Voeg de URL van de redeems-pagina toe
    };

    // Try to show counts in this order of preference:
    // 1) read the in-memory centralized arrays (js/table/*) if they were included
    // 2) read a previously stored value from localStorage (set by the individual pages)
    // 3) fallback to fetching the page HTML and counting table rows (may miss client-rendered rows)
    const localKeyMap = {
        alerts: 'alertsCount',
        soundEffects: 'soundEffectCount',
        tts: 'ttsCount',
        redeems: 'redeemsCount'
    };

    Object.entries(counts).forEach(([key, url]) => {
        const el = document.getElementById(`${key}Count`);
        if (!el) return;

        // 1) try centralized arrays
        try {
            if (key === 'alerts' && typeof alertsTable !== 'undefined' && Array.isArray(alertsTable)) {
                el.textContent = String(alertsTable.length);
                return;
            }
            if (key === 'tts' && typeof ttsTable !== 'undefined' && Array.isArray(ttsTable)) {
                el.textContent = String(ttsTable.length);
                return;
            }
            if (key === 'soundEffects' && typeof soundeffectsTable !== 'undefined' && Array.isArray(soundeffectsTable)) {
                el.textContent = String(soundeffectsTable.length);
                return;
            }
            if (key === 'redeems' && (typeof noobPointsTable !== 'undefined' && Array.isArray(noobPointsTable))) {
                el.textContent = String(noobPointsTable.length);
                return;
            }
        } catch (err) {
            // ignore and try other methods
        }

        // 2) try localStorage (pages may store counts after rendering)
        const storedKey = localKeyMap[key];
        if (storedKey) {
            const stored = localStorage.getItem(storedKey);
            if (stored !== null) {
                el.textContent = stored;
                return;
            }
        }

        // 3) fallback to fetching the page HTML and counting rows
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                let rowCount = 0;

                if (key === 'alerts') {
                    rowCount = doc.querySelectorAll('#alertList li').length || doc.querySelectorAll('#alertTable tr').length;
                } else if (key === 'soundEffects') {
                    rowCount = doc.querySelectorAll('#soundEffectsList li').length || doc.querySelectorAll('#soundEffectsTable tr').length;
                } else if (key === 'redeems') {
                    rowCount = doc.querySelectorAll('#redeemList li').length || doc.querySelectorAll('#redeemTable tr').length;
                } else if (key === 'tts') {
                    rowCount = doc.querySelectorAll('#ttsList li').length || doc.querySelectorAll('#ttsTable tr').length;
                }

                el.textContent = String(rowCount);
            })
            .catch(() => {
                el.textContent = '0';
            });
    });
});
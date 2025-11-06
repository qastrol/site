        // Functie om effectnaam te kopiëren naar klembord
        function copyToClipboard(button) {
            const row = button.closest('tr');
            const effectName = row.cells[2].innerText.trim();
            navigator.clipboard.writeText(effectName).then(() => {
                alert(`Effectnaam '${effectName}' gekopieerd naar het klembord!`);
            }).catch(err => {
                console.error('Kopiëren mislukt', err);
            });
        }

        let sortDirection = [true, true, true]; // Eén richting per kolom

function sortTable(n) {
    const table = document.querySelector("table");
    const rows = Array.from(table.rows).slice(1);

    const isNumeric = rows.every(row => !isNaN(row.cells[n].innerText.trim()));
    const sortedRows = rows.sort((rowA, rowB) => {
        const textA = rowA.cells[n].innerText.trim();
        const textB = rowB.cells[n].innerText.trim();
        if (isNumeric) {
            return parseFloat(textA) - parseFloat(textB);
        }
        return textA.localeCompare(textB);
    });

    if (!sortDirection[n]) {
        sortedRows.reverse();
    }

    sortedRows.forEach(row => table.appendChild(row));
    sortDirection[n] = !sortDirection[n];
}


        // Functie om de tabel te filteren en het aantal zichtbare rijen bij te werken
        function searchTable() {
            const input = document.getElementById("searchInput");
            const filter = input.value.toLowerCase();
            const table = document.querySelector("table");
            const rows = table.getElementsByTagName("tr");
            let visibleCount = 0;

            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName("td");
                let matchFound = false;

                for (let j = 0; j < cells.length; j++) {
                    const cellText = cells[j].textContent || cells[j].innerText;
                    if (cellText.toLowerCase().indexOf(filter) > -1) {
                        matchFound = true;
                        break;
                    }
                }

                rows[i].style.display = matchFound ? "" : "none";
                if (matchFound) {
                    visibleCount++;
                }
            }

            // Werk het dynamische getal bij
            document.getElementById("rowCount").textContent = visibleCount;
        }

        // Functie om het aantal zichtbare rijen te berekenen bij pagina-initialisatie
        function updateRowCount() {
            const table = document.querySelector("table");
            const rows = Array.from(table.getElementsByTagName("tr")).slice(1);
            const visibleCount = rows.filter(row => row.style.display !== "none").length;
            document.getElementById("rowCount").textContent = visibleCount;
        }

        // Standaard sorteren en initialiseren van rijen bij het laden van de pagina
        document.addEventListener("DOMContentLoaded", function() {
            sortTable(0);
            updateRowCount();
        });
        // Hook voor de sort select in de sidebar
        function applySort() {
            const sel = document.getElementById('sortSelect');
            if (!sel) return;
            const [colStr, dir] = sel.value.split(':');
            const col = parseInt(colStr, 10);
            // Stel de interne sortrichting in zodat één enkele aanroep van sortTable
            // het gewenste resultaat geeft (asc of desc).
            sortDirection[col] = (dir === 'asc');
            sortTable(col);
        }
        const alertCount = document.querySelectorAll('#alertTable tr').length;
        localStorage.setItem('alertCount', alertCount);

        /* Preview modal for alerts from /alerts/ */
        function normalizeNameForFile(text) {
            return (text || '').toString().replace(/[^a-z0-9]/gi, '').toLowerCase();
        }

        function createPreviewOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'preview-overlay';
            overlay.innerHTML = `
                <div class="preview-modal" role="dialog" aria-modal="true">
                    <div class="preview-header">
                        <strong id="preview-title"></strong>
                        <button class="preview-close" aria-label="Sluiten">✕</button>
                    </div>
                    <div class="preview-body" id="preview-body"></div>
                    <div class="preview-controls">
                        <button class="preview-copy">Kopieer naam</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('.preview-close').addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
            return overlay;
        }

        function showPreview(folder, displayName) {
            const name = normalizeNameForFile(displayName);
            const overlay = createPreviewOverlay();
            const titleEl = overlay.querySelector('#preview-title');
            const body = overlay.querySelector('#preview-body');
            const copyBtn = overlay.querySelector('.preview-copy');
            titleEl.textContent = displayName;
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(displayName).then(() => {
                    copyBtn.textContent = 'Gekopieerd ✓';
                    setTimeout(() => copyBtn.textContent = 'Kopieer naam', 1200);
                });
            });

            const base = `${folder}/${name}`;

            function tryImage(exts, i) {
                if (i >= exts.length) return tryAudio(['.mp3','.ogg','.wav'], 0);
                const img = new Image();
                img.onload = () => { body.innerHTML = ''; body.appendChild(img); };
                img.onerror = () => tryImage(exts, i+1);
                img.src = base + exts[i];
            }

            function tryAudio(exts, i) {
                if (i >= exts.length) return tryVideo(['.webm','.mp4','.ogg'], 0);
                const a = document.createElement('audio');
                a.controls = true; a.preload = 'metadata';
                a.oncanplaythrough = () => { body.innerHTML = ''; body.appendChild(a); };
                a.onerror = () => tryAudio(exts, i+1);
                a.src = base + exts[i];
            }

            function tryVideo(exts, i) {
                if (i >= exts.length) { body.innerHTML = '<div class="preview-notfound">Geen voorbeeld beschikbaar.</div>'; return; }
                const v = document.createElement('video');
                v.controls = true; v.preload = 'metadata'; v.style.maxHeight = '60vh';
                v.oncanplaythrough = () => { body.innerHTML = ''; body.appendChild(v); };
                v.onerror = () => tryVideo(exts, i+1);
                v.src = base + exts[i];
            }

            tryImage(['.png','.jpg','.jpeg','.gif','.webp'], 0);
        }

        // Helper to check if a preview file exists (image -> audio -> video)
        function previewExists(folder, displayName, cb) {
            const name = normalizeNameForFile(displayName);
            const base = `${folder}/${name}`;
            const img = new Image();
            let done = false;
            img.onload = () => { if (!done) { done = true; cb(true); } };
            img.onerror = () => {
                const a = document.createElement('audio');
                a.oncanplaythrough = () => { if (!done) { done = true; cb(true); } };
                a.onerror = () => {
                    const v = document.createElement('video');
                    v.oncanplaythrough = () => { if (!done) { done = true; cb(true); } };
                    v.onerror = () => { if (!done) { done = true; cb(false); } };
                    v.src = base + '.mp4';
                };
                a.src = base + '.mp3';
            };
            img.src = base + '.png';
        }

        // Attach preview handlers to first-column names and mark those with previews
        (function attachPreviewHandlers(){
            const rows = document.querySelectorAll('#alertTable tr');
            rows.forEach(r => {
                const first = r.querySelector('td:first-child');
                if (!first) return;
                const display = first.innerText.trim();
                first.title = 'Klik voor voorbeeld';
                first.addEventListener('click', () => showPreview('alerts', display));
                previewExists('alerts', display, (exists) => {
                    if (exists) first.classList.add('has-preview');
                });
            });
        })();
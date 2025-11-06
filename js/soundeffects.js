        // Functie om effectnaam of stemnaam te kopiëren naar klembord
        function copyToClipboard(button) {
    // Zoek de rij van de knop en vervolgens de eerste cel (de soundeffectnaam)
    const row = button.closest('tr'); // Zoek de rij van de knop
    const soundEffectName = row.querySelector('td').innerText.trim(); // Pak de tekst uit de eerste cel

    // Kopieer de tekst naar het klembord
    navigator.clipboard.writeText(soundEffectName).then(() => {
        alert(`Naam '${soundEffectName}' gekopieerd naar het klembord!`);
    }).catch(err => {
        console.error('Kopiëren mislukt', err);
    });
}


        function updateCounter() {
            const tbody = document.getElementById('soundEffectsTable');
            if (!tbody) return;
            const rows = Array.from(tbody.rows);
            const visibleRows = rows.filter(r => r.style.display !== 'none').length;
            document.getElementById('counter').textContent = visibleRows;
}


        let sortDirection = [true, true, true]; // array om de sorteer volgorde bij te houden

        // Functie om de tabel te sorteren
        function sortTable(n) {
            const tbody = document.getElementById('soundEffectsTable');
            if (!tbody) return;
            const rows = Array.from(tbody.rows);
            if (!rows.length) return;

            const isNumeric = !isNaN(rows[0].cells[n].innerText.trim());

            const sortedRows = rows.sort((rowA, rowB) => {
                const textA = rowA.cells[n].innerText.trim();
                const textB = rowB.cells[n].innerText.trim();

                if (isNumeric) return parseFloat(textA) - parseFloat(textB);
                return textA.localeCompare(textB, 'nl', { sensitivity: 'base' });
            });

            if (!sortDirection[n]) sortedRows.reverse();

            // Re-append into tbody
            sortedRows.forEach(r => tbody.appendChild(r));
            sortDirection[n] = !sortDirection[n];
            updateCounter();
}


        function searchTable() {
            // Rebuild the visible table from the data source so non-matching rows are removed entirely.
            refreshTable();
}

        // Returns true if the given item matches the search text and category selections
        function itemMatchesFilters(item, searchLower, selectedCats) {
            if (!item) return false;
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const textMatch = (!searchLower) || name.indexOf(searchLower) !== -1 || desc.indexOf(searchLower) !== -1;
            // compute item categories array (support multiple input shapes)
            let cats = [];
            if (Array.isArray(item.categories)) cats = item.categories.map(String);
            else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
            else if (Array.isArray(item.category)) cats = item.category.map(String);
            else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);

            // If no categories are selected, show items based on text match only
            if (!selectedCats || selectedCats.length === 0) return textMatch;

            // If categories are selected but this item has no categories, hide it
            if (cats.length === 0) return false;

            // check if any selected cat is present in cats
            const intersects = selectedCats.some(sc => cats.includes(sc));
            return textMatch && intersects;
        }

        function refreshTable() {
            const tbody = document.getElementById('soundEffectsTable');
            if (!tbody) return;
            if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;

            const input = document.getElementById('searchInput');
            const searchLower = input ? (input.value || '').toLowerCase() : '';
            const selectedCats = getSelectedCategories();

            // filter data source
            const filtered = soundeffectsTable.filter(item => itemMatchesFilters(item, searchLower, selectedCats));

            // clear and render only filtered rows
            tbody.innerHTML = '';
            filtered.forEach(item => {
                const tr = document.createElement('tr');
                // compute categories array for this item (support multiple input shapes)
                let cats = [];
                if (Array.isArray(item.categories)) cats = item.categories.map(String);
                else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
                else if (Array.isArray(item.category)) cats = item.category.map(String);
                else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);
                if (cats.length) tr.dataset.categories = cats.join('|');

                const tdName = document.createElement('td');
                tdName.textContent = item.name || '';
                tdName.title = 'Klik voor voorbeeld';
                const tdDesc = document.createElement('td');
                tdDesc.textContent = item.description || '';
                const tdAct = document.createElement('td');
                const btn = document.createElement('button');
                btn.className = 'copy-btn';
                btn.textContent = 'Kopieer';
                btn.addEventListener('click', function() { copyToClipboard(this); });
                tdAct.appendChild(btn);
                tr.appendChild(tdName);
                tr.appendChild(tdDesc);
                tr.appendChild(tdAct);
                tbody.appendChild(tr);
            });

            // update counters and preview handlers
            localStorage.setItem('soundEffectCount', soundeffectsTable.length);
            updateCounter();
            attachPreviewHandlers();
        }

        // Return array of selected category strings (exact match). If none, returns []
        function getSelectedCategories() {
            const container = document.getElementById('categoryFilters');
            if (!container) return [];
            const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
            return inputs.filter(i => i.checked).map(i => i.value);
        }

        // Build category checkboxes from the data in soundeffectsTable. Sorted alphabetically.
        function buildCategoryFilters() {
            const container = document.getElementById('categoryFilters');
            if (!container) return;
            if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;

            const categories = new Set();
            soundeffectsTable.forEach(item => {
                if (!item) return;
                // support item.categories (array), item.categories (comma string), item.category (string or array)
                if (Array.isArray(item.categories)) {
                    item.categories.forEach(c => { if (c) categories.add(c.toString()); });
                } else if (item.categories && typeof item.categories === 'string') {
                    item.categories.split(',').forEach(c => { const t = c.trim(); if (t) categories.add(t); });
                } else if (Array.isArray(item.category)) {
                    item.category.forEach(c => { if (c) categories.add(c.toString()); });
                } else if (item.category && typeof item.category === 'string') {
                    item.category.split(',').forEach(c => { const t = c.trim(); if (t) categories.add(t); });
                } else if (item.category) {
                    categories.add(item.category.toString());
                }
            });

            const cats = Array.from(categories).sort((a,b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
            container.innerHTML = '';
            if (cats.length === 0) {
                container.innerHTML = '<small>Geen categorieën gevonden.</small>';
                return;
            }

            cats.forEach(cat => {
                const id = 'cat-' + cat.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const wrapper = document.createElement('div');
            // place checkbox and label on the same row
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'row';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '6px';
            wrapper.style.marginBottom = '4px';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = id;
                input.value = cat;
                input.addEventListener('change', () => searchTable());
                const label = document.createElement('label');
                label.htmlFor = id;
            label.style.fontWeight = 'normal';
            label.style.display = 'inline-block';
                label.textContent = cat;
                wrapper.appendChild(input);
                wrapper.appendChild(label);
                container.appendChild(wrapper);
            });
        }


function renderSoundEffectsTable() {
    const tbody = document.getElementById('soundEffectsTable');
    if (!tbody) return;
    // Clear existing
    tbody.innerHTML = '';
    if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;

    soundeffectsTable.forEach(item => {
        const tr = document.createElement('tr');
        // compute categories array for this item (support multiple input shapes)
        let cats = [];
        if (Array.isArray(item.categories)) cats = item.categories.map(String);
        else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
        else if (Array.isArray(item.category)) cats = item.category.map(String);
        else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);
        if (cats.length) tr.dataset.categories = cats.join('|');
        const tdName = document.createElement('td');
        tdName.textContent = item.name || '';
        tdName.title = 'Klik voor voorbeeld';
        const tdDesc = document.createElement('td');
        tdDesc.textContent = item.description || '';
        const tdAct = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Kopieer';
        btn.addEventListener('click', function() { copyToClipboard(this); });
        tdAct.appendChild(btn);
        tr.appendChild(tdName);
        tr.appendChild(tdDesc);
        tr.appendChild(tdAct);
        tbody.appendChild(tr);
    });

    // store count
    localStorage.setItem('soundEffectCount', soundeffectsTable.length);
}

document.addEventListener("DOMContentLoaded", function() {
    renderSoundEffectsTable();
    buildCategoryFilters();
    // apply initial sort (respect selector)
    const sel = document.getElementById('sortSelect');
    if (sel) {
        const [colStr, dir] = sel.value.split(':');
        const col = parseInt(colStr, 10);
        sortDirection[col] = (dir === 'asc');
    }
    sortTable(0);
    updateCounter();
    attachPreviewHandlers();
});

// Hook voor de sort selector in de sidebar
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


        // Inline HTML van de navigatiebalk als fallback
        document.addEventListener('DOMContentLoaded', (event) => {
    const modeToggle = document.getElementById('mode-toggle');
    const body = document.body;

    // Check the saved mode preference
    if (localStorage.getItem('dark-mode') === 'true') {
        body.classList.add('dark-mode');
    }

    modeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        // Save the mode preference
        localStorage.setItem('dark-mode', body.classList.contains('dark-mode'));
    });
});
// soundEffectCount is stored after rendering the table (see renderSoundEffectsTable)

    /* Preview modal for sound effects from /soundeffects/ */
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
        // Prefer the pre-generated mapping when available to avoid creating
        // media elements (which can trigger network requests). The mapping is
        // expected to be written to `window.soundeffectsLinks` by the generator.
        try {
            const key = normalizeNameForFile(displayName);
            if (window && window.soundeffectsLinks && Array.isArray(window.soundeffectsLinks[key])) {
                cb(window.soundeffectsLinks[key].length > 0);
                return;
            }
        } catch (e) {
            // fall back to probing below
        }

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
    function attachPreviewHandlers(){
        const rows = document.querySelectorAll('#soundEffectsTable tr');
        rows.forEach(r => {
            const first = r.querySelector('td:first-child');
            if (!first) return;
            const display = first.innerText.trim();
            first.title = 'Klik voor voorbeeld';
            // Use generated mapping if available to avoid probing/loading media files
            try {
                const key = normalizeNameForFile(display);
                if (window && window.soundeffectsLinks && Array.isArray(window.soundeffectsLinks[key]) && window.soundeffectsLinks[key].length > 0) {
                    // mark as having a preview; do not create audio elements yet
                    first.classList.add('has-preview');
                    first.addEventListener('click', () => showPreview('soundeffects', display));
                    return;
                }
            } catch (e) {
                // fall back to probing below
            }

            // Fallback: attach click handler and probe (may trigger small metadata requests)
            first.addEventListener('click', () => showPreview('soundeffects', display));
            previewExists('soundeffects', display, (exists) => {
                if (exists) first.classList.add('has-preview');
            });
        });

        // Also intercept anchors inside the table that point to local media so the
        // browser doesn't navigate / preload them. Instead open the preview overlay.
        const anchors = document.querySelectorAll('#soundEffectsTable a[href]');
        anchors.forEach(a => {
            try {
                const href = a.getAttribute('href') || '';
                const lower = href.toLowerCase();
                const isLocalMedia = lower.includes('/soundeffects/') || lower.match(/\.(mp4|webm|mp3|ogg|wav|png|jpg|jpeg|gif|webp)(?:$|[?#])/i);
                if (isLocalMedia) {
                    a.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const filename = href.split('/').pop().split(/[?#]/)[0] || a.innerText.trim();
                        const name = filename.replace(/\.[^/.]+$/, '');
                        showPreview('soundeffects', name);
                    });
                    a.rel = (a.rel || '') + ' noopener';
                }
            } catch (e) {
                // ignore
            }
        });
    }
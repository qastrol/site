        // Functie om effectnaam of stemnaam te kopiëren naar klembord
        function copyToClipboard(button) {
            const li = button.closest('li');
            const nameEl = li ? li.querySelector('.item-name') : null;
            const soundEffectName = nameEl ? nameEl.innerText.trim() : '';
            if (!soundEffectName) return;
            navigator.clipboard.writeText(soundEffectName).then(() => {
                alert(`Naam '${soundEffectName}' gekopieerd naar het klembord!`);
            }).catch(err => {
                console.error('Kopiëren mislukt', err);
            });
        }


        function updateCounter() {
            const items = Array.from(document.querySelectorAll('#soundEffectsList li'));
            const visibleRows = items.filter(r => r.style.display !== 'none').length;
            document.getElementById('counter').textContent = visibleRows;
        }


        let sortDirection = [true, true, true, true]; // array om de sorteer volgorde bij te houden (extra voor lengte)

        // Functie om de tabel te sorteren (operates on list)
        function sortTable(n) {
            const list = document.getElementById('soundEffectsList');
            if (!list) return;
            const items = Array.from(list.children);
            if (!items.length) return;

            // Support sorting by categories (dataset.categories) as column 1
            if (n === 1) {
                items.sort((a, b) => {
                    const ac = (a.dataset.categories || '').toLowerCase();
                    const bc = (b.dataset.categories || '').toLowerCase();
                    return ac.localeCompare(bc, 'nl', { sensitivity: 'base' });
                });
            } else if (n === 3) {
                // sort by numeric length (ms)
                items.sort((a, b) => {
                    const al = parseInt(a.dataset.length || '0', 10) || 0;
                    const bl = parseInt(b.dataset.length || '0', 10) || 0;
                    return al - bl;
                });
            } else {
                const colMap = { 0: '.item-name', 2: '.item-desc' };
                const sel = colMap[n] || '.item-name';

                const isNumeric = items.every(li => {
                    const el = li.querySelector(sel);
                    return el && !isNaN(el.innerText.trim());
                });

                items.sort((a, b) => {
                    const aEl = a.querySelector(sel);
                    const bEl = b.querySelector(sel);
                    const textA = aEl ? aEl.innerText.trim() : '';
                    const textB = bEl ? bEl.innerText.trim() : '';
                    if (isNumeric) return (parseFloat(textA) || 0) - (parseFloat(textB) || 0);
                    return textA.localeCompare(textB, 'nl', { sensitivity: 'base' });
                });
            }

            if (!sortDirection[n]) items.reverse();
            items.forEach(it => list.appendChild(it));
            sortDirection[n] = !sortDirection[n];
            updateCounter();
        }


    function searchTable() { refreshTable(); computeFilterCountsSound(); }

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
            if (!textMatch || !intersects) return false;

            // length filter (min/max in seconds)
            try {
                const minInput = document.getElementById('minLength');
                const maxInput = document.getElementById('maxLength');
                const minVal = minInput && minInput.value !== '' ? parseFloat(minInput.value) : null;
                const maxVal = maxInput && maxInput.value !== '' ? parseFloat(maxInput.value) : null;
                if ((minVal !== null && !isNaN(minVal)) || (maxVal !== null && !isNaN(maxVal))) {
                    const lenMs = parseInt(item.length || 0, 10) || 0;
                    const lenS = lenMs / 1000;
                    if (minVal !== null && !isNaN(minVal) && lenS < minVal) return false;
                    if (maxVal !== null && !isNaN(maxVal) && lenS > maxVal) return false;
                }
            } catch (e) {
                // ignore
            }

            return true;
        }

        function refreshTable() {
            const list = document.getElementById('soundEffectsList');
            if (!list) return;
            if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;

            const input = document.getElementById('searchInput');
            const searchLower = input ? (input.value || '').toLowerCase() : '';
            const selectedCats = getSelectedCategories();

            const filtered = soundeffectsTable.filter(item => itemMatchesFilters(item, searchLower, selectedCats));
            list.innerHTML = '';
            filtered.forEach(item => {
                const li = document.createElement('li');
                li.className = 'item-listing__item';

                // categories
                let cats = [];
                if (Array.isArray(item.categories)) cats = item.categories.map(String);
                else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
                else if (Array.isArray(item.category)) cats = item.category.map(String);
                else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);
                if (cats.length) {
                    cats.sort((a,b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
                    li.dataset.categories = cats.join('|');
                }

                // length dataset (ms) if present
                const lenMs = (item && (typeof item.length !== 'undefined')) ? (parseInt(item.length, 10) || 0) : 0;
                if (lenMs > 0) li.dataset.length = String(lenMs);

                const main = document.createElement('div'); main.className = 'item-listing__main';
                const left = document.createElement('div'); left.className = 'item-listing__left';
                const name = document.createElement('div'); name.className = 'item-name'; name.textContent = item.name || '';
                name.title = 'Klik voor voorbeeld';

                // info row: length (seconds) and categories (comma separated)
                const info = document.createElement('div'); info.className = 'item-langs';
                // render categories as clickable parts
                info.innerHTML = '';
                // show length first if we have it
                if (li.dataset.length) {
                    const ms = parseInt(li.dataset.length || '0', 10) || 0;
                    if (ms > 0) {
                        const sec = (ms / 1000);
                        // one decimal, Dutch comma, full word 'seconden'
                        const secStr = sec.toFixed(1).replace('.', ',') + ' seconden';
                        const spanLen = document.createElement('span');
                        spanLen.className = 'info-length';
                        spanLen.textContent = secStr;
                        info.appendChild(spanLen);
                        if (cats.length) info.appendChild(document.createTextNode(' \u00A0•\u00A0 '));
                    }
                }
                if (cats.length) {
                    cats.forEach((c, idx) => {
                        const span = document.createElement('span');
                        span.className = 'info-part';
                        span.textContent = c;
                        span.style.cursor = 'pointer';
                        span.dataset.facet = 'category';
                        span.addEventListener('click', () => applyFilterFromInfoSfx('category', c));
                        info.appendChild(span);
                        if (idx < cats.length - 1) info.appendChild(document.createTextNode(', '));
                    });
                }

                const desc = document.createElement('div'); desc.className = 'item-desc'; desc.textContent = item.description || '';
                left.appendChild(name);
                if (info.textContent) left.appendChild(info);
                left.appendChild(desc);

                const meta = document.createElement('div'); meta.className = 'item-meta';
                const actions = document.createElement('div'); actions.className = 'item-actions';
                const btn = document.createElement('button'); btn.className = 'copy-btn'; btn.textContent = 'Kopieer'; btn.addEventListener('click', function() { copyToClipboard(this); });
                actions.appendChild(btn);
                meta.appendChild(actions);

                main.appendChild(left); main.appendChild(meta); li.appendChild(main);
                list.appendChild(li);
            });

            localStorage.setItem('soundEffectCount', soundeffectsTable.length);
            updateCounter();
            attachPreviewHandlers();
            // update counts after we rebuilt the visible list
            computeFilterCountsSound();
            // render active filters UI
            try {
                const active = [];
                const input = document.getElementById('searchInput');
                if (input && input.value && input.value.trim() !== '') active.push({ type: 'search', label: 'Zoek: "' + input.value.trim() + '"', value: input.value.trim() });
                const catContainer = document.getElementById('categoryFilters');
                if (catContainer) {
                    const boxes = Array.from(catContainer.querySelectorAll('input[type="checkbox"]:checked'));
                    boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'category', label: lab, value: cb.value }); });
                }
                if (window.activeFilters && typeof window.activeFilters.render === 'function') window.activeFilters.render(document.getElementById('activeFiltersContainer'), active);
            } catch (e) { console.error('active filters render failed (sfx)', e); }
        }

        // Return array of selected category strings (exact match). If none, returns []
        function getSelectedCategories() {
            const container = document.getElementById('categoryFilters');
            if (!container) return [];
            const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
            return inputs.filter(i => i.checked).map(i => i.value);
        }

        // Apply a filter when an info-part is clicked (soundeffects page)
        function applyFilterFromInfoSfx(facet, text) {
            if (!text) return;
            const container = document.getElementById('categoryFilters');
            if (!container) return;
            const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
            for (const input of inputs) {
                const lab = input.nextElementSibling ? input.nextElementSibling.textContent.trim() : '';
                const val = (input.value || '').toString().trim();
                if (val.toLowerCase() === text.toLowerCase() || lab.toLowerCase() === text.toLowerCase()) {
                    if (!input.checked) { input.checked = true; input.dispatchEvent(new Event('change')); }
                    refreshTable();
                    computeFilterCountsSound();
                    return;
                }
            }
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
                input.addEventListener('change', () => { searchTable(); computeFilterCountsSound(); });
                const label = document.createElement('label');
                label.htmlFor = id;
            label.style.fontWeight = 'normal';
            label.style.display = 'inline-block';
                label.textContent = cat;
                const countSpan = document.createElement('span');
                countSpan.className = 'filter-count';
                countSpan.style.marginLeft = '6px';
                countSpan.style.color = '#666';
                countSpan.textContent = '';
                wrapper.appendChild(input);
                wrapper.appendChild(label);
                wrapper.appendChild(countSpan);
                container.appendChild(wrapper);
            });
        }

// Compute per-category counts for sound effects filters and update UI.
function computeFilterCountsSound() {
    if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;
    const input = document.getElementById('searchInput');
    const searchLower = input ? (input.value || '').toLowerCase() : '';
    const container = document.getElementById('categoryFilters');
    if (!container) return;
    const boxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    boxes.forEach(cb => {
        const cat = cb.value;
        // Count items that would match if this category were selected (replace facet selection)
        const count = soundeffectsTable.reduce((acc, item) => {
            if (!item) return acc;
            if (itemMatchesFilters(item, searchLower, [cat])) return acc + 1;
            return acc;
        }, 0);
        const parent = cb.parentElement || cb.closest('div');
        if (parent) {
            const span = parent.querySelector('.filter-count');
            if (span) span.textContent = ' (' + count + ')';
        }
    });
}

// Compute min/max lengths (seconds) from soundeffectsTable and set placeholders
function setLengthPlaceholders() {
    try {
        if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;
        const lengths = soundeffectsTable.map(it => {
            if (!it) return 0;
            const v = parseInt(it.length || 0, 10) || 0;
            return v > 0 ? v : 0;
        }).filter(v => v > 0);
        if (!lengths.length) return;
        const minMs = Math.min(...lengths);
        const maxMs = Math.max(...lengths);
        const minS = (minMs / 1000).toFixed(1);
        const maxS = (maxMs / 1000).toFixed(1);
        const minEl = document.getElementById('minLength');
        const maxEl = document.getElementById('maxLength');
        if (minEl) {
            // placeholder uses dot as decimal separator for input
            minEl.placeholder = minS;
            minEl.title = `Kortste: ${minS}s`;
        }
        if (maxEl) {
            maxEl.placeholder = maxS;
            maxEl.title = `Langste: ${maxS}s`;
        }
    } catch (e) {
        console.error('setLengthPlaceholders failed', e);
    }
}


function renderSoundEffectsTable() {
    const list = document.getElementById('soundEffectsList');
    if (!list) return;
    list.innerHTML = '';
    if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;

    soundeffectsTable.forEach(item => {
        const li = document.createElement('li');
        li.className = 'item-listing__item';
    // compute categories for this item
    let cats = [];
        if (Array.isArray(item.categories)) cats = item.categories.map(String);
        else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
        else if (Array.isArray(item.category)) cats = item.category.map(String);
        else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);
        if (cats.length) {
            cats.sort((a,b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
            li.dataset.categories = cats.join('|');
        }

        // length dataset (ms) if present
        const lenMs = (item && (typeof item.length !== 'undefined')) ? (parseInt(item.length, 10) || 0) : 0;
        if (lenMs > 0) li.dataset.length = String(lenMs);

        const main = document.createElement('div'); main.className = 'item-listing__main';
        const left = document.createElement('div'); left.className = 'item-listing__left';
        const name = document.createElement('div'); name.className = 'item-name'; name.textContent = item.name || ''; name.title = 'Klik voor voorbeeld';
    const info = document.createElement('div'); info.className = 'item-langs';
    info.innerHTML = '';
    // show length first if we have it
    if (li.dataset.length) {
        const ms = parseInt(li.dataset.length || '0', 10) || 0;
        if (ms > 0) {
            const sec = (ms / 1000);
            const secStr = sec.toFixed(1).replace('.', ',') + ' seconden';
            const spanLen = document.createElement('span');
            spanLen.className = 'info-length';
            spanLen.textContent = secStr;
            info.appendChild(spanLen);
            if (cats.length) info.appendChild(document.createTextNode(' \u00A0•\u00A0 '));
        }
    }

    if (cats.length) {
        cats.forEach((c, idx) => {
            const span = document.createElement('span');
            span.className = 'info-part';
            span.textContent = c;
            span.style.cursor = 'pointer';
            span.dataset.facet = 'category';
            span.addEventListener('click', () => applyFilterFromInfoSfx('category', c));
            info.appendChild(span);
            if (idx < cats.length - 1) info.appendChild(document.createTextNode(', '));
        });
    }
        const desc = document.createElement('div'); desc.className = 'item-desc'; desc.textContent = item.description || '';
        left.appendChild(name); if (info.textContent) left.appendChild(info); left.appendChild(desc);
        const meta = document.createElement('div'); meta.className = 'item-meta';
        const actions = document.createElement('div'); actions.className = 'item-actions';
        const btn = document.createElement('button'); btn.className = 'copy-btn'; btn.textContent = 'Kopieer'; btn.addEventListener('click', function() { copyToClipboard(this); });
        actions.appendChild(btn); meta.appendChild(actions);
        main.appendChild(left); main.appendChild(meta); li.appendChild(main);
        list.appendChild(li);
    });

    localStorage.setItem('soundEffectCount', soundeffectsTable.length);
}

document.addEventListener("DOMContentLoaded", function() {
    renderSoundEffectsTable();
    buildCategoryFilters();
        // initialize per-filter counts
        computeFilterCountsSound();
    // set min/max placeholders based on data
    setLengthPlaceholders();
    const sel = document.getElementById('sortSelect');
    if (sel) {
        const [colStr, dir] = sel.value.split(':');
        const col = parseInt(colStr, 10);
        sortDirection[col] = (dir === 'asc');
    }
    sortTable(0);
    updateCounter();
    attachPreviewHandlers();
    // listen for chip removal events
    window.addEventListener('activeFilter:remove', (ev) => {
        try {
            const { type, value } = ev.detail || {};
            if (!type) return;
            if (type === 'search') {
                const s = document.getElementById('searchInput'); if (s) s.value = '';
            } else if (type === 'category') {
                const container = document.getElementById('categoryFilters'); if (container) {
                    const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => i.value === value);
                    if (input) input.checked = false;
                }
            }
            // refresh UI
            refreshTable();
        } catch (e) { console.error('failed to handle activeFilter:remove (sfx)', e); }
    });

    // Clear all filters when requested by the active-filters UI
    window.addEventListener('activeFilter:clear', () => {
        try {
            const s = document.getElementById('searchInput'); if (s) s.value = '';
            const minL = document.getElementById('minLength'); if (minL) minL.value = '';
            const maxL = document.getElementById('maxLength'); if (maxL) maxL.value = '';
            const container = document.getElementById('categoryFilters');
            if (container) {
                const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
                inputs.forEach(i => { if (i.checked) { i.checked = false; i.dispatchEvent(new Event('change')); } });
            }
            refreshTable(); computeFilterCountsSound();
        } catch (e) { console.error('failed to clear filters (sfx)', e); }
    });
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

        // If we have an explicit mapping, use it directly to avoid probing
        try {
            const key = normalizeNameForFile(displayName);
            if (window && window.soundeffectsLinks && Array.isArray(window.soundeffectsLinks[key]) && window.soundeffectsLinks[key].length > 0) {
                body.innerHTML = '';
                const audioPath = window.soundeffectsLinks[key][0];
                const a = document.createElement('audio');
                a.controls = true; a.preload = 'metadata';
                a.src = audioPath;
                body.appendChild(a);
                return;
            }
        } catch (e) {
            // fall back to probing
        }

        // Only try audio extensions (.mp3, .ogg). Other extensions are ignored.
        const exts = ['.mp3', '.ogg'];
        let i = 0;
        function tryAudioExt() {
            if (i >= exts.length) { body.innerHTML = '<div class="preview-notfound">Geen voorbeeld beschikbaar.</div>'; return; }
            const a = document.createElement('audio');
            a.controls = true; a.preload = 'metadata';
            a.oncanplaythrough = () => { body.innerHTML = ''; body.appendChild(a); };
            a.onerror = () => { i++; tryAudioExt(); };
            a.src = base + exts[i];
        }

        tryAudioExt();
    }

    // Helper to check if a preview file exists (only audio .mp3/.ogg)
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

        // Probe only audio extensions (.mp3, .ogg).
        const name = normalizeNameForFile(displayName);
        const base = `${folder}/${name}`;
        const exts = ['.mp3', '.ogg'];
        let idx = 0;
        let done = false;
        function tryNext() {
            if (idx >= exts.length) { if (!done) { done = true; cb(false); } return; }
            const a = document.createElement('audio');
            a.oncanplaythrough = () => { if (!done) { done = true; cb(true); } };
            a.onerror = () => { idx++; tryNext(); };
            a.src = base + exts[idx];
        }
        tryNext();
    }

    // Attach preview handlers to first-column names and mark those with previews
    function attachPreviewHandlers(){
        const rows = document.querySelectorAll('#soundEffectsList li');
        rows.forEach(r => {
            const first = r.querySelector('.item-name');
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

        // Also intercept anchors inside the list that point to local media so the
        // browser doesn't navigate / preload them. Instead open the preview overlay.
        const anchors = document.querySelectorAll('#soundEffectsList a[href]');
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
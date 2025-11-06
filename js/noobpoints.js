// noobpoints.js — render and control the Redeems table from noobPointsTable
document.addEventListener('DOMContentLoaded', () => {
    // Support both styles: a top-level `const noobPointsTable = [...]` or an assignment to `window.noobPointsTable`.
    if (typeof noobPointsTable === 'undefined' && typeof window.noobPointsTable === 'undefined') {
        console.warn('noobPointsTable not found');
        return;
    }

    // prefer the lexical binding if present, otherwise fall back to window property
    const dataSource = (typeof noobPointsTable !== 'undefined') ? noobPointsTable : window.noobPointsTable;

    const tbody = document.getElementById('redeemTable');
    const searchInput = document.getElementById('searchInput');
    const counter = document.getElementById('rowCount');

    function renderNoobPointsTable(items) {
        tbody.innerHTML = '';
    items.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.code = item.code || '';
            tr.dataset.cost = item.cost || '';
            tr.dataset.name = item.name || '';

            const tdName = document.createElement('td');
            tdName.textContent = item.name || '';
            tdName.title = 'Klik voor voorbeeld';
            tdName.style.cursor = 'pointer';

            const tdCode = document.createElement('td');
            const codeEl = document.createElement('code');
            codeEl.textContent = item.code || '';
            tdCode.appendChild(codeEl);

            const tdDesc = document.createElement('td');
            tdDesc.innerHTML = item.description || '';

            const tdCost = document.createElement('td');
            tdCost.textContent = item.cost != null ? String(item.cost) : '';

            const tdActions = document.createElement('td');
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Kopieer';
            copyBtn.className = 'copy-code';
            copyBtn.type = 'button';
            copyBtn.addEventListener('click', () => copyToClipboard(item.code));
            tdActions.appendChild(copyBtn);

            tr.appendChild(tdName);
            tr.appendChild(tdCode);
            tr.appendChild(tdDesc);
            tr.appendChild(tdCost);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });
        updateCounter();
        // attach preview handlers to the newly rendered rows
        attachPreviewHandlers();
    }

    // --- Preview helpers (image/audio/video in /alerts/ or iframe fallback) ---
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

    function showPreview(folder, code, displayName) {
        const name = normalizeNameForFile(code || displayName);
        const overlay = createPreviewOverlay();
        const titleEl = overlay.querySelector('#preview-title');
        const body = overlay.querySelector('#preview-body');
        const copyBtn = overlay.querySelector('.preview-copy');
        titleEl.textContent = displayName || code || '';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(code || displayName || '').then(() => {
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
            if (i >= exts.length) {
                // fallback: check for iframe mapping
                const iframes = (typeof window.noobpointsIframes !== 'undefined') ? window.noobpointsIframes : null;
                const mapped = iframes && (iframes[name] || iframes[code]);
                if (mapped) {
                    body.innerHTML = mapped;
                    return;
                }
                body.innerHTML = '<div class="preview-notfound">Geen voorbeeld beschikbaar.</div>';
                return;
            }
            const v = document.createElement('video');
            v.controls = true; v.preload = 'metadata'; v.style.maxHeight = '60vh';
            v.oncanplaythrough = () => { body.innerHTML = ''; body.appendChild(v); };
            v.onerror = () => tryVideo(exts, i+1);
            v.src = base + exts[i];
        }

        tryImage(['.png','.jpg','.jpeg','.gif','.webp'], 0);
    }

    // Helper to check if a preview file exists (image -> audio -> video)
    function previewExists(folder, codeOrName, cb) {
        const name = normalizeNameForFile(codeOrName);
        const base = `${folder}/${name}`;
        let done = false;

        // try images first
        const imgExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const tryImage = (i) => {
            if (i >= imgExts.length) return tryAudio(0);
            const img = new Image();
            img.onload = () => { if (!done) { done = true; cb(true); } };
            img.onerror = () => tryImage(i+1);
            img.src = base + imgExts[i];
        };

        // then audio
        const audioExts = ['.mp3', '.ogg', '.wav'];
        const tryAudio = (i) => {
            if (i >= audioExts.length) return tryVideo(0);
            const a = document.createElement('audio');
            a.oncanplaythrough = () => { if (!done) { done = true; cb(true); } };
            a.onerror = () => tryAudio(i+1);
            a.src = base + audioExts[i];
        };

        // then video (check several extensions)
        const videoExts = ['.webm', '.mp4', '.ogg'];
        const tryVideo = (i) => {
            if (i >= videoExts.length) {
                // finally, check iframe mapping
                const iframes = (typeof window.noobpointsIframes !== 'undefined') ? window.noobpointsIframes : null;
                const mapped = iframes && (iframes[name] || iframes[codeOrName]);
                if (!done) { done = true; cb(Boolean(mapped)); }
                return;
            }
            const v = document.createElement('video');
            v.oncanplaythrough = () => { if (!done) { done = true; cb(true); } };
            v.onerror = () => tryVideo(i+1);
            v.src = base + videoExts[i];
        };

        tryImage(0);
    }

    // Attach preview handlers to first-column names and mark those with previews
    function attachPreviewHandlers(){
        const rows = document.querySelectorAll('#redeemTable tr');
        rows.forEach(r => {
            const first = r.querySelector('td:first-child');
            if (!first) return;
            const code = r.dataset.code || '';
            const display = first.innerText.trim();
            first.title = 'Klik voor voorbeeld';
            first.style.cursor = 'pointer';
            // remove prior listeners by cloning
            const newFirst = first.cloneNode(true);
            first.parentNode.replaceChild(newFirst, first);
            newFirst.addEventListener('click', () => showPreview('alerts', code, display));
            // mark if preview exists (image/audio/video or iframe mapping)
            previewExists('alerts', code || display, (exists) => {
                if (exists) newFirst.classList.add('has-preview');
            });
        });
    }

    // Return array of selected category strings (exact match). If none, returns []
    function getSelectedCategories() {
        const container = document.getElementById('categoryFilters');
        if (!container) return [];
        const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        return inputs.filter(i => i.checked).map(i => i.value);
    }

    // Determine whether an item matches the selected categories and search text
    function itemMatchesFilters(item, searchLower, selectedCats) {
        if (!item) return false;
        const name = (item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const code = (item.code || '').toLowerCase();
        const textMatch = (!searchLower) || name.indexOf(searchLower) !== -1 || desc.indexOf(searchLower) !== -1 || code.indexOf(searchLower) !== -1;

        // build categories array (support item.categories or item.category)
        let cats = [];
        if (Array.isArray(item.categories)) cats = item.categories.map(String);
        else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
        else if (Array.isArray(item.category)) cats = item.category.map(String);
        else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);

        if (!selectedCats || selectedCats.length === 0) return textMatch;

        if (cats.length === 0) return false; // if categories selected but item has none, hide

        const intersects = selectedCats.some(sc => cats.includes(sc));
        return textMatch && intersects;
    }

    // Rebuild the visible table from the dataSource and current filters
    function refreshTable() {
        const searchLower = (searchInput?.value || '').toLowerCase().trim();
        const selectedCats = getSelectedCategories();
        const filtered = dataSource.filter(item => itemMatchesFilters(item, searchLower, selectedCats));
        renderNoobPointsTable(filtered);
    }

    function copyToClipboard(text) {
        if (!text) return;
        navigator.clipboard?.writeText(text).then(() => {
            // flash a small visual feedback
            console.log('Copied', text);
        }).catch(err => console.warn('clipboard failed', err));
    }

    function updateCounter() {
        if (!counter) return;
        const total = tbody.querySelectorAll('tr').length;
        counter.textContent = total;
    }

    function searchTable() {
        const q = (searchInput?.value || '').toLowerCase().trim();
        if (!q) {
            // show all
            renderNoobPointsTable(dataSource);
            return;
        }
        const filtered = dataSource.filter(item => {
            return [item.name, item.code, item.description].join(' ').toLowerCase().includes(q);
        });
        renderNoobPointsTable(filtered);
    }

    function sortTable(columnIndex, numeric = false) {
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length === 0) return;
        const multiplier = tbody.dataset.sortOrder === 'asc' ? -1 : 1;
        tbody.dataset.sortOrder = tbody.dataset.sortOrder === 'asc' ? 'desc' : 'asc';

        rows.sort((a, b) => {
            const aText = a.children[columnIndex].textContent.trim();
            const bText = b.children[columnIndex].textContent.trim();
            if (numeric) {
                return multiplier * ((Number(aText) || 0) - (Number(bText) || 0));
            }
            return multiplier * aText.localeCompare(bText, undefined, {numeric: true});
        });
        rows.forEach(r => tbody.appendChild(r));
    }

    // wire events
    document.getElementById('searchBtn')?.addEventListener('click', searchTable);
    searchInput?.addEventListener('input', () => { refreshTable(); });

    // enable sorting by clicking the table headers if present
    document.querySelectorAll('#redeemTableHeader th.sortable').forEach((th, idx) => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            // headers are: Name, Code, Description, Cost, Actions
            const columnIndex = Number(th.dataset.col) || idx;
            const numeric = th.dataset.numeric === 'true';
            sortTable(columnIndex, numeric);
        });
    });

    // Build category filters from dataSource: same UI as other pages
    function buildCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;
        if (!Array.isArray(dataSource)) return;

        const categories = new Set();
        dataSource.forEach(item => {
            if (!item) return;
            if (Array.isArray(item.categories)) {
                item.categories.forEach(c => { if (c) categories.add(c.toString()); });
            } else if (item.categories && typeof item.categories === 'string') {
                item.categories.split(',').forEach(c => { const t = c.trim(); if (t) categories.add(t); });
            } else if (Array.isArray(item.category)) {
                item.category.forEach(c => { if (c) categories.add(c.toString()); });
            } else if (item.category && typeof item.category === 'string') {
                item.category.split(',').forEach(c => { const t = c.trim(); if (t) categories.add(t); });
            }
        });

        const cats = Array.from(categories).sort((a,b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
        container.innerHTML = '';
        if (cats.length === 0) {
            container.innerHTML = '<small>Geen categorieën gevonden.</small>';
            return;
        }

        cats.forEach(cat => {
            const id = 'noobcat-' + cat.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'row';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '6px';
            wrapper.style.marginBottom = '4px';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = id;
            input.value = cat;
            input.addEventListener('change', () => refreshTable());
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

    // initial setup: build filters and render
    buildCategoryFilters();
    renderNoobPointsTable(dataSource);
    // expose total redeems count for the index page (stored as a simple value)
    try { localStorage.setItem('redeemsCount', String(dataSource.length)); } catch (e) { /* noop */ }

    // applySort: expose a global function so the inline onchange in the select works
    function applySortInternal() {
        const sel = document.getElementById('sortSelect');
        if (!sel) return;
        const [colStr, dir] = (sel.value || '0:asc').split(':');
        const col = parseInt(colStr, 10);
        const th = document.querySelector(`#redeemTableHeader th[data-col="${col}"]`);
        const numeric = th && th.dataset.numeric === 'true';
        const tbodyEl = document.getElementById('redeemTable');
        if (!tbodyEl) return;
        // The sortTable implementation toggles tbody.dataset.sortOrder; to force a specific
        // direction we set it to the opposite before calling sortTable.
        tbodyEl.dataset.sortOrder = (dir === 'asc') ? 'desc' : 'asc';
        sortTable(col, numeric);
    }

    // expose globally for the inline onchange / button handlers in the HTML
    window.applySort = applySortInternal;

    // apply initial sort according to the selector value
    applySortInternal();
});

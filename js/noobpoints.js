// noobpoints.js — render and control the Redeems table from noobPointsTable
document.addEventListener('DOMContentLoaded', () => {
    // Support both styles: a top-level `const noobPointsTable = [...]` or an assignment to `window.noobPointsTable`.
    if (typeof noobPointsTable === 'undefined' && typeof window.noobPointsTable === 'undefined') {
        console.warn('noobPointsTable not found');
        return;
    }

    // prefer the lexical binding if present, otherwise fall back to window property
    const dataSource = (typeof noobPointsTable !== 'undefined') ? noobPointsTable : window.noobPointsTable;

    // prefer the new list container, fall back to legacy table body if present
    const listEl = document.getElementById('redeemList');
    const tbody = document.getElementById('redeemTable');
    const searchInput = document.getElementById('searchInput');
    const counter = document.getElementById('rowCount');
    // cost filter elements
    const minCostInput = document.getElementById('minCostInput');
    const maxCostInput = document.getElementById('maxCostInput');
    const costRangeMin = document.getElementById('costRangeMin');
    const costRangeMax = document.getElementById('costRangeMax');

    function renderNoobPointsTable(items) {
        // If new list container exists, render into it; otherwise render into tbody
        if (listEl) listEl.innerHTML = '';
        if (tbody) tbody.innerHTML = '';
        items.forEach(item => {
            const code = item.code || '';
            const nameText = item.name || '';
            const descHtml = item.description || '';
            const costText = item.cost != null ? String(item.cost) : '';

            // Build li element
            if (listEl) {
                // compute categories for this item (support many input shapes) and sort them
                let cats = [];
                if (Array.isArray(item.categories)) cats = item.categories.map(String);
                else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
                else if (Array.isArray(item.category)) cats = item.category.map(String);
                else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);
                if (cats.length) cats.sort((a,b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));

                // compute type(s) for this item (new optional field 'type' or 'types')
                let types = [];
                if (Array.isArray(item.types)) types = item.types.map(String);
                else if (item && item.types && typeof item.types === 'string') types = item.types.split(',').map(s => s.trim()).filter(Boolean);
                else if (Array.isArray(item.type)) types = item.type.map(String);
                else if (item && item.type && typeof item.type === 'string') types = item.type.split(',').map(s => s.trim()).filter(Boolean);
                if (types.length) types.sort((a,b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));

                const li = document.createElement('li');
                li.className = 'item-listing__item';
                li.dataset.code = code; li.dataset.cost = costText; li.dataset.name = nameText;
                if (cats.length) li.dataset.categories = cats.join('|');
                if (types.length) li.dataset.types = types.join('|');

                const main = document.createElement('div'); main.className = 'item-listing__main';
                const left = document.createElement('div'); left.className = 'item-listing__left';
                const name = document.createElement('div'); name.className = 'item-name'; name.textContent = nameText; name.title = 'Klik voor voorbeeld'; name.style.cursor = 'pointer';

                // info row: cost and categories
                const info = document.createElement('div'); info.className = 'item-langs';
                // Inline code element for mobile: shown between name and info on small screens
                const codeInline = document.createElement('div'); codeInline.className = 'item-code-inline'; codeInline.textContent = code;
                // Mobile copy row: a mobile-only row containing label, code and a copy button
                const mobileCodeRow = document.createElement('div'); mobileCodeRow.className = 'mobile-code-row';
                const mobileCodeLeft = document.createElement('div'); mobileCodeLeft.className = 'mobile-code-left';
                const mobileLabel = document.createElement('span'); mobileLabel.className = 'mobile-code-label'; mobileLabel.textContent = 'Redeemcode:';
                mobileCodeLeft.appendChild(mobileLabel);
                mobileCodeLeft.appendChild(codeInline);
                const mobileCopyBtn = document.createElement('button'); mobileCopyBtn.type = 'button'; mobileCopyBtn.className = 'mobile-copy-code'; mobileCopyBtn.textContent = 'Kopieer';
                mobileCopyBtn.addEventListener('click', (ev) => copyToClipboard(code, ev.currentTarget));
                mobileCodeRow.appendChild(mobileCodeLeft);
                mobileCodeRow.appendChild(mobileCopyBtn);
                const costPart = costText ? (costText + ' Noob-Points') : '';
                const typePart = types.length ? types.join(', ') : '';
                const catPart = cats.length ? cats.join(', ') : '';
                const infoParts = [];
                if (costPart) infoParts.push(costPart);
                if (typePart) infoParts.push(typePart);
                if (catPart) infoParts.push(catPart);
                info.textContent = infoParts.join(' • ');

                const desc = document.createElement('div'); desc.className = 'item-desc'; desc.innerHTML = descHtml;
                left.appendChild(name);
                // insert mobile code row (hidden on desktop via CSS)
                left.appendChild(mobileCodeRow);
                if (info.textContent) left.appendChild(info);
                left.appendChild(desc);

                const meta = document.createElement('div'); meta.className = 'item-meta';
                const codeEl = document.createElement('div'); codeEl.className = 'item-code'; codeEl.textContent = code;
                const actions = document.createElement('div'); actions.className = 'item-actions';
                const copyBtn = document.createElement('button'); copyBtn.textContent = 'Kopieer'; copyBtn.className = 'copy-code'; copyBtn.type = 'button'; copyBtn.addEventListener('click', (ev) => copyToClipboard(code, ev.currentTarget));
                actions.appendChild(copyBtn);
                // note: cost is shown in the info row; do not duplicate it in meta
                meta.appendChild(codeEl); meta.appendChild(actions);

                main.appendChild(left); main.appendChild(meta); li.appendChild(main);
                listEl.appendChild(li);
            }

            // Legacy table rendering (kept for compatibility)
            if (tbody) {
                const tr = document.createElement('tr');
                tr.dataset.code = code; tr.dataset.cost = costText; tr.dataset.name = nameText;
                const tdName = document.createElement('td'); tdName.textContent = nameText; tdName.title = 'Klik voor voorbeeld'; tdName.style.cursor = 'pointer';
                const tdCode = document.createElement('td'); const codeTag = document.createElement('code'); codeTag.textContent = code; tdCode.appendChild(codeTag);
                const tdDesc = document.createElement('td'); tdDesc.innerHTML = descHtml;
                const tdCost = document.createElement('td'); tdCost.textContent = costText;
                const tdActions = document.createElement('td'); const copyBtn2 = document.createElement('button'); copyBtn2.textContent = 'Kopieer'; copyBtn2.className = 'copy-code'; copyBtn2.type = 'button'; copyBtn2.addEventListener('click', (ev) => copyToClipboard(code, ev.currentTarget)); tdActions.appendChild(copyBtn2);
                tr.appendChild(tdName); tr.appendChild(tdCode); tr.appendChild(tdDesc); tr.appendChild(tdCost); tr.appendChild(tdActions);
                tbody.appendChild(tr);
            }
        });
        updateCounter();
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

        // Prefer generated mapping (alertsLinks) which lists files present in /alerts/
        // This avoids creating elements which could trigger downloads at page load.
        try {
            const matchesVideo = (f) => /\.(mp4|webm)(?:$|[?#])/i.test(f);
            const mappingFiles = (typeof window.getAlertsFiles === 'function') ? window.getAlertsFiles(name) : (window.alertsLinks && window.alertsLinks[name]) || [];
            if (mappingFiles && mappingFiles.length > 0) {
                // Prefer video files (.webm/.mp4) but accept audio (.mp3/.ogg) as fallback
                const prefer = ['.webm', '.mp4'];
                const audioExts = ['.mp3', '.ogg'];
                let chosen = null;
                let chosenType = null;
                for (const ext of prefer) {
                    const found = mappingFiles.find(f => f.toLowerCase().endsWith(ext));
                    if (found) { chosen = found; chosenType = 'video'; break; }
                }
                if (!chosen) {
                    for (const ext of audioExts) {
                        const found = mappingFiles.find(f => f.toLowerCase().endsWith(ext));
                        if (found) { chosen = found; chosenType = 'audio'; break; }
                    }
                }

                if (chosen) {
                    body.innerHTML = '';
                    if (chosenType === 'video') {
                        const v = document.createElement('video');
                        v.controls = true; v.preload = 'metadata'; v.style.maxHeight = '60vh';
                        v.src = chosen;
                        body.appendChild(v);
                    } else {
                        const a = document.createElement('audio');
                        a.controls = true; a.preload = 'metadata';
                        a.src = chosen;
                        body.appendChild(a);
                    }
                    return;
                }
            }
        } catch (e) {
            // continue to fallback behavior if mapping not available
        }

        // fallback: if no mapping present, try iframe mapping (youtube/twitch) first
        const iframes = (typeof window.noobpointsIframes !== 'undefined') ? window.noobpointsIframes : null;
        const mapped = iframes && (iframes[name] || iframes[code]);
        if (mapped) {
            body.innerHTML = mapped;
            return;
        }

        // final fallback: perform a lightweight HTTP check for video existence and then create element
        const base = `${folder}/${name}`;
        (async () => {
            const tryHead = async (url) => {
                try {
                    const r = await fetch(url, { method: 'HEAD' });
                    if (r && r.ok) return true;
                    if (r && (r.status === 405 || r.status === 501)) {
                        const rr = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
                        return Boolean(rr && rr.ok);
                    }
                } catch (err) {
                    try {
                        const rr = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
                        return Boolean(rr && rr.ok);
                    } catch (e) { return false; }
                }
                return false;
            };

            for (const ext of ['.webm', '.mp4']) {
                const url = base + ext;
                if (await tryHead(url)) {
                    body.innerHTML = '';
                    const v = document.createElement('video');
                    v.controls = true; v.preload = 'metadata'; v.style.maxHeight = '60vh';
                    v.src = url;
                    body.appendChild(v);
                    return;
                }
            }
            // check audio extensions as fallback
            for (const ext of ['.mp3', '.ogg']) {
                const url = base + ext;
                if (await tryHead(url)) {
                    body.innerHTML = '';
                    const a = document.createElement('audio');
                    a.controls = true; a.preload = 'metadata';
                    a.src = url;
                    body.appendChild(a);
                    return;
                }
            }

            body.innerHTML = '<div class="preview-notfound">Geen voorbeeld beschikbaar.</div>';
        })();
    }

    // Helper to check if a preview video exists (only .webm/.mp4 for redeems)
    // Prefer the generated mapping to avoid network probes. Calls cb(true/false).
    function previewExists(folder, codeOrName, cb) {
        const name = normalizeNameForFile(codeOrName);
        // 1) check generated mapping for video files
        try {
            const matchesMedia = (f) => /\.(mp4|webm|mp3|ogg)(?:$|[?#])/i.test(f);
            if (typeof window.getAlertsFiles === 'function') {
                const files = window.getAlertsFiles(name) || [];
                if (files.some(matchesMedia)) { cb(true); return; }
            } else if (typeof window.alertsLinks !== 'undefined') {
                const files = window.alertsLinks[name] || [];
                if (files.some(matchesMedia)) { cb(true); return; }
            }
        } catch (e) {
            // ignore and fall back
        }

        // 2) fallback: lightweight HTTP HEAD / Range check for video files
        (async () => {
            const base = `${folder}/${name}`;
            const tryHead = async (url) => {
                try {
                    const r = await fetch(url, { method: 'HEAD' });
                    if (r && r.ok) return true;
                    if (r && (r.status === 405 || r.status === 501)) {
                        const rr = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
                        return Boolean(rr && rr.ok);
                    }
                } catch (err) {
                    try {
                        const rr = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
                        return Boolean(rr && rr.ok);
                    } catch (e) { return false; }
                }
                return false;
            };

            for (const ext of ['.webm', '.mp4']) {
                if (await tryHead(base + ext)) { cb(true); return; }
            }

            // 3) finally check iframe mapping as last resort
            const iframes = (typeof window.noobpointsIframes !== 'undefined') ? window.noobpointsIframes : null;
            const mapped = iframes && (iframes[name] || iframes[codeOrName]);
            cb(Boolean(mapped));
        })();
    }

    // Attach preview handlers to first-column names and mark those with previews
    function attachPreviewHandlers(){
        // handle list items first
        const listRows = document.querySelectorAll('#redeemList li');
        listRows.forEach(r => {
            const first = r.querySelector('.item-name');
            if (!first) return;
            const code = r.dataset.code || '';
            const display = first.innerText.trim();
            first.title = 'Klik voor voorbeeld';
            first.style.cursor = 'pointer';
            const newFirst = first.cloneNode(true);
            first.parentNode.replaceChild(newFirst, first);
            newFirst.addEventListener('click', () => showPreview('alerts', code, display));
            previewExists('alerts', code || display, (exists) => { if (exists) newFirst.classList.add('has-preview'); });
        });

        // legacy table rows
        const rows = document.querySelectorAll('#redeemTable tr');
        rows.forEach(r => {
            const first = r.querySelector('td:first-child');
            if (!first) return;
            const code = r.dataset.code || '';
            const display = first.innerText.trim();
            first.title = 'Klik voor voorbeeld';
            first.style.cursor = 'pointer';
            const newFirst = first.cloneNode(true);
            first.parentNode.replaceChild(newFirst, first);
            newFirst.addEventListener('click', () => showPreview('alerts', code, display));
            previewExists('alerts', code || display, (exists) => { if (exists) newFirst.classList.add('has-preview'); });
        });

        // Intercept anchors inside the list/table that point to alert videos so they
        // don't trigger navigation or downloads; open preview overlay instead.
        const anchors = document.querySelectorAll('#redeemList a[href], #redeemTable a[href]');
        anchors.forEach(a => {
            try {
                const href = a.getAttribute('href') || '';
                const lower = href.toLowerCase();
                const isLocalVideo = lower.includes('/alerts/') || lower.match(/\.(mp4|webm|mp3|ogg)(?:$|[?#])/i);
                if (isLocalVideo) {
                    a.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const filename = href.split('/').pop().split(/[?#]/)[0] || a.innerText.trim();
                        const name = filename.replace(/\.[^/.]+$/, '');
                        showPreview('alerts', name, name);
                    });
                    a.rel = (a.rel || '') + ' noopener';
                }
            } catch (e) { /* ignore */ }
        });
    }

    // Return array of selected category strings (exact match). If none, returns []
    function getSelectedCategories() {
        const container = document.getElementById('categoryFilters');
        if (!container) return [];
        const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        return inputs.filter(i => i.checked).map(i => i.value);
    }

    function getSelectedTypes() {
        const selected = [];
        const checkboxes = document.querySelectorAll('#typeFilters input[type="checkbox"]:checked');
        // Voeg .trim() en .toLowerCase() toe om spaties en hoofdletters te elimineren
        checkboxes.forEach(cb => selected.push(cb.value.trim().toLowerCase()));
        return selected;
    }

    // Determine whether an item matches the selected categories and search text
    function itemMatchesFilters(item, searchLower, selectedCats, selectedTypes, minCost, maxCost) {
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

        if (!selectedCats || selectedCats.length === 0) {
            // still must respect text match
            if (!textMatch) return false;
        } else {
            if (cats.length === 0) return false; // if categories selected but item has none, hide
            const intersects = selectedCats.some(sc => cats.includes(sc));
            if (!intersects) return false;
        }

        // type filtering: if selectedTypes set, ensure item has at least one of them
        if (selectedTypes && selectedTypes.length > 0) {
            // build types array (support item.types or item.type)
            let tarr = [];
            if (Array.isArray(item.types)) tarr = item.types.map(String);
            else if (item && item.types && typeof item.types === 'string') tarr = item.types.split(',').map(s => s.trim()).filter(Boolean);
            else if (Array.isArray(item.type)) tarr = item.type.map(String);
            else if (item && item.type && typeof item.type === 'string') tarr = item.type.split(',').map(s => s.trim()).filter(Boolean);
            // normalize item types for comparison (trim + lowercase)
            tarr = tarr.map(t => (t || '').toString().trim().toLowerCase()).filter(Boolean);
            if (tarr.length === 0) return false;
            const intersectsTypes = selectedTypes.some(st => tarr.includes(st));
            if (!intersectsTypes) return false;
        }

        // cost filtering: if minCost/maxCost are numbers, ensure item.cost is within range
        if (typeof minCost === 'number' && typeof maxCost === 'number') {
            const costVal = (item.cost == null) ? 0 : Number(item.cost);
            if (isNaN(costVal)) return false;
            if (costVal < minCost || costVal > maxCost) return false;
        }

        return true;
    }

    // Rebuild the visible table from the dataSource and current filters
    function getSelectedCostRange() {
        // Determine a sensible global min/max from the data source (works even when
        // the visual range inputs are not present). Treat empty text inputs as
        // "no override" and fall back to the global bounds.
        let globalMin = Infinity, globalMax = -Infinity;
        if (Array.isArray(dataSource)) {
            dataSource.forEach(item => {
                if (!item) return;
                const c = (item.cost == null) ? 0 : Number(item.cost);
                if (!isFinite(c)) return;
                if (c < globalMin) globalMin = c;
                if (c > globalMax) globalMax = c;
            });
        }
        if (!isFinite(globalMin)) globalMin = 0;
        if (!isFinite(globalMax)) globalMax = 0;

        // Read text inputs; treat empty string / missing value as "use global"
        const rawMin = (minCostInput && typeof minCostInput.value === 'string') ? minCostInput.value.trim() : '';
        const rawMax = (maxCostInput && typeof maxCostInput.value === 'string') ? maxCostInput.value.trim() : '';
        let mn = rawMin === '' ? globalMin : Number(rawMin);
        let mx = rawMax === '' ? globalMax : Number(rawMax);
        if (!isFinite(mn)) mn = globalMin;
        if (!isFinite(mx)) mx = globalMax;

        // clamp to global bounds
        if (mn < globalMin) mn = globalMin;
        if (mx > globalMax) mx = globalMax;
        if (mn > mx) mn = mx;
        return [mn, mx];
    }

    function refreshTable() {
        const searchLower = (searchInput?.value || '').toLowerCase().trim();
        const selectedCats = getSelectedCategories();
        const selectedTypes = getSelectedTypes();
        const [minCost, maxCost] = getSelectedCostRange();
        try { console.debug('refreshTable', { searchLower, selectedCats, selectedTypes, minCost, maxCost }); } catch (e) {}
        const filtered = dataSource.filter(item => itemMatchesFilters(item, searchLower, selectedCats, selectedTypes, minCost, maxCost));
        try { console.debug('filtered count', filtered.length); } catch (e) {}
        renderNoobPointsTable(filtered);
    }

    function showCopyToast(message) {
        // remove existing toast if present
        const existing = document.getElementById('copyToast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.id = 'copyToast';
        t.textContent = message;
        t.style.position = 'fixed';
        t.style.left = '50%';
        t.style.bottom = '12px';
        t.style.transform = 'translateX(-50%)';
        t.style.background = 'rgba(0,0,0,0.85)';
        t.style.color = '#fff';
        t.style.padding = '8px 12px';
        t.style.borderRadius = '6px';
        t.style.zIndex = 3000;
        t.style.fontSize = '0.95rem';
        document.body.appendChild(t);
        setTimeout(() => { t.style.transition = 'opacity 0.25s'; t.style.opacity = '0'; }, 1200);
        setTimeout(() => { t.remove(); }, 1500);
    }

    function copyToClipboard(text, sourceBtn) {
        if (!text) return;
        // prefer modern Clipboard API, fallback to execCommand
        const doFallback = (txt) => {
            try {
                const ta = document.createElement('textarea');
                ta.value = txt;
                // prevent scrolling to bottom
                ta.style.position = 'fixed'; ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand('copy');
                ta.remove();
                return ok;
            } catch (e) { return false; }
        };

        const isMobile = window.matchMedia && window.matchMedia('(max-width: 899px)').matches;

        const afterCopySuccess = () => {
            if (isMobile) {
                // on mobile do not change button text — show small toast at bottom
                showCopyToast(`${text} gekopieerd`);
            } else if (sourceBtn) {
                // change button text briefly on desktop
                const orig = sourceBtn.textContent;
                sourceBtn.textContent = 'Gekopieerd ✓';
                sourceBtn.disabled = true;
                setTimeout(() => { sourceBtn.textContent = orig; sourceBtn.disabled = false; }, 1200);
            } else {
                // fallback console log
                console.log('Copied', text);
            }
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).then(() => {
                afterCopySuccess();
            }).catch(err => {
                // fallback method
                const ok = doFallback(text);
                if (ok) afterCopySuccess();
                else console.warn('clipboard failed', err);
            });
        } else {
            const ok = doFallback(text);
            if (ok) afterCopySuccess();
            else console.warn('clipboard not supported');
        }
    }

    function updateCounter() {
        if (!counter) return;
        const total = (listEl ? listEl.querySelectorAll('li').length : 0) || (tbody ? tbody.querySelectorAll('tr').length : 0);
        counter.textContent = total;
    }

    function searchTable() {
        const q = (searchInput?.value || '').toLowerCase().trim();
        if (!q) { renderNoobPointsTable(dataSource); return; }
        const filtered = dataSource.filter(item => [item.name, item.code, item.description].join(' ').toLowerCase().includes(q));
        renderNoobPointsTable(filtered);
    }

    function sortTable(columnIndex, numeric = false) {
        // Try list view first
        const list = listEl;
        if (list) {
            const items = Array.from(list.querySelectorAll('li'));
            if (items.length === 0) return;
            // Support sorting by different columns. For list view we prefer dataset values for
            // cost/type/categories when available to avoid relying on inner DOM structure.
            if (columnIndex === 3) {
                // cost - numeric
                items.sort((a, b) => ((Number(a.dataset.cost) || 0) - (Number(b.dataset.cost) || 0)));
            } else if (columnIndex === 4) {
                // type - string compare using dataset.types (may be pipe-separated)
                items.sort((a, b) => {
                    const at = (a.dataset.types || '').toLowerCase();
                    const bt = (b.dataset.types || '').toLowerCase();
                    return at.localeCompare(bt, 'nl', { sensitivity: 'base' });
                });
            } else if (columnIndex === 5) {
                // categories - string compare using dataset.categories
                items.sort((a, b) => {
                    const ac = (a.dataset.categories || '').toLowerCase();
                    const bc = (b.dataset.categories || '').toLowerCase();
                    return ac.localeCompare(bc, 'nl', { sensitivity: 'base' });
                });
            } else {
                const selMap = { 0: '.item-name', 1: '.item-code', 2: '.item-desc' };
                const sel = selMap[columnIndex] || '.item-name';
                const isNumeric = numeric || items.every(li => {
                    const el = li.querySelector(sel); return el && !isNaN(el.innerText.trim());
                });
                items.sort((a, b) => {
                    const aEl = a.querySelector(sel); const bEl = b.querySelector(sel);
                    const aText = aEl ? aEl.textContent.trim() : '';
                    const bText = bEl ? bEl.textContent.trim() : '';
                    if (isNumeric) return (Number(aText) || 0) - (Number(bText) || 0);
                    return aText.localeCompare(bText, undefined, { numeric: true });
                });
            }
            // respect dataset on list for order tracking
            const order = list.dataset.sortOrder === 'asc' ? -1 : 1;
            list.dataset.sortOrder = list.dataset.sortOrder === 'asc' ? 'desc' : 'asc';
            if (order === -1) items.reverse();
            items.forEach(i => list.appendChild(i));
            return;
        }

        // Fallback to legacy tbody sort
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length === 0) return;
        const multiplier = tbody.dataset.sortOrder === 'asc' ? -1 : 1;
        tbody.dataset.sortOrder = tbody.dataset.sortOrder === 'asc' ? 'desc' : 'asc';
        rows.sort((a, b) => {
            const aText = a.children[columnIndex].textContent.trim();
            const bText = b.children[columnIndex].textContent.trim();
            if (numeric) return multiplier * ((Number(aText) || 0) - (Number(bText) || 0));
            return multiplier * aText.localeCompare(bText, undefined, { numeric: true });
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

    // Build type filters from dataSource (new 'type' or 'types' field)
    function buildTypeFilters() {
        const container = document.getElementById('typeFilters');
        if (!container) return;
        if (!Array.isArray(dataSource)) return;

        const types = new Set();
        dataSource.forEach(item => {
            if (!item) return;
            if (Array.isArray(item.types)) {
                item.types.forEach(t => { if (t) types.add(t.toString()); });
            } else if (item.types && typeof item.types === 'string') {
                item.types.split(',').forEach(t => { const s = t.trim(); if (s) types.add(s); });
            } else if (Array.isArray(item.type)) {
                item.type.forEach(t => { if (t) types.add(t.toString()); });
            } else if (item.type && typeof item.type === 'string') {
                item.type.split(',').forEach(t => { const s = t.trim(); if (s) types.add(s); });
            }
        });

        const arr = Array.from(types).sort((a,b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
        container.innerHTML = '';
        if (arr.length === 0) { container.innerHTML = '<small>Geen types gevonden.</small>'; return; }

        arr.forEach(t => {
            const id = 'noobtype-' + t.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex'; wrapper.style.gap = '6px'; wrapper.style.alignItems = 'center'; wrapper.style.marginBottom = '4px';
            const input = document.createElement('input'); input.type = 'checkbox'; input.id = id; input.value = t;
            // log changes to help debug filtering issues
            input.addEventListener('change', (ev) => {
                try { console.debug('type checkbox changed', { value: input.value, checked: input.checked }); } catch (e) {}
                refreshTable();
            });
            const label = document.createElement('label'); label.htmlFor = id; label.style.fontWeight = 'normal'; label.textContent = t;
            wrapper.appendChild(input); wrapper.appendChild(label); container.appendChild(wrapper);
        });
    }

    // Initialize cost filter inputs and (optional) sliders based on dataSource values
    function initializeCostFilter() {
        if (!Array.isArray(dataSource)) return;
        // determine global min/max from the data set
        let min = Infinity, max = -Infinity;
        dataSource.forEach(item => {
            if (!item) return;
            const c = (item.cost == null) ? 0 : Number(item.cost);
            if (!isFinite(c)) return;
            if (c < min) min = c;
            if (c > max) max = c;
        });
        if (!isFinite(min)) min = 0;
        if (!isFinite(max)) max = 0;

        // Require number inputs at minimum
        if (!minCostInput || !maxCostInput) return;

        // Set placeholders to show global bounds but keep values empty by default
        minCostInput.placeholder = String(min);
        maxCostInput.placeholder = String(max);
        // Clear current values so placeholders are visible and filters are inactive on load
        minCostInput.value = '';
        maxCostInput.value = '';
        // Also set min/max attributes on the number inputs for nicer UX
        try { minCostInput.min = String(min); minCostInput.max = String(max); } catch (e) {}
        try { maxCostInput.min = String(min); maxCostInput.max = String(max); } catch (e) {}

        // When the user types, update filtering in real time. We do not force clamping
        // while typing; clamping can occur on blur if desired.
        minCostInput.addEventListener('input', () => { refreshTable(); });
        maxCostInput.addEventListener('input', () => { refreshTable(); });

        // If the optional range slider inputs exist, wire them up as well (preserve
        // previous behavior). They remain optional and the number inputs work even
        // when they are absent.
        if (costRangeMin && costRangeMax) {
            const step = 10;
            costRangeMin.min = String(min);
            costRangeMin.max = String(max);
            costRangeMin.step = String(step);
            costRangeMax.min = String(min);
            costRangeMax.max = String(max);
            costRangeMax.step = String(step);

            // initialize slider positions to global bounds
            costRangeMin.value = String(min);
            costRangeMax.value = String(max);

            function syncFromRange() {
                let a = Number(costRangeMin.value);
                let b = Number(costRangeMax.value);
                if (isNaN(a)) a = min; if (isNaN(b)) b = max;
                if (a > b) {
                    if (this === costRangeMin) { a = b; costRangeMin.value = String(a); }
                    else { b = a; costRangeMax.value = String(b); }
                }
                minCostInput.value = String(a);
                maxCostInput.value = String(b);
                refreshTable();
            }

            function syncFromInputs() {
                // when number inputs change, sync them back to the sliders
                let a = Number(minCostInput.value);
                let b = Number(maxCostInput.value);
                if (!isFinite(a)) a = min; if (!isFinite(b)) b = max;
                if (a < Number(costRangeMin.min)) a = Number(costRangeMin.min);
                if (b > Number(costRangeMax.max)) b = Number(costRangeMax.max);
                if (a > b) a = b;
                costRangeMin.value = String(a);
                costRangeMax.value = String(b);
                minCostInput.value = String(a);
                maxCostInput.value = String(b);
                refreshTable();
            }

            costRangeMin.addEventListener('input', syncFromRange);
            costRangeMax.addEventListener('input', syncFromRange);
            costRangeMin.addEventListener('pointerdown', function(ev){
                // original behavior: only allow drag when pressing near the thumb
                const rect = costRangeMin.getBoundingClientRect();
                const pct = (Number(costRangeMin.value) - Number(costRangeMin.min)) / (Number(costRangeMin.max) - Number(costRangeMin.min) || 1);
                const thumbX = rect.left + Math.max(0, Math.min(1, pct)) * rect.width;
                if (Math.abs(ev.clientX - thumbX) > 14) { ev.preventDefault(); ev.stopImmediatePropagation(); }
            });
            costRangeMax.addEventListener('pointerdown', function(ev){
                const rect = costRangeMax.getBoundingClientRect();
                const pct = (Number(costRangeMax.value) - Number(costRangeMax.min)) / (Number(costRangeMax.max) - Number(costRangeMax.min) || 1);
                const thumbX = rect.left + Math.max(0, Math.min(1, pct)) * rect.width;
                if (Math.abs(ev.clientX - thumbX) > 14) { ev.preventDefault(); ev.stopImmediatePropagation(); }
            });

            minCostInput.addEventListener('change', syncFromInputs);
            maxCostInput.addEventListener('change', syncFromInputs);
        }
    }

    // initial setup: build filters and render
    buildCategoryFilters();
    buildTypeFilters();
    // initialize the cost filter controls (sets min/max and wires events)
    initializeCostFilter();
    renderNoobPointsTable(dataSource);
    // Ensure list/table is sorted alphabetically by name on initial load
    try { sortTable(0); } catch (e) { /* ignore if sortTable unavailable */ }
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
    // expose sortTable so inline header buttons (onclick="sortTable(...)") work
    window.sortTable = sortTable;

    // apply initial sort according to the selector value
    applySortInternal();
});

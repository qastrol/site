
document.addEventListener('DOMContentLoaded', () => {

    if (typeof noobPointsTable === 'undefined' && typeof window.noobPointsTable === 'undefined') {
        console.warn('noobPointsTable not found');
        return;
    }


    const dataSource = (typeof noobPointsTable !== 'undefined') ? noobPointsTable : window.noobPointsTable;


    const listEl = document.getElementById('redeemList');
    const tbody = document.getElementById('redeemTable');
    const searchInput = document.getElementById('searchInput');
    const counter = document.getElementById('rowCount');

    const minCostInput = document.getElementById('minCostInput');
    const maxCostInput = document.getElementById('maxCostInput');
    const costRangeMin = document.getElementById('costRangeMin');
    const costRangeMax = document.getElementById('costRangeMax');

    function renderNoobPointsTable(items) {

        if (listEl) listEl.innerHTML = '';
        if (tbody) tbody.innerHTML = '';
        items.forEach(item => {
            const code = item.code || '';
            const nameText = item.name || '';
            const descHtml = item.description || '';
            const costText = item.cost != null ? String(item.cost) : '';


            if (listEl) {

                let cats = [];
                if (Array.isArray(item.categories)) cats = item.categories.map(String);
                else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
                else if (Array.isArray(item.category)) cats = item.category.map(String);
                else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);
                if (cats.length) cats.sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));


                let types = [];
                if (Array.isArray(item.types)) types = item.types.map(String);
                else if (item && item.types && typeof item.types === 'string') types = item.types.split(',').map(s => s.trim()).filter(Boolean);
                else if (Array.isArray(item.type)) types = item.type.map(String);
                else if (item && item.type && typeof item.type === 'string') types = item.type.split(',').map(s => s.trim()).filter(Boolean);
                if (types.length) types.sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));

                const li = document.createElement('li');
                li.className = 'item-listing__item';
                li.dataset.code = code; li.dataset.cost = costText; li.dataset.name = nameText;
                if (cats.length) li.dataset.categories = cats.join('|');
                if (types.length) li.dataset.types = types.join('|');

                const main = document.createElement('div'); main.className = 'item-listing__main';
                const left = document.createElement('div'); left.className = 'item-listing__left';
                const name = document.createElement('div'); name.className = 'item-name'; name.title = 'Klik voor voorbeeld'; name.style.cursor = 'pointer';
                const nameTextEl = document.createElement('span'); nameTextEl.className = 'item-name-text'; nameTextEl.textContent = nameText; name.appendChild(nameTextEl);
                const starEl = document.createElement('span'); starEl.className = 'fav-indicator';
                try {
                    const key = normalizeNameForFile(code || nameText || '');
                    const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('noobpoints', key);
                    starEl.textContent = isFav ? '★' : '';
                } catch (e) { starEl.textContent = ''; }
                name.appendChild(starEl);



                const codeInline = document.createElement('div'); codeInline.className = 'item-code-inline'; codeInline.textContent = code;

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
                const info = document.createElement('div'); info.className = 'item-langs';
                const infoParts = [];
                if (costPart) infoParts.push({ text: costPart, facet: 'cost' });
                if (typePart) infoParts.push({ text: typePart, facet: 'type' });
                if (catPart) infoParts.push({ text: catPart, facet: 'category' });

                info.innerHTML = '';
                infoParts.forEach((p, idx) => {
                    const isSplitFacet = (p.facet === 'category' || p.facet === 'type');
                    if (isSplitFacet && p.text && p.text.indexOf(',') !== -1) {
                        const parts = p.text.split(',').map(s => s.trim()).filter(Boolean);
                        parts.forEach((part, i2) => {
                            const span = document.createElement('span');
                            span.className = 'info-part';
                            span.textContent = part;
                            span.style.cursor = 'pointer';
                            span.dataset.facet = p.facet;
                            span.addEventListener('click', () => applyFilterFromInfoNoob(p.facet, part));
                            info.appendChild(span);
                            if (i2 < parts.length - 1) info.appendChild(document.createTextNode(', '));
                        });
                    } else {
                        const span = document.createElement('span');
                        span.className = 'info-part';
                        span.textContent = p.text;
                        span.style.cursor = 'pointer';
                        span.dataset.facet = p.facet;
                        span.addEventListener('click', () => applyFilterFromInfoNoob(p.facet, p.text));
                        info.appendChild(span);
                    }
                    if (idx < infoParts.length - 1) info.appendChild(document.createTextNode(' • '));
                });

                const desc = document.createElement('div'); desc.className = 'item-desc'; desc.innerHTML = descHtml;
                left.appendChild(name);

                left.appendChild(mobileCodeRow);
                if (info.textContent) left.appendChild(info);
                left.appendChild(desc);

                const meta = document.createElement('div'); meta.className = 'item-meta';
                const codeEl = document.createElement('div'); codeEl.className = 'item-code'; codeEl.textContent = code;
                const actions = document.createElement('div'); actions.className = 'item-actions';
                const copyBtn = document.createElement('button'); copyBtn.textContent = 'Kopieer'; copyBtn.className = 'copy-code'; copyBtn.type = 'button'; copyBtn.addEventListener('click', (ev) => copyToClipboard(code, ev.currentTarget));
                actions.appendChild(copyBtn);

                meta.appendChild(codeEl); meta.appendChild(actions);

                main.appendChild(left); main.appendChild(meta); li.appendChild(main);
                listEl.appendChild(li);
            }


            if (tbody) {
                const tr = document.createElement('tr');
                tr.dataset.code = code; tr.dataset.cost = costText; tr.dataset.name = nameText;
                const tdName = document.createElement('td'); tdName.title = 'Klik voor voorbeeld'; tdName.style.cursor = 'pointer';
                const tdNameSpan = document.createElement('span'); tdNameSpan.className = 'item-name-text'; tdNameSpan.textContent = nameText;
                const tdStar = document.createElement('span'); tdStar.className = 'fav-indicator';
                try { const k = normalizeNameForFile(code || nameText || ''); tdStar.textContent = (window.favorites && window.favorites.isFav && window.favorites.isFav('noobpoints', k)) ? '★' : ''; } catch (e) { tdStar.textContent = ''; }
                tdName.appendChild(tdNameSpan); tdName.appendChild(tdStar);
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
        try { updateFavIndicators(); } catch (e) { }

        try {
            const active = [];
            const s = document.getElementById('searchInput');
            if (s && s.value && s.value.trim() !== '') active.push({ type: 'search', label: 'Zoek: "' + s.value.trim() + '"', value: s.value.trim() });
            const cats = getSelectedCategories();
            if (cats && cats.length) {
                const catContainer = document.getElementById('categoryFilters');
                cats.forEach(v => {
                    const labEl = catContainer ? Array.from(catContainer.querySelectorAll('input')).find(i => i.value === v) : null;
                    const lab = labEl && labEl.nextElementSibling ? labEl.nextElementSibling.textContent : v;
                    active.push({ type: 'category', label: lab, value: v });
                });
            }
            const types = getSelectedTypes();
            if (types && types.length) {
                const typeContainer = document.getElementById('typeFilters');
                types.forEach(v => {
                    const labEl = typeContainer ? Array.from(typeContainer.querySelectorAll('input')).find(i => (i.value || '').trim().toLowerCase() === (v || '').trim().toLowerCase()) : null;
                    const lab = labEl && labEl.nextElementSibling ? labEl.nextElementSibling.textContent : v;
                    active.push({ type: 'type', label: lab, value: v });
                });
            }

            const min = (minCostInput && minCostInput.value) ? minCostInput.value.trim() : '';
            const max = (maxCostInput && maxCostInput.value) ? maxCostInput.value.trim() : '';
            if (min || max) {
                const label = 'Kosten: ' + (min || '-') + ' → ' + (max || '-');
                active.push({ type: 'cost', label: label, value: JSON.stringify({ min, max }) });
            }
            if (window.activeFilters && typeof window.activeFilters.render === 'function') window.activeFilters.render(document.getElementById('activeFiltersContainer'), active);
        } catch (e) { console.error('active filters render failed (noobpoints)', e); }
    }


    function normalizeNameForFile(text) {
        return (text || '').toString().replace(/[^a-z0-9]/gi, '').toLowerCase();
    }


    function updateFavIndicators() {
        try {
            const nodes = Array.from(document.querySelectorAll('.fav-indicator'));
            nodes.forEach(n => {
                try {
                    const li = n.closest && n.closest('li');
                    const nameSrc = (li && (li.dataset.name || (li.querySelector('.item-name-text') && li.querySelector('.item-name-text').textContent))) || '';
                    const code = (li && li.dataset.code) || '';
                    const key = normalizeNameForFile(code || nameSrc || '');
                    const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('noobpoints', key);
                    n.textContent = isFav ? '★' : '';
                } catch (e) { /* ignore per-node errors */ }
            });
        } catch (e) { /* ignore */ }
    }

    function createPreviewOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'preview-overlay';
        overlay.innerHTML = `
            <div class="preview-modal" role="dialog" aria-modal="true">
                <div class="preview-header">
                    <div class="preview-header-left">
                        <strong id="preview-title"></strong>
                        <div class="header-actions">
                            <button class="preview-fav btn-muted" title="Favoriet" aria-label="Favoriet">☆ <span class="btn-label">Favoriet</span></button>
                            <button class="preview-share btn-muted" title="Deel" aria-label="Deel">🔗 <span class="btn-label"></span></button>
                        </div>
                    </div>
                    <button class="preview-close" aria-label="Sluiten">✕</button>
                </div>
                <div class="preview-body" id="preview-body"></div>
                <div class="preview-controls">
                    <div class="preview-controls-top">
                        <button class="preview-copy">Kopieer redeemcode</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const popup = document.createElement('div'); popup.className = 'preview-popup'; popup.style.display = 'none'; document.body.appendChild(popup);
        overlay.querySelector('.preview-close').addEventListener('click', () => { try { popup.remove(); } catch (e) { }; overlay.remove(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { try { popup.remove(); } catch (e) { }; overlay.remove(); } });
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
                setTimeout(() => copyBtn.textContent = 'Kopieer redeemcode', 1200);
            });
        });


        try {
            const key = normalizeNameForFile(code || displayName || '');
            const favBtn = overlay.querySelector('.preview-fav');
            const shareBtn = overlay.querySelector('.preview-share');
            const page = 'noobpoints';
            const updateFavUi = () => { if (!favBtn) return; const isFav = window.favorites && window.favorites.isFav(page, key); favBtn.textContent = isFav ? '★' : '☆'; };
            const showPopup = (msg) => { try { if (!popup) return; popup.textContent = msg; popup.style.display = 'block'; popup.style.opacity = '1'; setTimeout(() => { popup.style.transition = 'opacity 0.25s ease'; popup.style.opacity = '0'; }, 1200); setTimeout(() => { try { popup.style.display = 'none'; } catch (e) { } }, 1450); } catch (e) { } };
            if (favBtn) { favBtn.addEventListener('click', () => { try { const added = window.favorites.toggle(page, key); updateFavUi(); showPopup(added ? 'Favoriet toegevoegd' : 'Favoriet verwijderd'); } catch (e) { } }); updateFavUi(); }
            if (shareBtn) { shareBtn.addEventListener('click', () => { try { const url = window.favorites ? window.favorites.makeShareUrl(page, key) : (window.location.href + `?focus=${page}:${key}`); navigator.clipboard.writeText(url).then(() => { showPopup('Link gekopieerd'); }).catch(() => { showPopup('Link gekopieerd'); }); } catch (e) { } }); }
        } catch (e) { }



        try {
            const matchesVideo = (f) => /\.(mp4|webm)(?:$|[?#])/i.test(f);
            const mappingFiles = (typeof window.getAlertsFiles === 'function') ? window.getAlertsFiles(name) : (window.alertsLinks && window.alertsLinks[name]) || [];
            if (mappingFiles && mappingFiles.length > 0) {

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

        }


        const iframes = (typeof window.noobpointsIframes !== 'undefined') ? window.noobpointsIframes : null;
        const mapped = iframes && (iframes[name] || iframes[code]);
        if (mapped) {
            body.innerHTML = mapped;
            return;
        }


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


    function computeFilterCountsNoob() {
        if (!Array.isArray(dataSource)) return;
        const searchLower = (searchInput?.value || '').toLowerCase().trim();
        const [minCost, maxCost] = getSelectedCostRange();


        const catContainer = document.getElementById('categoryFilters');
        if (catContainer) {
            const boxes = Array.from(catContainer.querySelectorAll('input[type="checkbox"]'));
            boxes.forEach(cb => {
                const selCats = [cb.value];
                const selTypes = getSelectedTypes();
                const count = dataSource.reduce((acc, item) => itemMatchesFilters(item, searchLower, selCats, selTypes, minCost, maxCost) ? acc + 1 : acc, 0);
                const parent = cb.parentElement || cb.closest('div');
                if (parent) {
                    const span = parent.querySelector('.filter-count');
                    if (span) span.textContent = ' (' + count + ')';
                }
            });
        }


        const typeContainer = document.getElementById('typeFilters');
        if (typeContainer) {
            const boxes = Array.from(typeContainer.querySelectorAll('input[type="checkbox"]'));
            boxes.forEach(cb => {
                const selCats = getSelectedCategories();
                const selTypes = [cb.value.trim().toLowerCase()];
                const count = dataSource.reduce((acc, item) => itemMatchesFilters(item, searchLower, selCats, selTypes, minCost, maxCost) ? acc + 1 : acc, 0);
                const parent = cb.parentElement || cb.closest('div');
                if (parent) {
                    const span = parent.querySelector('.filter-count');
                    if (span) span.textContent = ' (' + count + ')';
                }
            });
        }
    }


    function previewExists(folder, codeOrName, cb) {
        const name = normalizeNameForFile(codeOrName);

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

        }


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


            const iframes = (typeof window.noobpointsIframes !== 'undefined') ? window.noobpointsIframes : null;
            const mapped = iframes && (iframes[name] || iframes[codeOrName]);
            cb(Boolean(mapped));
        })();
    }


    function applyFilterFromInfoNoob(facet, text) {
        if (!text) return;
        const matchInContainer = (id) => {
            const container = document.getElementById(id);
            if (!container) return false;
            const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
            for (const input of inputs) {
                const lab = input.nextElementSibling ? input.nextElementSibling.textContent.trim() : '';
                const val = (input.value || '').toString().trim();
                if (val.toLowerCase() === text.toLowerCase() || lab.toLowerCase() === text.toLowerCase()) {
                    if (!input.checked) { input.checked = true; input.dispatchEvent(new Event('change')); }
                    return true;
                }
            }
            return false;
        };

        if (facet === 'cost') {

            const m = text.match(/(\d+)/);
            if (m) {
                const v = m[1];
                const mi = document.getElementById('minCostInput');
                if (mi) { mi.value = v; }
                refreshTable();
                computeFilterCountsNoob();
            }
            return;
        }

        if (facet === 'type') {
            try { const c = document.getElementById('typeFilters'); const d = c && c.closest && c.closest('details.filter-option'); if (d && !d.open) d.open = true; } catch (e) { }
            if (matchInContainer('typeFilters')) { refreshTable(); computeFilterCountsNoob(); return; }
        }
        if (facet === 'category') {
            try { const c = document.getElementById('categoryFilters'); const d = c && c.closest && c.closest('details.filter-option'); if (d && !d.open) d.open = true; } catch (e) { }
            if (matchInContainer('categoryFilters')) { refreshTable(); computeFilterCountsNoob(); return; }
        }


        try { const c1 = document.getElementById('categoryFilters'); const d1 = c1 && c1.closest && c1.closest('details.filter-option'); if (d1 && !d1.open) d1.open = true; } catch (e) { }
        try { const c2 = document.getElementById('typeFilters'); const d2 = c2 && c2.closest && c2.closest('details.filter-option'); if (d2 && !d2.open) d2.open = true; } catch (e) { }
        if (matchInContainer('categoryFilters') || matchInContainer('typeFilters')) { refreshTable(); computeFilterCountsNoob(); return; }
    }


    function attachPreviewHandlers() {

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


    function getSelectedCategories() {
        const container = document.getElementById('categoryFilters');
        if (!container) return [];
        const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        return inputs.filter(i => i.checked).map(i => i.value);
    }

    function getSelectedTypes() {
        const selected = [];
        const checkboxes = document.querySelectorAll('#typeFilters input[type="checkbox"]:checked');

        checkboxes.forEach(cb => selected.push(cb.value.trim().toLowerCase()));
        return selected;
    }


    function itemMatchesFilters(item, searchLower, selectedCats, selectedTypes, minCost, maxCost) {
        if (!item) return false;
        const name = (item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const code = (item.code || '').toLowerCase();
        const textMatch = (!searchLower) || name.indexOf(searchLower) !== -1 || desc.indexOf(searchLower) !== -1 || code.indexOf(searchLower) !== -1;


        let cats = [];
        if (Array.isArray(item.categories)) cats = item.categories.map(String);
        else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
        else if (Array.isArray(item.category)) cats = item.category.map(String);
        else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);

        if (!selectedCats || selectedCats.length === 0) {

            if (!textMatch) return false;
        } else {
            if (cats.length === 0) return false;
            const intersects = selectedCats.some(sc => cats.includes(sc));
            if (!intersects) return false;
        }


        if (selectedTypes && selectedTypes.length > 0) {

            let tarr = [];
            if (Array.isArray(item.types)) tarr = item.types.map(String);
            else if (item && item.types && typeof item.types === 'string') tarr = item.types.split(',').map(s => s.trim()).filter(Boolean);
            else if (Array.isArray(item.type)) tarr = item.type.map(String);
            else if (item && item.type && typeof item.type === 'string') tarr = item.type.split(',').map(s => s.trim()).filter(Boolean);

            tarr = tarr.map(t => (t || '').toString().trim().toLowerCase()).filter(Boolean);
            if (tarr.length === 0) return false;
            const intersectsTypes = selectedTypes.some(st => tarr.includes(st));
            if (!intersectsTypes) return false;
        }


        if (typeof minCost === 'number' && typeof maxCost === 'number') {
            const costVal = (item.cost == null) ? 0 : Number(item.cost);
            if (isNaN(costVal)) return false;
            if (costVal < minCost || costVal > maxCost) return false;
        }

        return true;
    }


    function getSelectedCostRange() {



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


        const rawMin = (minCostInput && typeof minCostInput.value === 'string') ? minCostInput.value.trim() : '';
        const rawMax = (maxCostInput && typeof maxCostInput.value === 'string') ? maxCostInput.value.trim() : '';
        let mn = rawMin === '' ? globalMin : Number(rawMin);
        let mx = rawMax === '' ? globalMax : Number(rawMax);
        if (!isFinite(mn)) mn = globalMin;
        if (!isFinite(mx)) mx = globalMax;


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
        try { console.debug('refreshTable', { searchLower, selectedCats, selectedTypes, minCost, maxCost }); } catch (e) { }
        const filtered = dataSource.filter(item => itemMatchesFilters(item, searchLower, selectedCats, selectedTypes, minCost, maxCost));
        try { console.debug('filtered count', filtered.length); } catch (e) { }
        renderNoobPointsTable(filtered);
    }

    function showCopyToast(message) {

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

        const doFallback = (txt) => {
            try {
                const ta = document.createElement('textarea');
                ta.value = txt;

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

                showCopyToast(`${text} gekopieerd`);
            } else if (sourceBtn) {

                const orig = sourceBtn.textContent;
                sourceBtn.textContent = 'Gekopieerd ✓';
                sourceBtn.disabled = true;
                setTimeout(() => { sourceBtn.textContent = orig; sourceBtn.disabled = false; }, 1200);
            } else {

                console.log('Copied', text);
            }
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).then(() => {
                afterCopySuccess();
            }).catch(err => {

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
        
        // Toon/verberg "geen resultaten" bericht
        const noResultsMsg = document.getElementById('noResultsMessage');
        if (noResultsMsg) {
            noResultsMsg.style.display = total === 0 ? 'block' : 'none';
        }
    }

    function searchTable() {
        const q = (searchInput?.value || '').toLowerCase().trim();
        if (!q) { renderNoobPointsTable(dataSource); return; }
        const filtered = dataSource.filter(item => [item.name, item.code, item.description].join(' ').toLowerCase().includes(q));
        renderNoobPointsTable(filtered);
    }

    function sortTable(columnIndex, numeric = false) {

        const list = listEl;
        if (list) {
            const items = Array.from(list.querySelectorAll('li'));
            if (items.length === 0) return;


            if (columnIndex === 3) {

                items.sort((a, b) => ((Number(a.dataset.cost) || 0) - (Number(b.dataset.cost) || 0)));
            } else if (columnIndex === 4) {

                items.sort((a, b) => {
                    const at = (a.dataset.types || '').toLowerCase();
                    const bt = (b.dataset.types || '').toLowerCase();
                    return at.localeCompare(bt, 'nl', { sensitivity: 'base' });
                });
            } else if (columnIndex === 5) {

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

            const order = list.dataset.sortOrder === 'asc' ? -1 : 1;
            list.dataset.sortOrder = list.dataset.sortOrder === 'asc' ? 'desc' : 'asc';
            if (order === -1) items.reverse();
            items.forEach(i => list.appendChild(i));
            return;
        }


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


    document.getElementById('searchBtn')?.addEventListener('click', searchTable);
    searchInput?.addEventListener('input', () => { refreshTable(); });


    document.querySelectorAll('#redeemTableHeader th.sortable').forEach((th, idx) => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {

            const columnIndex = Number(th.dataset.col) || idx;
            const numeric = th.dataset.numeric === 'true';
            sortTable(columnIndex, numeric);
        });
    });


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

        const cats = Array.from(categories).sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
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
            input.addEventListener('change', () => { refreshTable(); computeFilterCountsNoob(); });
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

        const arr = Array.from(types).sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
        container.innerHTML = '';
        if (arr.length === 0) { container.innerHTML = '<small>Geen types gevonden.</small>'; return; }

        arr.forEach(t => {
            const id = 'noobtype-' + t.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex'; wrapper.style.gap = '6px'; wrapper.style.alignItems = 'center'; wrapper.style.marginBottom = '4px';
            const input = document.createElement('input'); input.type = 'checkbox'; input.id = id; input.value = t;

            input.addEventListener('change', (ev) => {
                try { console.debug('type checkbox changed', { value: input.value, checked: input.checked }); } catch (e) { }
                refreshTable();
                computeFilterCountsNoob();
            });
            const label = document.createElement('label'); label.htmlFor = id; label.style.fontWeight = 'normal'; label.textContent = t;
            const countSpan = document.createElement('span');
            countSpan.className = 'filter-count';
            countSpan.style.marginLeft = '6px';
            countSpan.style.color = '#666';
            countSpan.textContent = '';
            wrapper.appendChild(input); wrapper.appendChild(label); wrapper.appendChild(countSpan); container.appendChild(wrapper);
        });
    }


    function initializeCostFilter() {
        if (!Array.isArray(dataSource)) return;

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


        if (!minCostInput || !maxCostInput) return;


        minCostInput.placeholder = String(min);
        maxCostInput.placeholder = String(max);

        minCostInput.value = '';
        maxCostInput.value = '';

        try { minCostInput.min = String(min); minCostInput.max = String(max); } catch (e) { }
        try { maxCostInput.min = String(min); maxCostInput.max = String(max); } catch (e) { }



        minCostInput.addEventListener('input', () => { refreshTable(); });
        maxCostInput.addEventListener('input', () => { refreshTable(); });




        if (costRangeMin && costRangeMax) {
            const step = 10;
            costRangeMin.min = String(min);
            costRangeMin.max = String(max);
            costRangeMin.step = String(step);
            costRangeMax.min = String(min);
            costRangeMax.max = String(max);
            costRangeMax.step = String(step);


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
            costRangeMin.addEventListener('pointerdown', function (ev) {

                const rect = costRangeMin.getBoundingClientRect();
                const pct = (Number(costRangeMin.value) - Number(costRangeMin.min)) / (Number(costRangeMin.max) - Number(costRangeMin.min) || 1);
                const thumbX = rect.left + Math.max(0, Math.min(1, pct)) * rect.width;
                if (Math.abs(ev.clientX - thumbX) > 14) { ev.preventDefault(); ev.stopImmediatePropagation(); }
            });
            costRangeMax.addEventListener('pointerdown', function (ev) {
                const rect = costRangeMax.getBoundingClientRect();
                const pct = (Number(costRangeMax.value) - Number(costRangeMax.min)) / (Number(costRangeMax.max) - Number(costRangeMax.min) || 1);
                const thumbX = rect.left + Math.max(0, Math.min(1, pct)) * rect.width;
                if (Math.abs(ev.clientX - thumbX) > 14) { ev.preventDefault(); ev.stopImmediatePropagation(); }
            });

            minCostInput.addEventListener('change', syncFromInputs);
            maxCostInput.addEventListener('change', syncFromInputs);
        }
    }


    buildCategoryFilters();
    buildTypeFilters();

    initializeCostFilter();
    renderNoobPointsTable(dataSource);

    computeFilterCountsNoob();

    try { sortTable(0); } catch (e) { /* ignore if sortTable unavailable */ }

    try { localStorage.setItem('redeemsCount', String(dataSource.length)); } catch (e) { /* noop */ }


    function applySortInternal() {
        const sel = document.getElementById('sortSelect');
        if (!sel) return;
        const [colStr, dir] = (sel.value || '0:asc').split(':');
        const col = parseInt(colStr, 10);
        const th = document.querySelector(`#redeemTableHeader th[data-col="${col}"]`);
        const numeric = th && th.dataset.numeric === 'true';
        const tbodyEl = document.getElementById('redeemTable');
        if (!tbodyEl) return;


        tbodyEl.dataset.sortOrder = (dir === 'asc') ? 'desc' : 'asc';
        sortTable(col, numeric);
    }


    function scrollAndHighlightByKey(key) {
        try {

            const listRows = Array.from(document.querySelectorAll('#redeemList li'));
            for (const r of listRows) {
                const name = (r.dataset.name || (r.querySelector('.item-name-text') && r.querySelector('.item-name-text').textContent) || '').toString();
                const code = (r.dataset.code || '').toString();
                if (normalizeNameForFile(code || name) === key) {
                    r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const old = r.style.transition;
                    r.style.transition = 'background-color 0.3s ease';
                    const prev = r.style.backgroundColor;
                    r.style.backgroundColor = '#fff79a';
                    setTimeout(() => { r.style.backgroundColor = prev || ''; r.style.transition = old || ''; }, 2500);
                    return true;
                }
            }


            const trs = Array.from(document.querySelectorAll('#redeemTable tr'));
            for (const tr of trs) {
                const name = (tr.dataset.name || '').toString();
                const code = (tr.dataset.code || '').toString();
                if (normalizeNameForFile(code || name) === key) {
                    tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const old = tr.style.transition;
                    tr.style.transition = 'background-color 0.3s ease';
                    const prev = tr.style.backgroundColor;
                    tr.style.backgroundColor = '#fff79a';
                    setTimeout(() => { tr.style.backgroundColor = prev || ''; tr.style.transition = old || ''; }, 2500);
                    return true;
                }
            }
        } catch (e) { console.error('scrollAndHighlightByKey (noobpoints) failed', e); }
        return false;
    }


    (function handleFocusFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search);
            const focus = params.get('focus') || location.hash.replace(/^#/, '') || '';
            if (!focus) return;
            const [page, key] = focus.split(':');
            if (page === 'noobpoints' && key) {
                setTimeout(() => { try { scrollAndHighlightByKey(key); } catch (e) { } }, 300);
            }
        } catch (e) { /* ignore */ }
    })();


    window.applySort = applySortInternal;

    window.sortTable = sortTable;


    try {
        const favEl = document.getElementById('filterFavorites');
        if (favEl) favEl.addEventListener('change', () => { refreshTable(); computeFilterCountsNoob(); });
    } catch (e) { }


    function updateFavoritesFilterVisibility() {
        try {
            const favWrap = document.getElementById('favoritesFilter');
            if (!favWrap) return;
            const details = favWrap.closest && favWrap.closest('details.filter-option');
            const countSpan = favWrap.querySelector && favWrap.querySelector('.filter-count');
            const favCount = window.favorites ? window.favorites.count('noobpoints') : 0;
            const has = favCount > 0;
            if (details) details.style.display = has ? '' : 'none';
            if (countSpan) countSpan.textContent = has ? ' (' + favCount + ')' : '';
            const cb = document.getElementById('filterFavorites'); if (!has && cb) cb.checked = false;
        } catch (e) { /* ignore */ }
    }
    try { updateFavoritesFilterVisibility(); } catch (e) { }
    window.addEventListener('favorites:changed', (ev) => {
        try {
            const p = ev && ev.detail && ev.detail.page;
            if (!p || p === 'noobpoints') {
                updateFavoritesFilterVisibility();
                try { updateFavIndicators(); } catch (e) { }
            }
        } catch (e) { }
    });



    window.addEventListener('activeFilter:remove', (ev) => {
        try {
            const { type, value } = ev.detail || {};
            if (!type) return;
            if (type === 'search') { if (searchInput) searchInput.value = ''; }
            else if (type === 'category') { const c = document.getElementById('categoryFilters'); if (c) { const input = Array.from(c.querySelectorAll('input')).find(i => i.value === value); if (input) input.checked = false; } }
            else if (type === 'type') { const t = document.getElementById('typeFilters'); if (t) { const input = Array.from(t.querySelectorAll('input')).find(i => (i.value || '').trim().toLowerCase() === (value || '').trim().toLowerCase()); if (input) input.checked = false; } }
            else if (type === 'cost') { try { const obj = JSON.parse(value); if (minCostInput) minCostInput.value = ''; if (maxCostInput) maxCostInput.value = ''; } catch (e) { if (minCostInput) minCostInput.value = ''; if (maxCostInput) maxCostInput.value = ''; } }
            refreshTable();
        } catch (e) { console.error('failed to handle activeFilter:remove (noobpoints)', e); }
    });


    window.addEventListener('activeFilter:clear', () => {
        try {
            if (searchInput) searchInput.value = '';
            if (minCostInput) minCostInput.value = '';
            if (maxCostInput) maxCostInput.value = '';
            ['categoryFilters', 'typeFilters'].forEach(id => {
                const c = document.getElementById(id);
                if (!c) return;
                const inputs = Array.from(c.querySelectorAll('input[type="checkbox"]'));
                inputs.forEach(i => { if (i.checked) { i.checked = false; i.dispatchEvent(new Event('change')); } });
            });
            try { const fav = document.getElementById('filterFavorites'); if (fav) fav.checked = false; } catch (e) { }
            refreshTable();
            computeFilterCountsNoob();
        } catch (e) { console.error('failed to clear filters (noobpoints)', e); }
    });
    applySortInternal();
});

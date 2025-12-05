
function copyToClipboard(button) {
    const li = button.closest('li');
    if (!li) return;

    const codeFromData = li.dataset.code || '';
    const inlineEl = li.querySelector('.item-code-inline');
    const codeInline = inlineEl ? inlineEl.innerText.trim() : '';
    const code = codeFromData || codeInline || (li.dataset.name || '').replace(/[^a-z0-9]/gi, '');
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
        alert(`Code '${code}' gekopieerd naar het klembord!`);
    }).catch(err => {
        console.error('Kopiëren mislukt', err);
    });
}


function updateCounter() {
    const items = Array.from(document.querySelectorAll('#soundEffectsList li'));
    const visibleRows = items.filter(r => r.style.display !== 'none').length;
    document.getElementById('counter').textContent = visibleRows;
}


let sortDirection = [true, true, true, true, true];


function sortTable(n) {
    const list = document.getElementById('soundEffectsList');
    if (!list) return;
    const items = Array.from(list.children);
    if (!items.length) return;


    if (n === 1) {
        items.sort((a, b) => {
            const ac = (a.dataset.categories || '').toLowerCase();
            const bc = (b.dataset.categories || '').toLowerCase();
            return ac.localeCompare(bc, 'nl', { sensitivity: 'base' });
        });
    } else if (n === 3) {

        items.sort((a, b) => {
            const al = parseInt(a.dataset.length || '0', 10) || 0;
            const bl = parseInt(b.dataset.length || '0', 10) || 0;
            return al - bl;
        });
    } else if (n === 4) {

        items.sort((a, b) => {
            const ac = (a.dataset.code || (a.querySelector('.item-code') && a.querySelector('.item-code').innerText) || '').toString().toLowerCase();
            const bc = (b.dataset.code || (b.querySelector('.item-code') && b.querySelector('.item-code').innerText) || '').toString().toLowerCase();
            return ac.localeCompare(bc, 'nl', { sensitivity: 'base' });
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


function itemMatchesFilters(item, searchLower, selectedCats) {
    if (!item) return false;
    const name = (item.name || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const textMatch = (!searchLower) || name.indexOf(searchLower) !== -1 || desc.indexOf(searchLower) !== -1;

    let cats = [];
    if (Array.isArray(item.categories)) cats = item.categories.map(String);
    else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
    else if (Array.isArray(item.category)) cats = item.category.map(String);
    else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);


    if (!selectedCats || selectedCats.length === 0) return textMatch;


    if (cats.length === 0) return false;


    const intersects = selectedCats.some(sc => cats.includes(sc));
    if (!textMatch || !intersects) return false;


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

    let filtered = soundeffectsTable.filter(item => itemMatchesFilters(item, searchLower, selectedCats));

    try {
        const favCb = document.getElementById('filterFavorites');
        if (favCb && favCb.checked && window.favorites) {
            filtered = filtered.filter(it => {

                const key = normalizeNameForFile((it && it.code) ? it.code : (it && it.name) ? it.name : '');
                return window.favorites.isFav('soundeffects', key);
            });
        }
    } catch (e) { }
    list.innerHTML = '';
    filtered.forEach(item => {
        const li = document.createElement('li');
        li.className = 'item-listing__item';

        if (item && item.name) li.dataset.name = item.name;
        if (item && item.code) li.dataset.code = item.code;


        let cats = [];
        if (Array.isArray(item.categories)) cats = item.categories.map(String);
        else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
        else if (Array.isArray(item.category)) cats = item.category.map(String);
        else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);
        if (cats.length) {
            cats.sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
            li.dataset.categories = cats.join('|');
        }


        const lenMs = (item && (typeof item.length !== 'undefined')) ? (parseInt(item.length, 10) || 0) : 0;
        if (lenMs > 0) li.dataset.length = String(lenMs);

        const main = document.createElement('div'); main.className = 'item-listing__main';
        const left = document.createElement('div'); left.className = 'item-listing__left';
        const name = document.createElement('div'); name.className = 'item-name'; name.title = 'Klik voor voorbeeld';
        const nameText = document.createElement('span'); nameText.className = 'item-name-text'; nameText.textContent = item.name || ''; name.appendChild(nameText);
        const starEl = document.createElement('span'); starEl.className = 'fav-indicator';
        try {
            const key = normalizeNameForFile(item.code || item.name || '');
            const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('soundeffects', key);
            starEl.textContent = isFav ? '★' : '';
        } catch (e) { starEl.textContent = ''; }
        name.appendChild(starEl);


        const info = document.createElement('div'); info.className = 'item-langs';

        info.innerHTML = '';

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

        const codeInline = document.createElement('div'); codeInline.className = 'item-code-inline'; codeInline.textContent = item.code || '';
        left.appendChild(name);

        const mobileCodeRow = document.createElement('div'); mobileCodeRow.className = 'mobile-code-row';
        const mobileCodeLeft = document.createElement('div'); mobileCodeLeft.className = 'mobile-code-left';
        const mobileLabel = document.createElement('span'); mobileLabel.className = 'mobile-code-label'; mobileLabel.textContent = 'Geluidsnaam:';
        mobileCodeLeft.appendChild(mobileLabel);
        mobileCodeLeft.appendChild(codeInline);
        const mobileCopyBtn = document.createElement('button'); mobileCopyBtn.type = 'button'; mobileCopyBtn.className = 'mobile-copy-code'; mobileCopyBtn.textContent = 'Kopieer';
        mobileCopyBtn.addEventListener('click', (ev) => copyToClipboard(ev.currentTarget));
        mobileCodeRow.appendChild(mobileCodeLeft);
        mobileCodeRow.appendChild(mobileCopyBtn);

        left.appendChild(mobileCodeRow);
        if (info.textContent) left.appendChild(info);
        left.appendChild(desc);

        const meta = document.createElement('div'); meta.className = 'item-meta';

        const codeEl = document.createElement('div'); codeEl.className = 'item-code'; codeEl.textContent = item.code || '';
        const actions = document.createElement('div'); actions.className = 'item-actions';
        const btn = document.createElement('button'); btn.className = 'copy-code'; btn.textContent = 'Kopieer geluidsnaam'; btn.addEventListener('click', function () { copyToClipboard(this); });
        actions.appendChild(btn);
        meta.appendChild(codeEl);

        try { codeEl.style.cursor = 'pointer'; codeEl.title = 'Klik om te sorteren op geluidsnaam'; codeEl.addEventListener('click', () => sortTable(4)); } catch (e) { }
        meta.appendChild(actions);

        main.appendChild(left); main.appendChild(meta); li.appendChild(main);
        list.appendChild(li);
    });

    localStorage.setItem('soundEffectCount', soundeffectsTable.length);
    updateCounter();
    attachPreviewHandlers();

    computeFilterCountsSound();

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


function getSelectedCategories() {
    const container = document.getElementById('categoryFilters');
    if (!container) return [];
    const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    return inputs.filter(i => i.checked).map(i => i.value);
}


function applyFilterFromInfoSfx(facet, text) {
    if (!text) return;
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    try { const details = container.closest && container.closest('details.filter-option'); if (details && !details.open) details.open = true; } catch (e) { }
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


function buildCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;
    if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;

    const categories = new Set();
    soundeffectsTable.forEach(item => {
        if (!item) return;

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

    const cats = Array.from(categories).sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
    container.innerHTML = '';
    if (cats.length === 0) {
        container.innerHTML = '<small>Geen categorieën gevonden.</small>';
        return;
    }

    cats.forEach(cat => {
        const id = 'cat-' + cat.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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


function computeFilterCountsSound() {
    if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;
    const input = document.getElementById('searchInput');
    const searchLower = input ? (input.value || '').toLowerCase() : '';
    const container = document.getElementById('categoryFilters');
    if (!container) return;
    const boxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    boxes.forEach(cb => {
        const cat = cb.value;

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


function updateFavIndicators() {
    try {
        const nodes = Array.from(document.querySelectorAll('.fav-indicator'));
        nodes.forEach(n => {
            try {
                const li = n.closest && n.closest('li');
                const nameSrc = (li && (li.dataset.code || li.dataset.name || (li.querySelector('.item-name-text') && li.querySelector('.item-name-text').textContent))) || '';
                const key = normalizeNameForFile(nameSrc || '');
                const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('soundeffects', key);
                n.textContent = isFav ? '★' : '';
            } catch (e) { /* ignore per-node errors */ }
        });
    } catch (e) { /* ignore */ }
}


function renderSoundEffectsTable() {
    const list = document.getElementById('soundEffectsList');
    if (!list) return;
    list.innerHTML = '';
    if (typeof soundeffectsTable === 'undefined' || !Array.isArray(soundeffectsTable)) return;

    soundeffectsTable.forEach(item => {
        const li = document.createElement('li');
        li.className = 'item-listing__item';

        let cats = [];
        if (Array.isArray(item.categories)) cats = item.categories.map(String);
        else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
        else if (Array.isArray(item.category)) cats = item.category.map(String);
        else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);
        if (cats.length) {
            cats.sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
            li.dataset.categories = cats.join('|');
        }


        const lenMs = (item && (typeof item.length !== 'undefined')) ? (parseInt(item.length, 10) || 0) : 0;
        if (lenMs > 0) li.dataset.length = String(lenMs);

        const main = document.createElement('div'); main.className = 'item-listing__main';
        const left = document.createElement('div'); left.className = 'item-listing__left';
        const name = document.createElement('div'); name.className = 'item-name'; name.title = 'Klik voor voorbeeld';
        const nameText = document.createElement('span'); nameText.className = 'item-name-text'; nameText.textContent = item.name || ''; name.appendChild(nameText);
        const starEl = document.createElement('span'); starEl.className = 'fav-indicator';
        try {
            const key = normalizeNameForFile(item.code || item.name || '');
            const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('soundeffects', key);
            starEl.textContent = isFav ? '★' : '';
        } catch (e) { starEl.textContent = ''; }
        name.appendChild(starEl);
        const info = document.createElement('div'); info.className = 'item-langs';
        info.innerHTML = '';

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
        left.appendChild(name);
        const codeInline = document.createElement('div'); codeInline.className = 'item-code-inline'; codeInline.textContent = item.code || '';

        const mobileCodeRow2 = document.createElement('div'); mobileCodeRow2.className = 'mobile-code-row';
        const mobileCodeLeft2 = document.createElement('div'); mobileCodeLeft2.className = 'mobile-code-left';
        const mobileLabel2 = document.createElement('span'); mobileLabel2.className = 'mobile-code-label'; mobileLabel2.textContent = 'Geluidsnaam:';
        mobileCodeLeft2.appendChild(mobileLabel2);
        mobileCodeLeft2.appendChild(codeInline);
        const mobileCopyBtn2 = document.createElement('button'); mobileCopyBtn2.type = 'button'; mobileCopyBtn2.className = 'mobile-copy-code'; mobileCopyBtn2.textContent = 'Kopieer';
        mobileCopyBtn2.addEventListener('click', (ev) => copyToClipboard(ev.currentTarget));
        mobileCodeRow2.appendChild(mobileCodeLeft2);
        mobileCodeRow2.appendChild(mobileCopyBtn2);
        left.appendChild(mobileCodeRow2);
        if (info.textContent) left.appendChild(info);
        left.appendChild(desc);
        const meta = document.createElement('div'); meta.className = 'item-meta';
        const codeEl = document.createElement('div'); codeEl.className = 'item-code'; codeEl.textContent = item.code || '';
        const actions = document.createElement('div'); actions.className = 'item-actions';
        const btn = document.createElement('button'); btn.className = 'copy-code'; btn.textContent = 'Kopieer'; btn.addEventListener('click', function () { copyToClipboard(this); });
        actions.appendChild(btn);
        meta.appendChild(codeEl);
        meta.appendChild(actions);
        main.appendChild(left); main.appendChild(meta); li.appendChild(main);

        if (item && item.name) li.dataset.name = item.name;
        if (item && item.code) li.dataset.code = item.code;
        list.appendChild(li);
    });

    try { updateFavIndicators(); } catch (e) { }

    try { updateFavIndicators(); } catch (e) { }


    localStorage.setItem('soundEffectCount', soundeffectsTable.length);
}

document.addEventListener("DOMContentLoaded", function () {
    renderSoundEffectsTable();
    buildCategoryFilters();


    try {
        const favEl = document.getElementById('filterFavorites');
        if (favEl) favEl.addEventListener('change', () => { refreshTable(); computeFilterCountsSound(); });
    } catch (e) { }


    function updateFavoritesFilterVisibility() {
        try {
            const favWrap = document.getElementById('favoritesFilter');
            if (!favWrap) return;
            const details = favWrap.closest && favWrap.closest('details.filter-option');
            const countSpan = favWrap.querySelector && favWrap.querySelector('.filter-count');
            const favCount = window.favorites ? window.favorites.count('soundeffects') : 0;
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
            if (!p || p === 'soundeffects') {
                updateFavoritesFilterVisibility();
                try { updateFavIndicators(); } catch (e) { }
            }
        } catch (e) { }
    });

    computeFilterCountsSound();

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

    try {
        const params = new URLSearchParams(window.location.search);
        const focus = params.get('focus') || location.hash.replace(/^#/, '') || '';
        if (focus) {
            const [page, key] = focus.split(':');
            if (page === 'soundeffects' && key) {
                setTimeout(() => {
                    try {
                        const rows = Array.from(document.querySelectorAll('#soundEffectsList li'));
                        for (const r of rows) {
                            const name = (r.dataset.name || '').toString();
                            if (normalizeNameForFile(name) === key) {
                                r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                r.style.transition = 'background-color 0.3s ease';
                                const old = r.style.backgroundColor;
                                r.style.backgroundColor = '#fff79a';
                                setTimeout(() => { r.style.backgroundColor = old || ''; }, 2500);
                                break;
                            }
                        }
                    } catch (e) { }
                }, 300);
            }
        }
    } catch (e) { }

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

            refreshTable();
        } catch (e) { console.error('failed to handle activeFilter:remove (sfx)', e); }
    });


    window.addEventListener('activeFilter:clear', () => {
        try {
            const s = document.getElementById('searchInput'); if (s) s.value = '';
            const minL = document.getElementById('minLength'); if (minL) minL.value = '';
            const maxL = document.getElementById('maxLength'); if (maxL) maxL.value = '';
            const container = document.getElementById('categoryFilters');
            const fav = document.getElementById('filterFavorites'); if (fav) { fav.checked = false; }
            if (container) {
                const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
                inputs.forEach(i => { if (i.checked) { i.checked = false; i.dispatchEvent(new Event('change')); } });
            }
            refreshTable(); computeFilterCountsSound();
        } catch (e) { console.error('failed to clear filters (sfx)', e); }
    });
});


function applySort() {
    const sel = document.getElementById('sortSelect');
    if (!sel) return;
    const [colStr, dir] = sel.value.split(':');
    const col = parseInt(colStr, 10);


    sortDirection[col] = (dir === 'asc');
    sortTable(col);
}



document.addEventListener('DOMContentLoaded', (event) => {
    const modeToggle = document.getElementById('mode-toggle');
    const body = document.body;


    if (localStorage.getItem('dark-mode') === 'true') {
        body.classList.add('dark-mode');
    }

    modeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');

        localStorage.setItem('dark-mode', body.classList.contains('dark-mode'));
    });
});


function normalizeNameForFile(text) {
    return (text || '').toString().replace(/[^a-z0-9]/gi, '').toLowerCase();
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
                        <button class="preview-copy">Kopieer geluidsnaam</button>
                    </div>
                </div>
            </div>`;
    document.body.appendChild(overlay);

    const popup = document.createElement('div'); popup.className = 'preview-popup'; popup.style.display = 'none'; document.body.appendChild(popup);
    overlay._previewPopup = popup;
    overlay.querySelector('.preview-close').addEventListener('click', () => { popup.remove(); overlay.remove(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { popup.remove(); overlay.remove(); } });
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
            setTimeout(() => copyBtn.textContent = 'Kopieer geluidsnaam', 1200);
        });
    });

    const base = `${folder}/${name}`;
    const popup = overlay._previewPopup;


    try {
        const key = normalizeNameForFile(displayName);
        if (window && window.soundeffectsLinks && Array.isArray(window.soundeffectsLinks[key]) && window.soundeffectsLinks[key].length > 0) {
            body.innerHTML = '';
            const audioPath = window.soundeffectsLinks[key][0];
            const a = document.createElement('audio');
            a.controls = true; a.preload = 'metadata';
            a.src = audioPath;
            body.appendChild(a);

            try {
                const favBtn = overlay.querySelector('.preview-fav');
                const shareBtn = overlay.querySelector('.preview-share');
                const page = 'soundeffects';
                const updateFavUi = () => { if (!favBtn) return; const isFav = window.favorites && window.favorites.isFav(page, key); favBtn.textContent = isFav ? '★' : '☆'; };

                const showPopup = (msg) => { try { if (!popup) return; popup.textContent = msg; popup.style.display = 'block'; popup.style.opacity = '1'; setTimeout(() => { popup.style.transition = 'opacity 0.25s ease'; popup.style.opacity = '0'; }, 1200); setTimeout(() => { try { popup.style.display = 'none'; } catch (e) { } }, 1450); } catch (e) { } };
                if (favBtn) { favBtn.addEventListener('click', () => { try { const added = window.favorites.toggle(page, key); updateFavUi(); showPopup(added ? 'Favoriet toegevoegd' : 'Favoriet verwijderd'); } catch (e) { } }); updateFavUi(); }
                if (shareBtn) { shareBtn.addEventListener('click', () => { try { const url = window.favorites ? window.favorites.makeShareUrl(page, key) : (window.location.href + `?focus=${page}:${key}`); navigator.clipboard.writeText(url).then(() => { showPopup('Link gekopieerd'); }).catch(() => { showPopup('Link gekopieerd'); }); } catch (e) { } }); }
            } catch (e) { }
            return;
        }
    } catch (e) {

    }


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


    try {
        const key = normalizeNameForFile(displayName);
        const favBtn = overlay.querySelector('.preview-fav');
        const shareBtn = overlay.querySelector('.preview-share');
        const page = 'soundeffects';
        const updateFavUi = () => { if (!favBtn) return; const isFav = window.favorites && window.favorites.isFav(page, key); favBtn.textContent = isFav ? '★' : '☆'; };

        const showPopup = (msg) => { try { if (!popup) return; popup.textContent = msg; popup.style.display = 'block'; popup.style.opacity = '1'; setTimeout(() => { popup.style.transition = 'opacity 0.25s ease'; popup.style.opacity = '0'; }, 1200); setTimeout(() => { try { popup.style.display = 'none'; } catch (e) { } }, 1450); } catch (e) { } };
        if (favBtn) { favBtn.addEventListener('click', () => { try { const added = window.favorites.toggle(page, key); updateFavUi(); showPopup(added ? 'Favoriet toegevoegd' : 'Favoriet verwijderd'); } catch (e) { } }); updateFavUi(); }
        if (shareBtn) { shareBtn.addEventListener('click', () => { try { const url = window.favorites ? window.favorites.makeShareUrl(page, key) : (window.location.href + `?focus=${page}:${key}`); navigator.clipboard.writeText(url).then(() => { showPopup('Link gekopieerd'); }).catch(() => { showPopup('Link gekopieerd'); }); } catch (e) { } }); }
    } catch (e) { }
}


function previewExists(folder, displayName, cb) {



    try {
        const key = normalizeNameForFile(displayName);
        if (window && window.soundeffectsLinks && Array.isArray(window.soundeffectsLinks[key])) {
            cb(window.soundeffectsLinks[key].length > 0);
            return;
        }
    } catch (e) {

    }


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


function attachPreviewHandlers() {
    const rows = document.querySelectorAll('#soundEffectsList li');
    rows.forEach(r => {
        const first = r.querySelector('.item-name');
        if (!first) return;
        const li = first.closest && first.closest('li');

        const display = (li && li.dataset.code) ? (li.dataset.code) : first.innerText.trim();
        first.title = 'Klik voor voorbeeld';

        try {
            const key = normalizeNameForFile(display);
            if (window && window.soundeffectsLinks && Array.isArray(window.soundeffectsLinks[key]) && window.soundeffectsLinks[key].length > 0) {

                first.classList.add('has-preview');
                first.addEventListener('click', () => showPreview('soundeffects', display));
                return;
            }
        } catch (e) {

        }


        first.addEventListener('click', () => showPreview('soundeffects', display));
        previewExists('soundeffects', display, (exists) => {
            if (exists) first.classList.add('has-preview');
        });
    });



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

        }
    });
}
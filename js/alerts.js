
function copyToClipboard(button) {
    const li = button.closest && button.closest('li');
    const codeEl = li ? li.querySelector('.item-code') : null;
    const effectName = codeEl ? codeEl.innerText.trim() : '';
    if (!effectName) return;

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

    const onSuccess = () => {
        try { showCopyToast(effectName + ' gekopieerd!'); } catch (e) { }
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(effectName).then(() => { onSuccess(); }).catch(err => {
            const ok = doFallback(effectName);
            if (ok) onSuccess(); else console.error('Kopiëren mislukt', err);
        });
    } else {
        const ok = doFallback(effectName);
        if (ok) onSuccess(); else console.warn('clipboard niet ondersteund');
    }
}

function showCopyToast(msg) {
    try {

        const prev = document.getElementById('alertsCopyToast'); if (prev) prev.remove();
        const t = document.createElement('div');
        t.id = 'alertsCopyToast';
        t.textContent = msg;
        t.style.position = 'fixed';
        t.style.left = '50%';
        t.style.bottom = '16px';
        t.style.transform = 'translateX(-50%)';
        t.style.background = 'rgba(0,0,0,0.85)';
        t.style.color = '#fff';
        t.style.padding = '8px 12px';
        t.style.borderRadius = '6px';
        t.style.zIndex = 4000;
        t.style.fontSize = '0.95rem';
        t.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
        document.body.appendChild(t);
        setTimeout(() => { try { t.style.transition = 'opacity 0.25s'; t.style.opacity = '0'; } catch (e) { } }, 1200);
        setTimeout(() => { try { t.remove(); } catch (e) { } }, 1500);
    } catch (e) { /* ignore */ }
}


let sortDirection = {};

function sortTable(n, numeric = false) {
    const list = document.getElementById('alertList');
    if (!list) return;
    const items = Array.from(list.querySelectorAll('li'));
    if (items.length === 0) return;


    const colMap = { 0: '.item-name', 1: '.item-desc', 2: '.item-code' };
    const sel = colMap[n] || null;

    if (n === 3) {
        items.sort((a, b) => {
            const at = (a.dataset.types || '').toLowerCase();
            const bt = (b.dataset.types || '').toLowerCase();
            return at.localeCompare(bt, 'nl', { sensitivity: 'base' });
        });
    } else if (n === 4) {
        items.sort((a, b) => {
            const ac = (a.dataset.categories || '').toLowerCase();
            const bc = (b.dataset.categories || '').toLowerCase();
            return ac.localeCompare(bc, 'nl', { sensitivity: 'base' });
        });
    } else if (n === 5) {
        items.sort((a, b) => {
            const ay = Number(a.dataset.year === '2024' ? 2024 : 2025);
            const by = Number(b.dataset.year === '2024' ? 2024 : 2025);
            return ay - by;
        });
    } else {
        const isNumeric = numeric || (sel && items.every(li => {
            const el = li.querySelector(sel); return el && !isNaN(el.innerText.trim());
        }));
        items.sort((a, b) => {
            const aText = sel ? (a.querySelector(sel)?.textContent || '') : '';
            const bText = sel ? (b.querySelector(sel)?.textContent || '') : '';
            if (isNumeric) return (Number(aText) || 0) - (Number(bText) || 0);
            return aText.localeCompare(bText, 'nl', { sensitivity: 'base' });
        });
    }

    const dir = sortDirection[n] === 'asc' ? 'desc' : 'asc';
    sortDirection[n] = dir;
    if (dir === 'desc') items.reverse();
    items.forEach(it => list.appendChild(it));
}



function getSelectedCategories() {
    const container = document.getElementById('categoryFilters');
    if (!container) return [];
    const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    return inputs.filter(i => i.checked).map(i => i.value);
}

function getSelectedTypes() {
    const selected = [];
    const boxes = document.querySelectorAll('#typeFilters input[type="checkbox"]:checked');
    boxes.forEach(cb => selected.push(cb.value.trim().toLowerCase()));
    return selected;
}

function getSelectedYears() {
    const container = document.getElementById('yearFilters');
    if (!container) return [];
    const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    return inputs.filter(i => i.checked).map(i => i.value);
}

function itemMatchesFilters(item, searchLower, selectedCats, selectedTypes, yearSel) {
    if (!item) return false;
    const name = (item.name || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const code = (item.code || '').toLowerCase();
    const textMatch = (!searchLower) || name.indexOf(searchLower) !== -1 || desc.indexOf(searchLower) !== -1 || code.indexOf(searchLower) !== -1;
    if (!textMatch) return false;


    let cats = [];
    if (Array.isArray(item.categories)) cats = item.categories.map(String);
    else if (item && item.categories && typeof item.categories === 'string') cats = item.categories.split(',').map(s => s.trim()).filter(Boolean);
    else if (Array.isArray(item.category)) cats = item.category.map(String);
    else if (item && item.category && typeof item.category === 'string') cats = item.category.split(',').map(s => s.trim()).filter(Boolean);

    if (selectedCats && selectedCats.length > 0) {
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


    if (Array.isArray(yearSel) && yearSel.length > 0) {
        const y = (item.year == null) ? '' : String(item.year).trim();
        const bucket = (y === '2024') ? '2024_or_earlier' : '2025';
        if (!yearSel.includes(bucket)) return false;
    }

    return true;
}

function refreshFilters() {
    const input = document.getElementById('searchInput');
    const q = (input ? input.value : '').toLowerCase().trim();
    const selCats = getSelectedCategories();
    const selTypes = getSelectedTypes();
    const selYears = getSelectedYears();
    const items = document.querySelectorAll('#alertList li');
    let visibleCount = 0;
    items.forEach(li => {

        const item = {
            name: li.dataset.name,
            description: li.dataset.desc,
            code: li.dataset.code,
            categories: (li.dataset.categories || '').split('|').filter(Boolean),
            types: (li.dataset.types || '').split('|').filter(Boolean),
            year: li.dataset.year || ''
        };
        let show = itemMatchesFilters(item, q, selCats, selTypes, selYears);

        try {
            const favCb = document.getElementById('filterFavorites');
            if (favCb && favCb.checked) {
                const key = normalizeNameForFile(item.code || item.name || '');
                if (!(window.favorites && window.favorites.isFav('alerts', key))) show = false;
            }
        } catch (e) { }

        try {
            const hasCb = document.getElementById('filterHasPreview');
            const noCb = document.getElementById('filterNoPreview');


            const hasOnly = hasCb && hasCb.checked && !(noCb && noCb.checked);
            const noOnly = noCb && noCb.checked && !(hasCb && hasCb.checked);
            if (hasOnly || noOnly) {
                const key = normalizeNameForFile(item.code || item.name || '');
                const hasPrev = previewAvailableSync(key);
                if (hasOnly && !hasPrev) show = false;
                if (noOnly && hasPrev) show = false;
            }
        } catch (e) { }
        li.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });
    const rc = document.getElementById('rowCount'); if (rc) rc.textContent = visibleCount;
    
    // Toon/verberg "geen resultaten" bericht
    const noResultsMsg = document.getElementById('noResultsMessage');
    if (noResultsMsg) {
        noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    computeFilterCountsAlerts();


    try {
        const active = [];
        if (input && input.value && input.value.trim() !== '') {
            active.push({ type: 'search', label: 'Zoek: "' + input.value.trim() + '"', value: input.value.trim() });
        }

        const catContainer = document.getElementById('categoryFilters');
        if (catContainer) {
            const boxes = Array.from(catContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => {
                let lab = cb.nextElementSibling && cb.nextElementSibling.tagName === 'LABEL' ? cb.nextElementSibling.textContent : cb.value;
                active.push({ type: 'category', label: lab, value: cb.value });
            });
        }

        const typeContainer = document.getElementById('typeFilters');
        if (typeContainer) {
            const boxes = Array.from(typeContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => {
                let lab = cb.nextElementSibling && cb.nextElementSibling.tagName === 'LABEL' ? cb.nextElementSibling.textContent : cb.value;
                active.push({ type: 'type', label: lab, value: cb.value });
            });
        }

        const yearContainer = document.getElementById('yearFilters');
        if (yearContainer) {
            const boxes = Array.from(yearContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => {
                let lab = cb.nextElementSibling && cb.nextElementSibling.tagName === 'LABEL' ? cb.nextElementSibling.textContent : cb.value;
                active.push({ type: 'year', label: lab, value: cb.value });
            });
        }

        try {
            const hasCb = document.getElementById('filterHasPreview');
            const noCb = document.getElementById('filterNoPreview');
            if (hasCb && hasCb.checked) active.push({ type: 'preview', label: 'Heeft voorbeeld', value: 'has' });
            if (noCb && noCb.checked) active.push({ type: 'preview', label: 'Geen voorbeeld', value: 'no' });
        } catch (e) { }
        if (window.activeFilters && typeof window.activeFilters.render === 'function') {
            const cont = document.getElementById('activeFiltersContainer');
            window.activeFilters.render(cont, active);
        }
    } catch (e) { console.error('active filters render failed', e); }
}


function computeFilterCountsAlerts() {
    if (typeof alertsTable === 'undefined' || !Array.isArray(alertsTable)) return;
    const searchLower = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const selTypes = getSelectedTypes();
    const selCats = getSelectedCategories();
    const selYears = getSelectedYears();

    const catContainer = document.getElementById('categoryFilters');
    if (catContainer) {
        const boxes = Array.from(catContainer.querySelectorAll('input[type="checkbox"]'));
        boxes.forEach(cb => {
            const sel = [cb.value];
            const count = alertsTable.reduce((acc, item) => itemMatchesFilters(item, searchLower, sel, selTypes, selYears) ? acc + 1 : acc, 0);
            const parent = cb.parentElement || cb.closest('div');
            if (parent) {
                const span = parent.querySelector('.filter-count'); if (span) span.textContent = ' (' + count + ')';
            }
        });
    }

    const typeContainer = document.getElementById('typeFilters');
    if (typeContainer) {
        const boxes = Array.from(typeContainer.querySelectorAll('input[type="checkbox"]'));
        boxes.forEach(cb => {
            const sel = [cb.value.trim().toLowerCase()];
            const count = alertsTable.reduce((acc, item) => itemMatchesFilters(item, searchLower, selCats, sel, selYears) ? acc + 1 : acc, 0);
            const parent = cb.parentElement || cb.closest('div');
            if (parent) {
                const span = parent.querySelector('.filter-count'); if (span) span.textContent = ' (' + count + ')';
            }
        });
    }


    const yearContainer = document.getElementById('yearFilters');
    if (yearContainer) {
        const boxes = Array.from(yearContainer.querySelectorAll('input[type="checkbox"]'));
        boxes.forEach(cb => {
            const val = cb.value;
            const count = alertsTable.reduce((acc, item) => itemMatchesFilters(item, searchLower, selCats, selTypes, [val]) ? acc + 1 : acc, 0);
            const parent = cb.parentElement || cb.closest('div');
            if (parent) {
                const span = parent.querySelector('.filter-count'); if (span) span.textContent = ' (' + count + ')';
            }
        });
    }


    try {
        const hasCb = document.getElementById('filterHasPreview');
        const noCb = document.getElementById('filterNoPreview');
        if (hasCb || noCb) {
            const countHas = alertsTable.reduce((acc, item) => {
                try {
                    if (!itemMatchesFilters(item, searchLower, selCats, selTypes, selYears)) return acc;
                    const key = normalizeNameForFile(item.code || item.name || '');
                    return previewAvailableSync(key) ? acc + 1 : acc;
                } catch (e) { return acc; }
            }, 0);
            const countNo = alertsTable.reduce((acc, item) => {
                try {
                    if (!itemMatchesFilters(item, searchLower, selCats, selTypes, selYears)) return acc;
                    const key = normalizeNameForFile(item.code || item.name || '');
                    return !previewAvailableSync(key) ? acc + 1 : acc;
                } catch (e) { return acc; }
            }, 0);

            const parentHas = hasCb ? (hasCb.parentElement || hasCb.closest('div')) : null;
            if (parentHas) { const span = parentHas.querySelector('.filter-count'); if (span) span.textContent = ' (' + countHas + ')'; }
            const parentNo = noCb ? (noCb.parentElement || noCb.closest('div')) : null;
            if (parentNo) { const span = parentNo.querySelector('.filter-count'); if (span) span.textContent = ' (' + countNo + ')'; }
        }
    } catch (e) { /* ignore */ }
}


function buildCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container || typeof alertsTable === 'undefined' || !Array.isArray(alertsTable)) return;
    const categories = new Set();
    alertsTable.forEach(item => {
        if (!item) return;
        if (Array.isArray(item.categories)) item.categories.forEach(c => { if (c) categories.add(c.toString()); });
        else if (item.categories && typeof item.categories === 'string') item.categories.split(',').forEach(c => { const t = c.trim(); if (t) categories.add(t); });
        else if (Array.isArray(item.category)) item.category.forEach(c => { if (c) categories.add(c.toString()); });
        else if (item.category && typeof item.category === 'string') item.category.split(',').forEach(c => { const t = c.trim(); if (t) categories.add(t); });
    });
    const cats = Array.from(categories).sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
    container.innerHTML = '';
    if (cats.length === 0) { container.innerHTML = '<small>Geen categorieën gevonden.</small>'; return; }
    cats.forEach(cat => {
        const id = 'alertcat-' + cat.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const wrapper = document.createElement('div'); wrapper.style.display = 'flex'; wrapper.style.gap = '6px'; wrapper.style.alignItems = 'center'; wrapper.style.marginBottom = '4px';
        const input = document.createElement('input'); input.type = 'checkbox'; input.id = id; input.value = cat; input.addEventListener('change', () => { refreshFilters(); });
        const label = document.createElement('label'); label.htmlFor = id; label.style.fontWeight = 'normal'; label.textContent = cat;
        const countSpan = document.createElement('span'); countSpan.className = 'filter-count'; countSpan.style.marginLeft = '6px'; countSpan.style.color = '#666'; countSpan.textContent = '';
        wrapper.appendChild(input); wrapper.appendChild(label); wrapper.appendChild(countSpan); container.appendChild(wrapper);
    });
}

function buildTypeFilters() {
    const container = document.getElementById('typeFilters');
    if (!container || typeof alertsTable === 'undefined' || !Array.isArray(alertsTable)) return;
    const types = new Set();
    alertsTable.forEach(item => {
        if (!item) return;
        if (Array.isArray(item.types)) item.types.forEach(t => { if (t) types.add(t.toString()); });
        else if (item.types && typeof item.types === 'string') item.types.split(',').forEach(t => { const s = t.trim(); if (s) types.add(s); });
        else if (Array.isArray(item.type)) item.type.forEach(t => { if (t) types.add(t.toString()); });
        else if (item.type && typeof item.type === 'string') item.type.split(',').forEach(t => { const s = t.trim(); if (s) types.add(s); });
    });
    const arr = Array.from(types).sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
    container.innerHTML = '';
    if (arr.length === 0) { container.innerHTML = '<small>Geen types gevonden.</small>'; return; }
    arr.forEach(t => {
        const id = 'alerttype-' + t.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const wrapper = document.createElement('div'); wrapper.style.display = 'flex'; wrapper.style.gap = '6px'; wrapper.style.alignItems = 'center'; wrapper.style.marginBottom = '4px';
        const input = document.createElement('input'); input.type = 'checkbox'; input.id = id; input.value = t; input.addEventListener('change', () => { refreshFilters(); });
        const label = document.createElement('label'); label.htmlFor = id; label.style.fontWeight = 'normal'; label.textContent = t;
        const countSpan = document.createElement('span'); countSpan.className = 'filter-count'; countSpan.style.marginLeft = '6px'; countSpan.style.color = '#666'; countSpan.textContent = '';
        wrapper.appendChild(input); wrapper.appendChild(label); wrapper.appendChild(countSpan); container.appendChild(wrapper);
    });
}


function buildYearFilters() {
    const container = document.getElementById('yearFilters');
    if (!container) return;
    container.innerHTML = '';
    const choices = [
        { val: '2024_or_earlier', label: '2024 of eerder' },
        { val: '2025', label: '2025' }
    ];
    choices.forEach(c => {
        const id = 'yeard-' + c.val;
        const wrapper = document.createElement('div'); wrapper.style.display = 'flex'; wrapper.style.gap = '6px'; wrapper.style.alignItems = 'center'; wrapper.style.marginBottom = '4px';
        const input = document.createElement('input'); input.type = 'checkbox'; input.id = id; input.value = c.val; input.addEventListener('change', () => { refreshFilters(); });
        const label = document.createElement('label'); label.htmlFor = id; label.style.fontWeight = 'normal'; label.textContent = c.label;
        const countSpan = document.createElement('span'); countSpan.className = 'filter-count'; countSpan.style.marginLeft = '6px'; countSpan.style.color = '#666'; countSpan.textContent = '';
        wrapper.appendChild(input); wrapper.appendChild(label); wrapper.appendChild(countSpan); container.appendChild(wrapper);
    });
}


function renderAlertsTable() {
    const list = document.getElementById('alertList'); if (!list) return; list.innerHTML = '';
    if (typeof alertsTable === 'undefined' || !Array.isArray(alertsTable)) return;

    alertsTable.forEach(item => {
        const li = document.createElement('li'); li.className = 'item-listing__item';
        const main = document.createElement('div'); main.className = 'item-listing__main';
        const left = document.createElement('div'); left.className = 'item-listing__left';
        const name = document.createElement('div'); name.className = 'item-name'; name.title = 'Klik voor voorbeeld';
        const nameText = document.createElement('span'); nameText.className = 'item-name-text'; nameText.textContent = item.name || ''; name.appendChild(nameText);
        const starEl = document.createElement('span'); starEl.className = 'fav-indicator';
        try {
            const key = normalizeNameForFile(item.code || item.name || '');
            const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('alerts', key);
            starEl.textContent = isFav ? '★' : '';
        } catch (e) { starEl.textContent = ''; }
        name.appendChild(starEl);
        const desc = document.createElement('div'); desc.className = 'item-desc'; desc.innerHTML = item.description || '';


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


        const info = document.createElement('div'); info.className = 'item-langs';
        const typePart = (types.length) ? types.join(', ') : '';
        const catPart = (cats.length) ? cats.join(', ') : '';

        const yearBucket = (String(item.year || '').trim() === '2024') ? '2024 of eerder' : '2025';
        const infoParts = [];
        if (typePart) infoParts.push({ text: typePart, facet: 'type' });
        if (catPart) infoParts.push({ text: catPart, facet: 'category' });

        infoParts.push({ text: yearBucket, facet: 'year' });


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
                    span.addEventListener('click', () => applyFilterFromInfoAlerts(p.facet, part));
                    info.appendChild(span);
                    if (i2 < parts.length - 1) info.appendChild(document.createTextNode(', '));
                });
            } else {
                const span = document.createElement('span');
                span.className = 'info-part';
                span.textContent = p.text;
                span.style.cursor = 'pointer';
                span.dataset.facet = p.facet;
                span.addEventListener('click', () => applyFilterFromInfoAlerts(p.facet, p.text));
                info.appendChild(span);
            }
            if (idx < infoParts.length - 1) info.appendChild(document.createTextNode(' • '));
        });

        left.appendChild(name);

        const codeInline = document.createElement('div'); codeInline.className = 'item-code-inline'; codeInline.textContent = item.code || '';
        const mobileCodeRow = document.createElement('div'); mobileCodeRow.className = 'mobile-code-row';
        const mobileCodeLeft = document.createElement('div'); mobileCodeLeft.className = 'mobile-code-left';
        const mobileLabel = document.createElement('span'); mobileLabel.className = 'mobile-code-label'; mobileLabel.textContent = 'Alertcode:';
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
        const code = document.createElement('div'); code.className = 'item-code'; code.textContent = item.code || '';

        const actions = document.createElement('div'); actions.className = 'item-actions';
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'copy-code';
        copyBtn.textContent = 'Kopieer';
        copyBtn.addEventListener('click', (ev) => copyToClipboard(ev.currentTarget));
        actions.appendChild(copyBtn);
        meta.appendChild(code);
        meta.appendChild(actions);

        main.appendChild(left); main.appendChild(meta); li.appendChild(main);


        li.dataset.name = (item.name || '').toString();
        li.dataset.desc = (item.description || '').toString();
        li.dataset.code = (item.code || '').toString();
        if (cats.length) li.dataset.categories = cats.join('|');
        if (types.length) li.dataset.types = types.join('|');

        li.dataset.year = (item.year == null) ? '' : String(item.year);

        list.appendChild(li);
    });
}


function applySort() {
    const sel = document.getElementById('sortSelect'); if (!sel) return;
    const [colStr, dir] = sel.value.split(':'); const col = parseInt(colStr, 10);

    sortDirection[col] = (dir === 'asc') ? 'asc' : 'desc';
    sortTable(col);
}
const alertCount = document.querySelectorAll('#alertList li').length;
try { localStorage.setItem('alertCount', alertCount); } catch (e) { }

/* Preview modal for alerts from /alerts/ */
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
                const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('alerts', key);
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
                                <button class="preview-fav btn-muted" title="Favoriet" aria-label="Favoriet">☆<span class="btn-label">Favoriet</span></button>
                                <button class="preview-share btn-muted" title="Deel" aria-label="Deel">🔗<span class="btn-label"></span></button>
                            </div>
                        </div>
                        <button class="preview-close" aria-label="Sluiten">✕</button>
                    </div>
                    <div class="preview-body" id="preview-body"></div>
                    <div class="preview-controls">
                        <div class="preview-controls-top">
                            <button class="preview-copy">Kopieer alertcode</button>
                        </div>
                    </div>
                </div>`;
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.className = 'preview-popup';
    popup.style.display = 'none';
    document.body.appendChild(popup);

    overlay._previewPopup = popup;
    overlay.querySelector('.preview-close').addEventListener('click', () => { popup.remove(); overlay.remove(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { popup.remove(); overlay.remove(); } });
    return overlay;
}






function showPreview(folder, codeOrDisplay, displayName) {
    let code = undefined;
    let display = undefined;
    if (typeof displayName === 'undefined') {
        display = codeOrDisplay;
    } else {
        code = codeOrDisplay;
        display = displayName;
    }

    const overlay = createPreviewOverlay();
    const titleEl = overlay.querySelector('#preview-title');
    const body = overlay.querySelector('#preview-body');
    const copyBtn = overlay.querySelector('.preview-copy');
    titleEl.textContent = display || '';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(display || '').then(() => {
            copyBtn.textContent = 'Gekopieerd ✓';
            setTimeout(() => copyBtn.textContent = 'Kopieer alertcode', 1200);
        });
    });


    try {
        const favBtn = overlay.querySelector('.preview-fav');
        const shareBtn = overlay.querySelector('.preview-share');
        const key = normalizeNameForFile(code || display || '');
        const page = 'alerts';
        const updateFavUi = () => {
            if (!favBtn) return;
            const isFav = window.favorites && window.favorites.isFav(page, key);
            favBtn.textContent = isFav ? '★' : '☆';
            favBtn.title = isFav ? 'Verwijder favoriet' : 'Markeer als favoriet';
        };
        const popup = overlay._previewPopup;

        const showPopup = (msg) => {
            try {
                if (!popup) return;
                popup.textContent = msg;
                popup.style.display = 'block';
                popup.style.opacity = '1';
                setTimeout(() => { popup.style.transition = 'opacity 0.25s ease'; popup.style.opacity = '0'; }, 1200);
                setTimeout(() => { try { popup.style.display = 'none'; } catch (e) { } }, 1450);
            } catch (e) { /* ignore */ }
        };

        if (favBtn) {
            favBtn.addEventListener('click', () => {
                try { const added = window.favorites.toggle(page, key); updateFavUi(); showPopup(added ? 'Favoriet toegevoegd' : 'Favoriet verwijderd'); } catch (e) { console.error(e); }
            });
            updateFavUi();
        }
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                try {
                    const url = window.favorites ? window.favorites.makeShareUrl(page, key) : (window.location.href + `?focus=${page}:${key}`);
                    navigator.clipboard.writeText(url).then(() => { showPopup('Link gekopieerd'); }).catch(() => { showPopup('Link gekopieerd'); });
                } catch (e) { console.error('share failed', e); }
            });
        }
    } catch (e) { /* ignore */ }




    try {
        const tryNames = [];
        if (code) tryNames.push(normalizeNameForFile(code));
        if (display) tryNames.push(normalizeNameForFile(display));

        for (const name of tryNames) {
            const mappingFiles = (typeof window.getAlertsFiles === 'function') ? window.getAlertsFiles(name) : (window.alertsLinks && window.alertsLinks[name]) || [];
            if (mappingFiles && mappingFiles.length > 0) {
                const videoExts = ['.webm', '.mp4'];
                const audioExts = ['.mp3', '.ogg'];
                let chosen = null; let chosenType = null;
                for (const f of mappingFiles) {
                    const ext = (f.split('.').pop() || '').toLowerCase();
                    const dotExt = '.' + ext;
                    if (videoExts.includes(dotExt)) { chosen = f; chosenType = 'video'; break; }
                    if (audioExts.includes(dotExt) && !chosen) { chosen = f; chosenType = 'audio'; }
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
        }
    } catch (e) {

    }

    body.innerHTML = '<div class="preview-notfound">Geen voorbeeld beschikbaar.</div>';
}

function scrollAndHighlightByKey(key) {
    try {
        const rows = Array.from(document.querySelectorAll('#alertList li'));
        for (const r of rows) {
            const code = (r.dataset.code || '').toString();
            const name = (r.dataset.name || '').toString();
            if (normalizeNameForFile(code || name) === key) {
                r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const orig = r.style.transition;
                r.style.transition = 'background-color 0.3s ease';
                const oldBg = r.style.backgroundColor;
                r.style.backgroundColor = '#fff79a';
                setTimeout(() => { r.style.backgroundColor = oldBg || ''; r.style.transition = orig; }, 2500);
                return true;
            }
        }
    } catch (e) { console.error('focus failed', e); }
    return false;
}


(function handleFocusFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const focus = params.get('focus') || location.hash.replace(/^#/, '') || '';
        if (!focus) return;
        const [page, key] = focus.split(':');
        if (page === 'alerts' && key) {

            setTimeout(() => { scrollAndHighlightByKey(key); }, 300);
        }
    } catch (e) { /* ignore */ }
})();




async function _checkUrlExists(url) {
    try {

        const head = await fetch(url, { method: 'HEAD' });
        if (head && head.ok) return true;

        if (head && (head.status === 405 || head.status === 501)) {
            const getr = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
            return Boolean(getr && getr.ok);
        }
    } catch (e) {

        try {
            const getr = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
            return Boolean(getr && getr.ok);
        } catch (err) {
            return false;
        }
    }
    return false;
}




function previewExists(folder, codeOrDisplay, displayName, cb) {
    let code = undefined;
    let display = undefined;

    if (typeof cb === 'undefined' && typeof displayName === 'function') {
        cb = displayName;
        display = codeOrDisplay;
    } else {
        code = codeOrDisplay;
        display = displayName;
    }

    const tryNames = [];
    if (code) tryNames.push(normalizeNameForFile(code));
    if (display) tryNames.push(normalizeNameForFile(display));

    try {
        const matchesMedia = (f) => /\.(mp4|webm|mp3|ogg)(?:$|[?#])/i.test(f);
        for (const name of tryNames) {
            if (typeof window.getAlertsFiles === 'function') {
                const files = window.getAlertsFiles(name) || [];
                if (files.some(matchesMedia)) { cb(true); return; }
            } else if (typeof window.alertsLinks !== 'undefined') {
                const files = window.alertsLinks[name] || [];
                if (files.some(matchesMedia)) { cb(true); return; }
            }
        }
    } catch (e) {

    }

    cb(false);
}



function previewAvailableSync(name) {
    try {
        const matchesMedia = (f) => /\.(mp4|webm|mp3|ogg)(?:$|[?#])/i.test(f);
        if (typeof window.getAlertsFiles === 'function') {
            const files = window.getAlertsFiles(name) || [];
            if (files.some(matchesMedia)) return true;
        } else if (typeof window.alertsLinks !== 'undefined') {
            const files = window.alertsLinks[name] || [];
            if (files.some(matchesMedia)) return true;
        }
    } catch (e) { /* ignore */ }
    return false;
}


function attachPreviewHandlers() {
    const rows = document.querySelectorAll('#alertList li');
    rows.forEach(r => {
        const first = r.querySelector('.item-name');
        if (!first) return;
        const display = first.innerText.trim();
        const code = (r.dataset.code || '').toString();
        first.title = 'Klik voor voorbeeld';
        first.addEventListener('click', () => showPreview('alerts', code || display, display));
        previewExists('alerts', code || display, display, (exists) => {
            if (exists) first.classList.add('has-preview');
        });
    });



    const anchors = document.querySelectorAll('#alertList a[href]');
    anchors.forEach(a => {
        try {
            const href = a.getAttribute('href') || '';
            const lower = href.toLowerCase();

            const isLocalAlert = lower.includes('/alerts/') || lower.match(/\.(mp4|webm|mp3|ogg)(?:$|[?#])/i);
            if (isLocalAlert) {
                a.addEventListener('click', (ev) => {
                    ev.preventDefault();

                    const filename = href.split('/').pop().split(/[?#]/)[0] || a.innerText.trim();
                    const name = filename.replace(/\.[^/.]+$/, '');
                    showPreview('alerts', name);
                });

                a.rel = (a.rel || '') + ' noopener';
            }
        } catch (e) {

        }
    });
}


function applyFilterFromInfoAlerts(facet, text) {
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

    const preferred = {
        'category': 'categoryFilters',
        'type': 'typeFilters',
        'year': 'yearFilters'
    };

    function openGroupFor(id) {
        try {
            const el = document.getElementById(id);
            if (!el) return;
            const details = el.closest && el.closest('details.filter-option');
            if (details && !details.open) details.open = true;
        } catch (e) { }
    }

    if (facet && preferred[facet]) {

        openGroupFor(preferred[facet]);
        if (matchInContainer(preferred[facet])) { try { refreshFilters(); } catch (e) { }; return; }
    }

    const all = ['categoryFilters', 'typeFilters', 'yearFilters'];
    for (const id of all) {
        openGroupFor(id);
        if (matchInContainer(id)) { try { refreshFilters(); } catch (e) { }; return; }
    }
}

function updateRowCount() {
    const items = Array.from(document.querySelectorAll('#alertList li'));
    const visibleCount = items.filter(it => it.style.display !== 'none').length;
    const el = document.getElementById('rowCount'); if (el) el.textContent = visibleCount;
    
    // Toon/verberg "geen resultaten" bericht
    const noResultsMsg = document.getElementById('noResultsMessage');
    if (noResultsMsg) {
        noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}


document.addEventListener("DOMContentLoaded", function () {


    try {
        const panel = document.getElementById('filterPanel');
        if (panel) {
            const checks = Array.from(panel.querySelectorAll('input[type="checkbox"]'));
            checks.forEach(cb => { try { cb.checked = false; } catch (e) { } });
            const texts = Array.from(panel.querySelectorAll('input[type="text"], input[type="search"]'));
            texts.forEach(t => { try { t.value = ''; } catch (e) { } });
        }

        const s = document.getElementById('searchInput'); if (s) s.value = '';
    } catch (e) { /* ignore */ }

    renderAlertsTable();
    buildCategoryFilters();
    buildTypeFilters();
    buildYearFilters();

    try {
        const favEl = document.getElementById('filterFavorites');
        if (favEl) favEl.addEventListener('change', () => { refreshFilters(); computeFilterCountsAlerts(); });
    } catch (e) { }

    try {
        const hasEl = document.getElementById('filterHasPreview');
        if (hasEl) hasEl.addEventListener('change', () => { refreshFilters(); computeFilterCountsAlerts(); });
    } catch (e) { }
    try {
        const noEl = document.getElementById('filterNoPreview');
        if (noEl) noEl.addEventListener('change', () => { refreshFilters(); computeFilterCountsAlerts(); });
    } catch (e) { }


    function updateFavoritesFilterVisibility() {
        try {
            const favWrap = document.getElementById('favoritesFilter');
            if (!favWrap) return;
            const details = favWrap.closest && favWrap.closest('details.filter-option');
            const countSpan = favWrap.querySelector && favWrap.querySelector('.filter-count');
            const favCount = window.favorites ? window.favorites.count('alerts') : 0;
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
            if (!p || p === 'alerts') {
                updateFavoritesFilterVisibility();
                try { updateFavIndicators(); } catch (e) { }
            }
        } catch (e) { }
    });

    const searchEl = document.getElementById('searchInput'); if (searchEl) searchEl.addEventListener('input', () => { refreshFilters(); });


    computeFilterCountsAlerts();
    refreshFilters();
    attachPreviewHandlers();
    try { updateFavIndicators(); } catch (e) { }

    const sel = document.getElementById('sortSelect');
    if (sel) {
        const [colStr, dir] = sel.value.split(':');
        const col = parseInt(colStr, 10);
        sortDirection[col] = (dir === 'asc');
    }
    sortTable(0);
    updateRowCount();

    window.addEventListener('activeFilter:remove', (ev) => {
        try {
            const { type, value } = ev.detail || {};
            if (!type) return;
            if (type === 'search') {
                const s = document.getElementById('searchInput'); if (s) s.value = '';
            } else if (type === 'category') {
                const container = document.getElementById('categoryFilters');
                if (container) {
                    const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => i.value === value);
                    if (input) input.checked = false;
                }
            } else if (type === 'type') {
                const container = document.getElementById('typeFilters');
                if (container) {
                    const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => (i.value || '').trim().toLowerCase() === (value || '').trim().toLowerCase());
                    if (input) input.checked = false;
                }
            } else if (type === 'year') {
                const container = document.getElementById('yearFilters');
                if (container) {
                    const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => i.value === value);
                    if (input) input.checked = false;
                }
            } else if (type === 'preview') {
                try {
                    if (value === 'has') {
                        const el = document.getElementById('filterHasPreview'); if (el) el.checked = false;
                    } else if (value === 'no') {
                        const el = document.getElementById('filterNoPreview'); if (el) el.checked = false;
                    }
                } catch (e) { }
            }

            refreshFilters();
        } catch (e) { console.error('failed to handle activeFilter:remove', e); }
    });

    window.addEventListener('activeFilter:clear', () => {
        try {
            const s = document.getElementById('searchInput'); if (s) s.value = '';
            ['categoryFilters', 'typeFilters', 'yearFilters'].forEach(id => {
                const c = document.getElementById(id);
                if (!c) return;
                const inputs = Array.from(c.querySelectorAll('input[type="checkbox"]'));
                inputs.forEach(i => { if (i.checked) { i.checked = false; i.dispatchEvent(new Event('change')); } });
            });
            try { const fav = document.getElementById('filterFavorites'); if (fav) fav.checked = false; } catch (e) { }
            try { const has = document.getElementById('filterHasPreview'); if (has) { has.checked = false; has.dispatchEvent(new Event('change')); } } catch (e) { }
            try { const nop = document.getElementById('filterNoPreview'); if (nop) { nop.checked = false; nop.dispatchEvent(new Event('change')); } } catch (e) { }
            refreshFilters();
        } catch (e) { console.error('failed to clear filters (alerts)', e); }
    });

    window.applySort = applySort;
    window.sortTable = sortTable;
});
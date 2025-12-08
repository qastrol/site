

function copyToClipboard(button) {
    const li = button.closest && button.closest('li');
    const codeEl = li ? li.querySelector('.item-code') : null;
    const codeText = codeEl ? codeEl.innerText.trim() : '';
    if (!codeText) return;

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
        try { showCopyToast && showCopyToast(codeText + ' gekopieerd!'); } catch (e) { alert(codeText + ' gekopieerd!'); }
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(codeText).then(() => { onSuccess(); }).catch(err => {
            const ok = doFallback(codeText);
            if (ok) onSuccess(); else console.error('Kopiëren mislukt', err);
        });
    } else {
        const ok = doFallback(codeText);
        if (ok) onSuccess(); else console.warn('clipboard niet ondersteund');
    }
}


function showCopyToast(msg) {
    try {
        const prev = document.getElementById('ttsCopyToast'); if (prev) prev.remove();
        const t = document.createElement('div');
        t.id = 'ttsCopyToast';
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


function renderTtsTable() {
    const list = document.getElementById('ttsList');
    if (!list) return;
    list.innerHTML = '';
    const data = (typeof ttsTable !== 'undefined' && Array.isArray(ttsTable)) ? ttsTable : [];
    if (data.length === 0) return;

    data.forEach(item => {
        const li = document.createElement('li');
        li.className = 'item-listing__item';

        const main = document.createElement('div');
        main.className = 'item-listing__main';

        const left = document.createElement('div');
        left.className = 'item-listing__left';
        const name = document.createElement('div');
        name.className = 'item-name';
        name.style.cursor = 'pointer';
        const nameText = document.createElement('span'); nameText.className = 'item-name-text'; nameText.textContent = item.name || ''; name.appendChild(nameText);
        const starEl = document.createElement('span'); starEl.className = 'fav-indicator';
        try {
            const key = normalizeNameForFile(item.name || '');
            const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('tts', key);
            starEl.textContent = isFav ? '★' : '';
        } catch (e) { starEl.textContent = ''; }
        name.appendChild(starEl);
        left.appendChild(name);


        const codeInline = document.createElement('div');
        codeInline.className = 'item-code-inline';
        codeInline.textContent = item.code || '';
        const mobileCodeRow = document.createElement('div');
        mobileCodeRow.className = 'mobile-code-row';
        const mobileCodeLeft = document.createElement('div');
        mobileCodeLeft.className = 'mobile-code-left';
        const mobileLabel = document.createElement('span');
        mobileLabel.className = 'mobile-code-label';
        mobileLabel.textContent = 'Stemnaam:';
        mobileCodeLeft.appendChild(mobileLabel);
        mobileCodeLeft.appendChild(codeInline);
        const mobileCopyBtn = document.createElement('button');
        mobileCopyBtn.type = 'button';
        mobileCopyBtn.className = 'mobile-copy-code';
        mobileCopyBtn.textContent = 'Kopieer';
        mobileCopyBtn.addEventListener('click', (ev) => copyToClipboard(ev.currentTarget));
        mobileCodeRow.appendChild(mobileCodeLeft);
        mobileCodeRow.appendChild(mobileCopyBtn);
        left.appendChild(mobileCodeRow);

        const info = document.createElement('div');
        info.className = 'item-langs';
        const langsArr = Array.isArray(item.languages) ? item.languages : (item.languages ? [item.languages] : []);
        const langLabel = (codes) => {
            if (!codes || codes.length === 0) return '';
            const mapped = codes.map(c => {
                if (c === '*') return 'Engels & Nederlands';
                if (c === 'en') return 'Engels';
                if (c === 'nl') return 'Nederlands';
                return c;
            });
            if (mapped.length === 2) return mapped.join(' & ');
            return mapped.join(', ');
        };
        const humanLangs = langLabel(langsArr);

        const infoParts = [];
        if (item.category) infoParts.push({ text: item.category, facet: 'category' });
        if (item.type) infoParts.push({ text: item.type, facet: 'gender' });

        if (item.source) {
            const srcText = Array.isArray(item.source) ? item.source.join(', ') : String(item.source);
            infoParts.push({ text: srcText, facet: 'source' });
        }
        if (humanLangs) infoParts.push({ text: humanLangs, facet: 'lang' });
        if (item.isAI) infoParts.push({ text: 'AI-stem', facet: 'type' });
        if (item.supportsAudioTags) infoParts.push({ text: 'Ondersteunt audio tags', facet: 'audio' });


        info.innerHTML = '';
        infoParts.forEach((p, idx) => {
            const isSplitFacet = (p.facet === 'category' || p.facet === 'type' || p.facet === 'gender' || p.facet === 'source');
            if (isSplitFacet && p.text && p.text.indexOf(',') !== -1) {
                const parts = p.text.split(',').map(s => s.trim()).filter(Boolean);
                parts.forEach((part, i2) => {
                    const span = document.createElement('span');
                    span.className = 'info-part';
                    span.textContent = part;
                    span.style.cursor = 'pointer';
                    span.dataset.facet = p.facet;
                    span.addEventListener('click', () => applyFilterFromInfoTts(p.facet, part));
                    info.appendChild(span);
                    if (i2 < parts.length - 1) info.appendChild(document.createTextNode(', '));
                });
            } else {
                const span = document.createElement('span');
                span.className = 'info-part';
                span.textContent = p.text;
                span.style.cursor = 'pointer';
                span.dataset.facet = p.facet;
                span.addEventListener('click', () => applyFilterFromInfoTts(p.facet, p.text));
                info.appendChild(span);
            }
            if (idx < infoParts.length - 1) info.appendChild(document.createTextNode(' • '));
        });
        left.appendChild(info);

        const desc = document.createElement('div');
        desc.className = 'item-desc';
        desc.textContent = item.description || '';
        left.appendChild(desc);

        const meta = document.createElement('div');
        meta.className = 'item-meta';


        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const code = document.createElement('div');
        code.className = 'item-code';
        code.textContent = item.code || '';
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'copy-code';
        copyBtn.textContent = 'Kopieer';
        copyBtn.addEventListener('click', (ev) => copyToClipboard(ev.currentTarget));
        actions.appendChild(copyBtn);

        meta.appendChild(code);
        meta.appendChild(actions);

        main.appendChild(left);
        main.appendChild(meta);
        li.appendChild(main);

        li.dataset.name = (item.name || '').toString();
        li.dataset.category = (item.category || '').toString();

        let dsSources = '';
        if (item.source) {
            if (Array.isArray(item.source)) dsSources = item.source.map(s => s.toString().trim()).filter(Boolean).join('|');
            else dsSources = String(item.source).trim();
        }
        li.dataset.source = dsSources;
        li.dataset.gender = (item.type || '').toString();
        li.dataset.isai = item.isAI ? '1' : '0';
        li.dataset.supportsaudiotags = item.supportsAudioTags ? '1' : '0';
        li.dataset.languages = (Array.isArray(item.languages) ? item.languages : (item.languages ? [item.languages] : [])).join(',');

        li.dataset.code = (item.code || '').toString();

        list.appendChild(li);

        try {
            const codeEl = li.querySelector('.item-code');
            if (codeEl) { codeEl.style.cursor = 'pointer'; codeEl.title = 'Klik om te sorteren op stemnaam'; codeEl.addEventListener('click', () => sortTable(5)); }
        } catch (e) { }
    });
}



let sortDirection = [true, true, true, true, true, true];


function sortTable(n) {
    const list = document.getElementById('ttsList');
    if (!list) return;
    const items = Array.from(list.children);
    if (items.length === 0) return;


    const colMap = { 0: '.item-name', 1: null, 2: null, 3: '.item-langs', 4: '.item-desc' };
    const sel = colMap[n];


    if (n === 5) {
        items.sort((a, b) => {
            const ac = (a.dataset.code || (a.querySelector('.item-code') && a.querySelector('.item-code').innerText) || '').toString().toLowerCase();
            const bc = (b.dataset.code || (b.querySelector('.item-code') && b.querySelector('.item-code').innerText) || '').toString().toLowerCase();
            return ac.localeCompare(bc, 'nl', { sensitivity: 'base' });
        });
        if (!sortDirection[n]) items.reverse();
        items.forEach(it => list.appendChild(it));
        sortDirection[n] = !sortDirection[n];
        return;
    }

    const isNumeric = items.every(li => {
        let txt = '';
        if (sel) {
            const el = li.querySelector(sel);
            txt = el ? el.innerText.trim() : '';
        } else {
            if (n === 1) txt = li.dataset.category || '';
            else if (n === 2) txt = li.dataset.gender || '';
            else txt = '';
        }
        return txt !== '' && !isNaN(txt);
    });

    items.sort((a, b) => {
        let aText = '';
        let bText = '';
        if (sel) {
            const aEl = a.querySelector(sel);
            const bEl = b.querySelector(sel);
            aText = aEl ? aEl.innerText.trim() : '';
            bText = bEl ? bEl.innerText.trim() : '';
        } else {
            if (n === 1) {
                aText = a.dataset.category || '';
                bText = b.dataset.category || '';
            } else if (n === 2) {
                aText = a.dataset.gender || '';
                bText = b.dataset.gender || '';
            }
        }
        if (isNumeric) return (parseFloat(aText) || 0) - (parseFloat(bText) || 0);
        return aText.localeCompare(bText, 'nl', { sensitivity: 'base' });
    });

    if (!sortDirection[n]) items.reverse();
    items.forEach(it => list.appendChild(it));
    sortDirection[n] = !sortDirection[n];
}


function updateRowCount() {
    const items = Array.from(document.querySelectorAll('#ttsList li'));
    const visibleRowCount = items.reduce((acc, r) => acc + (r.style.display !== 'none' ? 1 : 0), 0);
    document.getElementById("rowCount").textContent = visibleRowCount;
    
    // Toon/verberg "geen resultaten" bericht
    const noResultsMsg = document.getElementById('noResultsMessage');
    if (noResultsMsg) {
        noResultsMsg.style.display = visibleRowCount === 0 ? 'block' : 'none';
    }
}


function searchTable() {
    const input = document.getElementById("searchInput");
    const filter = (input ? input.value : '').toLowerCase();
    const rows = Array.from(document.querySelectorAll('#ttsList li'));


    const checkedCategoryInputs = Array.from(document.querySelectorAll('#categoryFilters input[data-type="category"]:checked'));
    const checkedCats = checkedCategoryInputs.map(cb => cb.value);
    const checkedSourceInputs = Array.from(document.querySelectorAll('#sourceFilters input[data-type="source"]:checked'));
    const checkedSources = checkedSourceInputs.map(cb => cb.value);
    const aiCheckbox = document.querySelector('#filterAI');
    const normalCheckbox = document.querySelector('#filterNormal');
    const aiChecked = aiCheckbox ? aiCheckbox.checked : false;
    const normalChecked = normalCheckbox ? normalCheckbox.checked : false;
    const supportsCb = document.querySelector('#filterSupports');
    const notSupportsCb = document.querySelector('#filterNotSupports');
    const supportsChecked = supportsCb ? supportsCb.checked : false;
    const notSupportsChecked = notSupportsCb ? notSupportsCb.checked : false;
    const checkedLangInputs = Array.from(document.querySelectorAll('#languageFilters input[data-type="lang"]:checked'));
    const checkedLangs = checkedLangInputs.map(cb => cb.value);

    const checkedGenderInputs = Array.from(document.querySelectorAll('#genderFilters input[data-type="gender"]:checked'));
    const checkedGenders = checkedGenderInputs.map(cb => cb.value);


    rows.forEach(row => {
        const text = row.innerText || '';
        const textMatch = !filter || text.toLowerCase().indexOf(filter) > -1;


        const categoryText = row.dataset.category || '';
        let categoryMatch = true;
        if (checkedCats.length > 0) categoryMatch = checkedCats.indexOf(categoryText) !== -1;


        const rowSourceValues = (row.dataset.source || '').split('|').map(s => s.trim()).filter(Boolean);
        let sourceMatch = true;
        if (checkedSources.length > 0) {
            sourceMatch = checkedSources.some(cs => rowSourceValues.indexOf(cs) !== -1);
        }


        let aiMatch = true;
        if (aiChecked || normalChecked) {
            if (aiChecked && !normalChecked) aiMatch = row.dataset.isai === '1';
            else if (!aiChecked && normalChecked) aiMatch = row.dataset.isai !== '1';
            else aiMatch = true;
        }


        let supportsMatch = true;
        if (supportsChecked || notSupportsChecked) {
            if (supportsChecked && !notSupportsChecked) supportsMatch = row.dataset.supportsaudiotags === '1';
            else if (!supportsChecked && notSupportsChecked) supportsMatch = row.dataset.supportsaudiotags === '0';
            else supportsMatch = true;
        }


        let langMatch = true;
        if (checkedLangs.length > 0) {
            const rowLangs = (row.dataset.languages || '').split(',').map(s => s.trim()).filter(Boolean);
            if (rowLangs.indexOf('*') !== -1) langMatch = true;
            else langMatch = checkedLangs.some(l => rowLangs.indexOf(l) !== -1);
        }


        let genderMatch = true;
        if (checkedGenders.length > 0) {
            const rowGender = (row.dataset.gender || '').trim();
            genderMatch = checkedGenders.indexOf(rowGender) !== -1;
        }

        const matchFound = textMatch && categoryMatch && sourceMatch && aiMatch && langMatch && genderMatch && supportsMatch;
        row.style.display = matchFound ? '' : 'none';
    });


    try {
        const favCb = document.getElementById('filterFavorites');
        if (favCb && favCb.checked) {
            const allRows = Array.from(document.querySelectorAll('#ttsList li'));
            allRows.forEach(r => {
                const name = (r.dataset.name || '').toString();
                const key = normalizeNameForFile(name);
                if (!window.favorites || !window.favorites.isFav('tts', key)) r.style.display = 'none';
            });
        }
    } catch (e) { }


    updateRowCount();

    computeFilterCounts();

    try {
        const active = [];
        const input = document.getElementById('searchInput');
        if (input && input.value && input.value.trim() !== '') active.push({ type: 'search', label: 'Zoek: "' + input.value.trim() + '"', value: input.value.trim() });

        const catContainer = document.getElementById('categoryFilters');
        if (catContainer) {
            const boxes = Array.from(catContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'category', label: lab, value: cb.value }); });
        }

        const srcContainer = document.getElementById('sourceFilters');
        if (srcContainer) {
            const boxes = Array.from(srcContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'source', label: lab, value: cb.value }); });
        }

        const typeContainer = document.getElementById('typeFilters');
        if (typeContainer) {
            const boxes = Array.from(typeContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'type', label: lab, value: cb.value }); });
        }

        const langContainer = document.getElementById('languageFilters');
        if (langContainer) {
            const boxes = Array.from(langContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'lang', label: lab, value: cb.value }); });
        }

        const genderContainer = document.getElementById('genderFilters');
        if (genderContainer) {
            const boxes = Array.from(genderContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'gender', label: lab, value: cb.value }); });
        }

        const audioContainer = document.getElementById('audioTagFilters');
        if (audioContainer) {
            const boxes = Array.from(audioContainer.querySelectorAll('input[type="checkbox"]:checked'));
            boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'audio', label: lab, value: cb.value }); });
        }
        if (window.activeFilters && typeof window.activeFilters.render === 'function') window.activeFilters.render(document.getElementById('activeFiltersContainer'), active);
    } catch (e) { console.error('active filters render failed (tts)', e); }
}


function computeFilterCounts() {
    const data = (typeof ttsTable !== 'undefined' && Array.isArray(ttsTable)) ? ttsTable : [];

    const checkedCats = Array.from(document.querySelectorAll('#categoryFilters input[data-type="category"]:checked')).map(c => c.value);
    const checkedLangs = Array.from(document.querySelectorAll('#languageFilters input[data-type="lang"]:checked')).map(c => c.value);
    const checkedGenders = Array.from(document.querySelectorAll('#genderFilters input[data-type="gender"]:checked')).map(c => c.value);
    const checkedSources = Array.from(document.querySelectorAll('#sourceFilters input[data-type="source"]:checked')).map(c => c.value);
    const aiCheckbox = document.querySelector('#filterAI');
    const normalCheckbox = document.querySelector('#filterNormal');
    const aiChecked = aiCheckbox ? aiCheckbox.checked : false;
    const normalChecked = normalCheckbox ? normalCheckbox.checked : false;
    const supportsCheckbox = document.querySelector('#filterSupports');
    const notSupportsCheckbox = document.querySelector('#filterNotSupports');
    const supportsChecked = supportsCheckbox ? supportsCheckbox.checked : false;
    const notSupportsChecked = notSupportsCheckbox ? notSupportsCheckbox.checked : false;


    const allCbs = Array.from(document.querySelectorAll('#filterPanel input[type="checkbox"]'));
    allCbs.forEach(cb => {
        const type = cb.getAttribute('data-type');
        const value = cb.value;


        let selCats = checkedCats.slice();
        let selSources = checkedSources.slice();
        let selLangs = checkedLangs.slice();
        let selGenders = checkedGenders.slice();
        let selAi = aiChecked;
        let selNormal = normalChecked;
        let selSupportsTrue = supportsChecked;
        let selSupportsFalse = notSupportsChecked;


        if (type === 'category') selCats = [];
        if (type === 'source') selSources = [];
        if (type === 'lang') selLangs = [];
        if (type === 'gender') selGenders = [];
        if (type === 'type') { selAi = false; selNormal = false; }
        if (type === 'audio') { selSupportsTrue = false; selSupportsFalse = false; }


        if (type === 'category') selCats = [value];
        if (type === 'source') selSources = [value];
        else if (type === 'lang') selLangs = [value];
        else if (type === 'gender') selGenders = [value];
        else if (type === 'type') {
            if (value === 'ai') { selAi = true; selNormal = false; }
            else if (value === 'normal') { selAi = false; selNormal = true; }
        }
        else if (type === 'audio') {
            if (value === 'supports') { selSupportsTrue = true; selSupportsFalse = false; }
            else if (value === 'notsupports') { selSupportsTrue = false; selSupportsFalse = true; }
        }


        const count = data.reduce((acc, item) => {

            if (selCats.length > 0) {
                if (!item.category || selCats.indexOf(item.category) === -1) return acc;
            }
            if (selSources.length > 0) {

                let rowSources = [];
                if (item.source) {
                    if (Array.isArray(item.source)) rowSources = item.source.map(s => s.toString().trim());
                    else rowSources = [String(item.source).trim()];
                }
                if (rowSources.length === 0) return acc;
                const intersects = selSources.some(s => rowSources.indexOf(s) !== -1);
                if (!intersects) return acc;
            }

            if (selAi || selNormal) {
                if (selAi && !selNormal) { if (!item.isAI) return acc; }
                else if (!selAi && selNormal) { if (item.isAI) return acc; }
            }

            if (typeof selSupportsTrue !== 'undefined' && (selSupportsTrue || selSupportsFalse)) {
                if (selSupportsTrue && !selSupportsFalse) { if (!item.supportsAudioTags) return acc; }
                else if (!selSupportsTrue && selSupportsFalse) { if (item.supportsAudioTags) return acc; }
            }

            if (selLangs.length > 0) {
                const rowLangs = (Array.isArray(item.languages) ? item.languages : (item.languages ? [item.languages] : [])).map(s => s.trim()).filter(Boolean);
                if (rowLangs.indexOf('*') === -1) {
                    const ok = selLangs.some(l => rowLangs.indexOf(l) !== -1);
                    if (!ok) return acc;
                }
            }

            if (selGenders.length > 0) {
                const rowGender = (item.type || '').toString().trim();
                if (selGenders.indexOf(rowGender) === -1) return acc;
            }
            return acc + 1;
        }, 0);


        const parent = cb.parentElement || cb.closest('label');
        if (parent) {
            const span = parent.querySelector('.filter-count');
            if (span) span.textContent = ' (' + count + ')';
        }
    });
}




function buildCategoryFilters() {

    const catContainer = document.getElementById('categoryFilters');
    const typeContainer = document.getElementById('typeFilters');
    const genderContainer = document.getElementById('genderFilters');
    const langContainer = document.getElementById('languageFilters');
    if (!catContainer || !typeContainer || !genderContainer || !langContainer) return;


    const data = (typeof ttsTable !== 'undefined' && Array.isArray(ttsTable)) ? ttsTable : [];
    const categories = new Set();
    const langs = new Set();
    const sources = new Set();
    data.forEach(item => {
        if (item.category) categories.add(item.category);

        if (item.source) {
            if (Array.isArray(item.source)) item.source.forEach(s => { if (s) sources.add(s); });
            else if (typeof item.source === 'string') sources.add(item.source);
        }
        (item.languages || []).forEach(l => langs.add(l));
    });

    catContainer.innerHTML = '';
    typeContainer.innerHTML = '';
    genderContainer.innerHTML = '';
    langContainer.innerHTML = '';




    const catTitle = document.createElement('div');
    catContainer.appendChild(catTitle);
    categories.forEach(cat => {
        const id = 'cat_' + cat.replace(/[^a-z0-9]/gi, '_');
        const wrapper = document.createElement('label');
        wrapper.style.display = 'block';
        wrapper.style.marginBottom = '6px';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('data-type', 'category');
        cb.value = cat;
        cb.id = id;
        cb.checked = false;
        cb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
        wrapper.appendChild(cb);
        const labelSpan = document.createElement('span');
        labelSpan.style.fontWeight = 'normal';
        labelSpan.textContent = ' ' + cat;
        wrapper.appendChild(labelSpan);
        const countSpan = document.createElement('span');
        countSpan.className = 'filter-count';
        countSpan.style.marginLeft = '6px';
        countSpan.style.color = '#666';
        countSpan.textContent = '';
        wrapper.appendChild(countSpan);
        catContainer.appendChild(wrapper);
    });


    const typeTitle = document.createElement('div');
    typeContainer.appendChild(typeTitle);

    const aiWrapper = document.createElement('label');
    aiWrapper.style.display = 'block';
    aiWrapper.style.marginBottom = '6px';
    const aiCb = document.createElement('input');
    aiCb.type = 'checkbox';
    aiCb.id = 'filterAI';
    aiCb.setAttribute('data-type', 'type');
    aiCb.value = 'ai';
    aiCb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
    aiWrapper.appendChild(aiCb);
    const aiSpan = document.createElement('span');
    aiSpan.style.fontWeight = 'normal';
    aiSpan.textContent = ' AI-stemmen';
    aiWrapper.appendChild(aiSpan);
    const aiCount = document.createElement('span');
    aiCount.className = 'filter-count';
    aiCount.style.marginLeft = '6px';
    aiCount.style.color = '#666';
    aiCount.textContent = '';
    aiWrapper.appendChild(aiCount);
    typeContainer.appendChild(aiWrapper);

    const normalWrapper = document.createElement('label');
    normalWrapper.style.display = 'block';
    normalWrapper.style.marginBottom = '6px';
    const normalCb = document.createElement('input');
    normalCb.type = 'checkbox';
    normalCb.id = 'filterNormal';
    normalCb.setAttribute('data-type', 'type');
    normalCb.value = 'normal';
    normalCb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
    normalWrapper.appendChild(normalCb);
    const normalSpan = document.createElement('span');
    normalSpan.style.fontWeight = 'normal';
    normalSpan.textContent = ' Gewone TTS';
    normalWrapper.appendChild(normalSpan);
    const normalCount = document.createElement('span');
    normalCount.className = 'filter-count';
    normalCount.style.marginLeft = '6px';
    normalCount.style.color = '#666';
    normalCount.textContent = '';
    normalWrapper.appendChild(normalCount);
    typeContainer.appendChild(normalWrapper);


    const audioContainer = document.getElementById('audioTagFilters');
    if (audioContainer) {
        audioContainer.innerHTML = '';
        const supWrapper = document.createElement('label');
        supWrapper.style.display = 'block';
        supWrapper.style.marginBottom = '6px';
        const supCb = document.createElement('input');
        supCb.type = 'checkbox';
        supCb.id = 'filterSupports';
        supCb.setAttribute('data-type', 'audio');
        supCb.value = 'supports';
        supCb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
        supWrapper.appendChild(supCb);
        const supSpan = document.createElement('span');
        supSpan.style.fontWeight = 'normal';
        supSpan.textContent = 'Ja';
        supWrapper.appendChild(supSpan);
        const supCount = document.createElement('span');
        supCount.className = 'filter-count';
        supCount.style.marginLeft = '6px';
        supCount.style.color = '#666';
        supCount.textContent = '';
        supWrapper.appendChild(supCount);
        audioContainer.appendChild(supWrapper);

        const notSupWrapper = document.createElement('label');
        notSupWrapper.style.display = 'block';
        notSupWrapper.style.marginBottom = '6px';
        const notSupCb = document.createElement('input');
        notSupCb.type = 'checkbox';
        notSupCb.id = 'filterNotSupports';
        notSupCb.setAttribute('data-type', 'audio');
        notSupCb.value = 'notsupports';
        notSupCb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
        notSupWrapper.appendChild(notSupCb);
        const notSupSpan = document.createElement('span');
        notSupSpan.style.fontWeight = 'normal';
        notSupSpan.textContent = 'Nee';
        notSupWrapper.appendChild(notSupSpan);
        const notSupCount = document.createElement('span');
        notSupCount.className = 'filter-count';
        notSupCount.style.marginLeft = '6px';
        notSupCount.style.color = '#666';
        notSupCount.textContent = '';
        notSupWrapper.appendChild(notSupCount);
        audioContainer.appendChild(notSupWrapper);
    }


    const gTitle = document.createElement('div');
    genderContainer.appendChild(gTitle);

    const maleWrapper = document.createElement('label');
    maleWrapper.style.display = 'block';
    maleWrapper.style.marginBottom = '6px';
    const maleCb = document.createElement('input');
    maleCb.type = 'checkbox';
    maleCb.id = 'filterMale';
    maleCb.setAttribute('data-type', 'gender');
    maleCb.value = 'Mannelijk';
    maleCb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
    maleWrapper.appendChild(maleCb);
    const maleSpan = document.createElement('span');
    maleSpan.style.fontWeight = 'normal';
    maleSpan.textContent = ' Mannelijk';
    maleWrapper.appendChild(maleSpan);
    const maleCount = document.createElement('span');
    maleCount.className = 'filter-count';
    maleCount.style.marginLeft = '6px';
    maleCount.style.color = '#666';
    maleCount.textContent = '';
    maleWrapper.appendChild(maleCount);
    genderContainer.appendChild(maleWrapper);

    const femaleWrapper = document.createElement('label');
    femaleWrapper.style.display = 'block';
    femaleWrapper.style.marginBottom = '6px';
    const femaleCb = document.createElement('input');
    femaleCb.type = 'checkbox';
    femaleCb.id = 'filterFemale';
    femaleCb.setAttribute('data-type', 'gender');
    femaleCb.value = 'Vrouwelijk';
    femaleCb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
    femaleWrapper.appendChild(femaleCb);
    const femaleSpan = document.createElement('span');
    femaleSpan.style.fontWeight = 'normal';
    femaleSpan.textContent = ' Vrouwelijk';
    femaleWrapper.appendChild(femaleSpan);
    const femaleCount = document.createElement('span');
    femaleCount.className = 'filter-count';
    femaleCount.style.marginLeft = '6px';
    femaleCount.style.color = '#666';
    femaleCount.textContent = '';
    femaleWrapper.appendChild(femaleCount);
    genderContainer.appendChild(femaleWrapper);


    const langTitle = document.createElement('div');
    langContainer.appendChild(langTitle);

    const langList = Array.from(langs).sort((a, b) => { if (a === '*') return -1; if (b === '*') return 1; return a.localeCompare(b); });

    const langLabel = (code) => {
        if (code === '*') return 'Engels & Nederlands';
        if (code === 'en') return 'Engels';
        if (code === 'nl') return 'Nederlands';
        return code;
    };

    langList.forEach(l => {
        const lw = document.createElement('label');
        lw.style.display = 'block';
        lw.style.marginBottom = '6px';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('data-type', 'lang');
        cb.value = l;
        cb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
        lw.appendChild(cb);
        const langSpan = document.createElement('span');
        langSpan.style.fontWeight = 'normal';
        langSpan.textContent = ' ' + langLabel(l);
        lw.appendChild(langSpan);
        const langCount = document.createElement('span');
        langCount.className = 'filter-count';
        langCount.style.marginLeft = '6px';
        langCount.style.color = '#666';
        langCount.textContent = '';
        lw.appendChild(langCount);
        langContainer.appendChild(lw);
    });


    const sourceContainer = document.getElementById('sourceFilters');
    if (sourceContainer) {
        sourceContainer.innerHTML = '';
        const srcList = Array.from(sources).sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
        srcList.forEach(src => {
            const lw = document.createElement('label');
            lw.style.display = 'block'; lw.style.marginBottom = '6px';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.setAttribute('data-type', 'source'); cb.value = src;
            cb.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
            lw.appendChild(cb);
            const span = document.createElement('span'); span.style.fontWeight = 'normal'; span.textContent = ' ' + src; lw.appendChild(span);
            const countSpan = document.createElement('span'); countSpan.className = 'filter-count'; countSpan.style.marginLeft = '6px'; countSpan.style.color = '#666'; countSpan.textContent = ''; lw.appendChild(countSpan);
            sourceContainer.appendChild(lw);
        });
    }
}


renderTtsTable();
buildCategoryFilters();

try {
    const favEl = document.getElementById('filterFavorites');
    if (favEl) favEl.addEventListener('change', () => { searchTable(); computeFilterCounts(); });
} catch (e) { }


function updateFavoritesFilterVisibility() {
    try {
        const favWrap = document.getElementById('favoritesFilter');
        if (!favWrap) return;
        const details = favWrap.closest && favWrap.closest('details.filter-option');
        const countSpan = favWrap.querySelector && favWrap.querySelector('.filter-count');
        const favCount = window.favorites ? window.favorites.count('tts') : 0;
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
        if (!p || p === 'tts') {
            updateFavoritesFilterVisibility();
            try { updateFavIndicators(); } catch (e) { }
        }
    } catch (e) { }
});

sortDirection[0] = true;
sortTable(0);
updateRowCount();

computeFilterCounts();

function applySort() {
    const sel = document.getElementById('sortSelect');
    if (!sel) return;
    const [colStr, dir] = sel.value.split(':');
    const col = parseInt(colStr, 10);


    sortDirection[col] = (dir === 'asc');
    sortTable(col);
}
const ttsCount = (typeof ttsTable !== 'undefined' && Array.isArray(ttsTable)) ? ttsTable.length : document.querySelectorAll('#ttsList li').length;
localStorage.setItem('ttsCount', ttsCount);

/* Preview modal: show image/audio/video files from /tts/ folder named after normalized stem name */
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
                const key = normalizeNameForFile(nameSrc || '');
                const isFav = window.favorites && window.favorites.isFav && window.favorites.isFav('tts', key);
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
                                <button class="preview-copy">Kopieer stemnaam</button>
                            </div>
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
            setTimeout(() => copyBtn.textContent = 'Kopieer stemnaam', 1200);
        });
    });


    try {
        const key = normalizeNameForFile(displayName || '');
        const favBtn = overlay.querySelector('.preview-fav');
        const shareBtn = overlay.querySelector('.preview-share');
        const page = 'tts';
        const updateFavUi = () => { if (!favBtn) return; const isFav = window.favorites && window.favorites.isFav(page, key); favBtn.textContent = isFav ? '★' : '☆'; };

        const popup = document.createElement('div'); popup.className = 'preview-popup'; popup.style.display = 'none'; document.body.appendChild(popup);

        try { const closeBtn = overlay.querySelector('.preview-close'); if (closeBtn) closeBtn.addEventListener('click', () => { try { popup.remove(); } catch (e) { } }); overlay.addEventListener('click', (e) => { if (e.target === overlay) { try { popup.remove(); } catch (e) { } } }); } catch (e) { }
        const showPopup = (msg) => { try { if (!popup) return; popup.textContent = msg; popup.style.display = 'block'; popup.style.opacity = '1'; setTimeout(() => { popup.style.transition = 'opacity 0.25s ease'; popup.style.opacity = '0'; }, 1200); setTimeout(() => { try { popup.style.display = 'none'; } catch (e) { } }, 1450); } catch (e) { } };
        if (favBtn) { favBtn.addEventListener('click', () => { try { const added = window.favorites.toggle(page, key); updateFavUi(); showPopup(added ? 'Favoriet toegevoegd' : 'Favoriet verwijderd'); } catch (e) { } }); updateFavUi(); }
        if (shareBtn) { shareBtn.addEventListener('click', () => { try { const url = window.favorites ? window.favorites.makeShareUrl(page, key) : (window.location.href + `?focus=${page}:${key}`); navigator.clipboard.writeText(url).then(() => { showPopup('Link gekopieerd'); }).catch(() => { showPopup('Link gekopieerd'); }); } catch (e) { } }); }
    } catch (e) { }


    const base = `${folder}/${name}`;
    let tried = false;

    function tryImage(exts, i) {
        if (i >= exts.length) return tryAudio(['.mp3', '.ogg', '.wav'], 0);
        const img = new Image();
        img.onload = () => { body.innerHTML = ''; body.appendChild(img); };
        img.onerror = () => tryImage(exts, i + 1);
        img.src = base + exts[i];
    }

    function tryAudio(exts, i) {
        if (i >= exts.length) return tryVideo(['.webm', '.mp4', '.ogg'], 0);
        const a = document.createElement('audio');
        a.controls = true; a.preload = 'metadata';
        a.oncanplaythrough = () => { body.innerHTML = ''; body.appendChild(a); };
        a.onerror = () => tryAudio(exts, i + 1);
        a.src = base + exts[i];
    }

    function tryVideo(exts, i) {
        if (i >= exts.length) { body.innerHTML = '<div class="preview-notfound">Geen voorbeeld beschikbaar.</div>'; return; }
        const v = document.createElement('video');
        v.controls = true; v.preload = 'metadata'; v.style.maxHeight = '60vh';
        v.oncanplaythrough = () => { body.innerHTML = ''; body.appendChild(v); };
        v.onerror = () => tryVideo(exts, i + 1);
        v.src = base + exts[i];
    }

    tryImage(['.png', '.jpg', '.jpeg', '.gif', '.webp'], 0);
}


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


function attachPreviewHandlers() {
    const rows = document.querySelectorAll('#ttsList li');
    rows.forEach(r => {
        const first = r.querySelector('.item-name');
        if (!first) return;
        const display = first.innerText.trim();
        first.title = 'Klik voor voorbeeld';
        first.addEventListener('click', () => showPreview('tts', display));
        previewExists('tts', display, (exists) => { if (exists) first.classList.add('has-preview'); });
    });
}


function applyFilterFromInfoTts(facet, text) {
    if (!text) return;
    const matchInContainer = (id, matchFn) => {
        const container = document.getElementById(id);
        if (!container) return false;
        const inputs = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        for (const input of inputs) {
            const lab = input.nextElementSibling ? input.nextElementSibling.textContent.trim() : '';
            const val = (input.value || '').toString().trim();
            if ((val && val.toLowerCase() === text.toLowerCase()) || (lab && lab.toLowerCase() === text.toLowerCase()) || (matchFn && matchFn(input, lab, val))) {
                if (!input.checked) { input.checked = true; input.dispatchEvent(new Event('change')); }
                return true;
            }
        }
        return false;
    };


    if (facet === 'lang') {
        const normalized = text.toLowerCase();
        if (normalized.includes('engels') && normalized.includes('nederlands')) {

            if (matchInContainer('languageFilters', (input, lab, val) => val === '*')) { searchTable(); computeFilterCounts(); return; }
            if (matchInContainer('languageFilters', (input, lab, val) => val === 'en')) { searchTable(); computeFilterCounts(); }
            if (matchInContainer('languageFilters', (input, lab, val) => val === 'nl')) { searchTable(); computeFilterCounts(); }
            return;
        }
        if (normalized.includes('engels')) { if (matchInContainer('languageFilters')) { searchTable(); computeFilterCounts(); return; } }
        if (normalized.includes('nederlands')) { if (matchInContainer('languageFilters')) { searchTable(); computeFilterCounts(); return; } }
    }

    if (facet === 'type') {

        if (text.toLowerCase().indexOf('ai') !== -1) {
            const inp = document.getElementById('filterAI'); if (inp) { if (!inp.checked) { inp.checked = true; inp.dispatchEvent(new Event('change')); } searchTable(); computeFilterCounts(); return; }
        }
    }

    if (facet === 'audio') {

        const inp = document.getElementById('filterSupports'); if (inp) { if (!inp.checked) { inp.checked = true; inp.dispatchEvent(new Event('change')); } searchTable(); computeFilterCounts(); return; }
    }


    function openGroupFor(id) {
        try {
            const el = document.getElementById(id);
            if (!el) return;
            const details = el.closest && el.closest('details.filter-option');
            if (details && !details.open) details.open = true;
        } catch (e) { }
    }

    if (facet === 'category') {
        openGroupFor('categoryFilters');
        if (matchInContainer('categoryFilters')) { searchTable(); computeFilterCounts(); return; }
    }
    if (facet === 'source') {
        openGroupFor('sourceFilters');

        if (matchInContainer('sourceFilters')) { searchTable(); computeFilterCounts(); return; }
    }
    if (facet === 'gender') {
        openGroupFor('genderFilters');
        if (matchInContainer('genderFilters')) { searchTable(); computeFilterCounts(); return; }
    }


    openGroupFor('typeFilters');
    openGroupFor('categoryFilters');
    if (matchInContainer('typeFilters') || matchInContainer('categoryFilters')) { searchTable(); computeFilterCounts(); return; }
}


attachPreviewHandlers();
try { updateFavIndicators(); } catch (e) { }



function scrollAndHighlightByKey(key) {
    try {
        const rows = Array.from(document.querySelectorAll('#ttsList li'));
        for (const r of rows) {
            const name = (r.dataset.name || (r.querySelector('.item-name-text') && r.querySelector('.item-name-text').textContent) || '').toString();
            if (normalizeNameForFile(name) === key) {
                r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const old = r.style.transition;
                r.style.transition = 'background-color 0.3s ease';
                const prevBg = r.style.backgroundColor;
                r.style.backgroundColor = '#fff79a';
                setTimeout(() => { r.style.backgroundColor = prevBg || ''; r.style.transition = old || ''; }, 2500);
                return true;
            }
        }
    } catch (e) { console.error('scrollAndHighlightByKey (tts) failed', e); }
    return false;
}


(function handleFocusFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const focus = params.get('focus') || location.hash.replace(/^#/, '') || '';
        if (!focus) return;
        const [page, key] = focus.split(':');
        if (page === 'tts' && key) {
            setTimeout(() => { try { scrollAndHighlightByKey(key); } catch (e) { } }, 300);
        }
    } catch (e) { /* ignore */ }
})();


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
        } else if (type === 'type') {
            const container = document.getElementById('typeFilters'); if (container) {
                const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => i.value === value);
                if (input) input.checked = false;
            }
        } else if (type === 'lang') {
            const container = document.getElementById('languageFilters'); if (container) {
                const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => i.value === value);
                if (input) input.checked = false;
            }
        } else if (type === 'source') {
            const container = document.getElementById('sourceFilters'); if (container) {
                const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => i.value === value);
                if (input) input.checked = false;
            }
        } else if (type === 'gender') {
            const container = document.getElementById('genderFilters'); if (container) {
                const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => i.value === value);
                if (input) input.checked = false;
            }
        } else if (type === 'audio') {
            const container = document.getElementById('audioTagFilters'); if (container) {
                const input = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(i => i.value === value);
                if (input) input.checked = false;
            }
        }

        searchTable();
    } catch (e) { console.error('failed to handle activeFilter:remove (tts)', e); }
});


window.addEventListener('activeFilter:clear', () => {
    try {
        const s = document.getElementById('searchInput'); if (s) s.value = '';

        ['categoryFilters', 'typeFilters', 'genderFilters', 'languageFilters', 'audioTagFilters', 'sourceFilters'].forEach(id => {
            const c = document.getElementById(id);
            if (!c) return;
            const inputs = Array.from(c.querySelectorAll('input[type="checkbox"]'));
            inputs.forEach(i => { if (i.checked) { i.checked = false; i.dispatchEvent(new Event('change')); } });
        });
        ['filterAI', 'filterNormal', 'filterSupports', 'filterNotSupports', 'filterMale', 'filterFemale', 'filterSupports', 'filterNotSupports'].forEach(id => {
            const el = document.getElementById(id); if (el && (el.type === 'checkbox')) { el.checked = false; el.dispatchEvent(new Event('change')); }
        });

        try { const fav = document.getElementById('filterFavorites'); if (fav) { fav.checked = false; } } catch (e) { }
        searchTable(); computeFilterCounts();
    } catch (e) { console.error('failed to clear filters (tts)', e); }
});
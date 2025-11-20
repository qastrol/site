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

// Render the ttsTable array into the DOM table body
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
        name.textContent = item.name || '';
        name.style.cursor = 'pointer';
        left.appendChild(name);

        // small info segment: languages and optional AI label
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
    // Build combined info: category • type • languages • AI-stem (omit empty parts)
    const infoParts = [];
    if (item.category) infoParts.push({ text: item.category, facet: 'category' });
    if (item.type) infoParts.push({ text: item.type, facet: 'gender' });
    if (humanLangs) infoParts.push({ text: humanLangs, facet: 'lang' });
    if (item.isAI) infoParts.push({ text: 'AI-stem', facet: 'type' });
    if (item.supportsAudioTags) infoParts.push({ text: 'Ondersteunt audio tags', facet: 'audio' });

    // Render clickable spans separated by bullets
    info.innerHTML = '';
    infoParts.forEach((p, idx) => {
        const span = document.createElement('span');
        span.className = 'info-part';
        span.textContent = p.text;
        span.style.cursor = 'pointer';
        span.dataset.facet = p.facet;
        span.addEventListener('click', () => applyFilterFromInfoTts(p.facet, p.text));
        info.appendChild(span);
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
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Kopieer';
        btn.addEventListener('click', function(){ copyToClipboard(this); });
        actions.appendChild(btn);

        meta.appendChild(actions);

        main.appendChild(left);
        main.appendChild(meta);
        li.appendChild(main);

    li.dataset.name = (item.name || '').toString();
    li.dataset.category = (item.category || '').toString();
    li.dataset.gender = (item.type || '').toString();
    li.dataset.isai = item.isAI ? '1' : '0';
    li.dataset.supportsaudiotags = item.supportsAudioTags ? '1' : '0';
    li.dataset.languages = (Array.isArray(item.languages) ? item.languages : (item.languages ? [item.languages] : [])).join(',');

        list.appendChild(li);
    });
}



    let sortDirection = [true, true, true, true, true]; // array om de sorteer volgorde bij te houden (incl. type & languages)

        // Functie om de tabel te sorteren (operates on the list view)
        function sortTable(n) {
            const list = document.getElementById('ttsList');
            if (!list) return;
            const items = Array.from(list.children);
            if (items.length === 0) return;

            // new column order: 0=name, 1=category (dataset), 2=type (dataset.gender), 3=languages, 4=description
            const colMap = { 0: '.item-name', 1: null, 2: null, 3: '.item-langs', 4: '.item-desc' };
            const sel = colMap[n];

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

        // Functie om de tabel te filteren op basis van de zoekopdracht
        function updateRowCount() {
            const items = Array.from(document.querySelectorAll('#ttsList li'));
            const visibleRowCount = items.reduce((acc, r) => acc + (r.style.display !== 'none' ? 1 : 0), 0);
            document.getElementById("rowCount").textContent = visibleRowCount;
        }

    // Functie om de tabel te filteren op basis van de zoekopdracht
        function searchTable() {
            const input = document.getElementById("searchInput");
            const filter = (input ? input.value : '').toLowerCase();
            const rows = Array.from(document.querySelectorAll('#ttsList li'));

        // Bepaal geselecteerde filters
        const checkedCategoryInputs = Array.from(document.querySelectorAll('#categoryFilters input[data-type="category"]:checked'));
        const checkedCats = checkedCategoryInputs.map(cb => cb.value);
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
    // Gender filters (Mannelijk / Vrouwelijk)
    const checkedGenderInputs = Array.from(document.querySelectorAll('#genderFilters input[data-type="gender"]:checked'));
    const checkedGenders = checkedGenderInputs.map(cb => cb.value);

        // Loop door alle tbody rijen
            rows.forEach(row => {
                const text = row.innerText || '';
                const textMatch = !filter || text.toLowerCase().indexOf(filter) > -1;

                // Category match (on dataset)
                const categoryText = row.dataset.category || '';
                let categoryMatch = true;
                if (checkedCats.length > 0) categoryMatch = checkedCats.indexOf(categoryText) !== -1;

                // Type filter (AI vs normal)
                let aiMatch = true;
                if (aiChecked || normalChecked) {
                    if (aiChecked && !normalChecked) aiMatch = row.dataset.isai === '1';
                    else if (!aiChecked && normalChecked) aiMatch = row.dataset.isai !== '1';
                    else aiMatch = true;
                }

                // supportsAudioTags filter
                let supportsMatch = true;
                if (supportsChecked || notSupportsChecked) {
                    if (supportsChecked && !notSupportsChecked) supportsMatch = row.dataset.supportsaudiotags === '1';
                    else if (!supportsChecked && notSupportsChecked) supportsMatch = row.dataset.supportsaudiotags === '0';
                    else supportsMatch = true;
                }

                // Languages filter
                let langMatch = true;
                if (checkedLangs.length > 0) {
                    const rowLangs = (row.dataset.languages || '').split(',').map(s => s.trim()).filter(Boolean);
                    if (rowLangs.indexOf('*') !== -1) langMatch = true;
                    else langMatch = checkedLangs.some(l => rowLangs.indexOf(l) !== -1);
                }

                // Gender filter (Type stem: Mannelijk / Vrouwelijk)
                let genderMatch = true;
                if (checkedGenders.length > 0) {
                    const rowGender = (row.dataset.gender || '').trim();
                    genderMatch = checkedGenders.indexOf(rowGender) !== -1;
                }

                const matchFound = textMatch && categoryMatch && aiMatch && langMatch && genderMatch && supportsMatch;
                row.style.display = matchFound ? '' : 'none';
            });

        // Werk de zichtbare rijcounter bij
        updateRowCount();
        // Werk de facet-aantallen bij
        computeFilterCounts();
        // render active filters (search, categories, types, languages, gender, audio tags)
        try {
            const active = [];
            const input = document.getElementById('searchInput');
            if (input && input.value && input.value.trim() !== '') active.push({ type: 'search', label: 'Zoek: "' + input.value.trim() + '"', value: input.value.trim() });
            // categories
            const catContainer = document.getElementById('categoryFilters');
            if (catContainer) {
                const boxes = Array.from(catContainer.querySelectorAll('input[type="checkbox"]:checked'));
                boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'category', label: lab, value: cb.value }); });
            }
            // type (AI/normal)
            const typeContainer = document.getElementById('typeFilters');
            if (typeContainer) {
                const boxes = Array.from(typeContainer.querySelectorAll('input[type="checkbox"]:checked'));
                boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'type', label: lab, value: cb.value }); });
            }
            // languages
            const langContainer = document.getElementById('languageFilters');
            if (langContainer) {
                const boxes = Array.from(langContainer.querySelectorAll('input[type="checkbox"]:checked'));
                boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'lang', label: lab, value: cb.value }); });
            }
            // gender
            const genderContainer = document.getElementById('genderFilters');
            if (genderContainer) {
                const boxes = Array.from(genderContainer.querySelectorAll('input[type="checkbox"]:checked'));
                boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'gender', label: lab, value: cb.value }); });
            }
            // audio tag support
            const audioContainer = document.getElementById('audioTagFilters');
            if (audioContainer) {
                const boxes = Array.from(audioContainer.querySelectorAll('input[type="checkbox"]:checked'));
                boxes.forEach(cb => { const lab = cb.nextElementSibling ? cb.nextElementSibling.textContent.trim() : cb.value; active.push({ type: 'audio', label: lab, value: cb.value }); });
            }
            if (window.activeFilters && typeof window.activeFilters.render === 'function') window.activeFilters.render(document.getElementById('activeFiltersContainer'), active);
        } catch (e) { console.error('active filters render failed (tts)', e); }
    }

// Bereken en werk per-filter aantallen bij op basis van de huidige selectie.
function computeFilterCounts() {
    const data = (typeof ttsTable !== 'undefined' && Array.isArray(ttsTable)) ? ttsTable : [];
    // huidige geselecteerde waarden per groep
    const checkedCats = Array.from(document.querySelectorAll('#categoryFilters input[data-type="category"]:checked')).map(c=>c.value);
    const checkedLangs = Array.from(document.querySelectorAll('#languageFilters input[data-type="lang"]:checked')).map(c=>c.value);
    const checkedGenders = Array.from(document.querySelectorAll('#genderFilters input[data-type="gender"]:checked')).map(c=>c.value);
    const aiCheckbox = document.querySelector('#filterAI');
    const normalCheckbox = document.querySelector('#filterNormal');
    const aiChecked = aiCheckbox ? aiCheckbox.checked : false;
    const normalChecked = normalCheckbox ? normalCheckbox.checked : false;
    const supportsCheckbox = document.querySelector('#filterSupports');
    const notSupportsCheckbox = document.querySelector('#filterNotSupports');
    const supportsChecked = supportsCheckbox ? supportsCheckbox.checked : false;
    const notSupportsChecked = notSupportsCheckbox ? notSupportsCheckbox.checked : false;

    // Loop over alle checkboxen in het filterpaneel
    const allCbs = Array.from(document.querySelectorAll('#filterPanel input[type="checkbox"]'));
    allCbs.forEach(cb => {
        const type = cb.getAttribute('data-type');
        const value = cb.value;

        // Start met kopieën van de huidige selectie
        let selCats = checkedCats.slice();
        let selLangs = checkedLangs.slice();
        let selGenders = checkedGenders.slice();
        let selAi = aiChecked;
        let selNormal = normalChecked;
        let selSupportsTrue = supportsChecked;
        let selSupportsFalse = notSupportsChecked;

        // Negeer bestaande selectie binnen dezelfde facet (we tonen counts alsof die facet leeg is)
        if (type === 'category') selCats = [];
        if (type === 'lang') selLangs = [];
        if (type === 'gender') selGenders = [];
        if (type === 'type') { selAi = false; selNormal = false; }
        if (type === 'audio') { selSupportsTrue = false; selSupportsFalse = false; }

        // Pas de kandidaatwaarde toe voor deze checkbox
        if (type === 'category') selCats = [value];
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

        // Tel matching items
        const count = data.reduce((acc, item) => {
            // category
            if (selCats.length > 0) {
                if (!item.category || selCats.indexOf(item.category) === -1) return acc;
            }
            // type (ai vs normal)
            if (selAi || selNormal) {
                if (selAi && !selNormal) { if (!item.isAI) return acc; }
                else if (!selAi && selNormal) { if (item.isAI) return acc; }
            }
            // supportsAudioTags filter
            if (typeof selSupportsTrue !== 'undefined' && (selSupportsTrue || selSupportsFalse)) {
                if (selSupportsTrue && !selSupportsFalse) { if (!item.supportsAudioTags) return acc; }
                else if (!selSupportsTrue && selSupportsFalse) { if (item.supportsAudioTags) return acc; }
            }
            // languages
            if (selLangs.length > 0) {
                const rowLangs = (Array.isArray(item.languages) ? item.languages : (item.languages ? [item.languages] : [])).map(s=>s.trim()).filter(Boolean);
                if (rowLangs.indexOf('*') === -1) {
                    const ok = selLangs.some(l => rowLangs.indexOf(l) !== -1);
                    if (!ok) return acc;
                }
            }
            // gender
            if (selGenders.length > 0) {
                const rowGender = (item.type || '').toString().trim();
                if (selGenders.indexOf(rowGender) === -1) return acc;
            }
            return acc + 1;
        }, 0);

        // Werk de bijbehorende count-span bij
        const parent = cb.parentElement || cb.closest('label');
        if (parent) {
            const span = parent.querySelector('.filter-count');
            if (span) span.textContent = ' (' + count + ')';
        }
    });
}
        

        // (init later after building filters)
        // Bouw dynamisch de categorie-checkboxes op basis van de tabelinhoud
        function buildCategoryFilters() {
            // Populate three separate containers so each <details> can toggle independently
            const catContainer = document.getElementById('categoryFilters');
            const typeContainer = document.getElementById('typeFilters');
            const genderContainer = document.getElementById('genderFilters');
            const langContainer = document.getElementById('languageFilters');
            if (!catContainer || !typeContainer || !genderContainer || !langContainer) return;

            // Build filters from the data array (ttsTable) rather than DOM rows
            const data = (typeof ttsTable !== 'undefined' && Array.isArray(ttsTable)) ? ttsTable : [];
            const categories = new Set();
            const langs = new Set();
            data.forEach(item => {
                if (item.category) categories.add(item.category);
                (item.languages || []).forEach(l => langs.add(l));
            });

            catContainer.innerHTML = '';
            typeContainer.innerHTML = '';
            genderContainer.innerHTML = '';
            langContainer.innerHTML = '';

            // Category checkboxes (in category container)
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

            // Type filters: AI-stemmen / Gewone TTS-stemmen (in type container)
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

            // Audio tags filters: supports / does not support (in audio container)
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

            // Gender filters: Mannelijk / Vrouwelijk (in separate gender container)
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

            // Language filters (in language container)
            const langTitle = document.createElement('div');
            langContainer.appendChild(langTitle);
            // normalize ordering: put '*' first if present
            const langList = Array.from(langs).sort((a,b)=>{ if (a==='*') return -1; if (b==='*') return 1; return a.localeCompare(b); });
            // map codes to readable labels
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
        }

    // Render table and initialize UI (render must run before attaching handlers)
    renderTtsTable();
    buildCategoryFilters();
    // Initialiseer sortering: zorg dat kolom 0 (Stemnaam) oplopend wordt gesorteerd
    sortDirection[0] = true; // zet expliciet op ascending
    sortTable(0);
    updateRowCount();
    // initialiseer facet-aantallen
    computeFilterCounts();
        // Hook voor sort-select in sidebar
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
    const ttsCount = (typeof ttsTable !== 'undefined' && Array.isArray(ttsTable)) ? ttsTable.length : document.querySelectorAll('#ttsList li').length;
    localStorage.setItem('ttsCount', ttsCount);

        /* Preview modal: show image/audio/video files from /tts/ folder named after normalized stem name */
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

            // Try image -> audio -> video
            const base = `${folder}/${name}`;
            let tried = false;

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
            // try image
            const img = new Image();
            let done = false;
            img.onload = () => { if (!done) { done = true; cb(true); } };
            img.onerror = () => {
                // try audio
                const a = document.createElement('audio');
                a.oncanplaythrough = () => { if (!done) { done = true; cb(true); } };
                a.onerror = () => {
                    // try video
                    const v = document.createElement('video');
                    v.oncanplaythrough = () => { if (!done) { done = true; cb(true); } };
                    v.onerror = () => { if (!done) { done = true; cb(false); } };
                    v.src = base + '.mp4';
                };
                a.src = base + '.mp3';
            };
            img.src = base + '.png';
        }

        // Attach preview handlers to first-column names, and mark those with previews
        function attachPreviewHandlers(){
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

        // Apply a filter when an info-part is clicked (tts page)
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

            // special mapping for languages and some labels
            if (facet === 'lang') {
                const normalized = text.toLowerCase();
                if (normalized.includes('engels') && normalized.includes('nederlands')) {
                    // prefer '*' if present, otherwise check both en/nl
                    if (matchInContainer('languageFilters', (input, lab, val) => val === '*')) { searchTable(); computeFilterCounts(); return; }
                    if (matchInContainer('languageFilters', (input, lab, val) => val === 'en')) { searchTable(); computeFilterCounts(); }
                    if (matchInContainer('languageFilters', (input, lab, val) => val === 'nl')) { searchTable(); computeFilterCounts(); }
                    return;
                }
                if (normalized.includes('engels')) { if (matchInContainer('languageFilters')) { searchTable(); computeFilterCounts(); return; } }
                if (normalized.includes('nederlands')) { if (matchInContainer('languageFilters')) { searchTable(); computeFilterCounts(); return; } }
            }

            if (facet === 'type') {
                // AI label -> filterAI
                if (text.toLowerCase().indexOf('ai') !== -1) {
                    const inp = document.getElementById('filterAI'); if (inp) { if (!inp.checked) { inp.checked = true; inp.dispatchEvent(new Event('change')); } searchTable(); computeFilterCounts(); return; }
                }
            }

            if (facet === 'audio') {
                // 'Ondersteunt audio tags' -> filterSupports
                const inp = document.getElementById('filterSupports'); if (inp) { if (!inp.checked) { inp.checked = true; inp.dispatchEvent(new Event('change')); } searchTable(); computeFilterCounts(); return; }
            }

            // generic category/gender match
            if (facet === 'category') { if (matchInContainer('categoryFilters')) { searchTable(); computeFilterCounts(); return; } }
            if (facet === 'gender') { if (matchInContainer('genderFilters')) { searchTable(); computeFilterCounts(); return; } }

            // fallback: try type and category containers
            if (matchInContainer('typeFilters') || matchInContainer('categoryFilters')) { searchTable(); computeFilterCounts(); return; }
        }

        // Run preview attachment after render
        attachPreviewHandlers();

// Handle chip removal events
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
        // re-run search to refresh UI
        searchTable();
    } catch (e) { console.error('failed to handle activeFilter:remove (tts)', e); }
});
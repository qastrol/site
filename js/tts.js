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
    // Build combined info: category • languages • AI-stem (omit empty parts)
    const infoParts = [];
    if (item.category) infoParts.push(item.category);
    if (humanLangs) infoParts.push(humanLangs);
    if (item.isAI) infoParts.push('AI-stem');
    info.textContent = infoParts.join(' • ');
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
    li.dataset.isai = item.isAI ? '1' : '0';
    li.dataset.languages = (Array.isArray(item.languages) ? item.languages : (item.languages ? [item.languages] : [])).join(',');

        list.appendChild(li);
    });
}



        let sortDirection = [true, true, true, true]; // array om de sorteer volgorde bij te houden (incl. languages)

        // Functie om de tabel te sorteren (operates on the list view)
        function sortTable(n) {
            const list = document.getElementById('ttsList');
            if (!list) return;
            const items = Array.from(list.children);
            if (items.length === 0) return;

            // new column order: 0=name, 1=category (dataset), 2=languages, 3=description
            const colMap = { 0: '.item-name', 1: null, 2: '.item-langs', 3: '.item-desc' };
            const sel = colMap[n];

            const isNumeric = items.every(li => {
                let txt = '';
                if (sel) {
                    const el = li.querySelector(sel);
                    txt = el ? el.innerText.trim() : '';
                } else {
                    txt = li.dataset.category || '';
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
                    aText = a.dataset.category || '';
                    bText = b.dataset.category || '';
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
    const checkedLangInputs = Array.from(document.querySelectorAll('#languageFilters input[data-type="lang"]:checked'));
        const checkedLangs = checkedLangInputs.map(cb => cb.value);

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

                // Languages filter
                let langMatch = true;
                if (checkedLangs.length > 0) {
                    const rowLangs = (row.dataset.languages || '').split(',').map(s => s.trim()).filter(Boolean);
                    if (rowLangs.indexOf('*') !== -1) langMatch = true;
                    else langMatch = checkedLangs.some(l => rowLangs.indexOf(l) !== -1);
                }

                const matchFound = textMatch && categoryMatch && aiMatch && langMatch;
                row.style.display = matchFound ? '' : 'none';
            });

        // Werk de zichtbare rijcounter bij
        updateRowCount();
    }
        

        // (init later after building filters)
        // Bouw dynamisch de categorie-checkboxes op basis van de tabelinhoud
        function buildCategoryFilters() {
            // Populate three separate containers so each <details> can toggle independently
            const catContainer = document.getElementById('categoryFilters');
            const typeContainer = document.getElementById('typeFilters');
            const langContainer = document.getElementById('languageFilters');
            if (!catContainer || !typeContainer || !langContainer) return;

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
                cb.addEventListener('change', () => searchTable());
                wrapper.appendChild(cb);
                const span = document.createElement('span');
                span.style.fontWeight = 'normal';
                span.textContent = ' ' + cat;
                wrapper.appendChild(span);
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
            aiCb.addEventListener('change', () => searchTable());
            aiWrapper.appendChild(aiCb);
            const aiSpan = document.createElement('span');
            aiSpan.style.fontWeight = 'normal';
            aiSpan.textContent = ' AI-stemmen';
            aiWrapper.appendChild(aiSpan);
            typeContainer.appendChild(aiWrapper);

            const normalWrapper = document.createElement('label');
            normalWrapper.style.display = 'block';
            normalWrapper.style.marginBottom = '6px';
            const normalCb = document.createElement('input');
            normalCb.type = 'checkbox';
            normalCb.id = 'filterNormal';
            normalCb.setAttribute('data-type', 'type');
            normalCb.value = 'normal';
            normalCb.addEventListener('change', () => searchTable());
            normalWrapper.appendChild(normalCb);
            const normalSpan = document.createElement('span');
            normalSpan.style.fontWeight = 'normal';
            normalSpan.textContent = ' Gewone TTS-stemmen';
            normalWrapper.appendChild(normalSpan);
            typeContainer.appendChild(normalWrapper);

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
                cb.addEventListener('change', () => searchTable());
                lw.appendChild(cb);
                const langSpan = document.createElement('span');
                langSpan.style.fontWeight = 'normal';
                langSpan.textContent = ' ' + langLabel(l);
                lw.appendChild(langSpan);
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

        // Run preview attachment after render
        attachPreviewHandlers();
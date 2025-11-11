        // Functie om effectnaam te kopiëren naar klembord
        function copyToClipboard(button) {
            const li = button.closest('li');
            const codeEl = li ? li.querySelector('.item-code') : null;
            const effectName = codeEl ? codeEl.innerText.trim() : '';
            if (!effectName) return;
            navigator.clipboard.writeText(effectName).then(() => {
                alert(`Effectnaam '${effectName}' gekopieerd naar het klembord!`);
            }).catch(err => {
                console.error('Kopiëren mislukt', err);
            });
        }

        let sortDirection = [true, true, true]; // Eén richting per kolom

function sortTable(n) {
    const list = document.getElementById('alertList');
    if (!list) return;
    const items = Array.from(list.children);
    if (!items.length) return;

    // map column indices to selectors inside the item
    const colMap = {
        0: '.item-name',
        1: '.item-desc',
        2: '.item-code'
    };
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

    if (!sortDirection[n]) items.reverse();
    items.forEach(it => list.appendChild(it));
    sortDirection[n] = !sortDirection[n];
}


        // Functie om de tabel te filteren en het aantal zichtbare rijen bij te werken
        function searchTable() {
            const input = document.getElementById("searchInput");
            const filter = (input ? input.value : '').toLowerCase();
            const items = document.querySelectorAll('#alertList li');
            let visibleCount = 0;
            items.forEach(li => {
                const text = li.innerText || '';
                const matchFound = !filter || text.toLowerCase().indexOf(filter) > -1;
                li.style.display = matchFound ? '' : 'none';
                if (matchFound) visibleCount++;
            });
            document.getElementById("rowCount").textContent = visibleCount;
        }

        // Functie om het aantal zichtbare rijen te berekenen bij pagina-initialisatie
        function updateRowCount() {
            const items = Array.from(document.querySelectorAll('#alertList li'));
            const visibleCount = items.filter(it => it.style.display !== 'none').length;
            document.getElementById('rowCount').textContent = visibleCount;
        }

        // Render the alerts table from the `alertsTable` data source.
        function renderAlertsTable() {
            const list = document.getElementById('alertList');
            if (!list) return;
            list.innerHTML = '';
            if (typeof alertsTable === 'undefined' || !Array.isArray(alertsTable)) return;

            alertsTable.forEach(item => {
                const li = document.createElement('li');
                li.className = 'item-listing__item';

                const main = document.createElement('div');
                main.className = 'item-listing__main';

                const left = document.createElement('div');
                left.className = 'item-listing__left';
                const name = document.createElement('div');
                name.className = 'item-name';
                name.textContent = item.name || '';
                name.title = 'Klik voor voorbeeld';
                const desc = document.createElement('div');
                desc.className = 'item-desc';
                desc.innerHTML = item.description || '';
                left.appendChild(name);
                left.appendChild(desc);

                const meta = document.createElement('div');
                meta.className = 'item-meta';
                const code = document.createElement('div');
                code.className = 'item-code';
                code.textContent = item.code || '';
                const actions = document.createElement('div');
                actions.className = 'item-actions';
                const btn = document.createElement('button');
                btn.className = 'copy-btn';
                btn.textContent = 'Kopieer';
                btn.addEventListener('click', function() { copyToClipboard(this); });
                actions.appendChild(btn);

                meta.appendChild(code);
                meta.appendChild(actions);

                main.appendChild(left);
                main.appendChild(meta);
                li.appendChild(main);

                // attach dataset attributes for filters/preview
                li.dataset.name = (item.name || '').toString();
                li.dataset.desc = (item.description || '').toString();
                li.dataset.code = (item.code || '').toString();

                list.appendChild(li);
            });
        }
        // Hook voor de sort select in de sidebar
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
    const alertCount = document.querySelectorAll('#alertList li').length;
    localStorage.setItem('alertCount', alertCount);

        /* Preview modal for alerts from /alerts/ */
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
            // If a pre-generated mapping (alertsLinks) exists, use it to pick the
            // exact file path to show. This avoids probing by constructing many
            // elements and ensures no media is loaded until the user opens the preview.
            try {
                const mappingFiles = (typeof window.getAlertsFiles === 'function') ? window.getAlertsFiles(name) : (window.alertsLinks && window.alertsLinks[name]) || [];
                if (mappingFiles && mappingFiles.length > 0) {
                    // Prefer video files for alerts previews (.mp4, .webm), but
                    // also accept audio files (.mp3, .ogg) if present in the mapping.
                    const videoExts = ['.webm', '.mp4'];
                    const audioExts = ['.mp3', '.ogg'];
                    let chosen = null;
                    let chosenType = null;
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
                            // set src only now to avoid preloading
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
                // fallback to probing behavior below
            }

            // fallback: probe common extensions (this will create elements and may
            // trigger small network checks, used only when mapping is not available)
            const base = `${folder}/${name}`;

            function tryVideo(exts, i) {
                if (i >= exts.length) { body.innerHTML = '<div class="preview-notfound">Geen voorbeeld beschikbaar.</div>'; return; }
                const v = document.createElement('video');
                v.controls = true; v.preload = 'metadata'; v.style.maxHeight = '60vh';
                v.oncanplaythrough = () => { body.innerHTML = ''; body.appendChild(v); };
                v.onerror = () => tryVideo(exts, i+1);
                v.src = base + exts[i];
            }

        }

        // Helper to check if a preview file exists (image -> audio -> video)
        // Use HTTP HEAD (or GET with Range) to avoid downloading the whole file.
        // Calls cb(true/false) when detection is complete.
        async function _checkUrlExists(url) {
            try {
                // Try HEAD first (no body downloaded)
                const head = await fetch(url, { method: 'HEAD' });
                if (head && head.ok) return true;
                // If server doesn't like HEAD (405/501), try a small ranged GET
                if (head && (head.status === 405 || head.status === 501)) {
                    const getr = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
                    return Boolean(getr && getr.ok);
                }
            } catch (e) {
                // network error or CORS; try small ranged GET as fallback
                try {
                    const getr = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
                    return Boolean(getr && getr.ok);
                } catch (err) {
                    return false;
                }
            }
            return false;
        }

        function previewExists(folder, displayName, cb) {
            const name = normalizeNameForFile(displayName);
            const base = `${folder}/${name}`;

            // If a generated mapping is available, consult it first to avoid any network checks.
            try {
                // Prefer the generated mapping and accept video (.mp4/.webm)
                // and audio (.mp3/.ogg) as valid preview files.
                const matchesMedia = (f) => /\.(mp4|webm|mp3|ogg)(?:$|[?#])/i.test(f);
                if (typeof window.getAlertsFiles === 'function') {
                    const files = window.getAlertsFiles(name) || [];
                    if (files.some(matchesMedia)) { cb(true); return; }
                } else if (typeof window.alertsLinks !== 'undefined') {
                    const files = window.alertsLinks[name] || [];
                    if (files.some(matchesMedia)) { cb(true); return; }
                }
            } catch (e) {
                // ignore and fall back to HTTP probing
            }

            // sequence: video-only (HTTP-based probing) — only check .webm/.mp4
            (async () => {
                // Check video first, then audio. We only probe a small set of
                // extensions to avoid extra network work.
                const videoExts = ['.webm', '.mp4'];
                for (const e of videoExts) {
                    if (await _checkUrlExists(base + e)) { cb(true); return; }
                }
                const audioExts = ['.mp3', '.ogg'];
                for (const e of audioExts) {
                    if (await _checkUrlExists(base + e)) { cb(true); return; }
                }
                // no local video found: no preview available
                cb(false);
            })();
        }

        // Attach preview handlers to first-column names and mark those with previews
        function attachPreviewHandlers(){
            const rows = document.querySelectorAll('#alertList li');
            rows.forEach(r => {
                const first = r.querySelector('.item-name');
                if (!first) return;
                const display = first.innerText.trim();
                first.title = 'Klik voor voorbeeld';
                first.addEventListener('click', () => showPreview('alerts', display));
                previewExists('alerts', display, (exists) => {
                    if (exists) first.classList.add('has-preview');
                });
            });

            // Intercept any anchor that points to a local alerts media file or folder
            // so the media isn't loaded until the preview overlay is requested.
            const anchors = document.querySelectorAll('#alertList a[href]');
            anchors.forEach(a => {
                try {
                    const href = a.getAttribute('href') || '';
                    const lower = href.toLowerCase();
                    // If the link targets the alerts folder or a media file extension, intercept it
                    const isLocalAlert = lower.includes('/alerts/') || lower.match(/\.(mp4|webm|mp3|ogg)(?:$|[?#])/i);
                    if (isLocalAlert) {
                        a.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            // Derive a display name from the filename or the link text
                            const filename = href.split('/').pop().split(/[?#]/)[0] || a.innerText.trim();
                            const name = filename.replace(/\.[^/.]+$/, '');
                            showPreview('alerts', name);
                        });
                        // avoid the browser prefetching the resource
                        a.rel = (a.rel || '') + ' noopener';
                    }
                } catch (e) {
                    // ignore
                }
            });
        }

        // Initialize on DOMContentLoaded: render table, attach handlers and sort
        document.addEventListener("DOMContentLoaded", function() {
            renderAlertsTable();
            attachPreviewHandlers();
            // apply initial sort (respect selector)
            const sel = document.getElementById('sortSelect');
            if (sel) {
                const [colStr, dir] = sel.value.split(':');
                const col = parseInt(colStr, 10);
                sortDirection[col] = (dir === 'asc');
            }
            sortTable(0);
            updateRowCount();
        });
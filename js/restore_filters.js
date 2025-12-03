// restore_filters.js
// Generic helper to persist filter panel state per page and offer to restore
(function(){
    const PAGE_KEYS = ['alerts','noobpoints','soundeffects','tts'];

    function detectPage() {
        if (document.getElementById('alertList')) return 'alerts';
        if (document.getElementById('redeemList')) return 'noobpoints';
        if (document.getElementById('soundEffectsList')) return 'soundeffects';
        if (document.getElementById('ttsList')) return 'tts';
        return null;
    }

    function storageKeyFor(page){ return 'savedFilters:' + page; }

    function collectFilterState() {
        const panel = document.getElementById('filterPanel');
        if (!panel) return {};
        const state = {};
        // text inputs
        Array.from(panel.querySelectorAll('input[type="text"], input[type="search"]')).forEach(i => { state[i.id||i.name||i.dataset.key||i.tagName+'_'+Math.random()] = {type:'text', id:i.id, value:i.value}; });
        // number inputs
        Array.from(panel.querySelectorAll('input[type="number"]')).forEach(i => { state[i.id||i.name] = {type:'number', id:i.id, value:i.value}; });
        // checkboxes
        Array.from(panel.querySelectorAll('input[type="checkbox"]')).forEach(i => { state[i.id||i.name||i.value] = {type:'checkbox', id:i.id, checked:i.checked, value:i.value}; });
        return state;
    }

    function saveState(page){
        try {
            const s = collectFilterState();
            localStorage.setItem(storageKeyFor(page), JSON.stringify(s));
        } catch(e) { /* ignore storage failures */ }
    }

    function readState(page){
        try { const raw = localStorage.getItem(storageKeyFor(page)); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
    }

    function anyActive(state) {
        if (!state) return false;
        for (const k in state) {
            const v = state[k];
            if (v.type === 'checkbox' && v.checked) return true;
            if ((v.type === 'text' || v.type === 'number') && (v.value !== null && v.value !== '')) return true;
        }
        return false;
    }

    function humanLabelFor(inputId, fallback) {
        if (!inputId) return fallback||'';
        // Known human-readable overrides for common input IDs
        const LABEL_OVERRIDES = {
            'searchInput': 'Zoekopdracht'
        };
        if (LABEL_OVERRIDES[inputId]) return LABEL_OVERRIDES[inputId];
        const el = document.getElementById(inputId);
        if (el) {
            // try label with for
            const lbl = document.querySelector('label[for="' + inputId + '"]');
            if (lbl) return lbl.textContent.trim();
            // try next sibling label
            if (el.nextElementSibling) {
                const sib = el.nextElementSibling;
                if (sib.tagName === 'LABEL' || sib.tagName === 'SPAN' || sib.tagName === 'DIV') return sib.textContent.trim();
            }
        }
        return fallback || inputId;
    }

    function buildSummary(state) {
        const bits = [];
        if (!state) return '';
        for (const k in state) {
            const v = state[k];
            if (v.type === 'checkbox' && v.checked) {
                // prefer human-readable label; if not available, try mapping common values
                let label = humanLabelFor(v.id, '');
                if (!label || label === v.id) {
                    // try to find an input by value inside the panel
                    try {
                        const found = document.querySelector('#filterPanel input[type="checkbox"][value="' + CSS.escape(v.value) + '"]');
                        if (found && found.nextElementSibling) label = found.nextElementSibling.textContent.trim();
                    } catch(e) {}
                }
                // fallback mappings for known tts values
                if (!label) {
                    if (v.value === 'ai') label = 'AI-stemmen';
                    else if (v.value === 'normal') label = 'Gewone TTS';
                    else label = v.value;
                }
                bits.push(label);
            } else if ((v.type === 'text' || v.type === 'number') && v.value) {
                const label = humanLabelFor(v.id, v.id || 'zoek');
                bits.push(label + ': "' + String(v.value) + '"');
            }
        }
        return bits.join(' · ');
    }

    function applyState(state) {
        if (!state) return;
        for (const k in state) {
            const v = state[k];
            try {
                if (v.type === 'checkbox') {
                    const el = document.getElementById(v.id) || document.querySelector('#filterPanel input[type="checkbox"][value="' + CSS.escape(v.value) + '"]');
                    if (el) { el.checked = !!v.checked; el.dispatchEvent(new Event('change')); }
                } else if (v.type === 'text' || v.type === 'number') {
                    const el = document.getElementById(v.id) || document.querySelector('#filterPanel input[type="text"]');
                    if (el) { el.value = v.value; el.dispatchEvent(new Event('input')); }
                }
            } catch(e) { /* ignore per-field apply errors */ }
        }
    }

    function callRefreshFor(page){
        try {
            if (page === 'alerts' && typeof window.refreshFilters === 'function') { window.refreshFilters(); }
            else if (page === 'noobpoints' && typeof window.refreshTable === 'function') { window.refreshTable(); if (typeof window.computeFilterCountsNoob === 'function') window.computeFilterCountsNoob(); }
            else if (page === 'soundeffects' && typeof window.refreshTable === 'function') { window.refreshTable(); }
            else if (page === 'tts' && typeof window.searchTable === 'function') { window.searchTable(); }
        } catch(e) {}
    }

    function createBanner(summary, onYes, onNo) {
        const container = document.createElement('div');
        container.className = 'restore-filters-banner';
        container.style.background = '#fff7d6';
        container.style.border = '1px solid #f0e1a8';
        container.style.padding = '10px';
        container.style.marginBottom = '10px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'space-between';
        container.style.gap = '12px';

        const left = document.createElement('div');
        left.style.flex = '1';
        const p = document.createElement('div'); p.style.fontWeight='600'; p.textContent = 'Wil je verder met je laatstgebruikte filters?';
        const s = document.createElement('div'); s.style.fontSize='0.95rem'; s.style.color='#333'; s.textContent = summary || '';
        left.appendChild(p); left.appendChild(s);

        const right = document.createElement('div');
        right.style.display='flex'; right.style.gap='8px';
        const yes = document.createElement('button'); yes.className='btn-restore-yes'; yes.textContent='Ja, graag!'; yes.style.padding='6px 10px'; yes.addEventListener('click', onYes);
        const no = document.createElement('button'); no.className='btn-restore-no'; no.textContent='Nee, dank je'; no.style.padding='6px 10px'; no.addEventListener('click', onNo);
        right.appendChild(yes); right.appendChild(no);

        container.appendChild(left); container.appendChild(right);
        return container;
    }

    // Initialize: detect page, hook saving, and show banner if stored state exists
    document.addEventListener('DOMContentLoaded', () => {
        const page = detectPage();
        if (!page) return;
        // attach save handler to filter panel
        const panel = document.getElementById('filterPanel');
        if (panel) {
            panel.addEventListener('change', () => saveState(page));
            panel.addEventListener('input', (ev) => {
                // save text inputs on input
                if (ev.target && (ev.target.tagName === 'INPUT')) saveState(page);
            });
        }

        // Also save when specific numeric inputs change outside the panel (eg min/max inputs)
        ['minLength','maxLength','minCostInput','maxCostInput'].forEach(id => {
            const el = document.getElementById(id); if (el) el.addEventListener('input', () => saveState(page));
        });

        // read stored state and show banner if applicable
        const stored = readState(page);
        if (stored && anyActive(stored)) {
            const summary = buildSummary(stored) || '(je laatstgebruikte filters)';
            const banner = createBanner(summary, () => {
                try { applyState(stored); callRefreshFor(page); } catch(e){}
                banner.remove();
            }, () => {
                try { localStorage.removeItem(storageKeyFor(page)); } catch(e){}
                banner.remove();
            });

            // Insert banner above activeFiltersContainer or at top of main area
            const activeCont = document.getElementById('activeFiltersContainer');
            if (activeCont && activeCont.parentNode) activeCont.parentNode.insertBefore(banner, activeCont);
            else {
                // fallback: insert as first child of main area
                const main = document.querySelector('.main-area'); if (main) main.insertBefore(banner, main.firstChild);
            }

            // If the user manually interacts with any filter controls, treat that
            // as a "Nee, dank je" response: remove stored filters and dismiss
            // the banner so it doesn't reappear later.
            const dismissByUser = () => {
                try { localStorage.removeItem(storageKeyFor(page)); } catch(e) {}
                try { if (banner && banner.parentNode) banner.remove(); } catch(e) {}
            };

            // Attach listeners to the filter panel so the first user interaction
            // dismisses the banner. Use `{ once: true }` so they auto-remove.
            const panelEl = document.getElementById('filterPanel');
            if (panelEl) {
                try {
                    panelEl.addEventListener('change', dismissByUser, { once: true });
                    panelEl.addEventListener('input', dismissByUser, { once: true });
                } catch (e) {
                    // older browsers may not support options object; fallback
                    panelEl.addEventListener('change', dismissByUser);
                    panelEl.addEventListener('input', dismissByUser);
                }
            } else {
                // fallback: observe clicks on any inputs/selects inside the banner's vicinity
                const nearby = document.querySelector('.main-area') || document.body;
                const clickHandler = (ev) => {
                    const t = ev.target;
                    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'BUTTON' || t.tagName === 'TEXTAREA')) {
                        dismissByUser();
                        nearby.removeEventListener('click', clickHandler);
                    }
                };
                nearby.addEventListener('click', clickHandler);
            }
        }
    });
})();

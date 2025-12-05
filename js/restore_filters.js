

(function () {
    const PAGE_KEYS = ['alerts', 'noobpoints', 'soundeffects', 'tts'];

    function detectPage() {
        if (document.getElementById('alertList')) return 'alerts';
        if (document.getElementById('redeemList')) return 'noobpoints';
        if (document.getElementById('soundEffectsList')) return 'soundeffects';
        if (document.getElementById('ttsList')) return 'tts';
        return null;
    }

    function storageKeyFor(page) { return 'savedFilters:' + page; }

    function collectFilterState() {
        const panel = document.getElementById('filterPanel');
        if (!panel) return {};
        const state = {};

        Array.from(panel.querySelectorAll('input[type="text"], input[type="search"]')).forEach(i => { state[i.id || i.name || i.dataset.key || i.tagName + '_' + Math.random()] = { type: 'text', id: i.id, value: i.value }; });

        Array.from(panel.querySelectorAll('input[type="number"]')).forEach(i => { state[i.id || i.name] = { type: 'number', id: i.id, value: i.value }; });

        Array.from(panel.querySelectorAll('input[type="checkbox"]')).forEach(i => { state[i.id || i.name || i.value] = { type: 'checkbox', id: i.id, checked: i.checked, value: i.value }; });
        return state;
    }

    function saveState(page) {
        try {
            const s = collectFilterState();
            localStorage.setItem(storageKeyFor(page), JSON.stringify(s));
        } catch (e) { /* ignore storage failures */ }
    }

    function readState(page) {
        try { const raw = localStorage.getItem(storageKeyFor(page)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
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
        if (!inputId) return fallback || '';

        const LABEL_OVERRIDES = {
            'searchInput': 'Zoekopdracht'
        };
        if (LABEL_OVERRIDES[inputId]) return LABEL_OVERRIDES[inputId];
        const el = document.getElementById(inputId);
        if (el) {

            const lbl = document.querySelector('label[for="' + inputId + '"]');
            if (lbl) return lbl.textContent.trim();

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

                let label = humanLabelFor(v.id, '');
                if (!label || label === v.id) {

                    try {
                        const found = document.querySelector('#filterPanel input[type="checkbox"][value="' + CSS.escape(v.value) + '"]');
                        if (found && found.nextElementSibling) label = found.nextElementSibling.textContent.trim();
                    } catch (e) { }
                }

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
            } catch (e) { /* ignore per-field apply errors */ }
        }
    }

    function callRefreshFor(page) {
        try {
            if (page === 'alerts' && typeof window.refreshFilters === 'function') { window.refreshFilters(); }
            else if (page === 'noobpoints' && typeof window.refreshTable === 'function') { window.refreshTable(); if (typeof window.computeFilterCountsNoob === 'function') window.computeFilterCountsNoob(); }
            else if (page === 'soundeffects' && typeof window.refreshTable === 'function') { window.refreshTable(); }
            else if (page === 'tts' && typeof window.searchTable === 'function') { window.searchTable(); }
        } catch (e) { }
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
        const p = document.createElement('div'); p.style.fontWeight = '600'; p.textContent = 'Wil je verder met je laatstgebruikte filters?';
        const s = document.createElement('div'); s.style.fontSize = '0.95rem'; s.style.color = '#333'; s.textContent = summary || '';
        left.appendChild(p); left.appendChild(s);

        const right = document.createElement('div');
        right.style.display = 'flex'; right.style.gap = '8px';
        const yes = document.createElement('button'); yes.className = 'btn-restore-yes'; yes.textContent = 'Ja, graag!'; yes.style.padding = '6px 10px'; yes.addEventListener('click', onYes);
        const no = document.createElement('button'); no.className = 'btn-restore-no'; no.textContent = 'Nee, dank je'; no.style.padding = '6px 10px'; no.addEventListener('click', onNo);
        right.appendChild(yes); right.appendChild(no);

        container.appendChild(left); container.appendChild(right);
        return container;
    }


    document.addEventListener('DOMContentLoaded', () => {
        const page = detectPage();
        if (!page) return;

        const panel = document.getElementById('filterPanel');
        if (panel) {
            panel.addEventListener('change', () => saveState(page));
            panel.addEventListener('input', (ev) => {

                if (ev.target && (ev.target.tagName === 'INPUT')) saveState(page);
            });
        }


        ['minLength', 'maxLength', 'minCostInput', 'maxCostInput'].forEach(id => {
            const el = document.getElementById(id); if (el) el.addEventListener('input', () => saveState(page));
        });


        const stored = readState(page);
        if (stored && anyActive(stored)) {
            const summary = buildSummary(stored) || '(je laatstgebruikte filters)';
            const banner = createBanner(summary, () => {
                try { applyState(stored); callRefreshFor(page); } catch (e) { }
                banner.remove();
            }, () => {
                try { localStorage.removeItem(storageKeyFor(page)); } catch (e) { }
                banner.remove();
            });


            const activeCont = document.getElementById('activeFiltersContainer');
            if (activeCont && activeCont.parentNode) activeCont.parentNode.insertBefore(banner, activeCont);
            else {

                const main = document.querySelector('.main-area'); if (main) main.insertBefore(banner, main.firstChild);
            }




            const dismissByUser = () => {
                try { localStorage.removeItem(storageKeyFor(page)); } catch (e) { }
                try { if (banner && banner.parentNode) banner.remove(); } catch (e) { }
            };



            const panelEl = document.getElementById('filterPanel');
            if (panelEl) {
                try {
                    panelEl.addEventListener('change', dismissByUser, { once: true });
                    panelEl.addEventListener('input', dismissByUser, { once: true });
                } catch (e) {

                    panelEl.addEventListener('change', dismissByUser);
                    panelEl.addEventListener('input', dismissByUser);
                }
            } else {

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

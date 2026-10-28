document.addEventListener('DOMContentLoaded', function () {
    const MOBILE_BREAKPOINT = 900;

    // --- 1. URL & FILTER SYNC LOGICA ---
    function getFiltersFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const state = {};
        for (const [key, value] of params.entries()) {
            if (!state[key]) state[key] = [];
            state[key].push(value);
        }
        return state;
    }

    function updateUrlFromFilters() {
        const params = new URLSearchParams();
        const panel = document.getElementById('filterPanel');
        if (!panel) return;

        // Verzamel alle aangevinkte checkboxes en actieve inputs
        const inputs = panel.querySelectorAll('input[type="checkbox"]:checked, input[type="text"], input[type="number"]');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                const type = input.getAttribute('data-type') || input.id;
                params.append(type, input.value || 'true');
            } else if (input.value.trim() !== '') {
                params.set(input.id || input.name, input.value.trim());
            }
        });

        const newRelativePathQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        history.replaceState(null, '', newRelativePathQuery);
    }

    function applyUrlToFilters() {
        const urlParams = getFiltersFromUrl();
        const panel = document.getElementById('filterPanel');
        if (!panel) return;

        let applied = false;
        Object.keys(urlParams).forEach(key => {
            const values = urlParams[key];
            values.forEach(val => {
                // Gecorrigeerde selector om de juiste checkbox te vinden
                const target = panel.querySelector(`input[data-type="${key}"][value="${CSS.escape(val)}"]`) ||
                               panel.querySelector(`#${CSS.escape(key)}`) ||
                               panel.querySelector(`input[value="${CSS.escape(val)}"]`);
                if (target) {
                    if (target.type === 'checkbox') {
                        if (!target.checked) {
                            target.checked = true;
                            target.dispatchEvent(new Event('change')); // Trigger event zodat de tabel filtert
                        }
                        applied = true;
                    } else if (target.type === 'text' || target.type === 'number') {
                        target.value = val;
                        target.dispatchEvent(new Event('input'));
                        applied = true;
                    }
                }
            });
        });

        if (applied) {
            if (typeof window.searchTable === 'function') window.searchTable();
            if (typeof window.refreshTable === 'function') window.refreshTable();
            if (typeof window.computeFilterCounts === 'function') window.computeFilterCounts();
        }
    }

    // Luister naar wijzigingen in het filterpanel om de URL live bij te werken
    const panel = document.getElementById('filterPanel');
    if (panel) {
        panel.addEventListener('change', () => {
            updateUrlFromFilters();
        });
        panel.addEventListener('input', () => {
            updateUrlFromFilters();
        });
    }

    // Geef de DOM even de tijd om de dynamische filters (zoals tts_table) in te laden, pas dan de URL toe
    setTimeout(applyUrlToFilters, 250);

    // --- 2. DEELKNOP VOOR HUIDIGE FILTERS ---
    function addShareButton() {
        const controlsRow = document.querySelector('.controls-row');
        if (!controlsRow || document.getElementById('shareFiltersBtn')) return;

        const shareBtn = document.createElement('button');
        shareBtn.id = 'shareFiltersBtn';
        shareBtn.type = 'button';
        shareBtn.className = 'btn-muted';
        shareBtn.style.marginLeft = 'auto';
        shareBtn.innerHTML = '🔗 <span class="btn-label">Deel filters</span>';
        
        shareBtn.addEventListener('click', () => {
            updateUrlFromFilters();
            const currentUrl = window.location.href;
            navigator.clipboard.writeText(currentUrl).then(() => {
                if (typeof showCopyToast === 'function') {
                    showCopyToast('Filterlink gekopieerd!');
                } else {
                    alert('Filterlink gekopieerd naar klembord!');
                }
            });
        });

        controlsRow.appendChild(shareBtn);
    }
    addShareButton();

    // --- 3. BESTAANDE PANEL SETUP ---
    function setupPanel(panelObj) {
        const toggle = document.querySelector('.filter-toggle');

        function applyInitial() {
            const overlay = document.getElementById('mobileFilterOverlay');
            if (overlay && overlay.classList.contains('open')) return;
            
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                panelObj.classList.add('collapsed');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            } else {
                panelObj.classList.remove('collapsed');
                if (toggle) toggle.setAttribute('aria-expanded', 'true');
            }
        }

        if (toggle) {
            toggle.addEventListener('click', function () {
                const expanded = toggle.getAttribute('aria-expanded') === 'true';
                if (expanded) {
                    panelObj.classList.add('collapsed');
                    toggle.setAttribute('aria-expanded', 'false');
                } else {
                    panelObj.classList.remove('collapsed');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });
        }

        window.addEventListener('resize', applyInitial);
        applyInitial();
    }

    document.querySelectorAll('.sidebar.filter-panel').forEach(setupPanel);

    // --- 4. MOBIELE OVERLAY LOGICA ---
    function createOverlayIfNeeded() {
        if (document.getElementById('mobileFilterOverlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'mobileFilterOverlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        const panelWrap = document.createElement('div');
        panelWrap.className = 'overlay-panel';

        const header = document.createElement('div');
        header.className = 'overlay-header';

        const title = document.createElement('div');
        title.textContent = 'Filters';
        title.style.fontWeight = '700';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'overlay-close';
        closeBtn.setAttribute('aria-label', 'Sluit filters');
        closeBtn.innerHTML = '&times;';

        header.appendChild(title);
        header.appendChild(closeBtn);
        panelWrap.appendChild(header);

        const contentHolder = document.createElement('div');
        contentHolder.className = 'overlay-content';
        panelWrap.appendChild(contentHolder);

        const footer = document.createElement('div');
        footer.className = 'overlay-footer';
        const applyBtn = document.createElement('button');
        applyBtn.className = 'overlay-apply';
        applyBtn.type = 'button';
        applyBtn.textContent = 'Filters toepassen';
        footer.appendChild(applyBtn);
        panelWrap.appendChild(footer);

        overlay.appendChild(panelWrap);
        document.body.appendChild(overlay);

        closeBtn.addEventListener('click', () => closeOverlay());
        applyBtn.addEventListener('click', () => closeOverlay());

        function getVisibleCountFallback() {
            const selectors = ['#alertList li', '#soundEffectsList li', '#ttsList li', '#redeemList li', '#alertTable tr', '#soundEffectsTable tr', '#ttsTable tr', '#redeemTable tr'];
            for (const sel of selectors) {
                const nodes = document.querySelectorAll(sel);
                if (nodes && nodes.length > 0) {
                    const visible = Array.from(nodes).filter(n => n.style.display !== 'none');
                    return visible.length;
                }
            }
            return 0;
        }

        function getCurrentCount() {
            const rc = document.getElementById('rowCount');
            if (rc && rc.textContent !== undefined && rc.textContent !== null) {
                const v = parseInt(rc.textContent, 10);
                if (!isNaN(v)) return v;
            }
            return getVisibleCountFallback();
        }

        function updateApplyText() {
            const count = getCurrentCount();
            applyBtn.textContent = `Toon ${count} resultaat${count === 1 ? '' : 'en'}`;
        }

        const rowCountEl = document.getElementById('rowCount');
        if (rowCountEl) {
            const rowObserver = new MutationObserver(updateApplyText);
            rowObserver.observe(rowCountEl, { childList: true, characterData: true, subtree: true });
        }

        contentHolder.addEventListener('input', updateApplyText);
        contentHolder.addEventListener('change', updateApplyText);
        updateApplyText();

        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) closeOverlay();
        });
    }

    let movedPanelState = null;

    function openOverlay(panelTarget) {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        createOverlayIfNeeded();
        const overlay = document.getElementById('mobileFilterOverlay');
        const contentHolder = overlay.querySelector('.overlay-content');

        movedPanelState = {
            panel: panelTarget,
            parent: panelTarget.parentNode,
            nextSibling: panelTarget.nextSibling
        };

        contentHolder.appendChild(panelTarget);
        overlay.classList.add('open');
        panelTarget.classList.remove('collapsed');
    }

    function closeOverlay() {
        const overlay = document.getElementById('mobileFilterOverlay');
        if (!overlay || !movedPanelState) return;

        const { panel: pTarget, parent, nextSibling } = movedPanelState;
        if (nextSibling) parent.insertBefore(pTarget, nextSibling);
        else parent.appendChild(pTarget);

        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            pTarget.classList.add('collapsed');
            const toggle = document.querySelector('.filter-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }

        overlay.classList.remove('open');
        movedPanelState = null;
    }

    document.querySelectorAll('.mobile-filter-open').forEach(btn => {
        btn.addEventListener('click', () => {
            const panelTarget = document.querySelector('.sidebar.filter-panel');
            if (!panelTarget) return;
            openOverlay(panelTarget);
        });
    });
});
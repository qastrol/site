
document.addEventListener('DOMContentLoaded', function () {
    const MOBILE_BREAKPOINT = 900;

    function setupPanel(panel) {
        const toggle = document.querySelector('.filter-toggle');

        function applyInitial() {
            if (window.innerWidth <= MOBILE_BREAKPOINT) {

                panel.classList.add('collapsed');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            } else {
                panel.classList.remove('collapsed');
                if (toggle) toggle.setAttribute('aria-expanded', 'true');
            }
        }

        if (toggle) {
            toggle.addEventListener('click', function () {
                const expanded = toggle.getAttribute('aria-expanded') === 'true';
                if (expanded) {
                    panel.classList.add('collapsed');
                    toggle.setAttribute('aria-expanded', 'false');
                } else {
                    panel.classList.remove('collapsed');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });
        }


        window.addEventListener('resize', applyInitial);
        applyInitial();
    }


    document.querySelectorAll('.sidebar.filter-panel').forEach(setupPanel);

    /* Mobile fullscreen filter overlay behavior
       When the mobile filter button is pressed we move the existing aside
       into an overlay for a fullscreen experience. On close we move it back. */
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

            const text = `Toon ${count} resultaat${count === 1 ? '' : 'en'}`;
            applyBtn.textContent = text;
        }




        const rowCountEl = document.getElementById('rowCount');
        let rowObserver = null;
        if (rowCountEl) {
            rowObserver = new MutationObserver(updateApplyText);
            rowObserver.observe(rowCountEl, { childList: true, characterData: true, subtree: true });
        }


        const contentMutHandler = (ev) => { updateApplyText(); };
        contentHolder.addEventListener('input', contentMutHandler);
        contentHolder.addEventListener('change', contentMutHandler);


        updateApplyText();
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) closeOverlay();
        });
    }

    let movedPanelState = null;

    function openOverlay(panel) {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        createOverlayIfNeeded();
        const overlay = document.getElementById('mobileFilterOverlay');
        const contentHolder = overlay.querySelector('.overlay-content');


        movedPanelState = {
            panel: panel,
            parent: panel.parentNode,
            nextSibling: panel.nextSibling
        };


        contentHolder.appendChild(panel);
        overlay.classList.add('open');

        panel.classList.remove('collapsed');
    }

    function closeOverlay() {
        const overlay = document.getElementById('mobileFilterOverlay');
        if (!overlay || !movedPanelState) return;

        const { panel, parent, nextSibling } = movedPanelState;
        if (nextSibling) parent.insertBefore(panel, nextSibling);
        else parent.appendChild(panel);


        try {
            const toggle = document.querySelector('.filter-toggle');
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                panel.classList.add('collapsed');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            } else {
                panel.classList.remove('collapsed');
                if (toggle) toggle.setAttribute('aria-expanded', 'true');
            }
        } catch (e) {

        }

        overlay.classList.remove('open');
        movedPanelState = null;

        const overlayEl = document.getElementById('mobileFilterOverlay');
        if (overlayEl) {
            const content = overlayEl.querySelector('.overlay-content');
            if (content) {
                content.removeEventListener('input', () => { });
                content.removeEventListener('change', () => { });
            }
        }
    }


    document.querySelectorAll('.mobile-filter-open').forEach(btn => {
        btn.addEventListener('click', (ev) => {

            const panel = document.querySelector('.sidebar.filter-panel');
            if (!panel) return;
            openOverlay(panel);
        });
    });
});

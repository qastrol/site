// Responsive filter panel behavior
document.addEventListener('DOMContentLoaded', function () {
    const MOBILE_BREAKPOINT = 900; // px - matches CSS

    function setupPanel(panel) {
        const toggle = document.querySelector('.filter-toggle');
        // If on mobile, collapse by default
        function applyInitial() {
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                // add collapsed class to panel container wrapper (we'll hide the aside)
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

        // adjust on resize
        window.addEventListener('resize', applyInitial);
        applyInitial();
    }

    // initialize all panels (pages will only have one .filter-panel aside)
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

        // This container will receive the moved aside
        const contentHolder = document.createElement('div');
        contentHolder.className = 'overlay-content';
        panelWrap.appendChild(contentHolder);

        overlay.appendChild(panelWrap);
        document.body.appendChild(overlay);

        closeBtn.addEventListener('click', () => closeOverlay());
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) closeOverlay();
        });
    }

    let movedPanelState = null; // {panel, parent, nextSibling}

    function openOverlay(panel) {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;
        createOverlayIfNeeded();
        const overlay = document.getElementById('mobileFilterOverlay');
        const contentHolder = overlay.querySelector('.overlay-content');

        // remember original location so we can move it back
        movedPanelState = {
            panel: panel,
            parent: panel.parentNode,
            nextSibling: panel.nextSibling
        };

        // move the real panel into the overlay
        contentHolder.appendChild(panel);
        overlay.classList.add('open');
        // ensure the panel is visible
        panel.classList.remove('collapsed');
    }

    function closeOverlay() {
        const overlay = document.getElementById('mobileFilterOverlay');
        if (!overlay || !movedPanelState) return;
        // move panel back to original parent location
        const { panel, parent, nextSibling } = movedPanelState;
        if (nextSibling) parent.insertBefore(panel, nextSibling);
        else parent.appendChild(panel);
        overlay.classList.remove('open');
        movedPanelState = null;
    }

    // Wire mobile filter open buttons (added to pages under the sort control)
    document.querySelectorAll('.mobile-filter-open').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            // find the nearest filter panel on this page
            const panel = document.querySelector('.sidebar.filter-panel');
            if (!panel) return;
            openOverlay(panel);
        });
    });
});

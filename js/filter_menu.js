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
});

// Helper to render active filters UI and emit events when a filter is removed
(function(){
    function createChip(text, type, value) {
        const span = document.createElement('span');
        span.className = 'active-filter-chip';
        span.dataset.filterType = type;
        span.dataset.filterValue = value;
        span.textContent = text;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'active-filter-remove';
        btn.title = 'Verwijder filter';
        btn.textContent = '✕';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ev = new CustomEvent('activeFilter:remove', { detail: { type, value } });
            window.dispatchEvent(ev);
        });
        span.appendChild(btn);
        return span;
    }

    function render(container, filters) {
        if (!container) return;
        container.innerHTML = '';
        if (!filters || filters.length === 0) {
            container.style.display = 'none';
            return;
        }
        container.style.display = '';
        filters.forEach(f => {
            const chip = createChip(f.label, f.type, f.value);
            container.appendChild(chip);
        });
    }

    window.activeFilters = {
        render,
    };

    // Styling is provided via `style.css`; this file no longer injects styles.
})();

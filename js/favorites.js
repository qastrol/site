// favorites.js — simple localStorage-backed favorites helper
(function(){
    const OLD_STORAGE_KEY = 'kk_favorites_v1';
    const STORAGE_KEY = 'qastrol_favorites_v1';

    function readAll() {
        try {
            // Prefer new key
            let raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                // migrate from old key if present
                const old = localStorage.getItem(OLD_STORAGE_KEY);
                if (old) {
                    try {
                        // copy old to new key
                        localStorage.setItem(STORAGE_KEY, old);
                        // remove old key to avoid duplication
                        try { localStorage.removeItem(OLD_STORAGE_KEY); } catch (e) {}
                        raw = old;
                    } catch (e) {
                        // fall back to using old raw if set failed
                        raw = old;
                    }
                }
            }
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) { /* ignore */ }
        return {};
    }

    function writeAll(obj) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (e) { console.error('favorites save failed', e); }
    }

    const api = {
        getAll() { return readAll(); },
        get(page) { const all = readAll(); return Array.isArray(all[page]) ? all[page].slice() : []; },
        isFav(page, key) { if (!page || !key) return false; const arr = api.get(page); return arr.indexOf(key) !== -1; },
        toggle(page, key) {
            if (!page || !key) return false;
            const all = readAll(); if (!all[page]) all[page] = [];
            const arr = all[page]; const idx = arr.indexOf(key);
            let added = false;
            if (idx === -1) { arr.push(key); added = true; }
            else { arr.splice(idx, 1); added = false; }
            all[page] = arr;
            writeAll(all);
            // dispatch event so pages can react
            try { window.dispatchEvent(new CustomEvent('favorites:changed', { detail: { page, key, added } })); } catch (e) {}
            return added;
        },
        count(page) { return api.get(page).length; },
        makeShareUrl(page, key) {
            try {
                const u = new URL(window.location.href);
                u.searchParams.set('focus', `${page}:${key}`);
                return u.toString();
            } catch (e) {
                return window.location.href + `?focus=${encodeURIComponent(page + ':' + key)}`;
            }
        }
    };

    window.favorites = api;
})();

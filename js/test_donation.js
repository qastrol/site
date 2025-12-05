/* test_donation.js
   Simple client-side tester to parse a donation-line and show which
   alerts / tts / soundeffects would be played.

   Uses global arrays: alertsTable, ttsTable, soundeffectsTable when available.
*/

(function(){
    function findAlert(code) {
        if (typeof alertsTable === 'undefined') return null;
        return alertsTable.find(a => (a.code || '').toLowerCase() === code.toLowerCase()) || null;
    }
    function findTts(code) {
        if (typeof ttsTable === 'undefined') return null;
        // ttsTable codes include the trailing ':' in many entries
        const normalized = code.toLowerCase();
        return ttsTable.find(t => (t.code||'').toLowerCase() === normalized) || null;
    }
    function findSfx(code) {
        if (typeof soundeffectsTable === 'undefined') return null;
        return soundeffectsTable.find(s => (s.code||'').toLowerCase() === code.toLowerCase()) || null;
    }
    function randomTts() {
        if (typeof ttsTable === 'undefined' || ttsTable.length === 0) return { name: 'Random', code: 'random:' };
        return ttsTable[Math.floor(Math.random()*ttsTable.length)];
    }
    function randomSfx() {
        if (typeof soundeffectsTable === 'undefined' || soundeffectsTable.length === 0) return { name: 'Random SFX', code: '(random)' };
        return soundeffectsTable[Math.floor(Math.random()*soundeffectsTable.length)];
    }

    function parseDonation(text) {
        // We'll collect tokens (in appearance order) and gaps between them.
        const rx = /(<[^>]+>)|([a-z0-9-_]+:)|(\([^\)]+\))/gi;
        const matches = Array.from(text.matchAll(rx));
        const tokens = [];
        const appendedSegments = [];
        let sawAlert = false;
        let lastTtsVoice = null;

        // Build tokens array: include first alert, tts, sfx, sfx-ai. Duplicate
        // alerts become appendedSegments (they'll be spoken by TTS later).
        for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            const token = m[0];
            const start = m.index;
            const end = start + token.length;

            if (token.startsWith('<')) {
                const code = token.trim();
                const found = findAlert(code);
                if (!sawAlert) {
                    tokens.push({ type: 'alert', start, end, requested: code, resolved: found ? found.code : '<noobpower>', name: found ? found.name : 'Noob-Power!' });
                    sawAlert = true;
                } else {
                    // Treat duplicate alerts as literal text to be appended
                    const nextStart = (i+1 < matches.length) ? matches[i+1].index : text.length;
                    const spoken = text.slice(end, nextStart).trim();
                    const extra = (token + (spoken ? ' ' + spoken : '')).trim();
                    appendedSegments.push({ text: extra, start, end: nextStart });
                }
            } else if (token.startsWith('(')) {
                const code = token.trim();
                const found = findSfx(code);
                if (found) tokens.push({ type: 'sfx', start, end, requested: code, resolved: found.code, name: found.name });
                else tokens.push({ type: 'sfx-ai', start, end, prompt: code, resolved: code, name: 'AI soundeffect met de prompt' });
            } else if (token.endsWith(':')) {
                const code = token.trim();
                const found = findTts(code);
                if (found) {
                    const t = { type: 'tts', start, end, requested: code, resolved: found.code, name: found.name, textPieces: [], supportsAudioTags: !!found.supportsAudioTags };
                    tokens.push(t);
                    lastTtsVoice = { requested: code, resolved: found.code, name: found.name, supportsAudioTags: !!found.supportsAudioTags };
                } else {
                    // Unknown colon token: treat as literal text so it can be
                    // attached to nearby TTS by later processing.
                    tokens.push({ type: 'literal', start, end, text: token });
                }
            }
        }

        // Build ranges that are occupied by tokens or appendedSegments so we can
        // extract the gaps (free text) between them.
        const occupied = [];
        for (const t of tokens) occupied.push([t.start, t.end]);
        for (const a of appendedSegments) occupied.push([a.start, a.end]);
        occupied.sort((a,b)=>a[0]-b[0]);
        // merge
        const mergedOcc = [];
        for (const r of occupied) {
            if (!mergedOcc.length || r[0] > mergedOcc[mergedOcc.length-1][1]) mergedOcc.push([r[0], r[1]]);
            else mergedOcc[mergedOcc.length-1][1] = Math.max(mergedOcc[mergedOcc.length-1][1], r[1]);
        }

        const gaps = [];
        let cur = 0;
        for (const r of mergedOcc) {
            if (cur < r[0]) gaps.push({ start: cur, end: r[0], text: text.slice(cur, r[0]) });
            cur = r[1];
        }
        if (cur < text.length) gaps.push({ start: cur, end: text.length, text: text.slice(cur) });

        // Attach appendedSegments texts into gaps by inserting them as separate
        // small gaps (they were originally duplicate alerts and similar).
        for (const a of appendedSegments) {
            gaps.push({ start: a.start, end: a.end, text: a.text });
        }

        // Normalize gaps order
        gaps.sort((a,b)=>a.start-b.start);

        // Helper: find token index with end <= pos
        function findLeftTokenIndex(pos) {
            for (let i = tokens.length-1; i>=0; i--) if (tokens[i].end <= pos) return i;
            return -1;
        }
        function findNextTokenIndex(pos) {
            for (let i = 0; i<tokens.length; i++) if (tokens[i].start >= pos) return i;
            return -1;
        }

        // Ensure each TTS token has array to collect pieces
        for (const t of tokens) if (t.type === 'tts') t.textPieces = t.textPieces || [];

        const orphanFree = [];

        // Assign each gap to nearest TTS following rules described:
        for (const g of gaps) {
            const leftIdx = findLeftTokenIndex(g.start);
            if (leftIdx !== -1) {
                const left = tokens[leftIdx];
                if (left.type === 'tts') {
                    left.textPieces.push(g.text.trim());
                    continue;
                }
                // left exists but isn't a TTS: try to attach to next TTS
                const nextIdx = findNextTokenIndex(g.end);
                if (nextIdx !== -1 && tokens[nextIdx].type === 'tts') {
                    tokens[nextIdx].textPieces.push(g.text.trim());
                    continue;
                }
                // no next TTS: create a default TTS using lastTtsVoice if available
                if (lastTtsVoice) {
                    const newTts = { type: 'tts', start: g.start, end: g.end, requested: '<inferred>', resolved: lastTtsVoice.resolved, name: lastTtsVoice.name, textPieces: [g.text.trim()], supportsAudioTags: !!lastTtsVoice.supportsAudioTags };
                    // insert after leftIdx
                    tokens.splice(leftIdx+1, 0, newTts);
                    continue;
                }
                // fallback: collect as orphan
                orphanFree.push(g.text.trim());
            } else {
                // no left token: try to attach to next tts
                const nextIdx = findNextTokenIndex(g.end);
                if (nextIdx !== -1 && tokens[nextIdx].type === 'tts') {
                    tokens[nextIdx].textPieces.push(g.text.trim());
                    continue;
                }
                if (lastTtsVoice) {
                    const newTts = { type: 'tts', start: g.start, end: g.end, requested: '<inferred>', resolved: lastTtsVoice.resolved, name: lastTtsVoice.name, textPieces: [g.text.trim()], supportsAudioTags: !!lastTtsVoice.supportsAudioTags };
                    tokens.splice(0, 0, newTts);
                    continue;
                }
                orphanFree.push(g.text.trim());
            }
        }

        // Build final results in token order, excluding 'literal' entries
        const resultsOut = [];
        for (const t of tokens) {
            if (t.type === 'alert') {
                resultsOut.push({ type: 'alert', requested: t.requested, resolved: t.resolved, name: t.name });
            } else if (t.type === 'tts') {
                const combined = (t.textPieces || []).filter(Boolean).join(' ').trim();
                resultsOut.push({ type: 'tts', requested: t.requested, resolved: t.resolved, name: t.name, text: combined, supportsAudioTags: !!t.supportsAudioTags });
            } else if (t.type === 'sfx') {
                resultsOut.push({ type: 'sfx', requested: t.requested, resolved: t.resolved, name: t.name });
            } else if (t.type === 'sfx-ai') {
                resultsOut.push({ type: 'sfx-ai', prompt: t.prompt, resolved: t.resolved, name: t.name });
            }
        }

        // If there are orphan free-text pieces and there are no TTS at all,
        // leave it to ensureDefaults to insert a default TTS. Otherwise, if
        // there are orphan pieces but we have a lastTtsVoice, create a final
        // TTS at the end with that voice.
        if (orphanFree.length && resultsOut.every(r=>r.type !== 'tts') && lastTtsVoice) {
            resultsOut.push({ type: 'tts', requested: '<inferred>', resolved: lastTtsVoice.resolved, name: lastTtsVoice.name, text: orphanFree.join(' ').trim() });
        }

        const lastIndex = matches.length ? (matches[matches.length-1].index + matches[matches.length-1][0].length) : 0;
        const freeText = orphanFree.join(' ').trim();
        return { results: resultsOut, lastIndex, freeText };
    }

    // Ensure defaults: if no alert present, use <noobpower>; if no tts present, use a random TTS
    // Accepts remainingText (string) which will be used as the default TTS text if present.
    function ensureDefaults(parsed, remainingText) {
        const hasAlert = parsed.some(p => p.type === 'alert');
        const hasTts = parsed.some(p => p.type === 'tts');

        if (!hasAlert) {
            const found = findAlert('<noobpower>');
            parsed.unshift({ type: 'alert', requested: '<noobpower>', resolved: found ? found.code : '<noobpower>', name: found ? found.name : 'Noob-Power!', isDefault: true });
        }

        // Only add a default TTS when there is trailing text to speak.
        // If there's no explicit TTS and no trailing text, do not insert a TTS.
        const trailing = (remainingText && remainingText.trim()) ? remainingText.trim() : '';
        if (!hasTts && trailing) {
            // For the purposes of the simulator, show a generic "random" choice
            // rather than the concrete resolved voice. This keeps the UX clear:
            // default TTS = a random voice speaking the free text.
            const defaultItem = {
                type: 'tts',
                requested: '<random>',
                resolved: 'random:',
                name: 'Willekeurige stem',
                text: trailing,
                isDefault: true,
                defaultTextProvided: true,
                supportsAudioTags: false
            };

            // Insert the default TTS immediately after the last alert so the
            // playback order is Alert -> (default) TTS when appropriate.
            let insertAt = -1;
            for (let i = parsed.length - 1; i >= 0; i--) {
                if (parsed[i].type === 'alert') { insertAt = i + 1; break; }
            }
            if (insertAt === -1) parsed.push(defaultItem);
            else parsed.splice(insertAt, 0, defaultItem);
        }

        return parsed;
    }

    function renderResults(container, parsed) {
        container.innerHTML = '';
        // Only show the simulated playback order (concise view)
        const title = document.createElement('div');
        title.style.marginTop = '6px';
        title.innerHTML = '<strong>De volgende alerts, TTS stemmen en sound effects worden afgespeeld:</strong>';

        const ol = document.createElement('ol');
        ol.style.marginTop = '8px';
        if (!parsed || parsed.length === 0) {
            const empty = document.createElement('div');
            empty.innerHTML = '<em>Geen items herkend.</em>';
            container.appendChild(empty);
            return;
        }

        // Arrange playback order: the first alert (if any) always plays first,
        // afterwards preserve the left-to-right order of remaining items.
        const freeText = parsed._freeText || '';
        const seq = Array.isArray(parsed) ? parsed.slice() : (parsed.results ? parsed.results.slice() : []);

        // Move the first alert to the front if present
        const firstAlertIndex = seq.findIndex(p => p.type === 'alert');
        const ordered = [];
        if (firstAlertIndex !== -1) {
            ordered.push(seq.splice(firstAlertIndex, 1)[0]);
        }

        // Attach freeText to the first TTS in the remaining sequence
        if (freeText) {
            const firstTtsIndex = seq.findIndex(p => p.type === 'tts');
            if (firstTtsIndex !== -1) {
                const t = seq[firstTtsIndex];
                // Don't double-append freeText when this TTS was created as a
                // default and already contains the free text (defaultTextProvided).
                if (!(t.isDefault && t.defaultTextProvided)) {
                    t.text = (t.text ? (t.text + ' ' + freeText) : freeText).trim();
                }
            }
        }

        // Append remaining items in their original left-to-right order
        ordered.push(...seq);

        function renderItem(it) {
            const li = document.createElement('li');
            if (it.type === 'alert') {
                if (it.isDefault) li.textContent = `Standaardalert: ${it.name} ${it.resolved}`;
                else li.textContent = `Alert: ${it.name} ${it.resolved} speelt af`;
                return li;
            }
            if (it.type === 'tts') {
                const spokenRaw = it.text || '(geen tekst)';
                // If the voice supports audio tags, strip them for display but keep
                // a note of the tags used.
                let spoken = spokenRaw;
                let tags = [];
                if (it.supportsAudioTags) {
                    const tagRx = /\[([^\]]+)\]/g;
                    tags = [];
                    spoken = spokenRaw.replace(tagRx, (m, g1) => { tags.push(g1.trim()); return ' '; }).replace(/\s+/g,' ').trim();
                    if (!spoken) spoken = '(geen tekst)';
                }
                if (it.isDefault) li.textContent = `Standaard TTS: ${it.name} (${it.resolved || 'random:'}) zegt: ${spoken}`;
                else {
                    const code = it.resolved || it.requested || '';
                    li.textContent = `TTS: ${it.name} (${code}) zegt: ${spoken}`;
                }
                if (tags.length) {
                    li.textContent += ` (audio tag${tags.length>1?'s':''}: ` + tags.map(t=>`[${t}]`).join(', ') + ')';
                }
                return li;
            }
            if (it.type === 'sfx') {
                li.textContent = `Soundeffect: ${it.name} ${it.resolved} speelt af`;
                return li;
            }
            if (it.type === 'sfx-ai') {
                li.textContent = `Soundeffect: ${it.name} ${it.prompt || it.resolved} speelt af`;
                return li;
            }
            return li;
        }

        for (const it of ordered) ol.appendChild(renderItem(it));

        container.appendChild(title);
        container.appendChild(ol);
    }

    function escapeHtml(str){
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Wire up UI if present
    function init(){
        const btn = document.getElementById('donationTestBtn');
        const clear = document.getElementById('donationTestClear');
        const input = document.getElementById('donationTestInput');
        const out = document.getElementById('donationTestResult');
        const status = document.getElementById('donationTestStatus');
        if (!btn || !input || !out) return;
        // Character counter / limit UI
        const MAX_CHARS = 150;
        let charCountEl = document.getElementById('donationCharCount');
        if (!charCountEl) {
            charCountEl = document.createElement('div');
            charCountEl.id = 'donationCharCount';
            charCountEl.setAttribute('aria-live','polite');
            charCountEl.style.marginLeft = '12px';
            charCountEl.style.color = 'var(--muted-text-color)';
            // insert into the tester-controls if present, otherwise after the input
            const controls = document.querySelector('.tester-controls');
            if (controls) controls.appendChild(charCountEl);
            else input.insertAdjacentElement('afterend', charCountEl);
        }

        function updateCharCount(){
            const len = (input.value || '').length;
            const remaining = MAX_CHARS - len;
            if (len > MAX_CHARS) {
                charCountEl.textContent = `Tekst te lang: ${len} tekens (max ${MAX_CHARS})`;
                charCountEl.style.color = '#b33';
                btn.disabled = true;
                status.textContent = 'Bericht te lang.';
            } else {
                charCountEl.textContent = `${len} / ${MAX_CHARS} tekens`;
                charCountEl.style.color = 'var(--muted-text-color)';
                btn.disabled = false;
                status.textContent = '';
            }
        }
        // initialize counter
        updateCharCount();
        input.addEventListener('input', updateCharCount);
        btn.addEventListener('click', ()=>{
            status.textContent = 'Analyseren…';
            setTimeout(()=>{
                    const parsedObj = parseDonation(input.value || '');
                    let parsed = parsedObj.results;
                    // Use the parsed freeText (text outside tokens and explicit TTS)
                    // so we also pick up text that appears before an alert token.
                    const remaining = parsedObj.freeText || '';
                    parsed = ensureDefaults(parsed, remaining);
                    // Keep the computed freeText on the parsed object so rendering
                    // can attach it to an explicit TTS (combine before/after text).
                    parsed._freeText = parsedObj.freeText || '';
                    renderResults(out, parsed);
                    // Smoothly scroll the results into view so the user sees them
                    // without needing to manually scroll. Center the results in
                    // the viewport for best visibility.
                    try {
                        out.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } catch (e) {
                        // fallback: do nothing
                    }
                    status.textContent = `Gevonden: ${parsed.length}`;
                }, 50);
        });
        clear && clear.addEventListener('click', ()=>{
            input.value = '';
            out.innerHTML = '';
            status.textContent = '';
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

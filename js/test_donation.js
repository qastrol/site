/* test_donation.js
   Simple client-side tester to parse a donation-line and show which
   alerts / tts / soundeffects would be played.

   Uses global arrays: alertsTable, ttsTable, soundeffectsTable when available.
*/

(function () {
    function findAlert(code) {
        if (typeof alertsTable === 'undefined') return null;
        return alertsTable.find(a => (a.code || '').toLowerCase() === code.toLowerCase()) || null;
    }
    function findTts(code) {
        if (typeof ttsTable === 'undefined') return null;

        const normalized = code.toLowerCase();
        return ttsTable.find(t => (t.code || '').toLowerCase() === normalized) || null;
    }
    function findSfx(code) {
        if (typeof soundeffectsTable === 'undefined') return null;
        return soundeffectsTable.find(s => (s.code || '').toLowerCase() === code.toLowerCase()) || null;
    }

    function parseEnhancedSfx(code) {
        // Parse soundeffect code with potential enhancements
        // e.g., "(^fart)", "(<<<fart)", "(_>>%fart)"
        // Returns: { base: 'fart', effects: ['2x Pitch omhoog', '3x Sneller afspelen', ...] }
        
        if (!code || !code.startsWith('(') || !code.endsWith(')')) {
            return { base: code, effects: [] };
        }
        
        const content = code.slice(1, -1); // Remove parentheses
        const effectChars = new Set(['^', '_', '>', '<', '%', '#']);
        
        let effectCounts = {
            'pitch_up': 0,
            'pitch_down': 0,
            'faster': 0,
            'slower': 0,
            'echo': 0,
            'robot': 0
        };
        
        let effectLabels = {
            'pitch_up': 'Pitch omhoog',
            'pitch_down': 'Pitch omlaag',
            'faster': 'Sneller afspelen',
            'slower': 'langzamer afspelen',
            'echo': 'Echo',
            'robot': 'Roboteffect'
        };
        
        let base = '';
        
        for (const char of content) {
            if (effectChars.has(char)) {
                if (char === '^') effectCounts['pitch_up']++;
                else if (char === '_') effectCounts['pitch_down']++;
                else if (char === '>') effectCounts['faster']++;
                else if (char === '<') {
                    // Only apply slower effect once
                    if (effectCounts['slower'] === 0) effectCounts['slower']++;
                }
                else if (char === '%') effectCounts['echo']++;
                else if (char === '#') effectCounts['robot']++;
            } else {
                base += char;
            }
        }
        
        // Build effects array with counts
        let effects = [];
        for (const [effectKey, count] of Object.entries(effectCounts)) {
            if (count > 0) {
                const label = effectLabels[effectKey];
                if (effectKey === 'slower') {
                    // Slower is always shown as "1x langzamer afspelen"
                    effects.push(`1x ${label}`);
                } else if (count === 1) {
                    effects.push(label);
                } else {
                    effects.push(`${count}x ${label}`);
                }
            }
        }
        
        return { base, effects };
    }
    function randomTts() {
        if (typeof ttsTable === 'undefined' || ttsTable.length === 0) return { name: 'Random', code: 'random:' };
        return ttsTable[Math.floor(Math.random() * ttsTable.length)];
    }
    function randomSfx() {
        if (typeof soundeffectsTable === 'undefined' || soundeffectsTable.length === 0) return { name: 'Random SFX', code: '(random)' };
        return soundeffectsTable[Math.floor(Math.random() * soundeffectsTable.length)];
    }

    function parseDonation(text) {

        const rx = /(<[^>]+>)|([a-z0-9-_]+:)|(\([^\)]+\))/gi;
        const matches = Array.from(text.matchAll(rx));
        const tokens = [];
        const appendedSegments = [];
        let sawAlert = false;
        let lastTtsVoice = null;



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

                    const nextStart = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
                    const spoken = text.slice(end, nextStart).trim();
                    const extra = (token + (spoken ? ' ' + spoken : '')).trim();
                    appendedSegments.push({ text: extra, start, end: nextStart });
                }
            } else if (token.startsWith('(')) {
                const code = token.trim();
                const parsed = parseEnhancedSfx(code);
                const baseCode = `(${parsed.base})`;
                const found = findSfx(baseCode);
                
                if (found) {
                    tokens.push({ 
                        type: 'sfx', 
                        start, 
                        end, 
                        requested: code, 
                        resolved: found.code, 
                        name: found.name,
                        effects: parsed.effects
                    });
                }
                else tokens.push({ 
                    type: 'sfx-ai', 
                    start, 
                    end, 
                    prompt: code, 
                    resolved: code, 
                    name: 'AI soundeffect met de prompt',
                    effects: []
                });
            } else if (token.endsWith(':')) {
                const code = token.trim();
                const found = findTts(code);
                if (found) {
                    const t = { type: 'tts', start, end, requested: code, resolved: found.code, name: found.name, textPieces: [], supportsAudioTags: !!found.supportsAudioTags };
                    tokens.push(t);
                    lastTtsVoice = { requested: code, resolved: found.code, name: found.name, supportsAudioTags: !!found.supportsAudioTags };
                } else {


                    tokens.push({ type: 'literal', start, end, text: token });
                }
            }
        }



        const occupied = [];
        for (const t of tokens) occupied.push([t.start, t.end]);
        for (const a of appendedSegments) occupied.push([a.start, a.end]);
        occupied.sort((a, b) => a[0] - b[0]);

        const mergedOcc = [];
        for (const r of occupied) {
            if (!mergedOcc.length || r[0] > mergedOcc[mergedOcc.length - 1][1]) mergedOcc.push([r[0], r[1]]);
            else mergedOcc[mergedOcc.length - 1][1] = Math.max(mergedOcc[mergedOcc.length - 1][1], r[1]);
        }

        const gaps = [];
        let cur = 0;
        for (const r of mergedOcc) {
            if (cur < r[0]) gaps.push({ start: cur, end: r[0], text: text.slice(cur, r[0]) });
            cur = r[1];
        }
        if (cur < text.length) gaps.push({ start: cur, end: text.length, text: text.slice(cur) });



        for (const a of appendedSegments) {
            gaps.push({ start: a.start, end: a.end, text: a.text });
        }


        gaps.sort((a, b) => a.start - b.start);


        function findLeftTokenIndex(pos) {
            for (let i = tokens.length - 1; i >= 0; i--) if (tokens[i].end <= pos) return i;
            return -1;
        }
        function findNextTokenIndex(pos) {
            for (let i = 0; i < tokens.length; i++) if (tokens[i].start >= pos) return i;
            return -1;
        }


        for (const t of tokens) if (t.type === 'tts') t.textPieces = t.textPieces || [];

        const orphanFree = [];


        for (const g of gaps) {
            const leftIdx = findLeftTokenIndex(g.start);
            if (leftIdx !== -1) {
                const left = tokens[leftIdx];
                if (left.type === 'tts') {
                    left.textPieces.push(g.text.trim());
                    continue;
                }

                const nextIdx = findNextTokenIndex(g.end);
                if (nextIdx !== -1 && tokens[nextIdx].type === 'tts') {
                    tokens[nextIdx].textPieces.push(g.text.trim());
                    continue;
                }

                if (lastTtsVoice) {
                    const newTts = { type: 'tts', start: g.start, end: g.end, requested: '<inferred>', resolved: lastTtsVoice.resolved, name: lastTtsVoice.name, textPieces: [g.text.trim()], supportsAudioTags: !!lastTtsVoice.supportsAudioTags };

                    tokens.splice(leftIdx + 1, 0, newTts);
                    continue;
                }

                orphanFree.push(g.text.trim());
            } else {

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


        const resultsOut = [];
        for (const t of tokens) {
            if (t.type === 'alert') {
                resultsOut.push({ type: 'alert', requested: t.requested, resolved: t.resolved, name: t.name });
            } else if (t.type === 'tts') {
                const combined = (t.textPieces || []).filter(Boolean).join(' ').trim();
                resultsOut.push({ type: 'tts', requested: t.requested, resolved: t.resolved, name: t.name, text: combined, supportsAudioTags: !!t.supportsAudioTags });
            } else if (t.type === 'sfx') {
                resultsOut.push({ type: 'sfx', requested: t.requested, resolved: t.resolved, name: t.name, effects: t.effects || [] });
            } else if (t.type === 'sfx-ai') {
                resultsOut.push({ type: 'sfx-ai', prompt: t.prompt, resolved: t.resolved, name: t.name, effects: t.effects || [] });
            }
        }





        if (orphanFree.length && resultsOut.every(r => r.type !== 'tts') && lastTtsVoice) {
            resultsOut.push({ type: 'tts', requested: '<inferred>', resolved: lastTtsVoice.resolved, name: lastTtsVoice.name, text: orphanFree.join(' ').trim() });
        }

        const lastIndex = matches.length ? (matches[matches.length - 1].index + matches[matches.length - 1][0].length) : 0;
        const freeText = orphanFree.join(' ').trim();
        return { results: resultsOut, lastIndex, freeText };
    }



    function ensureDefaults(parsed, remainingText) {
        const hasAlert = parsed.some(p => p.type === 'alert');
        const hasTts = parsed.some(p => p.type === 'tts');

        if (!hasAlert) {
            const found = findAlert('<noobpower>');
            parsed.unshift({ type: 'alert', requested: '<noobpower>', resolved: found ? found.code : '<noobpower>', name: found ? found.name : 'Noob-Power!', isDefault: true });
        }



        const trailing = (remainingText && remainingText.trim()) ? remainingText.trim() : '';
        if (!hasTts && trailing) {



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



        const freeText = parsed._freeText || '';
        const seq = Array.isArray(parsed) ? parsed.slice() : (parsed.results ? parsed.results.slice() : []);


        const firstAlertIndex = seq.findIndex(p => p.type === 'alert');
        const ordered = [];
        if (firstAlertIndex !== -1) {
            ordered.push(seq.splice(firstAlertIndex, 1)[0]);
        }


        if (freeText) {
            const firstTtsIndex = seq.findIndex(p => p.type === 'tts');
            if (firstTtsIndex !== -1) {
                const t = seq[firstTtsIndex];


                if (!(t.isDefault && t.defaultTextProvided)) {
                    t.text = (t.text ? (t.text + ' ' + freeText) : freeText).trim();
                }
            }
        }


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


                let spoken = spokenRaw;
                let tags = [];
                if (it.supportsAudioTags) {
                    const tagRx = /\[([^\]]+)\]/g;
                    tags = [];
                    spoken = spokenRaw.replace(tagRx, (m, g1) => { tags.push(g1.trim()); return ' '; }).replace(/\s+/g, ' ').trim();
                    if (!spoken) spoken = '(geen tekst)';
                }
                if (it.isDefault) li.textContent = `Standaard TTS: ${it.name} (${it.resolved || 'random:'}) zegt: ${spoken}`;
                else {
                    const code = it.resolved || it.requested || '';
                    li.textContent = `TTS: ${it.name} (${code}) zegt: ${spoken}`;
                }
                if (tags.length) {
                    li.textContent += ` (audio tag${tags.length > 1 ? 's' : ''}: ` + tags.map(t => `[${t}]`).join(', ') + ')';
                }
                return li;
            }
            if (it.type === 'sfx') {
                let text = `Soundeffect: ${it.name} ${it.resolved} speelt af`;
                if (it.effects && it.effects.length > 0) {
                    text += ` met ${it.effects.join(', ')}`;
                }
                li.textContent = text;
                return li;
            }
            if (it.type === 'sfx-ai') {
                let text = `Soundeffect: ${it.name} ${it.prompt || it.resolved} speelt af`;
                if (it.effects && it.effects.length > 0) {
                    text += ` met ${it.effects.join(', ')}`;
                }
                li.textContent = text;
                return li;
            }
            return li;
        }

        for (const it of ordered) ol.appendChild(renderItem(it));

        container.appendChild(title);
        container.appendChild(ol);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }


    function init() {
        const btn = document.getElementById('donationTestBtn');
        const clear = document.getElementById('donationTestClear');
        const input = document.getElementById('donationTestInput');
        const out = document.getElementById('donationTestResult');
        const status = document.getElementById('donationTestStatus');
        if (!btn || !input || !out) return;

        const MAX_CHARS = 150;
        let charCountEl = document.getElementById('donationCharCount');
        if (!charCountEl) {
            charCountEl = document.createElement('div');
            charCountEl.id = 'donationCharCount';
            charCountEl.setAttribute('aria-live', 'polite');
            charCountEl.style.marginLeft = '12px';
            charCountEl.style.color = 'var(--muted-text-color)';

            const controls = document.querySelector('.tester-controls');
            if (controls) controls.appendChild(charCountEl);
            else input.insertAdjacentElement('afterend', charCountEl);
        }

        function updateCharCount() {
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

        updateCharCount();
        input.addEventListener('input', updateCharCount);
        btn.addEventListener('click', () => {
            status.textContent = 'Analyseren…';
            setTimeout(() => {
                const parsedObj = parseDonation(input.value || '');
                let parsed = parsedObj.results;


                const remaining = parsedObj.freeText || '';
                parsed = ensureDefaults(parsed, remaining);


                parsed._freeText = parsedObj.freeText || '';
                renderResults(out, parsed);



                try {
                    out.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } catch (e) {

                }
                status.textContent = `Gevonden: ${parsed.length}`;
            }, 50);
        });
        clear && clear.addEventListener('click', () => {
            input.value = '';
            out.innerHTML = '';
            status.textContent = '';
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

/* ==========================================================================
   Aetheria.ai — Pure Core Logic

   The functions here have no DOM and no network dependencies, which is what
   makes them testable. app.js consumes them through window.AetheriaCore;
   test/core.test.js requires this file directly under Node.
   ========================================================================== */

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.AetheriaCore = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Diagram node types that have a matching .node-* rule in style.css
    const NODE_TYPES = ['source', 'service', 'ai', 'storage', 'client'];

    // Asked the same question repeatedly, the model returns variations on a handful
    // of favourite ideas. Rotating a constraint combination through the prompt
    // pushes it into a different corner each time: 5^4 = 625 combinations.
    const CONSTRAINT_AXES = {
        problemSource: [
            'regülasyon ve uyum baskısı',
            'operasyonel maliyet baskısı',
            'manuel iş yükü ve tekrar eden süreçler',
            'birbirinden kopuk veri siloları',
            'erişilebilirlik ve kapsayıcılık açığı'
        ],
        audience: [
            'kurumsal ekipler',
            'bağımsız profesyoneller ve küçük işletmeler',
            'son kullanıcılar',
            'araştırmacılar ve akademi',
            'kamu kurumları ve STK\'lar'
        ],
        technical: [
            'uçta (edge) çalışma',
            'gizlilik korumalı işleme',
            'gerçek zamanlı akış',
            'çevrimdışı öncelikli tasarım',
            'uçtan uca otomasyon'
        ],
        revenue: [
            'B2B SaaS aboneliği',
            'pazaryeri komisyonu',
            'geliştirici API\'si',
            'açık çekirdek (open core)',
            'kullanım bazlı ücretlendirme'
        ]
    };

    // Escape every HTML-significant character so untrusted text can never
    // introduce markup when it is later assigned to innerHTML.
    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Minimal markdown subset. Project content is untrusted — it comes from the
    // Gemini API or from a localStorage pool that anyone with devtools can edit.
    // The input is escaped first, so the only tags in the output are the ones
    // produced below.
    function parseMarkdown(text) {
        if (!text) return '';
        let html = escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^[•*] (.*$)/gm, '<li>$1</li>');

        html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => `<ul>${match}</ul>`);
        html = html.replace(/<\/ul>\s*<ul>/g, '');
        return html;
    }

    // Validate the shape of a project object coming from an untrusted source
    // (Gemini, or a hand-edited localStorage pool) before it reaches the renderer.
    // Returns an error string, or null when the object is usable.
    function validateProjectShape(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return 'Yanıt bir proje nesnesi değil';
        }
        for (const field of ['title', 'tagline', 'category']) {
            if (typeof obj[field] !== 'string' || !obj[field].trim()) {
                return `Zorunlu alan eksik veya boş: ${field}`;
            }
        }
        if (!obj.step1 || typeof obj.step1 !== 'object') return 'step1 bloğu eksik';
        for (const field of ['marketGap', 'description']) {
            if (typeof obj.step1[field] !== 'string' || !obj.step1[field].trim()) {
                return `Zorunlu alan eksik veya boş: step1.${field}`;
            }
        }
        return null;
    }

    // Fill in the optional parts of a validated project so the renderer never sees
    // half-built objects, and guarantee a unique id for pool de-duplication.
    function normalizeProject(obj, fallbackCategoryKey, now) {
        const p = { ...obj };
        const stamp = typeof now === 'number' ? now : Date.now();

        p.id = (typeof p.id === 'string' && p.id.trim()) ? p.id.trim() : `gemini-${stamp}`;
        p.categoryKey = typeof p.categoryKey === 'string' ? p.categoryKey : fallbackCategoryKey;
        p.meta = (p.meta && typeof p.meta === 'object') ? p.meta : {};
        p.diagramNodes = Array.isArray(p.diagramNodes)
            ? p.diagramNodes.filter(n => n && typeof n === 'object' && typeof n.name === 'string')
            : [];

        p.step1 = { ...p.step1 };
        p.step1.tags = Array.isArray(p.step1.tags)
            ? p.step1.tags.filter(tag => typeof tag === 'string')
            : [];

        // step2 is optional: drop it entirely unless both halves are present, so the
        // two-stage flow does not offer an empty report.
        const s2 = p.step2;
        const hasStep2 = s2 && typeof s2 === 'object'
            && typeof s2.architecture === 'string' && s2.architecture.trim()
            && typeof s2.security === 'string' && s2.security.trim();
        if (!hasStep2) delete p.step2;

        return p;
    }

    // Restrict a node type to the palette that actually has styles. The value ends
    // up in a class attribute, so an arbitrary string is also an injection risk.
    function safeNodeType(type) {
        return NODE_TYPES.includes(type) ? type : 'service';
    }

    // Draw one value from each constraint axis. Returned as a plain object so the
    // caller can both build a prompt from it and show it to the user.
    function pickConstraintCombo(random) {
        const rng = typeof random === 'function' ? random : Math.random;
        const combo = {};
        for (const [axis, values] of Object.entries(CONSTRAINT_AXES)) {
            combo[axis] = values[Math.floor(rng() * values.length)];
        }
        return combo;
    }

    // Comparison key for titles: case, punctuation and spacing differences should
    // not make "AI Destekli Rapor" and "ai-destekli rapor" look like separate ideas.
    function normalizeTitle(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // How much two titles share, as a fraction of the shorter one. Catches the
    // common near-duplicate ("Akıllı Sulama Ağı" vs "Akıllı Sulama Platformu")
    // that an exact-match check would let through.
    function titleOverlap(a, b) {
        const words = t => new Set(normalizeTitle(t).split(' ').filter(w => w.length > 3));
        const A = words(a);
        const B = words(b);
        if (A.size === 0 || B.size === 0) return 0;

        let shared = 0;
        for (const w of A) if (B.has(w)) shared++;
        return shared / Math.min(A.size, B.size);
    }

    // Choose an idea the user has not already been shown.
    //
    // The model is asked for several one-line ideas rather than one full project,
    // because filtering one-liners is both cheaper and more accurate than comparing
    // finished blueprints — and it means a repeat costs nothing to discard.
    //
    // Returns { idea, freshCount, exhausted }:
    //   exhausted — every idea in the batch was already known, so the least similar
    //               one is returned rather than spending another call.
    function selectFreshIdea(ideas, knownTitles, random) {
        const rng = typeof random === 'function' ? random : Math.random;

        const usable = (Array.isArray(ideas) ? ideas : []).filter(
            i => i && typeof i.title === 'string' && i.title.trim()
        );
        if (usable.length === 0) return { idea: null, freshCount: 0, exhausted: false };

        const known = (Array.isArray(knownTitles) ? knownTitles : []).filter(
            t => typeof t === 'string' && t.trim()
        );

        const SIMILAR = 0.6;
        const fresh = usable.filter(
            idea => !known.some(t => titleOverlap(idea.title, t) >= SIMILAR)
        );

        if (fresh.length > 0) {
            return {
                idea: fresh[Math.floor(rng() * fresh.length)],
                freshCount: fresh.length,
                exhausted: false
            };
        }

        // Nothing new in this batch — fall back to whichever is least like anything
        // already seen, so the user still gets a result.
        const leastSimilar = usable.reduce((best, idea) => {
            const worst = Math.max(0, ...known.map(t => titleOverlap(idea.title, t)));
            return worst < best.score ? { idea, score: worst } : best;
        }, { idea: usable[0], score: Infinity });

        return { idea: leastSimilar.idea, freshCount: 0, exhausted: true };
    }

    // Pick a project at random, avoiding an immediate repeat.
    // De-duplication is by id, not by index: indices belong to the *filtered* list,
    // so after a filter change a remembered index points at an unrelated project.
    function pickRandomProject(projects, lastId, random) {
        if (!Array.isArray(projects) || projects.length === 0) return null;
        const rng = typeof random === 'function' ? random : Math.random;

        const pickable = projects.length > 1
            ? projects.filter(p => p.id !== lastId)
            : projects;

        return pickable[Math.floor(rng() * pickable.length)];
    }

    // Pick a project the user has not been shown yet.
    //
    // Skipping only the immediately previous project meant a category with three
    // entries still felt like it was cycling through the same two. Tracking the
    // whole seen set instead turns N examples into N distinct results before
    // anything repeats.
    //
    // Returns { project, exhausted, seen }:
    //   exhausted — every candidate had been seen, so the set was cleared and the
    //               pick is from a fresh cycle. The caller can tell the user.
    //   seen      — the updated set, for the caller to persist.
    function pickUnseenProject(projects, seenIds, random) {
        if (!Array.isArray(projects) || projects.length === 0) {
            return { project: null, exhausted: false, seen: seenIds || [] };
        }
        const rng = typeof random === 'function' ? random : Math.random;
        const seen = new Set(Array.isArray(seenIds) ? seenIds : []);

        let candidates = projects.filter(p => !seen.has(p.id));
        let exhausted = false;

        if (candidates.length === 0) {
            // Everything in this filter has been shown — start a new cycle, but keep
            // ids from other categories so their history is not lost.
            exhausted = true;
            const inThisSet = new Set(projects.map(p => p.id));
            for (const id of [...seen]) if (inThisSet.has(id)) seen.delete(id);
            candidates = projects;
        }

        const project = candidates[Math.floor(rng() * candidates.length)];
        seen.add(project.id);

        return { project, exhausted, seen: [...seen] };
    }

    // Decide whether a Gemini call may proceed. Pure: callers pass the clock and
    // the recorded history, and get back both the verdict and the pruned history.
    function evaluateRateLimit(now, lastCallTimestamp, callHistory, options) {
        const cooldownMs = options.cooldownMs;
        const maxPerHour = options.maxPerHour;

        const recent = (Array.isArray(callHistory) ? callHistory : [])
            .filter(ts => ts > now - 3600000);

        const sinceLast = now - lastCallTimestamp;
        if (sinceLast < cooldownMs) {
            const secondsLeft = Math.ceil((cooldownMs - sinceLast) / 1000);
            return {
                allowed: false,
                history: recent,
                reason: `Güvenlik & Kota Koruması: Lütfen ${secondsLeft} saniye bekleyin.`
            };
        }

        if (recent.length >= maxPerHour) {
            return {
                allowed: false,
                history: recent,
                reason: `Saatlik Gemini API limitine (${maxPerHour} sorgu/saat) ulaşıldı. Otomatik dahili motora geçiliyor.`
            };
        }

        return { allowed: true, history: recent };
    }

    // Render a project as a Markdown blueprint document.
    function buildBlueprintMarkdown(p) {
        if (!p) return '';
        const meta = p.meta || {};
        const step1 = p.step1 || {};

        let doc = `# ${p.title} — Technical Blueprint & Market Analysis\n\n`;
        doc += `> **Slogan**: ${p.tagline}\n`;
        doc += `> **Kategori**: ${p.category}\n`;
        doc += `> **Fırsat Skoru**: ${meta.opportunityScore || 'N/A'}\n`;
        doc += `> **Zorluk Düzeyi**: ${meta.difficulty || 'N/A'}\n`;
        doc += `> **Tahmini MVP Süresi**: ${meta.mvpTime || 'N/A'}\n`;
        doc += `> **Gelir Modeli**: ${meta.monetization || 'N/A'}\n\n`;
        doc += `---\n\n`;
        doc += `## 1. ALANDAKİ AÇIK (Pazar Problemi & Fırsat)\n\n${step1.marketGap || ''}\n\n`;
        doc += `---\n\n`;
        doc += `## 2. DETAYLI PROJE AÇIKLAMASI & ÖZELLİKLER\n\n${step1.description || ''}\n\n`;
        doc += `---\n\n`;

        if (p.step2) {
            doc += `## 3. KOD MİMARİSİ VE SİSTEM KATMANLARI\n\n${p.step2.architecture}\n\n`;
            doc += `---\n\n`;
            doc += `## 4. GÜVENLİK YAPISI & RISK ÖNLEME TEDBİRLERİ\n\n${p.step2.security}\n\n`;
        }

        doc += `---\n*Generated by Aetheria.ai (Aetheria Agent)*\n`;
        return doc;
    }

    return {
        NODE_TYPES,
        CONSTRAINT_AXES,
        pickConstraintCombo,
        normalizeTitle,
        titleOverlap,
        selectFreshIdea,
        escapeHtml,
        parseMarkdown,
        validateProjectShape,
        normalizeProject,
        safeNodeType,
        pickRandomProject,
        pickUnseenProject,
        evaluateRateLimit,
        buildBlueprintMarkdown
    };
});

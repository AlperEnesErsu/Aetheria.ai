/* Boots the real application inside jsdom so tests can drive it the way a user
   does, instead of asserting that a string appears somewhere in app.js.
 *
 * The existing app.js assertions were source greps: they checked that a line of
 * code was written, not that it runs or does anything. A grep for
 * `option.disabled = true` passes even when the branch containing it is
 * unreachable. Everything this harness enables is a behaviour test.
 *
 * app.js has no exports — it is one DOMContentLoaded closure — so the only way
 * in is to load index.html, evaluate the three scripts in that window, and fire
 * the event ourselves.
 */

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

// jsdom will not fetch <script src>, so the three files are inlined into the
// markup instead — in the same order, in place of the tags they replace.
//
// Inlining rather than appending them after construction is deliberate. Appending
// meant the app's DOMContentLoaded handler had already missed the real event, so
// the harness dispatched a synthetic one — and then jsdom fired its own, running
// the whole initialiser a second time against a DOM the first run had already
// rewritten. Every test was booting a double-initialised app.
const INLINE = ['core.js', 'projects-data.js', 'app.js']
    .map(file => `<script>${read(file).replace(/<\/script/gi, '<\\/script')}</script>`)
    .join('\n');

const SEED_MARKER = '<!--AETHERIA_TEST_SEED-->';

const HTML_TEMPLATE = read('index.html').replace(
    /<script src="core\.js"[^>]*><\/script>[\s\S]*?<script src="app\.js"[^>]*><\/script>/,
    SEED_MARKER + '\n' + INLINE
);

if (HTML_TEMPLATE.includes('src="app.js"')) {
    throw new Error('app-harness: index.html script tags did not match the expected shape');
}

// Seeded from inside the page rather than from beforeParse: a value written to
// window.localStorage before the document exists does not survive into the
// document's own storage area, so the app booted as if nothing were stored and
// every "returning user" test silently exercised the first-visit path instead.
function seedScript(storage) {
    const entries = Object.entries(storage || {});
    if (entries.length === 0) return '';
    // The element removes itself: otherwise the seeded values stay in the page as
    // script text, and a test asserting "the key appears nowhere in the DOM" would
    // be failing on the harness rather than on the app.
    return `<script>${entries
        .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(String(v))});`)
        .join('')}document.currentScript.remove();</script>`;
}

/**
 * @param {object} [options]
 * @param {object} [options.storage]  seed values written to localStorage before boot
 * @param {function} [options.fetch]  stub for window.fetch
 * @returns {{window, document, dom, fetchCalls, flush}}
 */
async function bootApp(options = {}) {
    // Exceptions thrown inside an event listener never reach the caller of
    // .click(), so an app that throws on every render still looks like it passed.
    // Collecting them here is what makes `assert.deepStrictEqual(app.errors, [])`
    // meaningful.
    const errors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', err => errors.push(err));

    const objectUrls = [];
    // Record every request the app makes so tests can assert on the URL, headers
    // and body rather than trusting that the right code path ran.
    const fetchCalls = [];

    const html = HTML_TEMPLATE.replace(SEED_MARKER, seedScript(options.storage));

    const dom = new JSDOM(html, {
        virtualConsole,
        url: 'http://localhost:3000/',
        // 'dangerously' so the inlined scripts actually run — and run in one shared
        // global. window.eval() gave each file its own lexical scope, so
        // projects-data.js's `const PROJECTS_DATABASE` was invisible to app.js and
        // the app booted with no showcase data, a state no browser produces.
        runScripts: 'dangerously',
        pretendToBeVisual: true,

        // Everything the app touches has to exist before the scripts run, because
        // they now run during parsing rather than after it.
        beforeParse(window) {
            // jsdom implements neither, and the app calls both on paths the tests
            // need to reach; without them the first render throws.
            window.Element.prototype.scrollIntoView = function () {};
            window.HTMLElement.prototype.scrollIntoView = function () {};

            window.URL.createObjectURL = blob => {
                objectUrls.push(blob);
                return 'blob:stub';
            };
            window.URL.revokeObjectURL = () => {};

            window.fetch = async (url, init) => {
                fetchCalls.push({ url, init, body: init && init.body ? JSON.parse(init.body) : null });
                if (options.fetch) return options.fetch(url, init, fetchCalls.length);
                throw new Error('fetch stub not configured for this test');
            };

        }
    });
    const { window } = dom;

    // jsdom fires DOMContentLoaded on a later tick, so returning here synchronously
    // handed every test an app that had not initialised yet: assertions ran against
    // the raw markup and quietly described the first-visit state no matter what was
    // seeded. Waiting for it is what makes the returned handle meaningful.
    if (window.document.readyState === 'loading') {
        await new Promise(resolve =>
            window.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }

    return {
        dom,
        window,
        document: window.document,
        fetchCalls,
        objectUrls,
        /** Uncaught errors raised inside the page, including in event listeners. */
        errors,
        /** Let queued promise callbacks and the app's own sleeps settle. */
        flush: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
        $: sel => window.document.querySelector(sel),
        $$: sel => [...window.document.querySelectorAll(sel)],
        id: name => window.document.getElementById(name),
        terminal: () => [...window.document.querySelectorAll('#terminalBody .terminal-line')]
            .map(line => line.textContent.trim())
    };
}

/** A Gemini-shaped success response carrying `payload` as its JSON text. */
function geminiResponse(payload, tokens = 512) {
    return {
        ok: true,
        status: 200,
        json: async () => ({
            candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(payload) }] } }],
            usageMetadata: { totalTokenCount: tokens }
        })
    };
}

/** An HTTP error shaped the way the providers return them. */
function errorResponse(status, message = 'boom') {
    return {
        ok: false,
        status,
        text: async () => JSON.stringify({ error: { message } })
    };
}

/** A complete project matching the schema the renderer and validator require. */
function validProject(overrides = {}) {
    return {
        title: 'Test Projesi',
        tagline: 'Tek cümlelik slogan',
        category: 'DevOps & Yazılım Geliştirme Araçları',
        categoryKey: 'devops',
        scope: 'national',
        meta: {
            difficulty: 'İleri Düzey',
            mvpTime: '6 Hafta',
            monetization: 'B2B SaaS',
            opportunityScore: '%94 Fırsat Skoru'
        },
        diagramNodes: [
            { id: 1, name: 'Kaynak', type: 'source', sub: 'a' },
            { id: 2, name: 'Servis', type: 'service', sub: 'b' },
            { id: 3, name: 'AI', type: 'ai', sub: 'c' },
            { id: 4, name: 'Depo', type: 'storage', sub: 'd' }
        ],
        step1: {
            marketGap: 'Pazar boşluğu '.repeat(10),
            description: 'Açıklama '.repeat(10),
            tags: ['Go', 'Rust', 'Kubernetes']
        },
        step2: {
            architecture: 'Mimari '.repeat(20),
            security: 'Güvenlik '.repeat(20)
        },
        ...overrides
    };
}

/**
 * Answers the two generation passes: pass 1 returns one idea, pass 2 returns
 * `project`. Distinguishes them by the ideation prompt's JSON schema marker.
 */
function twoPassGemini(project = validProject(), ideaTitle = 'Üretilen Fikir') {
    return (url, init) => {
        const prompt = JSON.parse(init.body).contents[0].parts[0].text;
        if (prompt.includes('"ideas"')) {
            return geminiResponse({ ideas: [{ title: ideaTitle, summary: 'özet' }] }, 128);
        }
        return geminiResponse(project, 512);
    };
}

module.exports = { bootApp, geminiResponse, errorResponse, validProject, twoPassGemini };

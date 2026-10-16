/* ==========================================================================
   Aetheria.ai — DOM Helpers

   Self-contained pieces of the interface that app.js used to define inline:
   theme switching, the terminal log, the architecture diagram, clipboard and
   file downloads. Each takes what it touches as arguments instead of reaching
   into app.js's closure, so they can be read (and exercised under jsdom) on
   their own. app.js consumes them through window.AetheriaUI.
   ========================================================================== */

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.AetheriaUI = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const THEME_KEY = 'aetheria_theme';

    /**
     * Light/dark theme bound to <html data-theme>. An explicit choice is stored;
     * without one the page follows the system preference, live.
     *
     * @param {object} deps
     * @param {Document} deps.document
     * @param {Window} deps.window
     * @param {HTMLElement|null} deps.toggleButton
     * @param {function(string, string): void} deps.persist  storage write that tolerates failure
     */
    function createThemeController({ document, window, toggleButton, persist }) {
        function getStoredTheme() {
            try {
                return window.localStorage.getItem(THEME_KEY);
            } catch {
                return null;
            }
        }

        function getSystemTheme() {
            if (typeof window.matchMedia === 'function') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return 'light';
        }

        function applyTheme(theme, save = true) {
            const normalized = theme === 'dark' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', normalized);

            if (save) {
                persist(THEME_KEY, normalized);
            }

            if (toggleButton) {
                const isDark = normalized === 'dark';
                toggleButton.setAttribute('aria-pressed', String(isDark));
                toggleButton.title = isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç';
                toggleButton.setAttribute('aria-label', toggleButton.title);
            }
        }

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme') || getSystemTheme();
            applyTheme(current === 'dark' ? 'light' : 'dark', true);
        }

        function initTheme() {
            const stored = getStoredTheme();
            applyTheme((stored === 'dark' || stored === 'light') ? stored : getSystemTheme(), false);

            if (typeof window.matchMedia === 'function') {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
                    mediaQuery.addEventListener('change', e => {
                        if (!getStoredTheme()) {
                            applyTheme(e.matches ? 'dark' : 'light', false);
                        }
                    });
                }
            }
        }

        return { applyTheme, toggleTheme, initTheme };
    }

    /**
     * Terminal log writer. `message` can carry a raw upstream error body, so it is
     * redacted and then escaped before it becomes markup — a log line is the
     * easiest place for a secret to end up in a screenshot or a pasted bug report.
     *
     * @param {HTMLElement} body  the terminal's scrolling container
     * @param {object} deps
     * @param {function(string): string} deps.escapeHtml
     * @param {function(string): string} deps.redact
     */
    function createTerminalLog(body, { escapeHtml, redact }) {
        return function writeTerminalLog(message, type = 'info') {
            const document = body.ownerDocument;
            const line = document.createElement('div');
            line.className = 'terminal-line';

            const timestamp = new Date().toLocaleTimeString('tr-TR', { hour12: false });
            let statusTag = `<span class="prefix">[${timestamp}]</span>`;

            if (type === 'success') {
                statusTag += ` <span class="status-success">[SUCCESS]</span>`;
            } else if (type === 'agent') {
                statusTag += ` <span class="status-info">[AI AGENT]</span>`;
            } else if (type === 'warning') {
                // Was [SECURITY GUARD]. None of the callers is a security event —
                // they are a failed generation, an exhausted idea batch, an unreadable
                // file, a measurement that refutes its claim.
                statusTag += ` <span class="status-info" style="color: var(--accent-warning);">[UYARI]</span>`;
            } else {
                statusTag += ` <span class="status-info">[SCAN]</span>`;
            }

            line.innerHTML = `${statusTag} <span>${escapeHtml(redact(message))}</span>`;
            body.appendChild(line);
            body.scrollTop = body.scrollHeight;
        };
    }

    /**
     * Architecture flow graph: one card per node, arrows between them.
     * `safeNodeType` restricts node.type to the known palette because it lands in
     * a class name.
     */
    function renderArchitectureDiagram(container, nodes, safeNodeType) {
        container.innerHTML = '';
        if (!nodes || nodes.length === 0) return;
        const document = container.ownerDocument;

        nodes.forEach((node, idx) => {
            const card = document.createElement('div');
            card.className = `diagram-node-card node-${safeNodeType(node.type)}`;

            const name = document.createElement('div');
            name.className = 'node-name';
            name.textContent = node.name;

            const sub = document.createElement('div');
            sub.className = 'node-sub';
            sub.textContent = node.sub || '';

            card.append(name, sub);
            container.appendChild(card);

            if (idx < nodes.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'flow-arrow';
                arrow.innerHTML = '➔';
                container.appendChild(arrow);
            }
        });
    }

    /** Copy text, falling back to a hidden textarea where the Clipboard API is missing. Throws on failure. */
    async function copyText(document, text) {
        const clipboard = document.defaultView && document.defaultView.navigator.clipboard;
        if (clipboard && typeof clipboard.writeText === 'function') {
            await clipboard.writeText(text);
            return;
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    /** Briefly show "✓ Kopyalandı" on a copy button, then restore its label. */
    function flashCopied(button, fallbackLabel) {
        if (!button) return;
        button.classList.add('is-copied');
        const span = button.querySelector('span');
        const prevText = span ? span.textContent : '';
        if (span) span.textContent = '✓ Kopyalandı';
        setTimeout(() => {
            button.classList.remove('is-copied');
            if (span) span.textContent = prevText || fallbackLabel;
        }, 2000);
    }

    /**
     * Download `content` as a file. The blob URL stays alive for the whole document
     * lifetime unless revoked, so every export used to leak its payload; revoking is
     * deferred one tick so the download has started.
     */
    function downloadTextFile(document, filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    return {
        createThemeController,
        createTerminalLog,
        renderArchitectureDiagram,
        copyText,
        flashCopied,
        downloadTextFile
    };
});

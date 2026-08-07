const js = require('@eslint/js');

module.exports = [
    {
        ignores: ['node_modules/**']
    },
    js.configs.recommended,
    {
        // Browser sources: plain scripts sharing a global scope, no bundler
        files: ['app.js', 'core.js', 'projects-data.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                window: 'readonly',
                document: 'readonly',
                self: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
                Response: 'readonly',
                AbortController: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                MutationObserver: 'readonly',
                module: 'writable'
            }
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'smart']
        }
    },
    {
        // projects-data.js declares PROJECTS_DATABASE; app.js only reads it
        files: ['app.js'],
        languageOptions: {
            globals: { PROJECTS_DATABASE: 'readonly' }
        }
    },
    {
        files: ['projects-data.js'],
        rules: { 'no-unused-vars': 'off' }
    },
    {
        // Node-side sources: tests, tooling config and standalone scripts
        files: ['test/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'writable',
                __dirname: 'readonly',
                console: 'readonly',
                process: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                setTimeout: 'readonly'
            }
        }
    }
];

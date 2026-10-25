const assert = require('node:assert/strict');
const path = require('node:path');
const { before, describe, it } = require('node:test');
const { ESLint } = require('eslint');

const fixtureDir = path.join(__dirname, 'fixture');
const byFile = {};

before(async () => {
    const eslint = new ESLint({ cwd: fixtureDir });
    for (const result of await eslint.lintFiles(['src/**/*.ts', 'src/**/*.html'])) {
        byFile[path.basename(result.filePath)] = result.messages;
    }
});

const ruleIds = file => byFile[file].map(message => message.ruleId);

describe('eslint-config-repo', () => {
    it('loads and lints TypeScript and Angular templates without configuration errors', () => {
        assert.deepEqual(Object.keys(byFile).sort(), ['bad.component.html', 'bad.component.ts', 'decorators.ts', 'good.component.html', 'good.component.ts']);
        for (const [file, messages] of Object.entries(byFile)) {
            assert.deepEqual(
                messages.filter(message => message.fatal),
                [],
                `${file} has fatal messages`
            );
        }
    });

    it('accepts conforming code', () => {
        assert.deepEqual(byFile['good.component.ts'], []);
        assert.deepEqual(byFile['good.component.html'], []);
        assert.deepEqual(byFile['decorators.ts'], []);
    });

    it('enforces the selector prefix rules', () => {
        assert.ok(ruleIds('bad.component.ts').includes('@angular-eslint/component-selector'));
    });

    it('enforces the shared TypeScript rules', () => {
        const ids = ruleIds('bad.component.ts');
        for (const expected of [
            '@typescript-eslint/require-await',
            '@typescript-eslint/naming-convention',
            '@typescript-eslint/member-ordering',
            '@typescript-eslint/no-unsafe-function-type',
            'no-new-func',
            'no-template-curly-in-string'
        ]) {
            assert.ok(ids.includes(expected), `expected ${expected} in ${JSON.stringify([...new Set(ids)])}`);
        }
    });

    it('enforces attribute order and template recommendations', () => {
        const ids = ruleIds('bad.component.html');
        assert.ok(ids.includes('@angular-eslint/template/attributes-order'), JSON.stringify(ids));
    });
});

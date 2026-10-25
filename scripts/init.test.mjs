// Runs scripts/init.mjs against copies of the real template files (never the working tree itself).
// Optional: INIT_TEST_MAVEN=1 also builds the initialised copy with ./mvnw (needs network or a warm ~/.m2).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { FILLED_TOKENS, KEPT_TOKENS, findTokens, listFiles, sortLockfile, stripInitTest, transformPath } from './init.mjs';

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const initScript = join(templateRoot, 'scripts', 'init.mjs');
const workDirs = [];

const baseArgs = ['--prefix', 'acme', '--group-id', 'com.acme', '--name', 'Acme Build Standards', '--author', 'Acme Inc.', '--year', '2031'];

function copyTemplate() {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    workDirs.push(dir);
    for (const relPath of listFiles(templateRoot)) {
        mkdirSync(dirname(join(dir, relPath)), { recursive: true });
        cpSync(join(templateRoot, relPath), join(dir, relPath), { preserveTimestamps: true });
    }
    return dir;
}

function runInit(root, args) {
    return spawnSync(process.execPath, [initScript, '--root', root, ...args], { encoding: 'utf8' });
}

const read = (root, relPath) => readFileSync(join(root, relPath), 'utf8');

function snapshot(root) {
    return Object.fromEntries(listFiles(root).map(relPath => [relPath, readFileSync(join(root, relPath)).toString('base64')]));
}

after(() => {
    for (const dir of workDirs) {
        rmSync(dir, { recursive: true, force: true });
    }
});

describe('the real template', () => {
    it('only contains tokens that init.mjs fills or deliberately keeps', () => {
        const known = new Set([...FILLED_TOKENS, ...KEPT_TOKENS]);
        const unknown = [];
        for (const relPath of listFiles(templateRoot)) {
            if (/^(scripts\/|\.claude\/rules\/|THIRD_PARTY_NOTICES\.md$|mvnw)/.test(relPath) || relPath.endsWith('.jar')) {
                continue;
            }
            for (const token of findTokens(readFileSync(join(templateRoot, relPath), 'utf8'))) {
                if (!known.has(token)) {
                    unknown.push(`${relPath}: {{${token}}}`);
                }
            }
        }
        assert.deepEqual(unknown, []);
    });

    it('ships no placeholders in LICENSE and SECURITY.md', () => {
        for (const file of ['LICENSE', 'SECURITY.md']) {
            assert.deepEqual(findTokens(read(templateRoot, file)), [], file);
        }
    });
});

describe('init.mjs', () => {
    it('--dry-run changes nothing', () => {
        const root = copyTemplate();
        const before = snapshot(root);
        const result = runInit(root, [...baseArgs, '--dry-run']);
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /\[dry run\]/);
        assert.deepEqual(snapshot(root), before);
    });

    it('renames modules, fills tokens and removes itself', () => {
        const root = copyTemplate();
        const result = runInit(root, [...baseArgs, '--release-date', '2031-02-03', '--license', 'Apache-2.0', '--component-prefix', 'ac']);
        assert.equal(result.status, 0, result.stderr);

        for (const dir of ['acme-parent', 'acme-code-quality-configs', 'acme-shared-configs', 'acme-shared-configs/packages/eslint-config-acme']) {
            assert.ok(statSync(join(root, dir)).isDirectory(), dir);
        }
        assert.ok(existsSync(join(root, 'acme-code-quality-configs/src/main/resources/acme_java_style.xml')));
        for (const old of ['repo-parent', 'repo-code-quality-configs', 'repo-shared-configs']) {
            assert.ok(!existsSync(join(root, old)), `${old} should be gone`);
        }

        const rootPom = read(root, 'pom.xml');
        assert.match(rootPom, /<groupId>com\.acme<\/groupId>\s*<artifactId>acme-build-standards<\/artifactId>/);
        assert.match(rootPom, /<name>Acme Build Standards<\/name>/);
        assert.match(rootPom, /<module>acme-parent<\/module>/);
        assert.match(read(root, 'acme-parent/pom.xml'), /<artifactId>acme-code-quality-configs<\/artifactId>/);
        assert.match(read(root, 'acme-parent/pom.xml'), /<acme-code-quality-configs\.version>/);
        assert.match(read(root, 'acme-parent/pom.xml'), /<file>acme_java_style\.xml<\/file>/);

        assert.match(read(root, 'LICENSE'), /^Copyright \(c\) 2031 Acme Inc\.$/m);
        assert.match(read(root, 'CHANGELOG.md'), /## \[1\.0\.0\.0\] - 2031-02-03/);

        const pkg = JSON.parse(read(root, 'acme-shared-configs/packages/eslint-config-acme/package.json'));
        assert.equal(pkg.name, '@acme/eslint-config-acme');
        assert.equal(pkg.license, 'Apache-2.0');
        assert.match(pkg.description, /Acme Build Standards/);
        assert.match(read(root, 'acme-shared-configs/packages/eslint-config-acme/index.js'), /prefix: \['app', 'ac'\]/);
        const workspace = JSON.parse(read(root, 'acme-shared-configs/package.json'));
        assert.equal(workspace.scripts['patch:eslint-config-acme'], 'yarn workspace @acme/eslint-config-acme version patch');
        assert.match(read(root, 'acme-shared-configs/yarn.lock'), /"@acme\/eslint-config-acme@workspace:packages\/eslint-config-acme"/);
        assert.match(read(root, 'Makefile'), /cd acme-shared-configs && yarn install --immutable/);

        // Only the deliberately kept tokens remain, and the unused site-report exclusion is gone.
        const remaining = new Set();
        for (const relPath of listFiles(root)) {
            if (!relPath.endsWith('.jar') && !relPath.startsWith('.claude/rules/') && !relPath.startsWith('mvnw')) {
                findTokens(read(root, relPath)).forEach(token => remaining.add(token));
            }
        }
        assert.deepEqual(
            [...remaining].filter(token => !KEPT_TOKENS.includes(token)),
            []
        );
        assert.ok(!read(root, 'acme-parent/pom.xml').includes('pluginManagementExcludes'));

        // The vendored rules and notices are left alone; the init tooling is gone.
        assert.equal(read(root, '.claude/rules/java/security.md'), read(templateRoot, '.claude/rules/java/security.md'));
        assert.equal(read(root, 'THIRD_PARTY_NOTICES.md'), read(templateRoot, 'THIRD_PARTY_NOTICES.md'));
        assert.ok(!existsSync(join(root, 'scripts')));
        assert.ok(!read(root, 'Makefile').includes('init-test'));
        assert.match(read(root, 'Makefile'), /^\.PHONY: maven-build maven-ci npm-ci ci$/m);
        assert.match(read(root, 'Makefile'), /^ci: maven-ci npm-ci$/m);
    });

    it('keeps executable bits and CRLF line endings', () => {
        const root = copyTemplate();
        assert.equal(runInit(root, baseArgs).status, 0);
        assert.ok(statSync(join(root, 'mvnw')).mode & 0o111, 'mvnw executable');
        assert.ok(statSync(join(root, 'acme-parent/../samples/try-on-project.sh')).mode & 0o111, 'try-on-project.sh executable');
        assert.ok(read(root, 'mvnw.cmd').includes('\r\n'));
    });

    it('fills the optional values when given', () => {
        const root = copyTemplate();
        const result = runInit(root, [
            ...baseArgs,
            '--plugin-group-id',
            'com.acme.plugins',
            '--maven-distribution-url',
            'https://artifacts.acme.test/maven/apache-maven-3.10.0-bin.zip',
            '--keep-scripts'
        ]);
        assert.equal(result.status, 0, result.stderr);
        assert.match(read(root, 'acme-parent/pom.xml'), /<pluginManagementExcludes>com\.acme\.plugins<\/pluginManagementExcludes>/);
        assert.match(read(root, '.mvn/wrapper/maven-wrapper.properties'), /# distributionUrl=https:\/\/artifacts\.acme\.test\//);
        assert.ok(existsSync(join(root, 'scripts/init.mjs')), '--keep-scripts keeps scripts/');
    });

    it('does not interpret $ sequences in values', () => {
        const root = copyTemplate();
        const result = runInit(root, ['--prefix', 'acme', '--group-id', 'com.acme', '--name', "Cost $1 $$ $' $`", '--author', 'A $$ B']);
        assert.equal(result.status, 0, result.stderr);
        assert.ok(read(root, 'pom.xml').includes("<name>Cost $1 $$ $' $`</name>"));
        assert.match(read(root, 'LICENSE'), /^Copyright \(c\) \d{4} A \$\$ B$/m);
    });

    for (const [title, args, message] of [
        ['a missing required option', ['--prefix', 'acme'], /--group-id is required/],
        ['an uppercase prefix', ['--prefix', 'Acme', '--group-id', 'com.acme', '--name', 'n', '--author', 'a'], /Invalid prefix/],
        ['a groupId without a dot', ['--prefix', 'acme', '--group-id', 'acme', '--name', 'n', '--author', 'a'], /Invalid groupId/],
        ['a name that would break XML', ['--prefix', 'acme', '--group-id', 'com.acme', '--name', 'A & B', '--author', 'a'], /must not contain/],
        ['an unknown option', [...baseArgs, '--nope', 'x'], /Unknown option/],
        ['a bad date', [...baseArgs, '--release-date', '03.02.2031'], /Invalid releaseDate/]
    ]) {
        it(`rejects ${title} without touching any file`, () => {
            const root = copyTemplate();
            const before = snapshot(root);
            const result = runInit(root, args);
            assert.equal(result.status, 2, result.stdout);
            assert.match(result.stderr, message);
            assert.deepEqual(snapshot(root), before);
        });
    }

    it('refuses to run twice', () => {
        const root = copyTemplate();
        assert.equal(runInit(root, [...baseArgs, '--keep-scripts']).status, 0);
        const second = runInit(root, baseArgs);
        assert.equal(second.status, 2);
        assert.match(second.stderr, /does not look like an untouched template/);
    });

    it('prints usage for --help', () => {
        const result = spawnSync(process.execPath, [initScript, '--help'], { encoding: 'utf8' });
        assert.equal(result.status, 0);
        assert.match(result.stdout, /Usage: node scripts\/init\.mjs/);
    });
});

describe('helpers', () => {
    it('transformPath renames only the repo-prefixed segments', () => {
        const config = { prefix: 'acme' };
        assert.equal(transformPath('repo-parent/pom.xml', config), 'acme-parent/pom.xml');
        assert.equal(
            transformPath('repo-code-quality-configs/src/main/resources/repo_java_style.xml', config),
            'acme-code-quality-configs/src/main/resources/acme_java_style.xml'
        );
        assert.equal(
            transformPath('repo-shared-configs/packages/eslint-config-repo/index.js', config),
            'acme-shared-configs/packages/eslint-config-acme/index.js'
        );
        assert.equal(transformPath('samples/formatting-sample/pom.xml', config), 'samples/formatting-sample/pom.xml');
    });

    it('stripInitTest handles the template Makefile', () => {
        const stripped = stripInitTest(readFileSync(join(templateRoot, 'Makefile'), 'utf8'));
        assert.ok(!stripped.includes('init-test'));
        assert.match(stripped, /npm-ci:\n\tcd repo-shared-configs && yarn install --immutable && yarn format:check && yarn test\n\nci: maven-ci npm-ci\n$/);
    });
});

describe('yarn.lock handling', () => {
    it('sortLockfile leaves the Yarn-generated lockfile unchanged (same order as Yarn)', () => {
        const lock = readFileSync(join(templateRoot, 'repo-shared-configs/yarn.lock'), 'utf8');
        assert.equal(sortLockfile(lock), lock);
    });

    it('init keeps the lockfile ordered when workspace names move', () => {
        const root = copyTemplate();
        assert.equal(runInit(root, ['--prefix', 'zzz', '--group-id', 'com.zzz', '--name', 'Z', '--author', 'Z']).status, 0);
        const lock = read(root, 'zzz-shared-configs/yarn.lock');
        assert.ok(lock.indexOf('"@zzz/eslint-config-zzz@workspace') > lock.indexOf('"@humanwhocodes/'));
        assert.equal(sortLockfile(lock), lock);
        assert.ok(lock.endsWith('\n') && !lock.endsWith('\n\n'));
    });
});

describe('a Maven build of the initialised template', { skip: process.env.INIT_TEST_MAVEN !== '1' }, () => {
    it('passes tidy:check verify', { timeout: 600_000 }, () => {
        const root = copyTemplate();
        assert.equal(runInit(root, baseArgs).status, 0);
        const result = spawnSync('./mvnw', ['--batch-mode', 'tidy:check', 'verify'], { cwd: root, encoding: 'utf8' });
        assert.equal(result.status, 0, result.stdout.slice(-3000));
        assert.match(result.stdout, /BUILD SUCCESS/);
    });
});

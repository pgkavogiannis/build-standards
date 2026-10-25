#!/usr/bin/env node
// Turns this template into your project: renames repo-* modules to <prefix>-*, fills the remaining {{...}} tokens and the
// default values (groupId, license holder), then removes itself. Run once, from a fresh clone or an unpacked archive.
//
//   node scripts/init.mjs --prefix acme --group-id com.acme --name "Acme Build Standards" --author "Acme Inc."
//
// Options (see printUsage). Leaves {{NVD_API_KEY}}, {{OSS_INDEX_USERNAME}} and {{OSS_INDEX_PASSWORD}} alone on purpose:
// credentials belong in your own settings.xml / CI secrets, never in a committed POM.
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PREFIX = 'repo';
const DEFAULT_GROUP_ID = 'com.example';
const DEFAULT_AUTHOR = 'John Doe';

/** Directories never walked; build output and dependency stores are not template files. */
const SKIPPED_DIRS = new Set(['.git', 'node_modules', '.yarn', 'target']);
const SKIPPED_FILES = new Set(['.pnp.cjs', '.pnp.loader.mjs']);
const BINARY_EXTENSIONS = new Set(['.jar', '.class', '.png', '.jpg', '.ico', '.zip', '.gz']);

/** Content is left untouched here: vendored text, the init tooling itself and the Maven wrapper scripts. */
const CONTENT_EXCLUDED = [/^\.claude\/rules\//, /^THIRD_PARTY_NOTICES\.md$/, /^scripts\//, /^mvnw(\.cmd)?$/];

/** Tokens that may remain after a run; everything else must have been filled. */
export const KEPT_TOKENS = ['NVD_API_KEY', 'OSS_INDEX_USERNAME', 'OSS_INDEX_PASSWORD', 'MAVEN_DISTRIBUTION_URL'];
/** Tokens this script fills. Together with KEPT_TOKENS this must cover every token in the template (tested). */
export const FILLED_TOKENS = ['PROJECT_NAME', 'COMPONENT_PREFIX', 'LICENSE', 'RELEASE_DATE', 'CUSTOM_PLUGIN_GROUP_ID'];

class UsageError extends Error {}

function printUsage() {
    return `Usage: node scripts/init.mjs --prefix <p> --group-id <g> --name <n> --author <a> [options]

Required:
  --prefix <p>                  Module/package prefix: repo-parent -> <p>-parent, @repo/... -> @<p>/... (lowercase, e.g. acme)
  --group-id <g>                Maven groupId, e.g. com.acme
  --name <n>                    Human-readable project name, e.g. "Acme Build Standards"
  --author <a>                  Copyright holder written to LICENSE

Optional:
  --year <yyyy>                 Copyright year (default: current year)
  --license <spdx>              SPDX id for package.json and the README (default: MIT; replace LICENSE yourself if not MIT)
  --component-prefix <p>        Angular selector prefix (default: the --prefix value)
  --release-date <yyyy-mm-dd>   Date of the first CHANGELOG release (default: today)
  --maven-distribution-url <u>  Internal Maven distribution URL for .mvn/wrapper/maven-wrapper.properties (default: left as is)
  --plugin-group-id <g>         Custom plugin groupId to exclude from site reports (default: the exclusion is removed)
  --keep-scripts                Keep scripts/ and the init-test Makefile target (default: removed, they only work on the template)
  --dry-run                     Print what would change and write nothing
  --root <dir>                  Template root (default: the directory above scripts/)
`;
}

export function parseArgs(argv) {
    const flags = new Set(['dry-run', 'keep-scripts', 'help']);
    const values = new Set([
        'prefix',
        'group-id',
        'name',
        'author',
        'year',
        'license',
        'component-prefix',
        'release-date',
        'maven-distribution-url',
        'plugin-group-id',
        'root'
    ]);
    const opts = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg.startsWith('--')) {
            throw new UsageError(`Unexpected argument: ${arg}`);
        }
        const key = arg.slice(2);
        if (flags.has(key)) {
            opts[key] = true;
        } else if (values.has(key)) {
            const value = argv[++i];
            if (value === undefined || value.startsWith('--')) {
                throw new UsageError(`--${key} needs a value`);
            }
            opts[key] = value;
        } else {
            throw new UsageError(`Unknown option: ${arg}`);
        }
    }
    return opts;
}

export function resolveOptions(opts, now = new Date()) {
    if (opts.help) {
        return null;
    }
    for (const required of ['prefix', 'group-id', 'name', 'author']) {
        if (!opts[required]) {
            throw new UsageError(`--${required} is required`);
        }
    }
    const config = {
        prefix: opts.prefix,
        groupId: opts['group-id'],
        name: opts.name,
        author: opts.author,
        year: opts.year ?? String(now.getFullYear()),
        license: opts.license ?? 'MIT',
        componentPrefix: opts['component-prefix'] ?? opts.prefix,
        releaseDate: opts['release-date'] ?? now.toISOString().slice(0, 10),
        mavenDistributionUrl: opts['maven-distribution-url'],
        pluginGroupId: opts['plugin-group-id'],
        keepScripts: Boolean(opts['keep-scripts']),
        dryRun: Boolean(opts['dry-run'])
    };
    const checks = [
        ['prefix', /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, 'lowercase letters, digits and single hyphens, starting with a letter'],
        ['groupId', /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/, 'dot-separated Java-style identifiers, e.g. com.acme'],
        ['year', /^\d{4}$/, 'four digits'],
        ['license', /^[A-Za-z0-9.+-]+$/, 'an SPDX identifier such as MIT or Apache-2.0'],
        ['componentPrefix', /^[a-z][a-z0-9]*$/, 'lowercase letters and digits, e.g. acme'],
        ['releaseDate', /^\d{4}-\d{2}-\d{2}$/, 'yyyy-mm-dd']
    ];
    for (const [field, pattern, hint] of checks) {
        if (!pattern.test(config[field])) {
            throw new UsageError(`Invalid ${field} "${config[field]}": ${hint}`);
        }
    }
    if (config.pluginGroupId !== undefined && !/^[A-Za-z][A-Za-z0-9_.-]*$/.test(config.pluginGroupId)) {
        throw new UsageError(`Invalid pluginGroupId "${config.pluginGroupId}"`);
    }
    // These values land in XML, JSON and Markdown; rejecting the few characters that need escaping keeps every file valid.
    for (const field of ['name', 'author', 'mavenDistributionUrl']) {
        if (config[field] !== undefined && /[<>&"\\\r\n]/.test(config[field])) {
            throw new UsageError(`${field} must not contain < > & " \\ or line breaks`);
        }
    }
    return config;
}

function isExcludedFromContent(relPath) {
    return CONTENT_EXCLUDED.some(pattern => pattern.test(relPath));
}

/** Every file under root as a posix-style relative path. */
export function listFiles(root) {
    const found = [];
    const walk = dir => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                if (!SKIPPED_DIRS.has(entry.name)) {
                    walk(join(dir, entry.name));
                }
            } else if (entry.isFile() && !SKIPPED_FILES.has(entry.name)) {
                found.push(relative(root, join(dir, entry.name)).split(sep).join('/'));
            }
        }
    };
    walk(root);
    return found.sort();
}

function isText(path, buffer) {
    const dot = path.lastIndexOf('.');
    return !(dot !== -1 && BINARY_EXTENSIONS.has(path.slice(dot))) && !buffer.includes(0);
}

/** Replace with a function so '$&' and friends in user input are never interpreted. */
const sub = (text, pattern, value) => text.replace(pattern, () => value);

export function transformContent(relPath, text, config) {
    if (isExcludedFromContent(relPath)) {
        return text;
    }
    const p = config.prefix;
    let out = text;
    out = sub(out, /@repo\//g, `@${p}/`);
    out = sub(out, /\beslint-config-repo\b/g, `eslint-config-${p}`);
    out = sub(out, /\brepo_java_style\b/g, `${p}_java_style`);
    out = sub(out, /\brepo-(?=[a-z])/g, `${p}-`);
    out = sub(out, /<groupId>com\.example<\/groupId>/g, `<groupId>${config.groupId}</groupId>`);
    out = sub(out, /\{\{PROJECT_NAME\}\}/g, config.name);
    out = sub(out, /\{\{COMPONENT_PREFIX\}\}/g, config.componentPrefix);
    out = sub(out, /\{\{LICENSE\}\}/g, config.license);
    out = sub(out, /\{\{RELEASE_DATE\}\}/g, config.releaseDate);
    if (config.mavenDistributionUrl !== undefined) {
        out = sub(out, /\{\{MAVEN_DISTRIBUTION_URL\}\}/g, config.mavenDistributionUrl);
    }
    if (relPath === 'LICENSE') {
        out = sub(out, /^Copyright \(c\) \d{4} John Doe$/m, `Copyright (c) ${config.year} ${config.author}`);
    }
    if (basename(relPath) === 'yarn.lock') {
        out = sortLockfile(out);
    }
    if (basename(relPath) === 'pom.xml') {
        if (config.pluginGroupId !== undefined) {
            out = sub(out, /\{\{CUSTOM_PLUGIN_GROUP_ID\}\}/g, config.pluginGroupId);
        } else {
            out = out.replace(
                /\r?\n[ \t]*<configuration>\s*<pluginManagementExcludes>\{\{CUSTOM_PLUGIN_GROUP_ID\}\}<\/pluginManagementExcludes>\s*<\/configuration>/g,
                ''
            );
        }
    }
    return out;
}

/**
 * Yarn rejects `install --immutable` when entries are not in its own order, and renamed workspaces move. Entries are
 * blank-line separated blocks after the header, ordered by their (unquoted) key in plain code-unit order.
 */
export function sortLockfile(text) {
    const trailingNewline = text.endsWith('\n') ? '\n' : '';
    const blocks = text.slice(0, text.length - trailingNewline.length).split(/\n\n(?=\S)/);
    const isEntry = block => /^"?[^#\s_]/.test(block) && !block.startsWith('__metadata:') && !block.startsWith('#');
    const firstEntry = blocks.findIndex(isEntry);
    if (firstEntry === -1) {
        return text;
    }
    const key = block => block.split('\n', 1)[0].replace(/:$/, '').replace(/^"|"$/g, '');
    const entries = blocks.slice(firstEntry).sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    return [...blocks.slice(0, firstEntry), ...entries].join('\n\n') + trailingNewline;
}

/** Removes the init-test target and its wiring from the Makefile. */
export function stripInitTest(makefile) {
    return makefile.replace(/ init-test(?=[ \n])/g, '').replace(/^(#[^\n]*\n)?init-test:\n(\t[^\n]*\n)+\n?/m, '');
}

export function transformPath(relPath, config) {
    return relPath
        .split('/')
        .map(segment =>
            segment
                .replace(/^repo-(?=[a-z])/, `${config.prefix}-`)
                .replace(/^repo_java_style(?=\.)/, `${config.prefix}_java_style`)
                .replace(/^eslint-config-repo$/, `eslint-config-${config.prefix}`)
        )
        .join('/');
}

/** Tokens still present in the template that init does not know about (or any token left after a run). */
export function findTokens(text) {
    return [...text.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)].map(match => match[1]);
}

export function run(config, root, log = console.log) {
    if (!existsSync(join(root, 'repo-parent', 'pom.xml')) || !existsSync(join(root, 'scripts', 'init.mjs'))) {
        throw new UsageError(`${root} does not look like an untouched template (repo-parent/ or scripts/init.mjs missing); nothing to do.`);
    }
    const files = listFiles(root);
    const contentChanges = new Map();
    const unknownTokens = new Map();
    for (const relPath of files) {
        const buffer = readFileSync(join(root, relPath));
        if (!isText(relPath, buffer)) {
            continue;
        }
        const before = buffer.toString('utf8');
        const after = transformContent(relPath, before, config);
        if (after !== before) {
            contentChanges.set(relPath, after);
        }
        if (!isExcludedFromContent(relPath)) {
            const leftover = findTokens(after).filter(token => !KEPT_TOKENS.includes(token));
            if (leftover.length > 0) {
                unknownTokens.set(relPath, [...new Set(leftover)]);
            }
        }
    }
    if (unknownTokens.size > 0) {
        const detail = [...unknownTokens].map(([file, tokens]) => `  ${file}: ${tokens.map(t => `{{${t}}}`).join(', ')}`).join('\n');
        throw new Error(`Tokens this script does not fill remain after substitution:\n${detail}`);
    }
    const renames = files.map(relPath => [relPath, transformPath(relPath, config)]).filter(([from, to]) => from !== to);

    log(`${config.dryRun ? '[dry run] ' : ''}${contentChanges.size} files change content, ${renames.length} files move.`);
    for (const relPath of contentChanges.keys()) {
        log(`  edit    ${relPath}`);
    }
    for (const [from, to] of renames) {
        log(`  move    ${from} -> ${to}`);
    }
    if (config.dryRun) {
        return;
    }

    for (const [relPath, text] of contentChanges) {
        writeFileSync(join(root, relPath), text);
    }
    for (const [from, to] of renames) {
        mkdirSync(dirname(join(root, to)), { recursive: true });
        renameSync(join(root, from), join(root, to));
    }
    removeEmptyDirs(root);

    if (!config.keepScripts) {
        rmSync(join(root, 'scripts'), { recursive: true, force: true });
        const makefile = join(root, 'Makefile');
        if (existsSync(makefile)) {
            writeFileSync(makefile, stripInitTest(readFileSync(makefile, 'utf8')));
        }
        log('  removed scripts/ and the init-test Makefile target (they only work on the untouched template)');
    }
    log('Done. Not filled on purpose: {{NVD_API_KEY}}, {{OSS_INDEX_USERNAME}}, {{OSS_INDEX_PASSWORD}} (set them via settings.xml or CI secrets).');
    if (config.license !== 'MIT') {
        log(`LICENSE still contains the MIT text; replace it to match ${config.license}.`);
    }
    log('Next: ./mvnw clean install, then (cd ' + config.prefix + '-shared-configs && yarn install --immutable).');
}

function removeEmptyDirs(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && !SKIPPED_DIRS.has(entry.name)) {
            const child = join(dir, entry.name);
            removeEmptyDirs(child);
            if (readdirSync(child).length === 0) {
                rmSync(child, { recursive: true });
            }
        }
    }
}

function main() {
    try {
        const config = resolveOptions(parseArgs(process.argv.slice(2)));
        if (config === null) {
            console.log(printUsage());
            return;
        }
        const root = resolve(parseArgs(process.argv.slice(2)).root ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
        if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
            throw new UsageError(`--root ${root} is not a directory`);
        }
        run(config, root);
    } catch (error) {
        if (error instanceof UsageError) {
            console.error(`${error.message}\n\n${printUsage()}`);
            process.exitCode = 2;
        } else {
            console.error(error.message);
            process.exitCode = 1;
        }
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main();
}

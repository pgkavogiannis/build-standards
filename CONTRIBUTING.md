# Contributing

## Development setup

**Prerequisites:** Java 21, Maven 3.9.4+ (or use `./mvnw`), Node.js 20+, Yarn 4+

```sh
# Build Maven artifacts locally
./mvnw clean install

# Install npm packages
cd repo-shared-configs
yarn install
```

## Before committing

Activate the pre-commit hook once after cloning:

```sh
git config core.hooksPath .husky
chmod +x .husky/pre-commit
```

The hook is a plain script (husky itself is not used, so there is no `prepare`/`postinstall` step); it runs
`./mvnw tidy:check` on every commit. Run manually:

```sh
# Maven checks for this repo (POM order, custom Checkstyle checks' unit tests)
./mvnw tidy:check verify

# Auto-fix POM formatting
./mvnw tidy:pom

# Spotless and Checkstyle run in projects that inherit repo-parent; try them on the sample
samples/formatting-sample/try-it.sh
```

## Dependency updates

[Renovate](https://docs.renovatebot.com/) (`renovate.json`) proposes Maven and npm updates, never newer than 7 days
(`minimumReleaseAge`), matching `npmMinimalAgeGate: 7d` in `repo-shared-configs/.yarnrc.yml`. Renovate does not track
`.sdkmanrc` or `eclipse-style.version` (bumping the formatter changes output; see USAGE.md): update those by hand.
If a security release is newer than 7 days, check its provenance first, then bypass the gate for that one package only:
list it under `npmPreapprovedPackages` in `.yarnrc.yml`, run `yarn up -R <pkg>`, remove the entry again, and say so in the
commit message. (`YARN_NPM_MINIMAL_AGE_GATE=0` lowers the gate for every package in that run; avoid it.)

## Pull requests

1. Branch from `develop` (gitflow: feature → develop → release → main); a fresh clone only has `main`, so create it once with
   `git branch develop main`
2. One concern per PR
3. Ensure `make ci` passes before opening
4. Update `CHANGELOG.md` under `[Unreleased]`

## Releasing

Maven releases follow gitflow. Use the `gitflow-maven-plugin`:

```sh
./mvnw gitflow:release-start
./mvnw gitflow:release-finish
```

npm package versions are bumped with:

```sh
cd repo-shared-configs
yarn patch:eslint-config-repo
yarn publish:eslint-config-repo
```

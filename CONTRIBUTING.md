# Contributing

## Development setup

**Prerequisites:** Java 8, Maven 3.6.3+ (or use `./mvnw`), Node.js 20+, Yarn 4+

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

The hook runs `./mvnw tidy:check` on every commit. Run manually:

```sh
# Maven quality checks (requires local install first)
./mvnw tidy:check
./mvnw checkstyle:check
./mvnw spotless:check

# Auto-fix formatting
./mvnw spotless:apply
./mvnw tidy:pom
```

## Pull requests

1. Branch from `develop` (gitflow: feature → develop → release → main)
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

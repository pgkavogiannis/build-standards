.PHONY: maven-build maven-ci npm-ci init-test ci

maven-build:
	./mvnw --batch-mode clean install

# The root reactor declares neither Spotless nor Checkstyle (only consumers of repo-parent do), so they are not run here.
maven-ci:
	./mvnw --batch-mode tidy:check verify

npm-ci:
	cd repo-shared-configs && yarn install --immutable && yarn format:check && yarn test

# Runs scripts/init.mjs against copies of the real template files; scripts/ is deleted by init.mjs.
init-test:
	node --test scripts/init.test.mjs

ci: maven-ci npm-ci init-test

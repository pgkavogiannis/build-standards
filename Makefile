.PHONY: maven-build maven-ci npm-ci ci

maven-build:
	./mvnw --batch-mode clean install

maven-ci:
	./mvnw --batch-mode tidy:check checkstyle:check spotless:check verify

npm-ci:
	cd repo-shared-configs && yarn install --immutable

ci: maven-ci npm-ci

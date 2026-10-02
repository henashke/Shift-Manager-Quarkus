# Native (GraalVM/Mandrel) build: the result is a single executable, no JVM in the runtime image.
# Needs a few GB of RAM and several minutes to build; starts in well under a second.

# === Stage 1: build the native executable (Quinoa runs npm install + npm run build during the package) ===
FROM quay.io/quarkus/ubi9-quarkus-mandrel-builder-image:jdk-21 AS build

USER root
WORKDIR /code
RUN chown quarkus:quarkus /code
USER quarkus

# Cache Maven dependencies separately from the sources (the builder image has no Maven, the wrapper downloads it)
COPY --chown=quarkus:quarkus mvnw ./
COPY --chown=quarkus:quarkus .mvn ./.mvn
COPY --chown=quarkus:quarkus pom.xml ./
RUN ./mvnw -B -q dependency:go-offline

COPY --chown=quarkus:quarkus src ./src
# Quinoa downloads its own Node.js, so the build image doesn't need one
RUN ./mvnw -B package -Dnative -DskipTests \
    -Dquarkus.quinoa.package-manager-install=true \
    -Dquarkus.quinoa.package-manager-install.node-version=22.12.0

# === Stage 2: runtime ===
FROM quay.io/quarkus/ubi9-quarkus-micro-image:2.0

WORKDIR /work
COPY --from=build --chown=1001:root /code/target/*-runner ./application

USER 1001
EXPOSE 8080

ENTRYPOINT ["./application", "-Dquarkus.http.host=0.0.0.0"]

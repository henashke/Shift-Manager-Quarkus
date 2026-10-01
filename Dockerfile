# === Stage 1: build the backend and the frontend (Quinoa runs npm install + npm run build during mvn package) ===
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Cache Maven dependencies separately from the sources
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Quinoa downloads its own Node.js, so the build image doesn't need one
RUN mvn -B package -DskipTests \
    -Dquarkus.quinoa.package-manager-install=true \
    -Dquarkus.quinoa.package-manager-install.node-version=22.12.0

# === Stage 2: runtime ===
FROM eclipse-temurin:21-jre

WORKDIR /deployments

# quarkus-run.jar needs the rest of the quarkus-app directory next to it
COPY --from=build --chown=1001:1001 /app/target/quarkus-app/ ./

USER 1001
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]

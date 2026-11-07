
# ==========================================
# Stage 1: Build Spring Boot Application
# ==========================================

FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /src

COPY pom.xml .

RUN mvn -B -q dependency:go-offline

COPY src ./src

RUN mvn -B -DskipTests package


# ==========================================
# Stage 2: Run Spring Boot Application
# ==========================================

FROM eclipse-temurin:21-jre

WORKDIR /app

RUN groupadd --system app \
    && useradd --system --gid app --no-create-home app

COPY --from=build \
    /src/target/algovision-api-0.1.0-SNAPSHOT.jar \
    /app/app.jar

USER app

EXPOSE 8080

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

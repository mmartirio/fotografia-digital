# ---------- build ----------
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -q package -DskipTests && mv target/*.jar app.jar

# ---------- runtime ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Fontes: a marca d'água das prévias desenha texto (Java2D precisa de fontconfig)
RUN apk add --no-cache fontconfig ttf-dejavu \
    && addgroup -S app && adduser -S app -G app \
    && mkdir -p /data/fotos && chown -R app:app /data

COPY --from=build /app/app.jar app.jar

USER app
ENV ARMAZENAMENTO_DIR=/data/fotos \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC"
VOLUME ["/data/fotos"]
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD wget -qO- http://localhost:8080/actuator/health/readiness | grep -q '"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

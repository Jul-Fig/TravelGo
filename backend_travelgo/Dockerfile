# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — optimizado para Railway
#
# Railway detecta este archivo automáticamente y hace el build.
# No necesitas subir el JAR; Railway compila desde el código fuente.
# ─────────────────────────────────────────────────────────────────────────────

# Etapa 1: compilar
FROM maven:3.8.8-openjdk-17 AS builder
WORKDIR /build

# Cachear dependencias primero (solo se re-descarga si cambia pom.xml)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compilar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ─────────────────────────────────────────────────────────────────────────────
# Etapa 2: imagen de runtime (mucho más pequeña que la de build)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copiar solo el JAR final
COPY --from=builder /build/target/*.jar app.jar

# Activar perfil de producción
ENV SPRING_PROFILES_ACTIVE=production

# Railway asigna el puerto mediante la variable $PORT
# Spring lo lee desde server.port=${PORT:8080} en application-production.properties
EXPOSE 8080

# Opciones JVM para contenedores con poca RAM (Railway tier gratuito ~512MB)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
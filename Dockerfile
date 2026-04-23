FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml ./
COPY .mvn .mvn
COPY mvnw ./
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY src ./src
COPY frontend ./frontend

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre

WORKDIR /app

ENV PORT=10000

COPY --from=build /app/target/CareerLink-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar /app/app.jar"]

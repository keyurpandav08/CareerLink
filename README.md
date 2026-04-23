# CareerLink

CareerLink is a full-stack job portal for applicants and employers. It includes:

- role-based authentication
- job search and application tracking
- employer job posting and candidate management
- resume upload and analysis
- recruiter analytics and AI-assisted insights

## Tech Stack

- Backend: Spring Boot, Spring Security, Spring Data JPA, PostgreSQL
- Frontend: React, Vite, Axios, React Router
- Build tools: Maven and npm

## Local Setup

1. Set the required environment variables for the backend database and AI keys.
2. Paste your Google Web Client ID into `src/main/resources/application.properties` as `app.oauth.google.client-id=...`.
3. Start the Spring Boot backend.
4. Start the Vite frontend.

Example backend command:

```powershell
.\mvnw spring-boot:run
```

Example frontend command:

```bash
npm run dev
```

## Render Deployment

This project is now configured to deploy as a single Render web service:

1. Create a PostgreSQL database on Render.
2. Create a new Web Service from this repository.
3. Select the `Java` runtime for the web service. Do not select `Docker` unless you add a `Dockerfile`.
4. Use these build and start commands:
   - Build: `./mvnw clean package -DskipTests`
   - Start: `java -Dserver.port=$PORT -jar target/CareerLink-0.0.1-SNAPSHOT.jar`
5. Set these environment variables on Render:
   - `DB_URL` or `DATABASE_URL`
   - `DB_USERNAME` or `DATABASE_USERNAME`
   - `DB_PASSWORD` or `DATABASE_PASSWORD`
   - `APP_FRONTEND_BASE_URL` to your Render service URL
   - `MAIL_USERNAME`
   - `MAIL_PASSWORD`
   - `APP_OAUTH_GOOGLE_CLIENT_ID`
   - `APP_CORS_ALLOWED_ORIGINS`
   - `APIKEY` or `GEMINI_API_KEY` for Gemini
   - `APP_H2_CONSOLE_ENABLED=false`
6. After deployment, open the service URL and confirm the React app loads.

The Maven build now compiles `frontend/` automatically and copies the generated SPA into the Spring Boot JAR, so your submission only needs one live URL.

## Notes

- The project keeps its current runtime behavior and security flow.
- Some internal storage keys may still use older names to preserve saved browser data.
- The submission is branded as CareerLink throughout the visible UI and documentation.

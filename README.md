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

## Notes

- The project keeps its current runtime behavior and security flow.
- Some internal storage keys may still use older names to preserve saved browser data.
- The submission is branded as CareerLink throughout the visible UI and documentation.

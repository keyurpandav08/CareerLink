# Admin Panel Guide

## Demo Admin Login

- URL: `http://localhost:5173/admin/login`
- Username: `admin`
- Password: `Admin@123`

## What Was Added

This project now has a separate admin flow on both frontend and backend.

- Separate admin login page in React: `/admin/login`
- Separate admin dashboard page in React: `/admin/dashboard`
- New `ADMIN` role in Spring Boot
- Seeded default admin account in `DataInitializer`
- New backend admin APIs under `/admin/**`

## Simple Backend Explanation For Mentor

The backend is intentionally kept simple:

1. Spring Security checks the logged-in user role.
2. If the user has `ROLE_ADMIN`, they can access `/admin/**` APIs.
3. `AdminController` receives the request.
4. `AdminService` collects data from repositories and returns JSON.
5. React admin pages call these APIs and show the data in the admin panel.

## Main Admin APIs

- `GET /admin/dashboard`
  Returns overview counts and recent activity.

- `GET /admin/users`
  Returns all platform users for admin management.

- `PUT /admin/users/{id}/role`
  Changes a user role to `APPLICANT`, `EMPLOYER`, or `ADMIN`.

- `DELETE /admin/users/{id}`
  Deletes a non-admin account.

- `GET /admin/jobs`
  Returns all jobs posted in the system.

- `PUT /admin/jobs/{id}/status`
  Opens or closes a job from admin side.

- `DELETE /admin/jobs/{id}`
  Deletes a job from admin side.

- `GET /admin/applications`
  Returns all job applications.

- `PUT /admin/applications/{id}/status`
  Updates application status like `PENDING`, `REVIEWED`, `ACCEPTED`, `REJECTED`.

## Important Security Rules Added

- Public registration cannot create admin accounts.
- Admin users are blocked from the normal login screen and must use `/admin/login`.
- Normal users cannot access admin APIs.
- A user cannot use profile APIs to edit another user profile.

## Files To Show In Viva / Demo

- `src/main/java/com/keyurpandav/jobber/config/SecurityConfig.java`
- `src/main/java/com/keyurpandav/jobber/config/DataInitializer.java`
- `src/main/java/com/keyurpandav/jobber/controller/AdminController.java`
- `src/main/java/com/keyurpandav/jobber/service/AdminService.java`
- `frontend/src/pages/AdminLogin.jsx`
- `frontend/src/pages/AdminDashboard.jsx`

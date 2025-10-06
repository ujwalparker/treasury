# GEMINI.md

## Project Overview

This is a SvelteKit application that provides a digital banking system for families. The goal of the application is to teach children financial responsibility through a points-based reward system.

**Key Technologies:**

*   **Frontend:** SvelteKit, TypeScript, Tailwind CSS
*   **Backend:** SvelteKit API routes, Node.js
*   **Database:** PostgreSQL with Prisma ORM
*   **Authentication:** JWT and WebAuthn for biometric authentication

**Architecture:**

The application is a monolithic SvelteKit application. The frontend is built with Svelte and communicates with the backend via API routes. The backend is written in TypeScript and uses Prisma to interact with a PostgreSQL database. Authentication is handled using JWTs, with the option to use WebAuthn for biometric login.

## Building and Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Set up Environment Variables:**

Copy the `.env.example` file to a new file named `.env` and update the following variables:

*   `DATABASE_URL`: The connection string for your PostgreSQL database.
*   `JWT_SECRET`: A secret key for signing JWTs.

**3. Run Database Migrations:**

```bash
npx prisma db push
```

**4. Seed the Database:**

```bash
npx prisma db seed
```

**5. Start the Development Server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

**Default Login:**

*   **Parent:**
    *   Name: Parent
    *   PIN: 1234
*   **Child:**
    *   Name: Child
    *   PIN: 1234

## Development Conventions

*   **Code Style:** The project uses Prettier for code formatting.
*   **Type Checking:** The project uses `svelte-check` for TypeScript type checking. You can run the type checker with `npm run check`.
*   **API Communication:** The frontend communicates with the backend via the `src/lib/services/api.ts` module. This module provides a clean and consistent interface for making API requests.
*   **Authentication:** Authentication is handled in the `src/routes/+layout.svelte` file. This file checks for a valid JWT and redirects to the login page if the user is not authenticated.
*   **Database:** The database schema is defined in the `prisma/schema.prisma` file. All database interactions should be done through the Prisma client.

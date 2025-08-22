# express-boilerplate

A Node.js/Express backend service built with TypeScript.

## What it does

The main branch contains the base structure of the project. Look at the other branches for more advanced features.

## How to run

### Prerequisites

- Node.js (version 20 or higher)
- PostgreSQL database

### Installation

```bash
npm install
```

### Environment Setup

All environment variables are configured through `src/config/env.ts`.

Environment variables that don't have a default value needs to be defined in a `.env` file.

### Development

```bash
npm run dev
```

### Production

```bash
npm run build       # Build the project
npm start           # Run the application
```

### Other commands

```bash
npm run lint        # Run ESLint
```

## Project Structure

- `src/config/env.ts` - Environment configuration (all envs go through this file)
- `src/controllers/` - Request handlers
- `src/middleware/` - Express middleware
- `src/routes/` - API route definitions
- `src/services/` - Business logic
- `src/validation/` - Request validation schemas
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

# YYENZA Backend Application

This is the main NestJS application for yyenza.

## Tech
- Node 20
- NestJS
- Postgres


## Prerequisites

This app can be either run on a docker compose environment or local environment for convenience. Postgres DB will be run on a docker environment. Before you get started, you'll need to install a few tools:

1. **Run NestJS app Locally**:
- To run locally, install the dependencies
```
// install dependencies
npm i

// generate types using prisma cli and initialise database
npx prisma generate && npx prisma migrate dev

// start postgres db in docker
docker compose build && docker compose up -d
```
   - App should be running at `http://localhost:3000/`
   - If you send a GET request to `http://localhost:3000/` you should get "Hello World!"
  
3. **Docker**: This is used to create, deploy, and run applications by using containers.
    - [Install Docker](https://docs.docker.com/get-docker/)

4. **Docker Compose**: This tool is used for defining and running multi-container Docker applications.
    - [Install Docker Compose](https://docs.docker.com/compose/install/)

   
# Troubleshooting

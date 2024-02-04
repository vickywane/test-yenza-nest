# YYENZA Backend Application

This is the main NestJS application for yyenza.

## Tech
- Node 20
- NestJS
- Postgres


## Prerequisites

### Start NestJS app (with Postgres DB run on docker)
This app can be either run on a docker compose environment or local environment for convenience. Postgres DB will be run on a docker environment. Before you get started, you'll need to install a few tools:

1. **Run NestJS app Locally**:
- To run locally, install the dependencies
```
// install dependencies
npm install

// generate types using prisma cli and initialise database
npx prisma generate && npx prisma migrate dev

// seed data to db
npx prisma db seed

// start the app
npm run start:dev

```
   - App should be running at `http://localhost:3000/`
   - If you send a GET request to `http://localhost:3000/` you should get "Hello World!"


2. **Docker Compose**: This tool is used for defining and running multi-container Docker applications.
- [Install Docker Compose Desktop and cli](https://docs.docker.com/compose/install/)
- Run the following command to start the app (http://localhost:3000) and Postgres  in docker
- Note that in `docker-compose.yml` file, `DB_HOST` must be equal to the database service name (ie:`db` in the docker-compose file)
```
docker compose up -d
```
   
# Troubleshooting

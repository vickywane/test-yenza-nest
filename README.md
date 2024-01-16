# YYENZA Backend Application

This is the main backend application for yyenza. It is a multi-modular gradle based spring boot project. Check [here](https://insert-notion-doc-link.com) for more details

## Tech
- Node 20
- NestJS
- Postgres


## Prerequisites

This app is run on a docker compose environment for convenience. Before you get started, you'll need to install a few tools:

1. **Docker**: This is used to create, deploy, and run applications by using containers.
    - [Install Docker](https://docs.docker.com/get-docker/)

2. **Docker Compose**: This tool is used for defining and running multi-container Docker applications.
    - [Install Docker Compose](https://docs.docker.com/compose/install/)

3. **Alternative to Docker**: If you prefer not to use Docker, you can use Podman.
    - [Install Podman](https://podman.io/getting-started/installation)

## Setup

Follow these steps to get your development environment set up:

1. **Clone the repository**
   ```bash
   git clone git@github.com:YYENZA/yyenza-nest.git ; cd yyenza-nest

2. **Build and run with docker compose**
   ```bash
   docker compose up --build

3. Application should be running at http://localhost:3000
   
# Troubleshooting
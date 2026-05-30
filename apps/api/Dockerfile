# Backend (Express + Prisma) container.
# Uses the apps/api directory as build context (see docker-compose.yml).
FROM node:22-alpine

WORKDIR /app

# Prisma needs OpenSSL at runtime on Alpine.
RUN apk add --no-cache openssl

# Install dependencies first to leverage Docker layer caching.
COPY package.json ./
RUN npm install

# Generate the Prisma client against the schema.
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source and build.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]

FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies and utilities
RUN apk add --no-cache postgresql-client curl netcat-openbsd

RUN npm install

COPY . .

# Create necessary directories
RUN mkdir -p /app/config /app/scripts /tmp

# Build the application
RUN npm run build

# Copy env file (if exists)
COPY .env ./dist/.env

EXPOSE 3000

CMD ["node", "dist/main"] 
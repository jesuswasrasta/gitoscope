# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for potential build steps)
RUN npm ci

# Copy application source
COPY . .

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install git (required for simple-git to work)
RUN apk update && \
    apk upgrade && \
    apk add --no-cache git && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy application from builder
COPY --from=builder /app .

# Create and initialize default repository
RUN mkdir /repo && \
    git init /repo && \
    sed "s/repo: *''/repo: '\/repo'/" config.js.template > config.js

# Expose application port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start"]

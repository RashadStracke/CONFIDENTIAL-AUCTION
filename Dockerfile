# Multi-stage build for FHEVM Development Environment

# Stage 1: Base Node.js environment
FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    bash

# Copy package files
COPY package*.json ./

# Stage 2: Development environment
FROM base AS development

# Install all dependencies including dev dependencies
RUN npm install

# Copy source code
COPY . .

# Compile contracts
RUN npm run compile

# Expose Hardhat network port
EXPOSE 8545

# Default command: Start Hardhat node
CMD ["npx", "hardhat", "node"]

# Stage 3: Production build
FROM base AS production

# Install only production dependencies
RUN npm install --production

# Copy compiled artifacts and source
COPY . .
COPY --from=development /app/artifacts ./artifacts
COPY --from=development /app/typechain-types ./typechain-types

# Set production environment
ENV NODE_ENV=production

CMD ["node", "scripts/deploy.js"]

# Stage 4: Testing environment
FROM development AS test

# Run tests
CMD ["npm", "run", "test"]

# ==============================================================================
# Stage 1: Build & Dependencies Layer (builder)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for sqlite3 native bindings if needed
RUN apk add --no-cache python3 make g++

# Copy package descriptors for layer caching
COPY package.json package-lock.json ./

# Install only production dependencies cleanly
RUN npm ci --omit=dev && npm cache clean --force

# ==============================================================================
# Stage 2: Minimalist Production Runtime (runner) - Sub-90MB Footprint
# ==============================================================================
FROM node:20-alpine AS runner

# Install wget (for HEALTHCHECK probe) and dumb-init (for PID 1 signal forwarding)
RUN apk add --no-cache wget dumb-init

ENV NODE_ENV=production \
    PORT=5000 \
    DB_PATH=/app/data/shopping_cart.db

WORKDIR /app

# Create persistent data volume directory and assign permissions to built-in 'node' user
RUN mkdir -p /app/data && chown -R node:node /app

# Copy production node_modules from builder stage
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copy application source code
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/

# Enforce least-privilege security principle: run container as non-root user
USER node

# Expose internal API port
EXPOSE 5000

# Mount point for persistent database storage
VOLUME ["/app/data"]

# Automated Container Healthcheck Probe
HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# dumb-init ensures proper PID 1 signal handling (SIGTERM, SIGINT) for graceful shutdowns
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]

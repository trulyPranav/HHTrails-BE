# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for tsc)
RUN npm ci

# Copy source and compile TypeScript → dist/
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy manifests and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Back4App injects PORT at runtime (defaults to 80).
# The app already reads process.env.PORT so no hardcoding needed.
EXPOSE 3000

CMD ["node", "dist/index.js"]

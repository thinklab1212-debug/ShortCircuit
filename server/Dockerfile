# ============================================================================
# ElectroKart API Server — Dockerfile (Node.js 22 Multi-stage)
# ============================================================================

# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

# Remove development dependencies to keep output image thin
RUN npm prune --production

# Stage 2: Runner
FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

# Set non-root user for security
USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]

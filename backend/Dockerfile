# ----------------------------------------------------
# Stage 1: Development / Build Stage
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL and build dependencies for native modules
RUN apk add --no-cache openssl python3 make g++

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy source files
COPY . .

# Generate Prisma Client & Build application
RUN npx prisma generate && npm run build

# ----------------------------------------------------
# Stage 2: Production Runtime
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL and runtime libraries
RUN apk add --no-cache openssl

# Copy node_modules, prisma, and dist from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Create and switch to non-root node user for security
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]

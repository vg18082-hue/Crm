# ----------------------------------------------------
# Stage 1: Development / Build Stage
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL and build dependencies for native modules (e.g. bcrypt)
RUN apk add --no-cache openssl python3 make g++

# Install dependencies (utilizing Docker layer caching)
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

# Install OpenSSL and runtime dependencies
RUN apk add --no-cache openssl python3 make g++

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && npx prisma generate

# Copy compiled build output from builder stage
COPY --from=builder /app/dist ./dist

# Create and switch to non-root node user for security
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]

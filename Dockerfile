# Dockerfile

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --frozen-lockfile

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for the build
# Add any build-time environment variables here if needed
# ENV NEXT_PUBLIC_SOME_ENV_VAR=your_value

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port that Next.js will run on.
# Cloud Run automatically provides the PORT environment variable.
EXPOSE 3000
ENV PORT 3000

# The CMD instruction starts the application.
# `npm start` is a common convention that calls `next start`.
CMD ["npm", "start"]

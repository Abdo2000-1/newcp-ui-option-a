# Stage 1: Build Environment
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies deterministically
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy application source code
COPY . .

# Run production build
RUN npm run build

# Stage 2: Hardened Nginx Runtime
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Clean default static assets
RUN rm -rf ./*

# Copy compiled production artifacts
COPY --from=builder /app/dist .

# Copy hardened Nginx configuration
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Security: Run as unprivileged nginx user
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

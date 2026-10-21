# Build the app, then serve the static files with nginx.

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Vite bakes VITE_ variables into the bundle, so they're needed at build time.
# In Coolify, tick "Build Variable" on both.
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
RUN npm run build


FROM nginx:1.28-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

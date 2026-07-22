# Stage 1: Build frontend
FROM node:24-alpine AS frontend_builder

WORKDIR /app

COPY ./frontend/package.json ./frontend/package-lock.json ./

RUN npm install

COPY ./frontend .

# Accept API base URL as a build argument (passed via --build-arg at docker build time)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build


# Stage 2: Backend + serve frontend dist
FROM node:24-alpine

WORKDIR /app

# Non-sensitive defaults only; pass secrets at runtime via --env-file
ENV PORT=3000
ENV MONGODB_NAME=marketsense

COPY ./backend/package.json ./backend/package-lock.json ./

RUN npm install --production

COPY ./backend .

# Copy built frontend from stage 1
COPY --from=frontend_builder /app/dist ./public

EXPOSE 3000

CMD ["node", "src/server.js"]

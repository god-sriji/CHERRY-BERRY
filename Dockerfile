FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

RUN mkdir -p /app/backend/uploads/media /app/backend/uploads/posts

EXPOSE 3002

CMD ["node", "server.js"]

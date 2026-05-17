FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

RUN addgroup --system appgroup \
  && adduser --system --ingroup appgroup appuser \
  && mkdir -p /app/backend/uploads/media /app/backend/uploads/posts \
  && chown -R appuser:appgroup /app/backend /app/frontend

USER appuser

EXPOSE 3002

CMD ["node", "server.js"]

# Stage 1 : build Vite
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL vide = frontend utilise /api (chemin relatif) → nginx proxifie vers backend
RUN npm run build

# Stage 2 : nginx sert les fichiers statiques
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

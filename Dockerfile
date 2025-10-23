FROM node:20.19.0-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --configuration=production

FROM nginx:alpine
COPY --from=build /app/dist/car-admin/browser /usr/share/nginx/html

# Создаем скрипт для замены переменной порта
RUN echo '#!/bin/sh' > /docker-entrypoint.d/30-replace-port.sh && \
    echo 'sed -i "s/\$PORT/'"'"'${PORT:-80}'"'"'/g" /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.d/30-replace-port.sh && \
    chmod +x /docker-entrypoint.d/30-replace-port.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Добавляем логирование для отладки
RUN echo "Files in /usr/share/nginx/html:" && ls -la /usr/share/nginx/html
RUN echo "Nginx config:" && cat /etc/nginx/conf.d/default.conf

EXPOSE $PORT
CMD ["nginx", "-g", "daemon off;"]

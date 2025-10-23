# Car Admin Panel

Админ панель для управления автомобилями.

## Установка

```bash
npm install
```

## Запуск в режиме разработки

```bash
npm start
```

## Сборка для продакшена

```bash
npm run build
```

## Деплой на Railway

1. Подключите репозиторий к Railway
2. Railway автоматически определит Node.js проект
3. Приложение будет собрано и запущено автоматически

### Переменные окружения

Убедитесь, что в Railway настроены переменные окружения:
- `API_URL` - URL вашего API сервера

## Структура проекта

- `src/app/pages/admin/` - компоненты админ панели
- `src/app/services/` - сервисы для работы с API
- `src/environments/` - конфигурация окружения

## Docker

Для локального тестирования с Docker:

```bash
docker build -t car-admin .
docker run -p 3000:3000 car-admin
```

## Railway конфигурация

- `railway.json` - конфигурация для Railway
- `Dockerfile` - для Docker деплоя
- `package.json` - содержит скрипт `serve` для Railway

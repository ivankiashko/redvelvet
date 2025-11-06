# API Документация (Планируемое)

> ⚠️ **ВАЖНО:** Это планируемая документация для будущего REST API. Backend еще не реализован.

## Базовая информация

**Base URL:** `https://api.redvelvet.com/v1`

**Формат данных:** JSON

**Аутентификация:** JWT Bearer Token

**Rate Limiting:** 100 запросов/минуту для авторизованных пользователей, 10 запросов/минуту для неавторизованных

---

## Аутентификация

### Регистрация

**POST** `/auth/register`

```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "type": "client" | "model"
}

Response (201):
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "type": "client"
  },
  "token": "jwt_token_here"
}

Error (400):
{
  "success": false,
  "error": "Email already registered"
}
```

### Вход

**POST** `/auth/login`

```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "type": "client"
  },
  "token": "jwt_token_here"
}

Error (401):
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Выход

**POST** `/auth/logout`

Headers: `Authorization: Bearer {token}`

```json
Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Проверка токена

**GET** `/auth/verify`

Headers: `Authorization: Bearer {token}`

```json
Response (200):
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "type": "client"
  }
}
```

---

## Профили (Анкеты)

### Получить все профили

**GET** `/profiles`

Query Parameters:
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `city` (string)
- `ageFrom` (int)
- `ageTo` (int)
- `priceFrom` (int)
- `priceTo` (int)
- `rating` (int, 1-5)
- `verified` (boolean)
- `search` (string)

```json
Response (200):
{
  "success": true,
  "data": {
    "profiles": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Получить профиль по ID

**GET** `/profiles/:id`

```json
Response (200):
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Анастасия",
    "age": 23,
    "city": "moscow",
    "height": 172,
    "weight": 54,
    "bustSize": "3",
    "eyeColor": "Зеленые",
    "hairColor": "Блондинка",
    "nationality": "Славянка",
    "bodyType": "Модельная",
    "clothingSize": "S",
    "description": "...",
    "services": [...],
    "price": 8000,
    "images": [...],
    "videos": [...],
    "rating": 4.8,
    "reviewCount": 12,
    "views": 245,
    "verified": true,
    "createdAt": "2024-10-15T..."
  }
}

Error (404):
{
  "success": false,
  "error": "Profile not found"
}
```

### Создать профиль

**POST** `/profiles`

Headers: `Authorization: Bearer {token}` (только для моделей)

```json
Request:
{
  "name": "Анастасия",
  "age": 23,
  "city": "moscow",
  "height": 172,
  "weight": 54,
  "bustSize": "3",
  "eyeColor": "Зеленые",
  "hairColor": "Блондинка",
  "nationality": "Славянка",
  "bodyType": "Модельная",
  "clothingSize": "S",
  "description": "...",
  "services": ["Эскорт", "Массаж"],
  "price": 8000
}

Response (201):
{
  "success": true,
  "data": {
    "id": 123,
    ...profile data
  }
}

Error (400):
{
  "success": false,
  "error": "Validation error",
  "details": {...}
}
```

### Обновить профиль

**PUT** `/profiles/:id`

Headers: `Authorization: Bearer {token}` (только владелец или админ)

```json
Request:
{
  ...updated fields
}

Response (200):
{
  "success": true,
  "data": {
    ...updated profile
  }
}
```

### Удалить профиль

**DELETE** `/profiles/:id`

Headers: `Authorization: Bearer {token}` (только владелец или админ)

```json
Response (200):
{
  "success": true,
  "message": "Profile deleted"
}
```

### Загрузить медиа

**POST** `/profiles/:id/media`

Headers:
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

Body: form-data с полем `file`

```json
Response (200):
{
  "success": true,
  "data": {
    "url": "https://cdn.redvelvet.com/...",
    "type": "image" | "video"
  }
}
```

---

## Отзывы

### Получить отзывы профиля

**GET** `/profiles/:id/reviews`

Query Parameters:
- `page` (int, default: 1)
- `limit` (int, default: 20)

```json
Response (200):
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "profileId": 123,
        "userId": 456,
        "rating": 5,
        "text": "Отличная модель!",
        "createdAt": "2024-10-30T..."
      },
      ...
    ],
    "pagination": {...}
  }
}
```

### Создать отзыв

**POST** `/profiles/:id/reviews`

Headers: `Authorization: Bearer {token}`

```json
Request:
{
  "rating": 5,
  "text": "Отличная модель!"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "profileId": 123,
    "userId": 456,
    "rating": 5,
    "text": "Отличная модель!",
    "createdAt": "2024-10-30T..."
  }
}

Error (400):
{
  "success": false,
  "error": "You already reviewed this profile"
}
```

### Удалить отзыв

**DELETE** `/reviews/:id`

Headers: `Authorization: Bearer {token}` (только владелец или админ)

```json
Response (200):
{
  "success": true,
  "message": "Review deleted"
}
```

---

## Бронирование

### Создать бронирование

**POST** `/bookings`

Headers: `Authorization: Bearer {token}`

```json
Request:
{
  "profileId": 123,
  "date": "2024-11-15",
  "time": "18:00",
  "duration": 2,
  "paymentMethod": "crypto" | "agreement",
  "message": "Дополнительная информация"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 789,
    "profileId": 123,
    "userId": 456,
    "status": "pending",
    "date": "2024-11-15",
    "time": "18:00",
    "duration": 2,
    "totalPrice": 16000,
    "paymentMethod": "crypto",
    "createdAt": "2024-10-30T..."
  }
}
```

### Получить мои бронирования

**GET** `/bookings/me`

Headers: `Authorization: Bearer {token}`

```json
Response (200):
{
  "success": true,
  "data": {
    "bookings": [...],
    "pagination": {...}
  }
}
```

### Обновить статус бронирования

**PATCH** `/bookings/:id/status`

Headers: `Authorization: Bearer {token}` (только модель или админ)

```json
Request:
{
  "status": "confirmed" | "rejected" | "completed" | "cancelled"
}

Response (200):
{
  "success": true,
  "data": {
    ...updated booking
  }
}
```

---

## Платежи

### Создать платеж

**POST** `/payments`

Headers: `Authorization: Bearer {token}`

```json
Request:
{
  "bookingId": 789,
  "amount": 16000,
  "currency": "USDT",
  "walletAddress": "0x..."
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "bookingId": 789,
    "amount": 16000,
    "currency": "USDT",
    "status": "pending",
    "paymentAddress": "0x...",
    "createdAt": "2024-10-30T..."
  }
}
```

### Получить статус платежа

**GET** `/payments/:id`

Headers: `Authorization: Bearer {token}`

```json
Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "status": "pending" | "confirmed" | "failed",
    "transactionHash": "0x...",
    ...
  }
}
```

---

## Пользователи

### Получить мой профиль

**GET** `/users/me`

Headers: `Authorization: Bearer {token}`

```json
Response (200):
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "type": "client",
    "wallet": {
      "type": "USDT",
      "address": "0x..."
    },
    "createdAt": "2024-10-01T..."
  }
}
```

### Обновить профиль

**PATCH** `/users/me`

Headers: `Authorization: Bearer {token}`

```json
Request:
{
  "wallet": {
    "type": "USDT",
    "address": "0x..."
  }
}

Response (200):
{
  "success": true,
  "data": {
    ...updated user
  }
}
```

---

## Админ

### Получить статистику

**GET** `/admin/stats`

Headers: `Authorization: Bearer {admin_token}`

```json
Response (200):
{
  "success": true,
  "data": {
    "totalProfiles": 150,
    "totalClients": 1000,
    "totalReviews": 500,
    "totalTransactions": 250,
    "revenue": {
      "total": 1000000,
      "thisMonth": 50000
    }
  }
}
```

### Модерация анкеты

**PATCH** `/admin/profiles/:id/moderate`

Headers: `Authorization: Bearer {admin_token}`

```json
Request:
{
  "action": "approve" | "reject",
  "reason": "Причина отклонения (опционально)"
}

Response (200):
{
  "success": true,
  "data": {
    ...updated profile
  }
}
```

---

## Коды ошибок

- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Webhooks (планируется)

### События

- `booking.created` - Создано бронирование
- `booking.confirmed` - Подтверждено бронирование
- `payment.completed` - Завершен платеж
- `review.created` - Создан отзыв
- `profile.verified` - Профиль верифицирован

### Формат webhook

```json
POST to your webhook URL:
{
  "event": "booking.created",
  "data": {
    ...event data
  },
  "timestamp": "2024-10-30T..."
}
```

---

## Примечания

1. Все даты в формате ISO 8601
2. Все цены в рублях (₽)
3. Все запросы должны включать заголовок `Content-Type: application/json`
4. Токены действительны 24 часа
5. HTTPS обязателен для всех запросов
6. API версионируется через URL (`/v1`, `/v2`, и т.д.)

---

**Версия API:** 1.0.0 (планируемая)
**Последнее обновление:** 01.11.2025

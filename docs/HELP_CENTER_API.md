# Help Center – REST API

This document describes the **Help Center** support chat over REST. Use it to implement the in-app help/support chat in mobile and admin clients. All operations use HTTP requests; there are no sockets.

---

## 1. Overview

- **Transport:** REST (HTTP/HTTPS).
- **Base path:** `/api/help-center` (with global prefix `api`).
- **Authentication:** JWT required for user endpoints (`Authorization: Bearer <token>`). Admin endpoints use admin token.

---

## 2. User endpoints (mobile app)

### 2.1 List messages

**GET** `/api/help-center/messages`

**Headers:** `Authorization: Bearer <user_jwt>`

**Response (200):**

```json
{
  "conversation": {
    "id": "uuid",
    "userId": "uuid",
    "status": "open",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  },
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "sender": "user",
      "text": "Hello",
      "createdAt": "ISO8601"
    },
    {
      "id": "uuid",
      "conversationId": "uuid",
      "sender": "support",
      "text": "Thanks for reaching out...",
      "createdAt": "ISO8601"
    }
  ]
}
```

Use this on screen load and when the user taps **Refresh** to show the latest messages.

### 2.2 Send message

**POST** `/api/help-center/messages`

**Headers:** `Authorization: Bearer <user_jwt>`  
**Body:** `{ "text": "User message (1–2000 chars)" }`

**Response (201):** Same shape as list – full `{ conversation, messages }` after adding the user message and the auto-reply support message. Use it to update the UI.

---

## 3. Admin endpoints (admin dashboard)

- **GET** `/api/admin-dashboard/help-center/conversations` – list all conversations (admin token).
- **GET** `/api/admin-dashboard/help-center/conversations/:id/messages` – get messages for a conversation (admin token).
- **POST** `/api/admin-dashboard/help-center/conversations/:userId/messages` – send support message (admin token). Body: `{ "text": "..." }` or `{ "content": "..." }`. Returns the created message.

Admin should use **Refresh** (or refetch after sending) to see new messages; no real-time push.

---

## 4. Recommended flow (mobile)

1. On opening Help Center: **GET** `/api/help-center/messages` and render the list.
2. Provide a **Refresh** button that calls **GET** `/api/help-center/messages` again and updates the list.
3. On Send: **POST** `/api/help-center/messages` with `{ text }`, then replace the messages list with the response `messages` (or refetch with GET).

---

## 5. Types (reference)

See `src/help-center/help-center.types.ts` for payload types. Key shapes:

- **Message:** `{ id, conversationId, sender: 'user' | 'support', text, createdAt }`
- **Conversation:** `{ id, userId, status: 'open' | 'closed', createdAt, updatedAt }`

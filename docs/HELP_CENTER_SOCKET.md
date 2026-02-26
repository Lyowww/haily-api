# Help Center – Socket.IO API (Mobile)

This document describes the **Help Center** real-time chat over Socket.IO for the AI Outfit API. Use it to implement the in-app help/support chat in your mobile client.

---

## 1. Overview

- **Transport:** Socket.IO (WebSocket with fallbacks).
- **Namespace:** `/help-center`.
- **Authentication:** JWT required on connection (same token as REST API).
- **Base URL:** Same as your API host (e.g. `https://api.yourapp.com` or `http://localhost:3000`). Socket.IO connects to this host; the namespace is `/help-center`.

---

## 2. Connection

### 2.1 URL and namespace

Connect to the **same host and port** as the REST API, using the **namespace** `/help-center`.

Examples:

- **Production:** `https://api.yourapp.com` → Socket URL: `https://api.yourapp.com`, namespace: `help-center`.
- **Local:** `http://localhost:3000` → Socket URL: `http://localhost:3000`, namespace: `help-center`.

### 2.2 Authentication

You must send a valid **JWT** (same as `Authorization: Bearer <token>` for REST). Two options:

**Option A – `auth.token` (recommended):**

```ts
import { io } from 'socket.io-client';

const token = 'YOUR_JWT_TOKEN'; // from login / secure storage

const socket = io('https://api.yourapp.com/help-center', {
  auth: {
    token: token,
    // or with Bearer prefix: token: `Bearer ${token}` (server trims "Bearer ")
  },
  transports: ['websocket', 'polling'],
});
```

**Option B – `Authorization` header:**

Some clients allow extra headers on the first request. If supported:

```ts
const socket = io('https://api.yourapp.com/help-center', {
  extraHeaders: {
    Authorization: `Bearer ${token}`,
  },
  transports: ['websocket', 'polling'],
});
```

- If the token is missing or invalid, the server emits one `help_center:error` and then disconnects the client.
- After a successful connection, the server emits **`help_center:connected`** with the conversation and message list (see below).

---

## 3. Events reference

### 3.1 Server → Client (listen on `socket.on(...)`)

| Event                   | When                         | Payload shape |
|-------------------------|------------------------------|---------------|
| `help_center:connected` | Right after successful auth  | `HelpCenterConnectedPayload` |
| `help_center:message`   | New message (user or support)| `HelpCenterMessagePayload` |
| `help_center:typing`    | Typing indicator (future)    | `HelpCenterTypingEventPayload` |
| `help_center:error`     | Error (e.g. auth / validation)| `HelpCenterErrorPayload` |

### 3.2 Client → Server (emit with `socket.emit(...)`)

| Event              | Purpose           | Payload              | Optional ack |
|--------------------|-------------------|----------------------|--------------|
| `help_center:send` | Send user message | `{ text: string }`   | Yes – see below |
| `help_center:typing` | User typing     | `{ isTyping: boolean }` | No |

---

## 4. Payload types (TypeScript / JSON)

Use these types in your mobile app (TypeScript, Kotlin, Swift, etc.) for type safety.

### 4.1 `HelpCenterConnectedPayload` (event: `help_center:connected`)

Sent once after connection. Use it to build the initial conversation and message list.

```ts
interface HelpCenterConnectedPayload {
  conversation: {
    id: string;
    userId: string;
    status: 'open' | 'closed';
    createdAt: string;   // ISO 8601
    updatedAt: string;   // ISO 8601
  };
  messages: Array<{
    id: string;
    conversationId: string;
    sender: 'user' | 'support';
    text: string;
    createdAt: string;   // ISO 8601
  }>;
}
```

### 4.2 `HelpCenterMessagePayload` (event: `help_center:message`)

Every new message (user or support) is emitted with this shape.

```ts
interface HelpCenterMessagePayload {
  id: string;
  conversationId: string;
  sender: 'user' | 'support';
  text: string;
  createdAt: string;   // ISO 8601
}
```

### 4.3 `HelpCenterTypingEventPayload` (event: `help_center:typing`)

Reserved for future support-side typing indicator.

```ts
interface HelpCenterTypingEventPayload {
  isTyping: boolean;
  sender: 'support';
}
```

### 4.4 `HelpCenterErrorPayload` (event: `help_center:error`)

Errors (auth, validation, server). Optional `details` for validation.

```ts
interface HelpCenterErrorPayload {
  code: string;       // e.g. 'UNAUTHORIZED', 'VALIDATION_ERROR', 'SERVER_ERROR'
  message: string;
  details?: Record<string, unknown>;
}
```

### 4.5 Send message payload (client → server)

```ts
// help_center:send
interface HelpCenterSendPayload {
  text: string;   // 1–2000 characters, trimmed
}
```

### 4.6 Acknowledgement for `help_center:send`

If the client sends an acknowledgement callback, the server will call it with either success or error:

```ts
// Success
{ message: HelpCenterMessagePayload }

// Error (e.g. validation, server error)
{ error: HelpCenterErrorPayload }
```

---

## 5. Recommended flow (mobile)

1. **Connect** with JWT in `auth.token` (or `Authorization` header if supported).
2. **Listen** for `help_center:connected` and store `conversation` + `messages`; render the thread.
3. **Listen** for `help_center:message` and append each payload to the list (avoid duplicates by `id`).
4. **Listen** for `help_center:error`; show a toast or inline error and, if code is `UNAUTHORIZED`, redirect to login.
5. **Send message:**  
   `socket.emit('help_center:send', { text }, (res) => { ... })`  
   - If `res.message` → optional: update UI with the saved message (you will also get `help_center:message`).  
   - If `res.error` → show `res.error.message` (and optionally `res.error.details`).
6. **Typing (optional):**  
   `socket.emit('help_center:typing', { isTyping: true/false });`  
   Listen for `help_center:typing` if you want to show a “support is typing” indicator later.

---

## 6. Connection lifecycle and reconnection

- **Reconnect:** Use Socket.IO’s default reconnection (or your client’s). After reconnect, the server will treat the client as a new connection and send `help_center:connected` again.
- **Token refresh:** If the JWT expires, the next connection may receive `help_center:error` with `UNAUTHORIZED`. Refresh the token and reconnect with the new token.
- **Offline:** Buffer outgoing messages locally and send when the socket is connected again; rely on `help_center:connected` to sync state.

---

## 7. REST fallback

You can load the same conversation over HTTP (e.g. on app launch or when socket is not used):

- **GET** `https://api.yourapp.com/api/help-center/messages`  
- **Headers:** `Authorization: Bearer <token>`  
- **Response:** Same shape as `HelpCenterConnectedPayload`:  
  `{ conversation: {...}, messages: [...] }`

Use this to show the last messages before opening the socket or when the socket is disconnected.

---

## 8. Example (pseudo-code)

```ts
const token = await getStoredToken();
const socket = io(`${API_BASE}/help-center`, { auth: { token } });

socket.on('help_center:connected', (data: HelpCenterConnectedPayload) => {
  setConversation(data.conversation);
  setMessages(data.messages);
});

socket.on('help_center:message', (msg: HelpCenterMessagePayload) => {
  appendMessage(msg);
});

socket.on('help_center:error', (err: HelpCenterErrorPayload) => {
  showError(err.message);
  if (err.code === 'UNAUTHORIZED') navigateToLogin();
});

function sendMessage(text: string) {
  socket.emit('help_center:send', { text }, (res: any) => {
    if (res?.error) showError(res.error.message);
  });
}
```

---

## 9. Summary table

| Item        | Value |
|------------|--------|
| Namespace  | `/help-center` |
| Auth       | JWT in `auth.token` or `Authorization` header |
| First event| `help_center:connected` (conversation + messages) |
| Send text  | `help_center:send` with `{ text }`, optional ack |
| New message| `help_center:message` (user + auto-reply support) |
| Errors     | `help_center:error` then disconnect if auth failed |
| REST sync  | `GET /api/help-center/messages` (Bearer token) |

For payload types in the codebase, see `src/help-center/help-center.types.ts`.

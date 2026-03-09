# Chat App -- CS 314 Final Project

A full-stack real-time chat application featuring direct messaging, group channels, file/image sharing, and user profile management. Built with a **Node.js/Express** backend, **MongoDB** database, **Socket.IO** for real-time communication, and a **React** (Vite) frontend.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Setup & Running](#setup--running)
3. [Code Structure](#code-structure)
4. [API Endpoints](#api-endpoints)
5. [Socket.IO Events](#socketio-events)
6. [Tests Performed](#tests-performed)
7. [Challenges Faced](#challenges-faced)
8. [Extra Features](#extra-features)

---

## Tech Stack

| Layer              | Technology                                              |
| ------------------ | ------------------------------------------------------- |
| Backend Runtime    | Node.js (ES Modules)                                    |
| Backend Framework  | Express 4.18                                            |
| Real-Time          | Socket.IO 4.8                                           |
| Database           | MongoDB via Mongoose 8.14                               |
| Authentication     | JWT (httpOnly cookies) + bcryptjs                       |
| File Uploads       | Multer 2.1 (disk storage)                               |
| Frontend Framework | React (Vite production build)                           |
| Frontend Styling   | Tailwind CSS                                            |
| Frontend Libraries | Radix UI, Lottie animations, Sonner toasts, Axios       |
| Testing            | Jest 30, Supertest 7, mongodb-memory-server 11          |

---

## Setup & Running

### Prerequisites

- **Node.js** (v18 or later recommended)
- **MongoDB** -- either a local instance or a MongoDB Atlas connection string

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (or edit the existing one) with:

```env
PORT=8747
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
```

Start the server:

```bash
npm start
```

The backend runs on `http://localhost:5001` by default.

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend is served as a static build on `http://localhost:3000`.

### Running Tests

```bash
cd backend
npm test
```

---

## Code Structure

```
cs314Final/
├── README.md
├── docs/                              # Course-provided specification documents
│   ├── project_spec.pdf
│   ├── Backend API spec.pdf
│   ├── Architecture_document_template.docx.pdf
│   ├── Feature_document_template.docx.pdf
│   └── Testplan_document_template.docx.pdf
│
├── backend/
│   ├── package.json                   # Dependencies & scripts (start, dev, test)
│   ├── jest.config.cjs                # Jest configuration (babel-jest transform)
│   ├── babel.config.cjs               # Babel config (ESM -> CJS for Jest)
│   ├── .env                           # Environment variables (MongoDB URI, JWT secret)
│   ├── uploads/                       # File upload storage (disk)
│   │   ├── profiles/                  # Profile image uploads
│   │   └── files/                     # General file attachments
│   │
│   ├── src/
│   │   ├── server.js                  # Entry point: HTTP server, DB connection, Socket.IO
│   │   ├── app.js                     # Express app factory (CORS, routes, static files)
│   │   │
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB connection via Mongoose
│   │   │
│   │   ├── models/
│   │   │   ├── User.js                # User schema (email, password, name, image, color)
│   │   │   ├── Message.js             # Message schema (sender, recipient, content, type, file/audio URLs)
│   │   │   └── Channel.js             # Channel schema (name, members, admin)
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.js                # JWT verification middleware (reads from httpOnly cookie)
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.js                # Signup, login, logout, profile management
│   │   │   ├── contacts.js            # Contact search, list, DM deletion
│   │   │   ├── messages.js            # Message retrieval, file upload
│   │   │   └── channels.js            # Channel CRUD, channel messages
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js                # Auth routes + Multer config for profile images
│   │   │   ├── contacts.js            # Contact routes (all authenticated)
│   │   │   ├── messages.js            # Message routes + Multer config for file uploads
│   │   │   └── channels.js            # Channel routes (all authenticated)
│   │   │
│   │   └── socket/
│   │       └── socket.js              # Socket.IO setup: DM, channel messaging, notifications
│   │
│   └── tests/
│       ├── helpers/
│       │   ├── db.js                  # MongoMemoryServer setup/teardown
│       │   ├── auth.js                # Helper to create authenticated test users
│       │   └── app.js                 # Express app factory for tests
│       ├── unit/
│       │   └── middleware/
│       │       └── auth.test.js       # Unit tests for JWT verification middleware
│       └── integration/
│           ├── auth.test.js           # Auth endpoint integration tests
│           ├── contacts.test.js       # Contact endpoint integration tests
│           ├── messages.test.js       # Message endpoint integration tests
│           └── socket.test.js         # Socket.IO connection & messaging tests
│
└── frontend/
    ├── package.json                   # Serves static build via `npx serve`
    ├── index.html                     # SPA entry point
    └── assets/
        ├── index-shofIL8b.js          # Vite-bundled React application
        ├── index-DEQ8v3rZ.css         # Tailwind CSS bundle
        └── new26-CoWu2emJ.png         # App logo/image
```

### Architecture Overview

The application follows a layered architecture:

1. **`server.js`** -- Creates the HTTP server, connects to MongoDB, and initializes Socket.IO.
2. **`app.js`** -- Configures the Express application with middleware (CORS, cookie parser, JSON body parsing) and mounts all route modules. Exported as a factory function (`createApp()`) to support both production use and isolated test instances.
3. **Routes** -- Define HTTP endpoints and wire up middleware (authentication, Multer for file uploads) to controller functions.
4. **Controllers** -- Contain the business logic for each domain (auth, contacts, messages, channels). Each function handles request validation, database operations, and response formatting.
5. **Models** -- Mongoose schemas defining the data layer (User, Message, Channel).
6. **Middleware** -- JWT token verification that protects authenticated routes by extracting and validating the token from httpOnly cookies.
7. **Socket Layer** -- Manages real-time WebSocket connections with JWT authentication middleware, direct message delivery, channel message broadcasting, and new-channel notifications.

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint               | Auth | Description                                  |
| ------ | ---------------------- | ---- | -------------------------------------------- |
| POST   | `/signup`              | No   | Create a new account; returns JWT cookie      |
| POST   | `/login`               | No   | Authenticate user; returns JWT cookie         |
| POST   | `/logout`              | No   | Clear JWT cookie                              |
| GET    | `/userinfo`            | Yes  | Get current user's profile                    |
| POST   | `/update-profile`      | Yes  | Update first name, last name, and color       |
| POST   | `/add-profile-image`   | Yes  | Upload a profile image (multipart form)       |
| DELETE | `/remove-profile-image`| Yes  | Delete profile image from disk and database   |

### Contacts (`/api/contacts`)

| Method | Endpoint                 | Auth | Description                                           |
| ------ | ------------------------ | ---- | ----------------------------------------------------- |
| POST   | `/search`                | Yes  | Search users by name or email (regex match)           |
| GET    | `/all-contacts`          | Yes  | Get all users as `{label, value}` pairs               |
| GET    | `/get-contacts-for-list` | Yes  | Get contacts sorted by most recent message time       |
| DELETE | `/delete-dm/:dmId`       | Yes  | Delete all DM messages between the user and a contact |

### Messages (`/api/messages`)

| Method | Endpoint        | Auth | Description                                     |
| ------ | --------------- | ---- | ----------------------------------------------- |
| POST   | `/get-messages`  | Yes  | Get DM history between two users (sorted by time)|
| POST   | `/upload-file`   | Yes  | Upload a file attachment (multipart form)        |

### Channels (`/api/channel`)

| Method | Endpoint                          | Auth | Description                                    |
| ------ | --------------------------------- | ---- | ---------------------------------------------- |
| POST   | `/create-channel`                 | Yes  | Create a new channel with name and members      |
| GET    | `/get-user-channels`              | Yes  | Get all channels the user belongs to            |
| GET    | `/get-channel-messages/:channelId`| Yes  | Get all messages in a channel (sender populated)|
| DELETE | `/delete-channel/:channelId`      | Yes  | Delete a channel and its messages (admin only)  |

---

## Socket.IO Events

All socket connections require a valid JWT cookie for authentication.

| Event                    | Direction         | Description                                           |
| ------------------------ | ----------------- | ----------------------------------------------------- |
| `sendMessage`            | Client -> Server  | Send a direct message (text, file, or audio)          |
| `receiveMessage`         | Server -> Client  | Deliver a DM to both sender and recipient             |
| `send-channel-message`   | Client -> Server  | Send a message to a group channel                     |
| `recieve-channel-message`| Server -> Client  | Broadcast a channel message to all online members     |
| `add-channel-notify`     | Client -> Server  | Notify members that a new channel was created         |
| `new-channel-added`      | Server -> Client  | Deliver new channel notification to online members    |

---

## Tests Performed

### Testing Stack

- **Jest 30** -- Test runner with Babel transform (ESM to CJS for Node compatibility)
- **Supertest 7** -- HTTP assertion library for testing Express endpoints
- **mongodb-memory-server 11** -- Spins up an in-memory MongoDB instance for isolated, fast tests
- **socket.io-client** -- Client library used to test real-time WebSocket connections

### Test Infrastructure

Reusable helpers in `tests/helpers/` provide:

- **`db.js`** -- Connects/disconnects MongoMemoryServer, sets `JWT_SECRET` for the test environment, and provides `clearTestDB()` to wipe collections between tests.
- **`auth.js`** -- `createAuthenticatedUser()` and `loginUser()` functions that call the signup/login endpoints and return the JWT cookie for use in subsequent requests.
- **`app.js`** -- Factory wrapper around `createApp()` to get an isolated Express instance.

### Test Summary

**27 total tests** across unit and integration suites:

#### Unit Tests -- Middleware (3 tests)

| Test                                        | Description                                            |
| ------------------------------------------- | ------------------------------------------------------ |
| No JWT cookie present                       | Returns 401 "Not authenticated"                        |
| Invalid or expired JWT token                | Returns 403 "Invalid or expired token"                 |
| Valid JWT token                             | Sets `req.userId` and calls `next()`                   |

#### Integration Tests -- Auth (10 tests)

| Test                                        | Description                                            |
| ------------------------------------------- | ------------------------------------------------------ |
| Signup -- success                           | Creates user, returns 201 with JWT cookie              |
| Signup -- missing email                     | Returns 400 with validation message                    |
| Signup -- missing password                  | Returns 400 with validation message                    |
| Signup -- duplicate email                   | Returns 409 "email already in use"                     |
| Login -- success                            | Returns 200 with JWT cookie                            |
| Login -- non-existent email                 | Returns 404 "No user found"                            |
| Login -- wrong password                     | Returns 400 "Invalid password"                         |
| Login -- missing fields                     | Returns 400 with validation message                    |
| Logout                                      | Clears JWT cookie, returns 200                         |
| UserInfo -- unauthenticated                 | Returns 401                                            |
| UserInfo -- authenticated                   | Returns user profile without password                  |
| Update Profile -- unauthenticated           | Returns 401                                            |
| Update Profile -- success                   | Updates name/color, sets `profileSetup: true`          |
| Update Profile -- missing fields            | Returns 400 "First name and last name are required"    |

#### Integration Tests -- Contacts (6 tests)

| Test                                        | Description                                            |
| ------------------------------------------- | ------------------------------------------------------ |
| Search -- unauthenticated                   | Returns 401                                            |
| Search -- missing search term               | Returns 400                                            |
| Search -- finds users by name               | Returns matching contacts via regex                    |
| Search -- excludes self                     | Current user is not in results                         |
| All Contacts                                | Returns all other users as `{label, value}` pairs      |
| Contacts for List                           | Returns contacts sorted by last message time           |
| Delete DM                                   | Removes all messages between two users                 |

#### Integration Tests -- Messages (3 tests)

| Test                                        | Description                                            |
| ------------------------------------------- | ------------------------------------------------------ |
| Get Messages -- unauthenticated             | Returns 401                                            |
| Get Messages -- sorted ascending            | Returns message history in chronological order         |
| Get Messages -- missing contact ID          | Returns 400 "Missing one or both user IDs"             |

#### Integration Tests -- Socket.IO (5 tests)

| Test                                        | Description                                            |
| ------------------------------------------- | ------------------------------------------------------ |
| Connection rejected -- no cookie            | Socket connection fails without JWT cookie             |
| Connection rejected -- bad JWT              | Socket connection fails with invalid token             |
| Connection accepted -- valid JWT            | Socket connects successfully with valid cookie         |
| Send DM -- sender receives echo             | `sendMessage` creates message and emits back to sender |
| Send DM -- both users receive               | Message delivered to both sender and recipient sockets |

### Running Tests

```bash
cd backend
npm test
```

All tests run against an in-memory MongoDB instance -- no external database or services are required.

---

## Challenges Faced

### COR

One of the first major hurdles was configuring CORS correctly between the React frontend (port 3000) and the Express backend (port 5001). Because authentication relies on HTTP-only cookies, the browser enforces strict rules around cross-origin cookie transmission. This required setting `credentials: true` in the CORS configuration and ensuring the frontend sends requests with `withCredentials`. Socket.IO also required its own separate CORS configuration with an explicit origin and `credentials: true` to allow cookie-based authentication on WebSocket connections.

### ngrok

During development and testing, we used **ngrok** to expose the local backend server to external networks. This introduced additional CORS and cookie challenges -- ngrok provides an HTTPS URL on a different domain, which means cookies set with `sameSite: 'Lax'` and `secure: false` would not be sent by the browser. Configuring the tunnel to work correctly with our cookie-based auth system required careful attention to these settings and testing across different network configurations.

### ESM/CJS Compatibility for Testing

The backend uses ES Modules (`"type": "module"` in `package.json`), but Jest does not natively support ESM well. This required configuring Babel (`babel.config.cjs` and `jest.config.cjs`) to transform ES module `import/export` syntax into CommonJS for the test runner. Getting this transform working correctly -- especially with Mongoose and Socket.IO -- required trial and error with the Babel preset configuration.

### Testing Real-Time Socket Connections

Writing integration tests for Socket.IO was one of the more complex testing challenges. Each test needed to:

- Spin up a real HTTP server on a random port
- Establish authenticated WebSocket connections using JWT cookies obtained from the API
- Coordinate asynchronous message delivery between multiple connected clients
- Handle timeouts to avoid tests hanging on missed events
- Clean up all connections and the server after each test run

The solution involved a `connectSocket()` helper and careful use of `Promise`-based patterns to await socket events within test assertions.

### Pre-Built Frontend Integration

The React frontend was compiled as a Vite production bundle, meaning the source code was not available for modification in this repository. Any backend changes, particularly to Socket.IO event names or API response shapes, had to match the existing frontend contract exactly.

---

## Extra Features

Beyond the core direct messaging functionality, the following additional features were implemented:

### Audio/Voice Messages

The message system supports audio messages via an `audioUrl` field. Users can record and send voice messages through the frontend, which are transmitted in real time through the same Socket.IO pipeline as text and file messages.

### File and Image Sharing

Both profile images and general file attachments are supported via **Multer** disk storage. Profile images are stored in `uploads/profiles/` and chat file attachments in `uploads/files/`. Files are served as static assets through Express and can be shared in both direct messages and channel conversations.

### Group Channels

A full channel (group chat) system with:

- **Channel creation** with a name and selected members
- **Admin controls** -- only the channel creator can delete the channel
- **Channel message broadcasting** -- messages are delivered to all online members via Socket.IO
- **Real-time notifications** -- when a channel is created, all members are notified instantly via the `new-channel-added` socket event

### Contact List (MongoDB Aggregation)

The "contacts for list" endpoint uses a sophisticated MongoDB aggregation pipeline that:

1. Finds all messages involving the current user
2. Groups them by the other participant
3. Sorts contacts by the timestamp of their most recent message
4. Joins with the Users collection to return full contact profiles

This provides a chat-app-style contact list where the most recent conversations appear at the top.

### Profile Customization

Users can customize their profiles with:

- **Custom avatar color** for a colored avatar background
- **Profile image upload/removal** via the profile management endpoints
- **Onboarding flow** controlled by a `profileSetup` flag that tracks whether the user has completed their initial profile setup

### DM Conversation Deletion

Users can delete their entire direct message history with a specific contact through the `DELETE /api/contacts/delete-dm/:dmId` endpoint, which removes all messages in both directions between the two users.

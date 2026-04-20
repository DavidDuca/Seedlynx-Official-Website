# 🌱 Seedlynx — Digital Innovation Studio

A modern, full-stack SPA landing page + admin dashboard for **Seedlynx**, a Philippines-based digital studio.

---

## 🗂 Project Structure

```
seedlynx/
├── frontend/
│   ├── index.html          # Main landing page
│   ├── styles.css          # Landing page styles
│   ├── script.js           # Landing page JS + API calls
│   └── admin/
│       ├── index.html      # Admin dashboard
│       ├── admin.css       # Admin styles
│       └── admin.js        # Admin JS + API calls
├── backend/
│   ├── server.js           # Express entry point
│   ├── routes/
│   │   ├── auth.js         # POST /api/auth/login
│   │   └── bookings.js     # CRUD /api/bookings
│   ├── controllers/
│   │   ├── authController.js
│   │   └── bookingController.js
│   ├── models/
│   │   ├── Admin.js        # Mongoose admin schema
│   │   └── Booking.js      # Mongoose booking schema
│   └── middleware/
│       └── auth.js         # JWT verification middleware
├── package.json
├── .env.example
└── README.md
```

---

## ⚙️ Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| MongoDB | Local ≥ 6.x OR Atlas (free tier) |

---

## 🚀 Quick Start

### 1. Clone or unzip the project

```bash
cd seedlynx
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/seedlynx
JWT_SECRET=your_super_secret_key_here_change_me
JWT_EXPIRES=8h
```

### 4. Start MongoDB

**Local:**
```bash
mongod
# or via Homebrew:
brew services start mongodb-community
# or via systemd:
sudo systemctl start mongod
```

**MongoDB Atlas:**
- Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
- Replace `MONGO_URI` in `.env` with your Atlas connection string

### 5. Start the server

**Development (auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

✅ Server runs at: `http://localhost:5000`

---

## 🌐 Access Points

| Page | URL |
|------|-----|
| Landing page | http://localhost:5000 |
| Admin dashboard | http://localhost:5000/admin/ |
| API health check | http://localhost:5000/api/health |

---

## 🔐 Default Admin Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> ⚠️ **Change these immediately in production!**

---

## 📡 API Reference

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Admin login → returns JWT |
| GET | `/api/auth/me` | Protected | Get current admin info |

**Login Request:**
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "id": "...", "username": "admin" }
}
```

---

### Bookings

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings` | Public | Create a new booking |
| GET | `/api/bookings` | Protected | Get all bookings |
| GET | `/api/bookings/:id` | Protected | Get a single booking |
| PUT | `/api/bookings/:id` | Protected | Update a booking |
| DELETE | `/api/bookings/:id` | Protected | Delete a booking |

**Create Booking:**
```json
POST /api/bookings
{
  "name": "Juan dela Cruz",
  "email": "juan@example.com",
  "date": "2025-08-15",
  "time": "10:00",
  "service": "web",
  "message": "I want to build a React app."
}
```

**Protected routes** require `Authorization: Bearer <token>` header.

**Query params for GET /api/bookings:**
- `?status=pending|confirmed|cancelled`
- `?date=2025-08-15`
- `?page=1&limit=20`

---

## 🎨 Tech Stack

### Frontend
- Vanilla HTML5, CSS3, JavaScript (ES2020+)
- Font: Syne (display) + DM Sans (body)
- Icons: Font Awesome 6
- Design: Glassmorphism, purple/black theme

### Backend
- Node.js + Express 4
- MongoDB + Mongoose 8
- JWT (jsonwebtoken)
- bcryptjs for password hashing
- CORS, dotenv

---

## 🛡 Security Notes

1. **JWT Secret**: Use a long, random string in production (≥ 32 chars).
2. **CORS**: Set `CLIENT_ORIGIN` to your actual frontend domain.
3. **Admin Password**: Change from `admin123` immediately.
4. **MongoDB**: Use authentication in production (Atlas handles this).
5. **HTTPS**: Deploy behind HTTPS in production (use nginx + Let's Encrypt).
6. **Rate Limiting**: Add `express-rate-limit` for the login route in production.

---

## 📦 Production Deployment Tips

1. Set `NODE_ENV=production` in `.env`
2. Use **PM2** for process management: `pm2 start backend/server.js`
3. Use **nginx** as reverse proxy
4. Deploy MongoDB to **Atlas** (free tier available)
5. Consider **Railway**, **Render**, or **Fly.io** for Node.js hosting

---

## 🧩 Extending the Project

- **Email notifications**: Add `nodemailer` to send confirmation emails on booking
- **Rate limiting**: `npm install express-rate-limit`
- **Helmet**: `npm install helmet` for HTTP security headers
- **File uploads**: `npm install multer` for team/service images
- **Admin password change**: Add a `PUT /api/auth/password` endpoint

---

## 📝 License

MIT © 2025 Seedlynx. All rights reserved.
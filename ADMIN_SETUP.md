# Admin Panel Setup

## 1. Enable Firebase Authentication

1. [Firebase Console](https://console.firebase.google.com/) → **farm2home-759a4**
2. **Build** → **Authentication** → **Get started**
3. **Sign-in method** → Enable **Email/Password**

## 2. Create admin user

1. **Authentication** → **Users** → **Add user**
2. Enter admin email and password (e.g. `admin@farm2home.com`)

## 3. Allow admin email on server

Edit `server/.env`:

```env
ADMIN_EMAILS=admin@farm2home.com
```

Use the same email you created in Firebase. Multiple admins: comma-separated.

Restart the server after changing `.env`.

## 4. Enable Firebase Storage (product photos)

1. Firebase Console → **Build** → **Storage** → **Get started**
2. Choose a location (same region as Firestore if possible)
3. Deploy storage rules from the project root:

```bash
firebase deploy --only storage
```

Or paste `storage.rules` in Firebase Console → Storage → Rules.

Admins upload photos from **Products → Add/Edit product**. Photos upload through the **server** to Firebase Storage (no browser CORS setup needed).

Ensure **Storage** is enabled in Firebase Console. Optional: deploy `storage.rules` for direct client reads.

## 5. Open admin panel

```
http://localhost:5173/admin/login
```

If Vite uses another port (e.g. `5174`), add that URL to **Google Cloud → API key → Website restrictions**:

```
http://localhost:5174/*
```

Or use `http://localhost/*` to allow all local ports.

## Troubleshooting login

| Error | Fix |
|-------|-----|
| Invalid email or password | Create user in Firebase → Authentication → Users with the same email as `ADMIN_EMAILS` in `server/.env` |
| Email/password disabled | Firebase → Authentication → Sign-in method → enable **Email/Password** |
| API key rejected | Google Cloud → Credentials → your browser key → add `http://localhost:5173/*` and `http://localhost:5174/*` |
| Login works but admin API fails | `ADMIN_EMAILS` in `server/.env` must include your Firebase user email exactly |
| Photo upload fails | Enable **Storage** in Firebase Console. Log out/in and retry. Or paste a direct **image URL** in the product form. Server OAuth errors mean use browser upload, not server. |

## Admin features

| Page | URL | Actions |
|------|-----|---------|
| Dashboard | `/admin` | Stats overview |
| Products | `/admin/products` | Add, edit, delete products, upload photos |
| Orders | `/admin/orders` | View orders, update status |
| Messages | `/admin/messages` | Read contact form submissions |

## Order statuses

- `pending` — new order
- `confirmed` — accepted
- `delivered` — completed
- `cancelled` — cancelled

## API routes (protected)

All require `Authorization: Bearer <firebase-id-token>`:

- `GET/POST /api/admin/products`
- `PUT/DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`

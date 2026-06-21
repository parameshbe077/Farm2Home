# Farm2Home

A full-stack farm produce store built with **React** and **Node.js**. Sell fresh **fruits**, **rice**, and **vegetables** online.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express |
| Database | **Firebase Firestore** (with in-memory fallback) |

## Features

- Product catalog with category filters (Fruits, Rice, Vegetables)
- Shopping cart with order submission to the API
- Contact form backed by the server
- Responsive, farm-themed UI
- REST API for products, orders, and contact messages

## Prerequisites

Install [Node.js](https://nodejs.org/) (v18 or newer recommended).

## Setup

```bash
# From the project root
npm run install:all
```

## Firebase Setup (recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create project**
2. Enable **Firestore Database** (Start in test mode for development)
3. Project **Settings** → **Service accounts** → **Generate new private key**
4. Save the JSON file as `server/firebase-service-account.json`
5. Copy env file and start:

```bash
cd server
copy .env.example .env
npm run seed          # upload products to Firestore (one time)
cd ..
npm run dev
```

Check connection: open `http://localhost:5000/api/health` — should show `"database": "firebase"`.

**Firestore collections:**
| Collection | Stores |
|------------|--------|
| `products` | Fruits, rice, vegetables catalog |
| `orders` | Customer orders |
| `contactMessages` | Contact form submissions |

Without Firebase credentials, the server falls back to **in-memory** storage (data lost on restart).

### Firestore security rules

Production rules are in `firestore.rules`. Deploy with:

```bash
firebase login
firebase use farm2home-759a4
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into Firebase Console → Firestore → Rules → Publish.

See [FIRESTORE_RULES.md](./FIRESTORE_RULES.md) for details.

### Admin panel

See [ADMIN_SETUP.md](./ADMIN_SETUP.md) to create an admin user and open `/admin/login`.

### Order alert emails

See [ORDER_ALERTS.md](./ORDER_ALERTS.md) to get an email when a customer places an order.

## Development

Run both the API and React app together:

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:5000

Or run them separately:

```bash
npm run dev:server   # API on port 5000
npm run dev:client   # React on port 5173
```

## Production

```bash
npm run build        # Build React app to client/dist
npm start            # Serve API + built frontend on port 5000
```

## Project Structure

```
Farm2Home/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # UI components
│   │   ├── context/        # Cart & toast state
│   │   └── pages/          # Home, Products, About, Contact
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── config/firebase.js  # Firebase init
│   ├── services/           # Firestore data layer
│   ├── data/products.js    # Seed product catalog
│   ├── scripts/seedProducts.js
│   ├── routes/             # API routes
│   └── index.js
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | List products (`?category=fruits`, `?featured=true`) |
| GET | `/api/products/:id` | Single product |
| POST | `/api/orders` | Place an order |
| POST | `/api/contact` | Send a contact message |

## Customization

- **Products:** Edit in Firebase Console, or update `server/data/products.js` and run `npm run seed --prefix server`
- **Contact info:** Edit `client/src/pages/Contact.jsx`
- **Styling:** Edit `client/src/index.css`

## License

MIT

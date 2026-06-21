# Firestore Security Rules — Farm2Home

## How your app accesses Firestore

| Access path | Uses rules? |
|-------------|-------------|
| **Express API** (orders, contact, seed) | No — Admin SDK bypasses rules |
| **React app in browser** | Yes — rules apply |

Your website uses the **Express API** for orders and contact, so those stay protected even with public product reads.

---

## Current rules summary

| Collection | Client read | Client write |
|------------|-------------|--------------|
| `products` | Allowed | Denied |
| `orders` | Denied | Denied |
| `contactMessages` | Denied | Denied |
| Everything else | Denied | Denied |

---

## Deploy rules to Firebase

### One-time: install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Link project (one time, from project root)

```bash
cd d:\Farm2Home
firebase use farm2home-759a4
```

### Deploy rules

```bash
firebase deploy --only firestore:rules
```

---

## Apply in Firebase Console (no CLI)

1. Open [Firebase Console](https://console.firebase.google.com/) → **farm2home-759a4**
2. **Firestore Database** → **Rules**
3. Paste contents of `firestore.rules`
4. Click **Publish**

---

## Test mode warning

If Firestore is still in **test mode** (`allow read, write: if request.time < ...`), replace it with these rules before going live. Test mode lets anyone read/write your database.

---

## Rules file location

```
Farm2Home/
├── firestore.rules    ← security rules
└── firebase.json      ← Firebase CLI config
```

[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=23225921&assignment_repo_type=AssignmentRepo)

# The Local Art Market

An e-commerce platform where individuals and artists can buy and sell handmade artwork in their region — paintings, sculptures, ceramics, textiles, and more.

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | Next.js (React)   |
| Backend  | Python / FastAPI  |
| Database | MongoDB Atlas     |
| State    | Jotai             |
| Testing  | unittest + coverage |

## Project Structure

```
project-1-kaper-shahzaib-jinnan/
├── backend/
│   ├── main.py            # FastAPI app & API routes
│   ├── test_main.py       # unittest suite
│   ├── backfill_stock.py  # One-off migration for existing listings
│   └── requirements.txt
└── frontend/
    ├── pages/
    │   ├── index.js           # Homepage — artwork gallery with pagination
    │   ├── artwork/[id].js    # Artwork detail page
    │   ├── my-listings.js     # Create / edit / delete your own listings
    │   ├── search.js          # Search results page
    │   ├── cart.js            # Shopping cart + checkout
    │   ├── purchases.js       # Order history
    │   ├── profile.js         # User profile
    │   ├── login.js           # Login page
    │   └── signup.js          # Sign-up page
    ├── components/
    │   └── SearchBar.js       # Reusable debounced search
    ├── atoms/
    │   └── cartAtom.js        # Jotai cart & user state
    ├── utils/
    │   └── image.js           # Image URL resolver helper
    └── styles/
        └── globals.css
```

## Getting Started

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Start the backend server:

```bash
uvicorn main:app --reload --port 8000
```

The backend expects a MongoDB Atlas connection string at the top of `main.py`. Replace the placeholder with your own.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint                    | Description                                   |
|--------|-----------------------------|-----------------------------------------------|
| GET    | `/api/artworks`             | List all artworks                             |
| GET    | `/api/artworks/{id}`        | Get a single artwork                          |
| POST   | `/api/artworks`             | Create a new artwork listing                  |
| PUT    | `/api/artworks/{id}`        | Update an existing listing                    |
| DELETE | `/api/artworks/{id}`        | Delete a listing                              |
| GET    | `/api/my-artworks/{email}`  | List a user's own listings                    |
| POST   | `/api/signup`               | Create a new account                          |
| POST   | `/api/login`                | Log in                                        |
| GET    | `/api/profile/{email}`      | Get a user profile                            |
| POST   | `/api/profile`              | Save / update a user profile                  |
| GET    | `/api/cart/{email}`         | Get a user's saved cart                       |
| POST   | `/api/cart`                 | Save a user's cart                            |
| GET    | `/api/orders/{email}`       | List a user's past orders                     |
| POST   | `/api/orders`               | Place an order (validates & decrements stock) |

## Features

- **Browse** the artwork gallery with pagination
- **Search** by title, artist, medium, description, or region (debounced live results)
- **View details** of any artwork — medium, artist, price, description, region, stock
- **Authentication** — sign up and log in
- **User profiles** with shipping address storage
- **My Listings** — create, edit, and delete your own artwork listings
- **Stock management** — each listing tracks available units:
  - Sellers set a stock count when creating or editing a listing
  - Buyers see "Out of stock" badges and cannot add more than the available quantity to their cart
  - Checkout validates stock on the server and decrements it atomically — an order either fully succeeds or is rejected with a clear error (no partial state)
- **Cart** — persistent across sessions, synced to the backend per user
- **Checkout** with a fake payment form
- **Purchase history** per user

## Running Tests

Backend test suite uses Python's built-in `unittest` module with `coverage` for code coverage reporting. MongoDB collections are mocked with an in-memory `FakeCollection`, so tests run without a database connection.

```bash
cd backend
source venv/bin/activate
coverage run -m unittest test_main -v
coverage report -m --include="main.py"
```

Current status: **36 tests passing, 100% coverage on `main.py`**.

Test groups:

| Test class              | Covers                                        |
|-------------------------|-----------------------------------------------|
| `TestListArtworks`      | `GET /api/artworks` + serialization           |
| `TestGetArtwork`        | `GET /api/artworks/{id}` (found / missing / invalid) |
| `TestMyArtworks`        | `GET /api/my-artworks/{email}`                |
| `TestCreateArtwork`     | `POST /api/artworks` (incl. stock field)      |
| `TestUpdateArtwork`     | `PUT /api/artworks/{id}` (found / missing / invalid) |
| `TestDeleteArtwork`     | `DELETE /api/artworks/{id}` (found / missing / invalid) |
| `TestSignup`            | `POST /api/signup` (new + duplicate)          |
| `TestLogin`             | `POST /api/login` (success + failure)         |
| `TestProfile`           | Profile save + fetch + validation             |
| `TestCart`              | Cart save + fetch + validation                |
| `TestOrders`            | Order save, stock decrement, insufficient stock, invalid item id, partial-order safety |
| `TestSerialize`         | Mongo `_id` → `id` conversion helper          |

## Manual Testing Checklist

1. **Sign up** with a new email → should redirect to login
2. **Log in** with those credentials → should redirect home, cart should load
3. **Browse** the gallery and paginate through pages
4. **Search** for an artist or medium from the header search bar
5. **Open** an artwork → detail page should render with stock count
6. **Add to cart** → button should disable once you hit the stock limit
7. **My Listings** → create a new listing with stock `3`, verify it appears on the homepage
8. **Edit** the listing, change stock to `1`, verify the homepage updates
9. **Checkout** with more items than stock → should show a "Not enough stock" error
10. **Checkout** within stock → order saves, cart clears, stock decrements on that listing
11. **Purchases** page → shows the order you just placed
12. **Delete** one of your listings → gone from both My Listings and homepage
13. **Log out** → header goes back to Login/Sign Up links

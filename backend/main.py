from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
from bson import ObjectId
from pymongo import MongoClient
import certifi

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MongoDB connection ──────────────────────────────────────────────
# Replace the string below with your actual MongoDB Atlas connection string
MONGO_URI = "mongodb+srv://kjanicki_db_user:zyCpYNlu8p3bYsk3@cluster0.zpm6k4o.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["local_art_market"]  # database name

artworks_col = db["artworks"]
users_col = db["users"]
profiles_col = db["profiles"]
carts_col = db["carts"]
orders_col = db["orders"]


# ── Helper: convert Mongo doc → JSON-safe dict ─────────────────────
def _serialize(doc):
    """Strip the Mongo _id and return a plain dict."""
    if doc is None:
        return None
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

# ── Auth endpoints (unchanged API shape) ─────────────────────────────
@app.post("/api/signup")
def signup(user: dict):
    if users_col.find_one({"email": user["email"]}):
        raise HTTPException(status_code=400, detail="Email already exists")

    users_col.insert_one(user)
    return {"message": "User created successfully"}


@app.post("/api/login")
def login(user: dict):
    match = users_col.find_one({"email": user["email"], "password": user["password"]})
    if match:
        return {"message": "Login successful"}

    raise HTTPException(status_code=401, detail="Invalid email or password")


# ── Profile endpoints ─────────────────────────────────────────────
@app.post("/api/profile")
def save_profile(profile: dict):
    email = profile.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    profiles_col.update_one(
        {"email": email},
        {"$set": profile},
        upsert=True
    )

    return {"message": "Profile saved"}

@app.get("/api/profile/{email}")
def get_profile(email: str):
    profile = profiles_col.find_one({"email": email})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.pop("_id", None)
    return profile

# ── Cart endpoints ─────────────────────────────────────────────

@app.get("/api/cart/{email}")
def get_cart(email: str):
    cart = carts_col.find_one({"email": email})

    if not cart:
        return {"email": email, "items": []}

    cart.pop("_id", None)
    return cart


@app.post("/api/cart")
def save_cart(cart: dict):
    email = cart.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    carts_col.update_one(
        {"email": email},
        {"$set": cart},
        upsert=True
    )

    return {"message": "Cart saved"}

# ── Orders endpoints ─────────────────────────────────────────────

@app.post("/api/orders")
def save_order(order: dict):
    email = order.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    items = order.get("items", []) or []

    # Validate stock for every item first so we never partially decrement.
    resolved = []
    for item in items:
        item_id = item.get("id")
        try:
            oid = ObjectId(item_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid artwork ID in cart")

        art = artworks_col.find_one({"_id": oid})
        if not art:
            raise HTTPException(
                status_code=404,
                detail=f"Artwork not found: {item.get('title', item_id)}"
            )

        available = art.get("stock", 0)
        requested = item.get("quantity", 1)
        if available < requested:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough stock for '{art.get('title', 'item')}' "
                    f"(have {available}, need {requested})"
                )
            )
        resolved.append((oid, available - requested))

    # All checks passed — decrement stock on each artwork.
    for oid, new_stock in resolved:
        artworks_col.update_one({"_id": oid}, {"$set": {"stock": new_stock}})

    orders_col.insert_one(order)
    return {"message": "Order saved"}

@app.get("/api/orders/{email}")
def get_orders(email: str):
    orders = list(orders_col.find({"email": email}))
    for order in orders:
        order.pop("_id", None)
    return orders

# ── Artwork endpoints (unchanged API shape) ─────────────────────────

@app.get("/api/artworks")
def list_artworks():
    return [_serialize(a) for a in artworks_col.find()]

@app.get("/api/artworks/{artwork_id}")
def get_artwork(artwork_id: str):
    try:
        art = artworks_col.find_one({"_id": ObjectId(artwork_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid artwork ID")

    if art is None:
        raise HTTPException(status_code=404, detail="Artwork not found")

    return _serialize(art)

@app.get("/api/my-artworks/{email}")
def get_my_artworks(email: str):
    artworks = list(artworks_col.find({"email": email}))
    return [_serialize(a) for a in artworks]

@app.post("/api/artworks")
def create_artwork(artwork: dict = Body(...)):
    result = artworks_col.insert_one(artwork)

    new_art = artworks_col.find_one({"_id": result.inserted_id})
    return _serialize(new_art)

@app.delete("/api/artworks/{artwork_id}")
def delete_artwork(artwork_id: str):
    try:
        result = artworks_col.delete_one({"_id": ObjectId(artwork_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid artwork ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artwork not found")

    return {"message": "Artwork deleted successfully"}

@app.put("/api/artworks/{artwork_id}")
def update_artwork(artwork_id: str, data: dict = Body(...)):
    try:
        obj_id = ObjectId(artwork_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid artwork ID")

    result = artworks_col.update_one({"_id": obj_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Artwork not found")

    updated = artworks_col.find_one({"_id": obj_id})
    return _serialize(updated)

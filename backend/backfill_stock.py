"""
One-off script: give every existing artwork a `stock` field.

Run once after deploying the stock-management feature so old listings
(which were created before `stock` existed) don't appear as permanently
out of stock. Safe to re-run — only touches documents missing `stock`.

Usage:
    source venv/bin/activate
    python backfill_stock.py
"""
from pymongo import MongoClient
import certifi

from main import MONGO_URI  # reuse the same connection string

DEFAULT_STOCK = 5

def main():
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client["local_art_market"]
    artworks = db["artworks"]

    missing_filter = {"$or": [
        {"stock": {"$exists": False}},
        {"stock": None},
    ]}

    missing_count = artworks.count_documents(missing_filter)
    total = artworks.count_documents({})

    print(f"Found {total} total artworks, {missing_count} missing stock.")

    if missing_count == 0:
        print("Nothing to backfill. All artworks already have a stock field.")
        return

    result = artworks.update_many(
        missing_filter,
        {"$set": {"stock": DEFAULT_STOCK}},
    )

    print(f"Backfilled {result.modified_count} artworks with stock={DEFAULT_STOCK}.")


if __name__ == "__main__":
    main()

import unittest
from unittest.mock import patch
from bson import ObjectId
from fastapi.testclient import TestClient

import main


class _InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class _DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class _UpdateResult:
    def __init__(self, matched_count):
        self.matched_count = matched_count


class FakeCollection:
    """In-memory stand-in for a pymongo collection."""

    def __init__(self, docs=None):
        self.docs = [dict(d) for d in (docs or [])]

    def find(self, query=None):
        if not query:
            return [dict(d) for d in self.docs]
        return [dict(d) for d in self.docs if self._matches(d, query)]

    def find_one(self, query):
        for d in self.docs:
            if self._matches(d, query):
                return dict(d)
        return None

    def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.docs.append(dict(doc))
        return _InsertResult(doc["_id"])

    def update_one(self, query, update, upsert=False):
        for i, d in enumerate(self.docs):
            if self._matches(d, query):
                self.docs[i].update(update.get("$set", {}))
                return _UpdateResult(1)
        if upsert:
            new = {}
            new.update(query)
            new.update(update.get("$set", {}))
            self.docs.append(new)
            return _UpdateResult(0)
        return _UpdateResult(0)

    def delete_one(self, query):
        for i, d in enumerate(self.docs):
            if self._matches(d, query):
                self.docs.pop(i)
                return _DeleteResult(1)
        return _DeleteResult(0)

    @staticmethod
    def _matches(doc, query):
        return all(doc.get(k) == v for k, v in query.items())


class BaseTestCase(unittest.TestCase):
    def setUp(self):
        self.art1_id = ObjectId()
        self.art2_id = ObjectId()
        self.artworks = FakeCollection([
            {"_id": self.art1_id, "title": "Sunset", "artist": "Alice",
             "price": 10.0, "region": "North", "image": "x.jpg",
             "medium": "oil", "description": "nice",
             "email": "alice@x.com", "stock": 5},
            {"_id": self.art2_id, "title": "Moon", "artist": "Bob",
             "price": 20.0, "region": "South", "image": "y.jpg",
             "medium": "ink", "description": "cool",
             "email": "bob@x.com", "stock": 1},
        ])
        self.users = FakeCollection()
        self.profiles = FakeCollection()
        self.carts = FakeCollection()
        self.orders = FakeCollection()

        self.patchers = [
            patch.object(main, "artworks_col", self.artworks),
            patch.object(main, "users_col", self.users),
            patch.object(main, "profiles_col", self.profiles),
            patch.object(main, "carts_col", self.carts),
            patch.object(main, "orders_col", self.orders),
        ]
        for p in self.patchers:
            p.start()

        self.client = TestClient(main.app)

    def tearDown(self):
        for p in self.patchers:
            p.stop()


# ── Artwork list / get ────────────────────────────────────────────

class TestListArtworks(BaseTestCase):
    def test_list_returns_all(self):
        r = self.client.get("/api/artworks")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 2)

    def test_list_serializes_id(self):
        r = self.client.get("/api/artworks")
        data = r.json()
        self.assertNotIn("_id", data[0])
        self.assertEqual(data[0]["id"], str(self.art1_id))


class TestGetArtwork(BaseTestCase):
    def test_get_existing(self):
        r = self.client.get(f"/api/artworks/{self.art1_id}")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["title"], "Sunset")

    def test_get_missing(self):
        missing = ObjectId()
        r = self.client.get(f"/api/artworks/{missing}")
        self.assertEqual(r.status_code, 404)

    def test_get_invalid_id(self):
        r = self.client.get("/api/artworks/not-an-object-id")
        self.assertEqual(r.status_code, 400)


# ── My artworks ───────────────────────────────────────────────────

class TestMyArtworks(BaseTestCase):
    def test_my_artworks_filtered_by_email(self):
        r = self.client.get("/api/my-artworks/alice@x.com")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Sunset")

    def test_my_artworks_none(self):
        r = self.client.get("/api/my-artworks/nobody@x.com")
        self.assertEqual(r.json(), [])


# ── Create / Update / Delete ─────────────────────────────────────

class TestCreateArtwork(BaseTestCase):
    def test_create_artwork(self):
        payload = {"title": "New", "artist": "C", "price": 5.0,
                   "region": "East", "image": "z.jpg", "medium": "ink",
                   "description": "fresh", "email": "c@x.com", "stock": 7}
        r = self.client.post("/api/artworks", json=payload)
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["title"], "New")
        self.assertEqual(body["stock"], 7)
        self.assertIn("id", body)
        self.assertEqual(len(self.artworks.docs), 3)


class TestUpdateArtwork(BaseTestCase):
    def test_update_existing(self):
        r = self.client.put(f"/api/artworks/{self.art1_id}",
                            json={"price": 99.0})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["price"], 99.0)

    def test_update_missing(self):
        missing = ObjectId()
        r = self.client.put(f"/api/artworks/{missing}",
                            json={"price": 1.0})
        self.assertEqual(r.status_code, 404)

    def test_update_invalid_id(self):
        r = self.client.put("/api/artworks/bad-id", json={"price": 1.0})
        self.assertEqual(r.status_code, 400)


class TestDeleteArtwork(BaseTestCase):
    def test_delete_existing(self):
        r = self.client.delete(f"/api/artworks/{self.art1_id}")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(self.artworks.docs), 1)

    def test_delete_missing(self):
        missing = ObjectId()
        r = self.client.delete(f"/api/artworks/{missing}")
        self.assertEqual(r.status_code, 404)

    def test_delete_invalid_id(self):
        r = self.client.delete("/api/artworks/bad-id")
        self.assertEqual(r.status_code, 400)


# ── Auth ─────────────────────────────────────────────────────────

class TestSignup(BaseTestCase):
    def test_signup_creates_user(self):
        r = self.client.post("/api/signup",
                             json={"email": "a@b.com", "password": "x"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(self.users.docs), 1)

    def test_signup_duplicate(self):
        self.users.insert_one({"email": "a@b.com", "password": "x"})
        r = self.client.post("/api/signup",
                             json={"email": "a@b.com", "password": "x"})
        self.assertEqual(r.status_code, 400)


class TestLogin(BaseTestCase):
    def test_login_success(self):
        self.users.insert_one({"email": "a@b.com", "password": "x"})
        r = self.client.post("/api/login",
                             json={"email": "a@b.com", "password": "x"})
        self.assertEqual(r.status_code, 200)

    def test_login_failure(self):
        r = self.client.post("/api/login",
                             json={"email": "a@b.com", "password": "wrong"})
        self.assertEqual(r.status_code, 401)


# ── Profile ──────────────────────────────────────────────────────

class TestProfile(BaseTestCase):
    def test_save_profile(self):
        r = self.client.post("/api/profile",
                             json={"email": "a@b.com", "name": "Alice"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(self.profiles.docs), 1)

    def test_save_profile_no_email(self):
        r = self.client.post("/api/profile", json={"name": "x"})
        self.assertEqual(r.status_code, 400)

    def test_get_profile(self):
        self.profiles.insert_one({"email": "a@b.com", "name": "Alice"})
        r = self.client.get("/api/profile/a@b.com")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["name"], "Alice")

    def test_get_profile_missing(self):
        r = self.client.get("/api/profile/none@b.com")
        self.assertEqual(r.status_code, 404)


# ── Cart ─────────────────────────────────────────────────────────

class TestCart(BaseTestCase):
    def test_get_cart_empty(self):
        r = self.client.get("/api/cart/a@b.com")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {"email": "a@b.com", "items": []})

    def test_get_cart_existing(self):
        self.carts.insert_one({"email": "a@b.com", "items": [{"id": 1}]})
        r = self.client.get("/api/cart/a@b.com")
        self.assertEqual(r.json()["items"], [{"id": 1}])

    def test_save_cart(self):
        r = self.client.post("/api/cart",
                             json={"email": "a@b.com", "items": []})
        self.assertEqual(r.status_code, 200)

    def test_save_cart_no_email(self):
        r = self.client.post("/api/cart", json={"items": []})
        self.assertEqual(r.status_code, 400)


# ── Orders ───────────────────────────────────────────────────────

class TestOrders(BaseTestCase):
    def test_save_order_no_items(self):
        r = self.client.post("/api/orders",
                             json={"email": "a@b.com", "total": 10})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(self.orders.docs), 1)

    def test_save_order_no_email(self):
        r = self.client.post("/api/orders", json={"total": 10})
        self.assertEqual(r.status_code, 400)

    def test_get_orders(self):
        self.orders.insert_one({"email": "a@b.com", "total": 10})
        r = self.client.get("/api/orders/a@b.com")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 1)

    def test_save_order_decrements_stock(self):
        order = {
            "email": "a@b.com",
            "total": 30.0,
            "items": [
                {"id": str(self.art1_id), "title": "Sunset",
                 "price": 10.0, "quantity": 2},
                {"id": str(self.art2_id), "title": "Moon",
                 "price": 20.0, "quantity": 1},
            ],
        }
        r = self.client.post("/api/orders", json=order)
        self.assertEqual(r.status_code, 200)
        art1 = self.artworks.find_one({"_id": self.art1_id})
        art2 = self.artworks.find_one({"_id": self.art2_id})
        self.assertEqual(art1["stock"], 3)
        self.assertEqual(art2["stock"], 0)
        self.assertEqual(len(self.orders.docs), 1)

    def test_save_order_insufficient_stock(self):
        order = {
            "email": "a@b.com",
            "total": 40.0,
            "items": [
                {"id": str(self.art2_id), "title": "Moon",
                 "price": 20.0, "quantity": 2},
            ],
        }
        r = self.client.post("/api/orders", json=order)
        self.assertEqual(r.status_code, 400)
        self.assertIn("Not enough stock", r.json()["detail"])
        # No partial effects: order not saved, stock unchanged
        self.assertEqual(len(self.orders.docs), 0)
        self.assertEqual(
            self.artworks.find_one({"_id": self.art2_id})["stock"], 1
        )

    def test_save_order_insufficient_stock_fails_before_partial(self):
        # First item fits, second doesn't — first item's stock must NOT be
        # touched because we validate everything upfront.
        order = {
            "email": "a@b.com",
            "total": 50.0,
            "items": [
                {"id": str(self.art1_id), "title": "Sunset",
                 "price": 10.0, "quantity": 2},
                {"id": str(self.art2_id), "title": "Moon",
                 "price": 20.0, "quantity": 999},
            ],
        }
        r = self.client.post("/api/orders", json=order)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(
            self.artworks.find_one({"_id": self.art1_id})["stock"], 5
        )
        self.assertEqual(len(self.orders.docs), 0)

    def test_save_order_invalid_item_id(self):
        order = {
            "email": "a@b.com",
            "total": 10.0,
            "items": [{"id": "not-an-object-id", "quantity": 1}],
        }
        r = self.client.post("/api/orders", json=order)
        self.assertEqual(r.status_code, 400)
        self.assertIn("Invalid artwork ID", r.json()["detail"])

    def test_save_order_item_not_found(self):
        missing = ObjectId()
        order = {
            "email": "a@b.com",
            "total": 10.0,
            "items": [{"id": str(missing), "title": "Ghost",
                       "quantity": 1}],
        }
        r = self.client.post("/api/orders", json=order)
        self.assertEqual(r.status_code, 404)


# ── _serialize helper ────────────────────────────────────────────

class TestSerialize(unittest.TestCase):
    def test_serialize_none(self):
        self.assertIsNone(main._serialize(None))

    def test_serialize_sets_id_and_strips_underscore(self):
        oid = ObjectId()
        out = main._serialize({"_id": oid, "a": 1})
        self.assertEqual(out, {"id": str(oid), "a": 1})


if __name__ == "__main__":
    unittest.main()

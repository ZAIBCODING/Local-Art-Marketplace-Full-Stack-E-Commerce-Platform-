import { atom } from "jotai";

export const userAtom = atom(null);

export const cartAtom = atom([]);

// Load cart from backend
export const loadCartAtom = atom(null, async (get, set) => {
  const user = get(userAtom);

  if (!user) {
    set(cartAtom, []);
    return;
  }

  try {
    const res = await fetch(`http://localhost:8000/api/cart/${user}`);
    const data = await res.json();
    set(cartAtom, data.items || []);
  } catch (err) {
    console.error("Failed to load cart:", err);
    set(cartAtom, []);
  }
});

// Save cart to backend
export const saveCartAtom = atom(null, async (get) => {
  const user = get(userAtom);
  const cart = get(cartAtom);

  if (!user) return;

  try {
    await fetch("http://localhost:8000/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user,
        items: cart,
      }),
    });
  } catch (err) {
    console.error("Failed to save cart:", err);
  }
});

// Add item (respects the artwork's stock — silently refuses to exceed it)
export const addToCartAtom = atom(null, (get, set, artwork) => {
  const cart = get(cartAtom);
  const exists = cart.find((item) => item.id === artwork.id);
  const stock = artwork.stock ?? 0;
  const currentQty = exists ? exists.quantity : 0;

  if (currentQty >= stock) {
    return;
  }

  let updated;
  if (exists) {
    updated = cart.map((item) =>
      item.id === artwork.id
        ? { ...item, quantity: item.quantity + 1, stock }
        : item
    );
  } else {
    updated = [...cart, { ...artwork, quantity: 1 }];
  }

  set(cartAtom, updated);
  set(saveCartAtom);
});

// Remove item
export const removeFromCartAtom = atom(null, (get, set, id) => {
  const updated = get(cartAtom).filter((item) => item.id !== id);
  set(cartAtom, updated);
  set(saveCartAtom);
});

// Clear cart
export const clearCartAtom = atom(null, (get, set) => {
  set(cartAtom, []);
  set(saveCartAtom);
});

// Totals
export const totalItemsAtom = atom((get) =>
  get(cartAtom).reduce((sum, item) => sum + item.quantity, 0)
);

export const totalPriceAtom = atom((get) =>
  get(cartAtom).reduce((sum, item) => sum + item.price * item.quantity, 0)
);

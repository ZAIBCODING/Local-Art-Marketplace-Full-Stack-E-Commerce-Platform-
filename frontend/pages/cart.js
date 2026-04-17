
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  cartAtom,
  removeFromCartAtom,
  clearCartAtom,
  totalItemsAtom,
  totalPriceAtom,
  userAtom,
  loadCartAtom,
} from "../atoms/cartAtom";
import SearchBar from "../components/SearchBar";
import { resolveImageSrc } from "../utils/image";

export default function CartPage() {
  const cart = useAtomValue(cartAtom);
  const totalItems = useAtomValue(totalItemsAtom);
  const totalPrice = useAtomValue(totalPriceAtom);
  const user = useAtomValue(userAtom);
  const [, removeFromCart] = useAtom(removeFromCartAtom);
  const [, clearCart] = useAtom(clearCartAtom);
  const [, setUser] = useAtom(userAtom);
  const [, loadCart] = useAtom(loadCartAtom);

  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    address: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(storedUser);
      loadCart();
    }
  }, [setUser, loadCart]);

  function handleLogout() {
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  const [checkoutError, setCheckoutError] = useState("");

  async function handleCheckout(e) {
    e.preventDefault();
    setCheckoutError("");

    const order = {
      email: user,
      items: cart,
      total: totalPrice,
      date: new Date().toISOString(),
      shippingName: checkoutForm.name,
      shippingAddress: checkoutForm.address,
    };

    try {
      const res = await fetch("http://localhost:8000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCheckoutError(data.detail || "Checkout failed. Please try again.");
        return;
      }

      setOrderPlaced(true);
      setShowCheckout(false);
      clearCart();
    } catch (err) {
      setCheckoutError("Could not reach the server. Please try again.");
    }
  }

  return (
    <>
      <Head>
        <title>Your Cart — Local Art Market</title>
      </Head>

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <Link href="/" style={styles.logoLink}>
            <h1 style={styles.logo}>
              🎨 <span style={{ color: "var(--accent)" }}>Local Art Market</span>
            </h1>
          </Link>

          <div style={styles.headerActions}>
            <Link href="/cart" style={styles.cartButton}>
              Cart🛒
              {totalItems > 0 && (
                <span style={styles.cartBadge}>{totalItems}</span>
              )}
            </Link>

            <div style={styles.profileContainer}>
              <div
                style={styles.profileIcon}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {user ? user[0].toUpperCase() : "👤"}
              </div>

              {menuOpen && (
                <div style={styles.dropdown}>
                  <Link href="/profile" style={styles.dropdownItem}>Profile</Link>
                  <Link href="/my-listings" style={styles.dropdownItem}>My Listings</Link>
                  <Link href="/purchases" style={styles.dropdownItem}>My Purchases</Link>
                  <div style={styles.dropdownItem} onClick={handleLogout}>Logout</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <h2 style={styles.pageTitle}>Your Cart</h2>

        {cart.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>Your cart is empty.</p>
            <Link href="/" style={styles.browseLink}>Browse the gallery →</Link>
          </div>
        ) : (
          <div style={styles.layout}>
            <div style={styles.items}>
              {cart.map((item) => (
                <div key={item.id} style={styles.item}>
                  <div style={styles.itemImageWrap}>
                    <Image src={resolveImageSrc(item.image)} alt={item.title} width={100} height={80} style={styles.itemImage} />
                  </div>

                  <div style={styles.itemDetails}>
                    <Link href={`/artwork/${item.id}`} style={styles.itemTitle}>{item.title}</Link>
                    <p style={styles.itemArtist}>by {item.artist}</p>
                    <p style={styles.itemMedium}>{item.medium}</p>
                  </div>

                  <div style={styles.itemRight}>
                    <p style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</p>
                    {item.quantity > 1 && (
                      <p style={styles.itemQty}>×{item.quantity} @ ${item.price.toFixed(2)}</p>
                    )}
                    <button onClick={() => removeFromCart(item.id)} style={styles.removeButton}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={() => clearCart()} style={styles.clearButton}>Clear Cart</button>
            </div>

            <div style={styles.summary}>
              <h3 style={styles.summaryTitle}>Order Summary</h3>

              <div style={styles.summaryRow}>
                <span>Items ({totalItems})</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>

              <div style={styles.summaryDivider} />

              <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>

              <button style={styles.checkoutButton} onClick={() => setShowCheckout(true)}>
                Proceed to Checkout
              </button>
              <Link href="/" style={styles.continueShopping}>← Continue Shopping</Link>
            </div>
          </div>
        )}
      </main>

      {showCheckout && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Checkout</h2>
            <form onSubmit={handleCheckout} style={styles.form}>
              <input
                placeholder="Full Name"
                required
                value={checkoutForm.name}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                style={styles.input}
              />
              <input
                placeholder="Shipping Address"
                required
                value={checkoutForm.address}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                style={styles.input}
              />
              <input
                placeholder="Card Number (fake)"
                required
                maxLength={16}
                value={checkoutForm.cardNumber}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, cardNumber: e.target.value })}
                style={styles.input}
              />
              <div style={{ display: "flex", gap: "1rem" }}>
                <input
                  placeholder="Expiry (MM/YY)"
                  required
                  maxLength={5}
                  value={checkoutForm.expiry}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, expiry: e.target.value })}
                  style={styles.input}
                />
                <input
                  placeholder="CVV"
                  required
                  maxLength={3}
                  value={checkoutForm.cvv}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, cvv: e.target.value })}
                  style={styles.input}
                />
              </div>
              {checkoutError && (
                <p style={{ color: "#e53935", fontSize: "0.9rem", margin: 0 }}>
                  {checkoutError}
                </p>
              )}
              <button type="submit" style={styles.submitButton}>Place Order</button>
              <button type="button" onClick={() => { setShowCheckout(false); setCheckoutError(""); }} style={styles.cancelButton}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {orderPlaced && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.orderTitle}>🎉 Order Placed!</h2>
            <p style={styles.orderText}>
              Thank you for your purchase! Your order has been confirmed.
            </p>
            <button onClick={() => setOrderPlaced(false)} style={styles.submitButton}>
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  header: {
    padding: "1rem",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  logoLink: {
    textDecoration: "none",
    color: "inherit",
  },
  searchContainer: {
    flex: 1,
    maxWidth: "400px",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  cartButton: {
    position: "relative",
    fontSize: "1.2rem",
    textDecoration: "none",
    lineHeight: 1,
    color: "inherit",
  },
  cartBadge: {
    position: "absolute",
    top: "-6px",
    right: "-8px",
    background: "var(--accent)",
    color: "white",
    borderRadius: "50%",
    fontSize: "0.65rem",
    fontWeight: 700,
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  profileContainer: {
    position: "relative",
  },
  profileIcon: {
    fontSize: "1.5rem",
    cursor: "pointer",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    color: "var(--accent)",
  },
  dropdown: {
    position: "absolute",
    top: "50px",
    right: 0,
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    minWidth: "140px",
    overflow: "hidden",
    zIndex: 10,
  },
  dropdownItem: {
    padding: "0.75rem 1rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "inherit",
    textDecoration: "none",
    display: "block",
  },
  main: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  pageTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: "2rem",
  },
  empty: {
    textAlign: "center",
    padding: "4rem 0",
  },
  emptyText: {
    fontSize: "1.1rem",
    color: "var(--muted)",
    marginBottom: "1rem",
  },
  browseLink: {
    color: "var(--accent)",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: "1rem",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: "2.5rem",
    alignItems: "start",
  },
  items: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  item: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1rem",
  },
  itemImageWrap: {
    borderRadius: "8px",
    overflow: "hidden",
    flexShrink: 0,
  },
  itemImage: {
    width: "100px",
    height: "80px",
    objectFit: "cover",
    display: "block",
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: 600,
    fontSize: "1rem",
    color: "inherit",
    textDecoration: "none",
  },
  itemArtist: {
    color: "var(--muted)",
    fontSize: "0.85rem",
    marginTop: "0.2rem",
  },
  itemMedium: {
    color: "var(--muted)",
    fontSize: "0.8rem",
    marginTop: "0.2rem",
  },
  itemRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.25rem",
    flexShrink: 0,
  },
  itemPrice: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "var(--accent)",
  },
  itemQty: {
    fontSize: "0.8rem",
    color: "var(--muted)",
  },
  removeButton: {
    background: "none",
    border: "none",
    color: "#e53935",
    fontSize: "0.82rem",
    cursor: "pointer",
    padding: 0,
    marginTop: "0.25rem",
    fontWeight: 500,
  },
  clearButton: {
    alignSelf: "flex-start",
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    color: "var(--muted)",
    fontSize: "0.85rem",
    marginTop: "0.5rem",
  },
  summary: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
    position: "sticky",
    top: "1.5rem",
  },
  summaryTitle: {
    fontWeight: 700,
    fontSize: "1.1rem",
    marginBottom: "1.25rem",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    marginBottom: "0.75rem",
    color: "var(--muted)",
  },
  summaryDivider: {
    borderTop: "1px solid var(--border)",
    margin: "1rem 0",
  },
  summaryTotal: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "var(--text)",
    marginBottom: "1.25rem",
  },
  checkoutButton: {
    width: "100%",
    padding: "0.85rem",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "1rem",
  },
  continueShopping: {
    display: "block",
    textAlign: "center",
    color: "var(--accent)",
    fontSize: "0.85rem",
    textDecoration: "none",
    fontWeight: 500,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    fontSize: "0.95rem",
    width: "100%",
  },
  submitButton: {
    padding: "0.75rem",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelButton: {
    padding: "0.75rem",
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  orderTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1rem",
  },
  orderText: {
    color: "var(--muted)",
    marginBottom: "1.5rem",
  },
};

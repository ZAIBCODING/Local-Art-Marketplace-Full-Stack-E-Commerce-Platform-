import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "../atoms/cartAtom";
import SearchBar from "../components/SearchBar";

export default function Purchases() {
  const user = useAtomValue(userAtom);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setLocalUser(storedUser);

    if (!storedUser) {
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/api/orders/${storedUser}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Not logged in ───────────────────────────────────────────
  if (!localUser && !loading) {
    return (
      <>
        <Head>
          <title>Purchase History | Local Art Market</title>
        </Head>
        <main style={styles.centered}>
          <div style={styles.card}>
            <p style={styles.lockIcon}>🔒</p>
            <h2 style={styles.title}>Please log in first</h2>
            <p style={styles.subtitle}>
              You need to be logged in to see your purchase history.
            </p>
            <Link href="/login" style={styles.loginButton}>
              Go to Login
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={styles.centered}>
        <p style={{ color: "var(--muted)" }}>Loading your orders...</p>
      </main>
    );
  }

  // ── No orders yet ───────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <>
        <Head>
          <title>Purchase History | Local Art Market</title>
        </Head>
        <header style={styles.header}>
          <Link href="/" style={styles.backLink}>← Back to Gallery</Link>
          <h1 style={styles.logo}>
            🎨 <span style={{ color: "var(--accent)" }}>Local Art Market</span>
          </h1>
          <div style={{ width: "120px" }} />
        </header>
        <main style={styles.centered}>
          <div style={styles.card}>
            <p style={styles.lockIcon}>🛍️</p>
            <h2 style={styles.title}>No purchases yet</h2>
            <p style={styles.subtitle}>You havent bought anything yet.</p>
            <Link href="/" style={styles.loginButton}>Browse the Gallery</Link>
          </div>
        </main>
      </>
    );
  }

  // ── Orders list ─────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Purchase History | Local Art Market</title>
      </Head>

      <header style={styles.header}>
        <div style={styles.headerTop}>
        <Link href="/" style={styles.backLink}>← Back to Gallery</Link>
        <div style={styles.searchContainer}>
        <SearchBar />
        </div>

        <h1 style={styles.logo}>
          🎨 <span style={{ color: "var(--accent)" }}>Local Art Market</span>
        </h1>
        <div style={{ width: "120px" }} />
        </div>
      </header>

      <main style={styles.main}>
        <h2 style={styles.pageTitle}>Purchase History</h2>
        <p style={styles.userEmail}>Logged in as: {localUser}</p>

        <div style={styles.ordersList}>
          {orders.map((order, index) => (
            <div key={index} style={styles.orderCard}>

              <div style={styles.orderHeader}>
                <span style={styles.orderDate}>
                  🗓️ {new Date(order.date).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span style={styles.orderTotal}>
                  Total: ${order.total.toFixed(2)}
                </span>
              </div>

              <p style={styles.shippingInfo}>
                📦 Shipped to: {order.shippingName}, {order.shippingAddress}
              </p>

              <div style={styles.itemsList}>
                {order.items.map((item, i) => (
                  <div key={i} style={styles.item}>
                    <span style={styles.itemTitle}>{item.title}</span>
                    <span style={styles.itemMeta}>
                      by {item.artist} · x{item.quantity} · ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      </main>
    </>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    borderBottom: "1px solid var(--border)",
  },
  headerTop: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: "1100px",
  margin: "0 auto",
  gap: "1.5rem",
  },
  searchContainer: {
  flex: 1,
  maxWidth: "400px",
  },
  backLink: {
    color: "var(--accent)",
    fontWeight: 500,
    fontSize: "0.95rem",
    textDecoration: "none",
    width: "120px",
    whiteSpace: "nowrap",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 700,
    textAlign: "center",
  },
  main: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2.5rem 1rem",
  },
  pageTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  userEmail: {
    color: "var(--muted)",
    fontSize: "0.9rem",
    marginBottom: "2rem",
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  orderCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  orderDate: {
    fontSize: "0.95rem",
    color: "var(--muted)",
  },
  orderTotal: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "var(--accent)",
  },
  shippingInfo: {
    fontSize: "0.875rem",
    color: "var(--muted)",
    marginBottom: "1rem",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    borderTop: "1px solid var(--border)",
    paddingTop: "1rem",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  itemMeta: {
    fontSize: "0.85rem",
    color: "var(--muted)",
  },
  centered: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    textAlign: "center",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "3rem 2rem",
    maxWidth: "400px",
    width: "100%",
  },
  lockIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
  },
  loginButton: {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    background: "var(--accent)",
    color: "white",
    borderRadius: "8px",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: "0.95rem",
  },
};
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { cartAtom, addToCartAtom, userAtom, loadCartAtom } from "../../atoms/cartAtom";
import { resolveImageSrc } from "../../utils/image";

export async function getServerSideProps(context) {
  const { id } = context.params;
  const res = await fetch(`http://localhost:8000/api/artworks/${id}`);
  if (!res.ok) return { notFound: true };
  const artwork = await res.json();
  return { props: { artwork } };
}

export default function ArtworkDetail({ artwork }) {
  const [cart] = useAtom(cartAtom);
  const [, addToCart] = useAtom(addToCartAtom);
  const [, setUser] = useAtom(userAtom);
  const [, loadCart] = useAtom(loadCartAtom);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [added, setAdded] = useState(false);

  const inCart = cart.find((item) => item.id === artwork.id);
  const stock = artwork.stock ?? 0;
  const inCartQty = inCart ? inCart.quantity : 0;
  const outOfStock = stock <= 0;
  const atMax = inCartQty >= stock;
  const disableAdd = outOfStock || atMax;

  // 🔥 FIX: load cart on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(storedUser);
      loadCart();
    }
  }, [setUser, loadCart]);

  function handleAddToCart() {
    if (disableAdd) return;
    addToCart(artwork);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <>
      <Head>
        <title>{artwork.title} — Local Art Market</title>
      </Head>

      <header style={styles.header}>
        <Link href="/" style={styles.backLink}>
          ← Back to Gallery
        </Link>

        <h1 style={styles.logo}>
          🎨 <span style={{ color: "var(--accent)" }}>Local Art Market</span>
        </h1>

        <Link href="/cart" style={styles.cartButton}>
          Cart🛒
          {totalItems > 0 && (
            <span style={styles.cartBadge}>{totalItems}</span>
          )}
        </Link>
      </header>

      <main style={styles.main}>
        <div style={styles.layout}>
          <div style={styles.imageWrap}>
            <Image
              src={resolveImageSrc(artwork.image)}
              alt={artwork.title}
              width={700}
              height={500}
              style={styles.image}
              priority
            />
          </div>

          <div style={styles.details}>
            <h2 style={styles.title}>{artwork.title}</h2>
            <p style={styles.artist}>by {artwork.artist}</p>
            <span style={styles.medium}>{artwork.medium}</span>
            <p style={styles.description}>{artwork.description}</p>

            <div style={styles.meta}>
              <div style={styles.price}>
                ${artwork.price.toFixed(2)}
              </div>
              <div style={styles.region}>📍 {artwork.region}</div>
            </div>

            <p style={{
              marginTop: "0.5rem",
              fontWeight: 600,
              color: outOfStock ? "#e53935" : "#374151",
            }}>
              {outOfStock
                ? "Out of stock"
                : `${stock} in stock`}
            </p>

            <div style={styles.buttonRow}>
              <button
                onClick={handleAddToCart}
                disabled={disableAdd}
                style={{
                  ...styles.addButton,
                  opacity: disableAdd ? 0.5 : 1,
                  cursor: disableAdd ? "not-allowed" : "pointer",
                }}
              >
                {outOfStock
                  ? "Out of Stock"
                  : atMax
                  ? "Max reached"
                  : added
                  ? "✓ Added to Cart!"
                  : inCart
                  ? "Add Another"
                  : "Add to Cart"}
              </button>

              <button style={styles.contactButton}>
                Contact Artist
              </button>
            </div>

            {inCart && (
              <p style={styles.cartHint}>
                You have {inCart.quantity} of this in your cart.
              </p>
            )}
          </div>
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
  backLink: {
    color: "var(--accent)",
    fontWeight: 500,
    fontSize: "0.95rem",
    textDecoration: "none",
    width: "120px",
    whiteSpace: "nowrap",
  },
  cartButton: {
    position: "relative",
    fontSize: "1.5rem",
    textDecoration: "none",
    lineHeight: 1,
    width: "120px",
    textAlign: "right",
  },
  cartBadge: {
    position: "absolute",
    top: "-6px",
    right: "-10px",
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
  logo: {
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2.5rem 1rem",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "3rem",
    alignItems: "start",
  },
  imageWrap: {
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid var(--border)",
  },
  image: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  details: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
  },
  artist: {
    color: "var(--muted)",
    fontSize: "1.1rem",
  },
  medium: {
    display: "inline-block",
    background: "#f3f0ff",
    color: "var(--accent)",
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 500,
    width: "fit-content",
  },
  description: {
    marginTop: "0.5rem",
    color: "var(--text)",
    fontSize: "1rem",
    lineHeight: 1.7,
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid var(--border)",
  },
  price: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--accent)",
  },
  region: {
    color: "var(--muted)",
    fontSize: "0.95rem",
  },
  buttonRow: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
  addButton: {
    flex: 1,
    padding: "0.85rem 1.5rem",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  contactButton: {
    flex: 1,
    padding: "0.85rem 1.5rem",
    background: "transparent",
    color: "var(--accent)",
    border: "2px solid var(--accent)",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  cartHint: {
    fontSize: "0.85rem",
    color: "var(--muted)",
    marginTop: "0.25rem",
  },
};
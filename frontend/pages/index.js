import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import { useEffect, useState, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { totalItemsAtom, userAtom, cartAtom, addToCartAtom, loadCartAtom } from "../atoms/cartAtom";
import { resolveImageSrc } from "../utils/image";

export async function getServerSideProps() {
 try{
  const res = await fetch("http://localhost:8000/api/artworks");
  const artworks = await res.json();
  return { props: { artworks } };
 } catch (error){
  console.error("Failed to fetch artwork:", error);
  return {props: {artworks: []}};
 }
 
}

export default function Home({ artworks }) {
  const [user, setUser] = useAtom(userAtom);
  const [cart, setCart] = useAtom(cartAtom);
  const [, addToCart] = useAtom(addToCartAtom);
  const [, loadCart] = useAtom(loadCartAtom);
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useAtomValue(totalItemsAtom);
  const menuRef = useRef();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(storedUser);
      loadCart();
    }
  }, [setUser, loadCart]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
    setUser(null);
    setCart([]);
    window.location.reload();
  }

  return (
    <>
      <Head>
        <title>Handmade Art Marketplace</title>
        <meta
          name="description"
          content="Buy and sell handmade artwork in your region"
        />
      </Head>

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.logo}>
            🎨 <span style={{ color: "var(--accent)" }}>Local Art Market</span>
          </h1>

          <div style={styles.searchContainer}>
            <SearchBar />
          </div>

          <div style={styles.headerActions}>
            <Link href="/cart" style={styles.cartButton}>
              Cart 🛒
              {totalItems > 0 && (
                <span style={styles.cartBadge}>{totalItems}</span>
              )}
            </Link>

            <div style={styles.profileContainer} ref={menuRef}>
              <div
                style={styles.profileIcon}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {user ? user[0].toUpperCase() : "👤"}
              </div>

              {menuOpen && (
                <div style={styles.dropdown}>
                  {user ? (
                    <>
                      <Link href="/profile" style={styles.dropdownItem}>Profile</Link>
                      <Link href="/my-listings" style={styles.dropdownItem}>My Listings</Link>
                      <Link href="/purchases" style={styles.dropdownItem}>My Purchases</Link>
                      <div style={styles.dropdownItem} onClick={handleLogout}>Logout</div>
                    </>
                  ) : (
                    <>
                      <Link href="/login" style={styles.dropdownItem}>Login</Link>
                      <Link href="/signup" style={styles.dropdownItem}>Sign Up</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <p style={styles.tagline}>
          Discover handmade art from artists in your region
        </p>
      </header>

      <main style={styles.main}>
        <h2 style={styles.sectionTitle}>Featured Pieces</h2>
        <div style={styles.grid}>
          {artworks.map((art) => (
            <Link
              href={`/artwork/${art.id}`}
              key={art.id}
              style={styles.cardLink}
            >
              <div style={styles.card}>
                <div style={styles.imageWrap}>
                  <Image
                    src={resolveImageSrc(art.image)}
                    alt={art.title}
                    width={400}
                    height={300}
                    style={styles.image}
                  />
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{art.title}</h3>
                  <p style={styles.cardArtist}>by {art.artist}</p>
                  <div style={styles.cardFooter}>
                    <span style={styles.price}>
                      ${art.price.toFixed(2)}
                    </span>
                    <span style={styles.region}>📍 {art.region}</span>
                  </div>
                  {(art.stock ?? 0) <= 0 && (
                    <p style={{
                      marginTop: "0.5rem",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#e53935",
                    }}>
                      Out of stock
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

const styles = {
  header: {
    textAlign: "center",
    padding: "3rem 1rem 1.5rem",
    borderBottom: "1px solid var(--border)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1100px",
    margin: "0 auto 1rem auto",
    gap:"1.5rem"
  },
  logo: {
    fontSize: "2.5rem",
    fontWeight: 700,
    whiteSpace:"nowrap",
  },
  searchContainer: {
    flex: 1,
    maxWidth: "400px",
  },
  tagline: {
    color: "var(--muted)",
    marginTop: "0.5rem",
    fontSize: "1.1rem",
  },
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    marginBottom: "1.5rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
  },
  card: {
    background: "var(--card-bg)",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid var(--border)",
    transition: "box-shadow 0.2s, transform 0.2s",
    cursor: "pointer",
  },
  imageWrap: {
    width: "100%",
    height: "220px",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardBody: {
    padding: "1rem",
  },
  cardTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
  },
  cardArtist: {
    color: "var(--muted)",
    fontSize: "0.9rem",
    marginTop: "0.25rem",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.75rem",
  },
  price: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "var(--accent)",
  },
  region: {
    fontSize: "0.85rem",
    color: "var(--muted)",
  },
  footer: {
    textAlign: "center",
    padding: "2rem 1rem",
    color: "var(--muted)",
    borderTop: "1px solid var(--border)",
    marginTop: "2rem",
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
    whiteSpace:"nowrap"
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
    transition: "background 0.2s",
  },
};
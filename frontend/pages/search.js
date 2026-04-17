import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAtom, useAtomValue } from "jotai";
import { totalItemsAtom, userAtom, cartAtom, loadCartAtom } from "../atoms/cartAtom";
import SearchBar from "../components/SearchBar";
import { resolveImageSrc } from "../utils/image";

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [user, setUser] = useAtom(userAtom);
  const [cart, setCart] = useAtom(cartAtom);
  const [, loadCart] = useAtom(loadCartAtom);
  const totalItems = useAtomValue(totalItemsAtom);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allArtworks, setAllArtworks] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(storedUser);
      loadCart();
    }
  }, [setUser, loadCart]);

  useEffect(() => {
    fetch("http://localhost:8000/api/artworks")
      .then((res) => res.json())
      .then((data) => setAllArtworks(data))
      .catch((err) => console.error("Failed to fetch artworks:", err));
  }, []);

  useEffect(() => {
    if (q && allArtworks.length > 0) {
      setLoading(true);
      const lowercaseQuery = q.toLowerCase();
      const results = allArtworks.filter((artwork) => {
        return (
          artwork.title.toLowerCase().includes(lowercaseQuery) ||
          artwork.artist.toLowerCase().includes(lowercaseQuery) ||
          artwork.description.toLowerCase().includes(lowercaseQuery) ||
          artwork.medium.toLowerCase().includes(lowercaseQuery) ||
          artwork.region.toLowerCase().includes(lowercaseQuery)
        );
      });
      setSearchResults(results);
      setLoading(false);
    } else if (q === "" && allArtworks.length > 0) {
      setSearchResults(allArtworks);
      setLoading(false);
    }
  }, [q, allArtworks]);

  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
    setCart([]);
    window.location.href = "/";
  }

  return (
    <>
      <Head>
        <title>
          {q ? `Search results for "${q}"` : "Search"} | Local Art Market
        </title>
      </Head>

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <Link href="/" style={styles.logoLink}>
            <h1 style={styles.logo}>
              🎨 <span style={{ color: "var(--accent)" }}>Local Art Market</span>
            </h1>
          </Link>

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

            <div style={styles.profileContainer}>
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
                      <Link href="/profile" style={styles.dropdownItem}>
                        Profile
                      </Link>
                      <Link href="/my-listings" style={styles.dropdownItem}>
                        My Listings
                      </Link>
                      <Link href="/purchases" style={styles.dropdownItem}>
                        My Purchases
                      </Link>
                      <div style={styles.dropdownItem} onClick={handleLogout}>
                        Logout
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/login" style={styles.dropdownItem}>
                        Login
                      </Link>
                      <Link href="/signup" style={styles.dropdownItem}>
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.resultsHeader}>
          <h2 style={styles.pageTitle}>
            {q ? `Search results for "${q}"` : "Search"}
          </h2>
          {!loading && (
            <p style={styles.resultCount}>
              Found {searchResults.length} result
              {searchResults.length !== 1 && "s"}
            </p>
          )}
        </div>

        {loading ? (
          <div style={styles.loadingState}>
            <p>Searching...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div style={styles.noResults}>
            <div style={styles.noResultsIcon}>🔍</div>
            <h3 style={styles.noResultsTitle}>No results found</h3>
            <p style={styles.noResultsText}>
              We couldn't find any artwork matching "{q}"
            </p>
            <div style={styles.suggestions}>
              <p style={styles.suggestionsTitle}>Try:</p>
              <ul style={styles.suggestionsList}>
                <li>Checking your spelling</li>
                <li>Using a different keyword</li>
                <li>Searching by artist name, medium, or region</li>
              </ul>
            </div>
            <Link href="/" style={styles.browseLink}>
              Browse all artwork →
            </Link>
          </div>
        ) : (
          <div style={styles.grid}>
            {searchResults.map((art) => (
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
                    <p style={styles.cardMedium}>{art.medium}</p>
                    <div style={styles.cardFooter}>
                      <span style={styles.price}>${art.price.toFixed(2)}</span>
                      <span style={styles.region}>📍 {art.region}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
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
    gap: "1.5rem",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
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
    whiteSpace: "nowrap",
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
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  resultsHeader: {
    marginBottom: "2rem",
  },
  pageTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  resultCount: {
    color: "var(--muted)",
    fontSize: "0.9rem",
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
  cardMedium: {
    fontSize: "0.8rem",
    color: "var(--accent)",
    marginTop: "0.5rem",
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
  loadingState: {
    textAlign: "center",
    padding: "3rem",
    color: "var(--muted)",
  },
  noResults: {
    textAlign: "center",
    padding: "3rem",
  },
  noResultsIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  noResultsTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  noResultsText: {
    color: "var(--muted)",
    marginBottom: "1.5rem",
  },
  suggestions: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
    maxWidth: "400px",
    margin: "1.5rem auto",
    textAlign: "left",
  },
  suggestionsTitle: {
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  suggestionsList: {
    marginLeft: "1.5rem",
    color: "var(--muted)",
  },
  browseLink: {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    background: "var(--accent)",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
  },
};
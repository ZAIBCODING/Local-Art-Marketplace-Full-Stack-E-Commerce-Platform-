import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { resolveImageSrc } from "../utils/image";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allArtworks, setAllArtworks] = useState([]);
  const searchRef = useRef(null);

  // Fetch all artworks on mount for client-side searching
  useEffect(() => {
    fetch("http://localhost:8000/api/artworks")
      .then((res) => res.json())
      .then((data) => setAllArtworks(data))
      .catch((err) => console.error("Failed to fetch artworks:", err));
  }, []);

  // Handle click outside to close results
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search function
  const performSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = allArtworks.filter((artwork) => {
      return (
        artwork.title.toLowerCase().includes(lowercaseQuery) ||
        artwork.artist.toLowerCase().includes(lowercaseQuery) ||
        artwork.description.toLowerCase().includes(lowercaseQuery) ||
        artwork.medium.toLowerCase().includes(lowercaseQuery) ||
        artwork.region.toLowerCase().includes(lowercaseQuery)
      );
    });

    setResults(filtered);
    setLoading(false);
    setShowResults(true);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, allArtworks]);

  return (
    <div ref={searchRef} style={styles.container}>
      <div style={styles.searchWrapper}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search by title, artist, medium, or region..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && results.length > 0 && setShowResults(true)}
          style={styles.input}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowResults(false);
            }}
            style={styles.clearButton}
          >
            ✕
          </button>
        )}
      </div>

      {showResults && (
        <div style={styles.resultsDropdown}>
          {loading ? (
            <div style={styles.loadingState}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={styles.noResults}>
              <p>No results found for "{query}"</p>
              <p style={styles.noResultsHint}>
                Try searching by artwork title, artist name, medium, or region
              </p>
            </div>
          ) : (
            <>
              <div style={styles.resultsHeader}>
                Found {results.length} result{results.length !== 1 && "s"}
              </div>
              {results.slice(0, 8).map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artwork/${artwork.id}`}
                  onClick={() => {
                    setShowResults(false);
                    setQuery("");
                  }}
                  style={styles.resultItem}
                >
                  <div style={styles.resultImage}>
                    <Image
                      src={resolveImageSrc(artwork.image)}
                      alt={artwork.title}
                      width={50}
                      height={50}
                      style={styles.thumbnail}
                    />
                  </div>
                  <div style={styles.resultInfo}>
                    <div style={styles.resultTitle}>{artwork.title}</div>
                    <div style={styles.resultArtist}>by {artwork.artist}</div>
                    <div style={styles.resultMeta}>
                      <span>{artwork.medium}</span>
                      <span>•</span>
                      <span>📍 {artwork.region}</span>
                    </div>
                  </div>
                  <div style={styles.resultPrice}>
                    ${artwork.price.toFixed(2)}
                  </div>
                </Link>
              ))}
              {results.length > 8 && (
                <div style={styles.viewAll}>
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={() => setShowResults(false)}
                  >
                    View all {results.length} results →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    flex: 1,
    maxWidth: "400px",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    fontSize: "14px",
    color: "var(--muted)",
  },
  input: {
    width: "100%",
    padding: "0.6rem 0.6rem 0.6rem 2.2rem",
    borderRadius: "40px",
    border: "1px solid var(--border)",
    background: "var(--card-bg)",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  clearButton: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  resultsDropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    maxHeight: "480px",
    overflowY: "auto",
    zIndex: 1000,
  },
  resultsHeader: {
    padding: "0.75rem 1rem",
    fontSize: "0.75rem",
    color: "var(--muted)",
    borderBottom: "1px solid var(--border)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
    cursor: "pointer",
    textDecoration: "none",
    color: "inherit",
    transition: "background 0.2s",
  },
  resultImage: {
    flexShrink: 0,
  },
  thumbnail: {
    borderRadius: "6px",
    objectFit: "cover",
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontWeight: 600,
    fontSize: "0.9rem",
    marginBottom: "2px",
  },
  resultArtist: {
    fontSize: "0.8rem",
    color: "var(--muted)",
    marginBottom: "4px",
  },
  resultMeta: {
    fontSize: "0.7rem",
    color: "var(--muted)",
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  resultPrice: {
    fontWeight: 700,
    fontSize: "0.9rem",
    color: "var(--accent)",
    flexShrink: 0,
  },
  loadingState: {
    padding: "2rem",
    textAlign: "center",
    color: "var(--muted)",
  },
  noResults: {
    padding: "2rem",
    textAlign: "center",
  },
  noResultsHint: {
    fontSize: "0.8rem",
    color: "var(--muted)",
    marginTop: "0.5rem",
  },
  viewAll: {
    padding: "0.75rem 1rem",
    textAlign: "center",
    borderTop: "1px solid var(--border)",
    background: "var(--bg)",
  },
};
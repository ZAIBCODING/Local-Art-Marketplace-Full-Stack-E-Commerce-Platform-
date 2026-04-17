import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { totalItemsAtom, userAtom, cartAtom } from "../atoms/cartAtom";
import SearchBar from "../components/SearchBar";

export default function Profile() {
  const [user, setUser] = useAtom(userAtom);
  const [, setCart] = useAtom(cartAtom);
  const totalItems = useAtomValue(totalItemsAtom);

  function handleLogout() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
    setUser(null);
    setCart([]);
    window.location.reload();
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const [form, setForm] = useState({
    name: "",
    email: "",
    street: "",
    unit: "",
    city: "",
    province: "",
    country: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(storedUser);

      fetch(`http://localhost:8000/api/profile/${storedUser}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setForm(data);
          else setForm((prev) => ({ ...prev, email: storedUser }));
        });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      console.log("Saving profile:", form);
      const res = await fetch("http://localhost:8000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json();
        setMessage("Failed to save profile: " + error.detail);
        return;
      }

      setMessage("Profile saved successfully");
    } catch (err) {
      console.error(err);
      setMessage("An error occurred while saving");
    }
  }

  if (!user) return <p style={{ padding: "2rem" }}>Please log in first.</p>;

  return (
    <>
      <Head>
        <title>Profile | Local Art Market</title>
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
              Cart🛒
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
                  <a href="/profile" style={styles.dropdownItem}>
                    Profile
                  </a>
                  <div style={styles.dropdownItem} onClick={handleLogout}>
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <a href="/" style={styles.back}>
            ← Back to Home
          </a>
          <h1 style={styles.title}>Your Profile</h1>

          <form onSubmit={handleSave} style={styles.form}>
            {["name", "email", "street", "unit", "city", "province", "country"].map(
              (field) => (
                <div key={field}>
                  <label style={styles.label}>
                    {field === "name"
                      ? "Full Name"
                      : field === "email"
                      ? "Email"
                      : field === "street"
                      ? "Street Address"
                      : field === "unit"
                      ? "Unit / Apartment"
                      : field === "city"
                      ? "City"
                      : field === "province"
                      ? "Province / State"
                      : "Country"}
                  </label>
                  <input
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    style={
                      field === "email"
                        ? { ...styles.input, background: "#f5f5f5" }
                        : styles.input
                    }
                    disabled={field === "email"}
                  />
                </div>
              )
            )}

            <button type="submit" style={styles.button}>
              Save Profile
            </button>
          </form>

          {message && <p style={styles.success}>{message}</p>}
        </div>
      </main>
    </>
  );
}

const styles = {
  header: {
    textAlign: "center",
    padding: "1.5rem",
    borderBottom: "1px solid var(--border)",
  },
  logo: {
    fontSize: "2rem",
    fontWeight: 700,
  },
  searchContainer: {
  flex: 1,
  maxWidth: "400px",
  },
  headerTop: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: "1100px",
  margin: "0 auto",
  gap: "1.5rem",
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
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "2rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: "1.6rem",
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
  },
  button: {
    marginTop: "1rem",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    background: "var(--accent)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  success: {
    marginTop: "1rem",
    color: "green",
    fontSize: "0.9rem",
  },
  back: {
    display: "inline-block",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    color: "var(--accent)",
    textDecoration: "none",
  },
};
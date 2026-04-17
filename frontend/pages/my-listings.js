import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { totalItemsAtom } from "../atoms/cartAtom";
import SearchBar from "../components/SearchBar";
import { resolveImageSrc } from "../utils/image";

export default function MyListings() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const totalItems = useAtomValue(totalItemsAtom);
  const [menuOpen, setMenuOpen] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    medium: "",
    description: "",
    region: "",
    image: "",
    stock: "",
  });

  const [createForm, setCreateForm] = useState({
    title: "",
    price: "",
    medium: "",
    description: "",
    region: "",
    image: "",
    stock: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(storedUser);
      fetchMyListings(storedUser);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMyListings(email) {
    try {
      const res = await fetch(`http://localhost:8000/api/my-artworks/${email}`);
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  // Create new listing
  async function handleCreate(e) {
    e.preventDefault();
    setIsError(false);
    setMessage("");

    // Validation
    if (!createForm.title || !createForm.price || !createForm.medium ||
        !createForm.description || !createForm.region || !createForm.image ||
        createForm.stock === "") {
      setIsError(true);
      setMessage("All fields are required");
      return;
    }

    if (createForm.price <= 0) {
      setIsError(true);
      setMessage("Price must be greater than 0");
      return;
    }

    const stockInt = parseInt(createForm.stock, 10);
    if (Number.isNaN(stockInt) || stockInt < 0) {
      setIsError(true);
      setMessage("Stock must be a non-negative whole number");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          price: parseFloat(createForm.price),
          stock: stockInt,
          artist: user,
          email: user,
        }),
      });

      if (res.ok) {
        const newArtwork = await res.json();
        setListings([newArtwork, ...listings]);
        setCreateForm({
          title: "",
          price: "",
          medium: "",
          description: "",
          region: "",
          image: "",
          stock: "",
        });
        setShowCreateForm(false);
        setIsError(false);
        setMessage("✓ Listing created successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const error = await res.json();
        setIsError(true);
        setMessage(error.detail || "Failed to create listing");
      }
    } catch (err) {
      setIsError(true);
      setMessage("An error occurred");
    }
  }

  // Update listing
  async function handleUpdate(id) {
    try {
      const updateData = {};
      const current = listings.find(l => l.id === id);
      if (editForm.title && editForm.title !== current?.title) updateData.title = editForm.title;
      if (editForm.price && parseFloat(editForm.price) !== current?.price) updateData.price = parseFloat(editForm.price);
      if (editForm.medium && editForm.medium !== current?.medium) updateData.medium = editForm.medium;
      if (editForm.description && editForm.description !== current?.description) updateData.description = editForm.description;
      if (editForm.region && editForm.region !== current?.region) updateData.region = editForm.region;
      if (editForm.image && editForm.image !== current?.image) updateData.image = editForm.image;
      if (editForm.stock !== "" && parseInt(editForm.stock, 10) !== current?.stock) {
        const stockInt = parseInt(editForm.stock, 10);
        if (Number.isNaN(stockInt) || stockInt < 0) {
          setIsError(true);
          setMessage("Stock must be a non-negative whole number");
          return;
        }
        updateData.stock = stockInt;
      }

      if (Object.keys(updateData).length === 0) {
        setEditingId(null);
        return;
      }

      const res = await fetch(`http://localhost:8000/api/artworks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const updated = await res.json();
        setListings(listings.map(l => l.id === id ? updated : l));
        setEditingId(null);
        setEditForm({
          title: "",
          price: "",
          medium: "",
          description: "",
          region: "",
          image: "",
          stock: "",
        });
        setIsError(false);
        setMessage("✓ Listing updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setIsError(true);
        setMessage("Failed to update listing");
      }
    } catch (err) {
      setIsError(true);
      setMessage("An error occurred");
    }
  }

  // Delete listing
  async function handleDelete(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/artworks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setListings(listings.filter(l => l.id !== id));
        setIsError(false);
        setMessage("✓ Listing deleted successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setIsError(true);
        setMessage("Failed to delete listing");
      }
    } catch (err) {
      setIsError(true);
      setMessage("An error occurred");
    }
  }

  function startEdit(listing) {
    setEditingId(listing.id);
    setEditForm({
      title: listing.title,
      price: listing.price,
      medium: listing.medium,
      description: listing.description,
      region: listing.region,
      image: listing.image,
      stock: listing.stock ?? 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({
      title: "",
      price: "",
      medium: "",
      description: "",
      region: "",
      image: "",
      stock: "",
    });
  }

  if (!user && !loading) {
    return (
      <main style={styles.centered}>
        <div style={styles.messageCard}>
          <p>Please log in to manage your listings.</p>
          <Link href="/login" style={styles.loginButton}>Go to Login</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>My Listings | Local Art Market</title>
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
        <div style={styles.headerBar}>
          <h2 style={styles.pageTitle}>My Artwork Listings</h2>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            style={styles.createButton}
          >
            {showCreateForm ? "Cancel" : "+ Create New Listing"}
          </button>
        </div>

        {message && (
          <div style={isError ? styles.errorMessage : styles.successMessage}>
            {message}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Create New Artwork Listing</h3>
            <form onSubmit={handleCreate} style={styles.form}>
              <input
                type="text"
                placeholder="Title *"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                style={styles.input}
                required
              />
              <input
                type="number"
                placeholder="Price ($) *"
                value={createForm.price}
                onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                style={styles.input}
                required
                step="0.01"
              />
              <input
                type="text"
                placeholder="Medium (e.g., Oil on Canvas) *"
                value={createForm.medium}
                onChange={(e) => setCreateForm({ ...createForm, medium: e.target.value })}
                style={styles.input}
                required
              />
              <textarea
                placeholder="Description *"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                style={styles.textarea}
                required
                rows="3"
              />
              <input
                type="text"
                placeholder="Region *"
                value={createForm.region}
                onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })}
                style={styles.input}
                required
              />
              <input
                type="url"
                placeholder="Image URL *"
                value={createForm.image}
                onChange={(e) => setCreateForm({ ...createForm, image: e.target.value })}
                style={styles.input}
                required
              />
              <input
                type="number"
                placeholder="Stock (units available) *"
                value={createForm.stock}
                onChange={(e) => setCreateForm({ ...createForm, stock: e.target.value })}
                style={styles.input}
                required
                min="0"
                step="1"
              />
              <button type="submit" style={styles.submitButton}>Create Listing</button>
            </form>
          </div>
        )}

        {/* Listings */}
        {loading ? (
          <p style={styles.loadingText}>Loading your listings...</p>
        ) : listings.length === 0 ? (
          <div style={styles.emptyState}>
            <p>You haven't created any listings yet.</p>
            <button onClick={() => setShowCreateForm(true)} style={styles.createButton}>
              Create Your First Listing
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {listings.map((listing) => (
              <div key={listing.id} style={styles.card}>
                <div style={styles.imageWrap}>
                  <Image
                    src={resolveImageSrc(listing.image)}
                    alt={listing.title}
                    width={400}
                    height={250}
                    style={styles.image}
                  />
                </div>
                <div style={styles.cardBody}>
                  {editingId === listing.id ? (
                    // Edit Mode
                    <div>
                      <input
                        type="text"
                        placeholder="Title"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        style={styles.editInput}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        style={styles.editInput}
                        step="0.01"
                      />
                      <input
                        type="text"
                        placeholder="Medium"
                        value={editForm.medium}
                        onChange={(e) => setEditForm({ ...editForm, medium: e.target.value })}
                        style={styles.editInput}
                      />
                      <textarea
                        placeholder="Description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        style={styles.editTextarea}
                        rows="2"
                      />
                      <input
                        type="text"
                        placeholder="Region"
                        value={editForm.region}
                        onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                        style={styles.editInput}
                      />
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={editForm.image}
                        onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                        style={styles.editInput}
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={editForm.stock}
                        onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                        style={styles.editInput}
                        min="0"
                        step="1"
                      />
                      <div style={styles.editButtons}>
                        <button onClick={() => handleUpdate(listing.id)} style={styles.saveButton}>
                          Save
                        </button>
                        <button onClick={cancelEdit} style={styles.cancelButton}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <h3 style={styles.cardTitle}>{listing.title}</h3>
                      <p style={styles.cardMedium}>{listing.medium}</p>
                      <p style={styles.cardDescription}>{listing.description}</p>
                      <div style={styles.cardFooter}>
                        <span style={styles.price}>${listing.price.toFixed(2)}</span>
                        <span style={styles.region}>📍 {listing.region}</span>
                      </div>
                      <p style={{
                        marginTop: "0.5rem",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: (listing.stock ?? 0) === 0 ? "#e53935" : "#6b7280",
                      }}>
                        {(listing.stock ?? 0) === 0
                          ? "Out of stock"
                          : `Stock: ${listing.stock}`}
                      </p>
                      <div style={styles.cardActions}>
                        <button onClick={() => startEdit(listing)} style={styles.editButton}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(listing.id, listing.title)} style={styles.deleteButton}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
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

  logo: {
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  logoLink: {
    textDecoration: "none",
    color: "inherit",
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
    transition: "background 0.2s",
  },
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  pageTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
  },
  createButton: {
    padding: "0.75rem 1.5rem",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  formCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  formTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    marginBottom: "1rem",
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
  textarea: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    resize: "vertical",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "var(--card-bg)",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid var(--border)",
    transition: "box-shadow 0.2s",
  },
  imageWrap: {
    width: "100%",
    height: "250px",
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
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  cardMedium: {
    fontSize: "0.85rem",
    color: "var(--accent)",
    marginBottom: "0.5rem",
  },
  cardDescription: {
    fontSize: "0.9rem",
    color: "var(--muted)",
    marginBottom: "1rem",
    lineHeight: 1.5,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
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
  cardActions: {
    display: "flex",
    gap: "0.75rem",
    borderTop: "1px solid var(--border)",
    paddingTop: "0.75rem",
  },
  editButton: {
    flex: 1,
    padding: "0.5rem",
    background: "none",
    border: "1px solid var(--accent)",
    borderRadius: "6px",
    color: "var(--accent)",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  deleteButton: {
    flex: 1,
    padding: "0.5rem",
    background: "none",
    border: "1px solid #e53935",
    borderRadius: "6px",
    color: "#e53935",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  editInput: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "0.5rem",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    fontSize: "0.9rem",
  },
  editTextarea: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "0.5rem",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  editButtons: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  saveButton: {
    flex: 1,
    padding: "0.5rem",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    padding: "0.5rem",
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    background: "var(--card-bg)",
    borderRadius: "12px",
    border: "1px solid var(--border)",
  },
  centered: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  messageCard: {
    textAlign: "center",
    padding: "2rem",
  },
  loginButton: {
    display: "inline-block",
    marginTop: "1rem",
    padding: "0.75rem 1.5rem",
    background: "var(--accent)",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
  },
  successMessage: {
    padding: "0.75rem",
    marginBottom: "1rem",
    background: "#e8f5e9",
    color: "#2e7d32",
    borderRadius: "8px",
    textAlign: "center",
  },
  errorMessage: {
    padding: "0.75rem",
    marginBottom: "1rem",
    background: "#ffebee",
    color: "#c62828",
    borderRadius: "8px",
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    padding: "2rem",
    color: "var(--muted)",
  },
};
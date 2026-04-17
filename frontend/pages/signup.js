import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();

    if (!name || !email || !password) {
      setIsError(true);
      setMessage("All fields are required");
      return;
    }
    if (!email.includes("@")) {
      setIsError(true);
      setMessage("Please enter a valid email");
      return;
    }
    if (password.length < 4) {
      setIsError(true);
      setMessage("Password must be at least 4 characters");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsError(false);
        setMessage("Account created! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      } else {
        setIsError(true);
        setMessage(data.detail || "Signup failed");
      }
    } catch (err) {
      setIsError(true);
      setMessage("An error occurred. Please try again.");
    }
  }

  return (
    <>
      <Head><title>Sign Up | Local Art Market</title></Head>
      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Sign up to start buying and selling artwork</p>
          <form onSubmit={handleSignup} style={styles.form}>
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
            <button type="submit" style={styles.button}>Sign Up</button>
          </form>
          {message && <p style={{ ...styles.message, color: isError ? "#e53935" : "#8b5cf6" }}>{message}</p>}
          <p style={styles.footerText}>Already have an account? <Link href="/login" style={styles.link}>Login</Link></p>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: { minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" },
  card: { width: "100%", maxWidth: "400px", background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "2rem" },
  title: { fontSize: "1.75rem", fontWeight: 700 },
  subtitle: { fontSize: "0.95rem", color: "#6b7280", marginBottom: "1.5rem", marginTop: "0.5rem" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: { padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "0.95rem" },
  button: { marginTop: "0.5rem", padding: "0.75rem", borderRadius: "8px", border: "none", background: "#8b5cf6", color: "white", fontWeight: 600, cursor: "pointer" },
  footerText: { marginTop: "1.5rem", fontSize: "0.85rem", textAlign: "center", color: "#6b7280" },
  link: { color: "#8b5cf6", textDecoration: "none" },
  message: { marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" },
};
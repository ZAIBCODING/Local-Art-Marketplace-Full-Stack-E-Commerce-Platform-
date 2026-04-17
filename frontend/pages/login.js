import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useSetAtom } from "jotai";
import { userAtom } from "../atoms/cartAtom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const setUser = useSetAtom(userAtom);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email.includes("@")) {
      setIsError(true);
      setMessage("Please enter a valid email");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", email);
        setUser(email);
        setIsError(false);
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setIsError(true);
        setMessage(data.detail || "Login failed");
      }
    } catch (err) {
      setIsError(true);
      setMessage("An error occurred. Please try again.");
    }
  }

  return (
    <>
      <Head><title>Login | Local Art Market</title></Head>
      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>Login</h1>
          <p style={styles.subtitle}>Log in to manage your purchases and listings</p>
          <form onSubmit={handleLogin} style={styles.form}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
            <button type="submit" style={styles.button}>Login</button>
          </form>
          {message && <p style={{ ...styles.message, color: isError ? "#e53935" : "#8b5cf6" }}>{message}</p>}
          <p style={styles.footerText}>Don't have an account? <Link href="/signup" style={styles.link}>Sign up</Link></p>
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
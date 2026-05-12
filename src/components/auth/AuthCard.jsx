import { useState } from "react";
import { Dumbbell, UserRound } from "lucide-react";
import { hasFirebaseConfig, login } from "../../services/firebase";

export function AuthCard({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const user = await login(email, password, mode);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-lockup">
          <span className="brand-mark"><Dumbbell size={24} /></span>
          <div>
            <p>Primitive Programming</p>
            <h1>Training plans for lifters and coaches.</h1>
          </div>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">
            <UserRound size={18} />
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <button className="text-button" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
        {!hasFirebaseConfig && <p className="demo-note">Demo mode is active until Firebase env vars are added.</p>}
      </section>
    </main>
  );
}

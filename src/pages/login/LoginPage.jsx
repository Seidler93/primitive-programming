import React, { useState } from "react";
import { Dumbbell } from "lucide-react";
import { login } from "../../services/firebase";
import { CreateAccountCard } from "./CreateAccountCard";
import { LoginCard } from "./LoginCard";

export function LoginPage({ onAuthed }) {
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

  const cardProps = {
    email,
    error,
    onEmailChange: setEmail,
    onPasswordChange: setPassword,
    onSubmit: submit,
    onSwitchMode: () => {
      setError("");
      setMode(mode === "login" ? "signup" : "login");
    },
    password,
  };

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
        {mode === "login" ? <LoginCard {...cardProps} /> : <CreateAccountCard {...cardProps} />}
      </section>
    </main>
  );
}

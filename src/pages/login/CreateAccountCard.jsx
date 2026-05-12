import React from "react";
import { UserRound } from "lucide-react";

export function CreateAccountCard({ email, error, onEmailChange, onPasswordChange, onSubmit, onSwitchMode, password }) {
  return (
    <>
      <form onSubmit={onSubmit} className="auth-form">
        <label>
          Email
          <input value={email} onChange={(event) => onEmailChange(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => onPasswordChange(event.target.value)} type="password" minLength={6} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">
          <UserRound size={18} />
          Create account
        </button>
      </form>
      <button className="text-button" type="button" onClick={onSwitchMode}>
        Already have an account?
      </button>
    </>
  );
}

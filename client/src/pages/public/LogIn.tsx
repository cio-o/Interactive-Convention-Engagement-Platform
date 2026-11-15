import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LogIn() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("ATTENDEE");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { firstName, lastName, role } },
      });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage("Check your email to confirm, then log in.");
    }
  }

  return (
    <main>
      <h1>{mode === "login" ? "Log in" : "Sign up"}</h1>
      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="ATTENDEE">Attendee</option>
              <option value="EXHIBITOR">Exhibitor</option>
            </select>
          </>
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      {message && <p>{message}</p>}
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "Sign up" : "Log in"}
      </button>
    </main>
  );
}
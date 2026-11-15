import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { api } from "../../services/api";

export default function BrowseEvents() {
  const [me, setMe] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setMe(await api("/me"));
      setEvents(await api("/events"));
      setMine(await api("/registrations/mine"));
    } catch (e: any) {
      setMessage(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function register(id: string) {
    setMessage("");
    try {
      await api(`/events/${id}/register`, { method: "POST" });
      await load();
    } catch (e: any) { setMessage(e.message); }
  }

  async function cancel(id: string) {
    setMessage("");
    try {
      await api(`/events/${id}/register`, { method: "DELETE" });
      await load();
    } catch (e: any) { setMessage(e.message); }
  }

  return (
    <main>
      <p>
        Logged in as {me?.email} ({me?.role}){" "}
        <button onClick={() => supabase.auth.signOut()}>Log out</button>
      </p>
      {message && <p>{message}</p>}

      <h2>Events</h2>
      {events.map((ev) => (
        <div key={ev.id}>
          <b>{ev.name}</b> - {ev.venue} - {new Date(ev.startDate).toLocaleString()}
          {me?.role === "ATTENDEE" && <button onClick={() => register(ev.id)}>Register</button>}
        </div>
      ))}

      <h2>My registrations</h2>
      {mine.map((r) => (
        <div key={r.id}>
          {r.event.name} - {r.status} <button onClick={() => cancel(r.eventId)}>Cancel</button>
        </div>
      ))}
    </main>
  );
}
"use client";

import { useActionState, useState } from "react";
import { createAvailabilityOverride } from "@/app/actions";

export function AvailabilityOverrideForm({ profileId, today }: { profileId: string; today: string }) {
  const [state, action, pending] = useActionState(createAvailabilityOverride, { message: "", success: false });
  const [startsAt, setStartsAt] = useState(today);
  const [endsAt, setEndsAt] = useState(today);
  return <form action={action} className="form">
    <input type="hidden" name="profileId" value={profileId} />
    <label>Status <select name="isAvailable" defaultValue="false"><option value="false">Unavailable</option><option value="true">Available</option></select></label>
    <label>Starts <input name="startsAt" type="date" value={startsAt} onChange={(event) => {
      const value = event.target.value;
      setStartsAt(value);
      if (value > endsAt) setEndsAt(value);
    }} required /></label>
    <label>Ends <input name="endsAt" type="date" value={endsAt} min={startsAt} onChange={(event) => setEndsAt(event.target.value)} required /></label>
    <label>Note <input name="reason" maxLength={300} /></label>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
    <button type="submit" disabled={pending}>{pending ? "Adding…" : "Add override"}</button>
  </form>;
}

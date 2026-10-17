"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { applyHubActions, EMPTY_HUB, sanitizeHub, type Hub, type HubAction } from "@/lib/companion/hub";

// The hub lives in the browser (works without a database) and is synced to the server, which keeps
// it across devices once Redis is connected. The newest copy wins.
const KEY = "pro_hub";
const EVENT = "pro-hub-change";

export function readHub(): Hub {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitizeHub(JSON.parse(raw)) : EMPTY_HUB;
  } catch {
    return EMPTY_HUB;
  }
}

function writeLocal(hub: Hub) {
  try {
    localStorage.setItem(KEY, JSON.stringify(hub));
  } catch {
    // storage full or blocked
  }
  window.dispatchEvent(new Event(EVENT));
}

let syncTimer: ReturnType<typeof setTimeout> | undefined;
function pushToServer(hub: Hub) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fetch("/api/hub", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hub }) }).catch(() => {});
  }, 600);
}

export function saveHub(hub: Hub) {
  const next = { ...hub, updatedAt: new Date().toISOString() };
  writeLocal(next);
  pushToServer(next);
  return next;
}

/** Applies expert actions (tasks, memories) from a reply to the hub. */
export function applyActionsToHub(actions: HubAction[], by?: string) {
  if (!actions.length) return;
  saveHub(applyHubActions(readHub(), actions, by));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const snapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
const serverSnapshot = () => "";

export function useHub() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const hub = useMemo(() => {
    try {
      return raw ? sanitizeHub(JSON.parse(raw)) : EMPTY_HUB;
    } catch {
      return EMPTY_HUB;
    }
  }, [raw]);

  useEffect(() => {
    // Pull the server copy once; keep whichever is newer.
    fetch("/api/hub")
      .then((r) => r.json())
      .then((d: { hub?: Hub }) => {
        const server = d.hub ? sanitizeHub(d.hub) : EMPTY_HUB;
        const local = readHub();
        if (server.updatedAt > local.updatedAt) writeLocal(server);
        else if (local.updatedAt > server.updatedAt) pushToServer(local);
      })
      .catch(() => {});
  }, []);

  const update = useCallback((fn: (h: Hub) => Hub) => saveHub(fn(readHub())), []);
  return { hub, update };
}

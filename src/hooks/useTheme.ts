"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { ThemeName } from "@/lib/types";

const KEY = "fly-verdict-theme";
const listeners = new Set<() => void>();
let current: ThemeName = "dark";

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ThemeName {
  return current;
}

function getServerSnapshot(): ThemeName {
  return "dark";
}

function readStored(): ThemeName {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  } catch {
    // Storage can be blocked (private mode, disabled site data).
    return current;
  }
}

if (typeof window !== "undefined") {
  current = readStored();
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    current = readStored();
    emit();
  });
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    current = current === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(KEY, current);
    } catch {}
    document.documentElement.dataset.theme = current;
    emit();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return { theme, toggle, isLight: theme === "light" };
}

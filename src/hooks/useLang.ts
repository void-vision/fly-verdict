"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { COPY } from "@/lib/copy";
import type { Lang } from "@/lib/types";

const KEY = "fly-verdict-lang";
const listeners = new Set<() => void>();
let current: Lang = "zh";

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Lang {
  return current;
}

function getServerSnapshot(): Lang {
  return "zh";
}

function readStored(): Lang {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === "zh" || stored === "en" ? stored : "zh";
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

export function useLang() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    current = current === "zh" ? "en" : "zh";
    try {
      window.localStorage.setItem(KEY, current);
    } catch {}
    emit();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  return { lang, toggle, t: COPY[lang] };
}

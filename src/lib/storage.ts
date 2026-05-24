import { get, set, createStore } from "idb-keyval";
import { useEffect, useState, useCallback } from "react";

const store = createStore("jee-scholar", "kv");

export async function loadKey<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await get(key, store);
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveKey<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value, store);
  } catch {
    /* noop */
  }
}

export function usePersisted<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadKey<T>(key, fallback).then((v) => {
      if (alive) {
        setValue(v);
        setReady(true);
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        saveKey(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, update, ready] as const;
}
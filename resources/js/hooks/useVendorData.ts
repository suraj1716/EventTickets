"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Vendor } from "@/types";

interface FooterCategory {
  id: number;
  name: string;
  slug: string;
}

type CacheEntry<T> = {
  data: T | null;
  promise: Promise<T> | null;
  timestamp: number;
};

// How long cached data is considered "fresh" before a background refetch.
// Vendor details / footer categories change rarely, so 5 min is safe.
const CACHE_TTL = 5 * 60 * 1000;

// Module-level cache. Persists for the life of the JS bundle (i.e. across
// client-side navigations), so any component using useCachedFetch with the
// same URL shares one in-flight request and one cached result.
const cache = new Map<string, CacheEntry<any>>();

function useCachedFetch<T>(url: string): T | null {
  const [data, setData] = useState<T | null>(() => {
    const entry = cache.get(url);
    if (entry?.data && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    return null;
  });

  useEffect(() => {
    let cancelled = false;
    const entry = cache.get(url);

    // 1. Fresh cache hit — serve immediately, no network call.
    if (entry?.data && Date.now() - entry.timestamp < CACHE_TTL) {
      if (!cancelled) setData(entry.data);
      return;
    }

    // 2. A request for this URL is already in flight (e.g. Header and
    //    Footer both mounted at once) — piggyback on it instead of
    //    firing a second request.
    if (entry?.promise) {
      entry.promise.then((res) => {
        if (!cancelled) setData(res);
      });
      return;
    }

    // 3. Nothing cached, nothing in flight — fetch and cache it.
    //    IMPORTANT: this promise must never reject. Other components may be
    //    piggybacking on it (see branch 2 above) via their own .then() with
    //    no .catch(), and a rejected shared promise would throw an
    //    "unhandled rejection" for every one of those listeners. So we
    //    catch the error right here and resolve to null instead.
    const promise = axios
      .get(url)
      .then((res) => res.data)
      .catch((err) => {
        console.error(`Failed to fetch ${url}`, err);
        return null;
      });

    cache.set(url, { data: null, promise, timestamp: Date.now() });

    promise.then((res) => {
      if (res !== null) {
        cache.set(url, { data: res, promise: null, timestamp: Date.now() });
      } else {
        cache.delete(url); // allow a retry on next mount instead of caching a failure
      }
      if (!cancelled) setData(res);
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return data;
}

export function useVendorDetails(): Vendor | null {
  const res = useCachedFetch<{ data: Vendor }>("/api/vendor-details");
  return res?.data ?? null;
}

export function useFooterServices(): FooterCategory[] {
  const res = useCachedFetch<FooterCategory[]>("/api/footer-services");
  return res ?? [];
}

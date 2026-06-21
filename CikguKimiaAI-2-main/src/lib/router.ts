import { useState, useEffect } from "react";

type RouteListener = (path: string) => void;
const listeners = new Set<RouteListener>();

let currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

export function navigate(path: string) {
  if (currentPath === path) return;
  currentPath = path;
  if (typeof window !== "undefined") {
    window.history.pushState({}, "", path);
  }
  listeners.forEach(listener => listener(path));
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    currentPath = window.location.pathname;
    listeners.forEach(listener => listener(currentPath));
  });
}

export function useRoute(): string {
  const [route, setRoute] = useState(currentPath);

  useEffect(() => {
    const handleLocationChange = (path: string) => {
      setRoute(path);
    };
    listeners.add(handleLocationChange);
    return () => {
      listeners.delete(handleLocationChange);
    };
  }, []);

  return route;
}

export function matchTopic(route: string): string | null {
  if (route.startsWith("/t/")) {
    return route.substring(3);
  }
  return null;
}

// A "workspace" is how we keep each visitor's data separate without accounts.
// The first time this browser uses the app we make up a random id, save it in
// localStorage, and send it with every API request (see lib/api.ts).

const STORAGE_KEY = "travel-wrapped-workspace";

// Used only if localStorage is blocked (e.g. some private-browsing modes).
// The id then lasts until the page is reloaded.
let fallbackId: string | null = null;

// Only letters, numbers, - and _ (the backend checks the same rule).
function isValidId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

function makeRandomId(): string {
  // crypto.randomUUID() gives something like "3b241101-e2bb-4255-8caf-4136c566a962".
  return crypto.randomUUID();
}

export function getWorkspaceId(): string {
  try {
    // A link like /dashboard?workspace=demo switches this browser to the
    // "demo" workspace. Handy for sharing a demo link.
    const fromUrl = new URLSearchParams(window.location.search).get("workspace");
    if (fromUrl && isValidId(fromUrl)) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isValidId(saved)) {
      return saved;
    }

    const newId = makeRandomId();
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch {
    // localStorage isn't available, so keep the id in memory instead.
    if (fallbackId === null) {
      fallbackId = makeRandomId();
    }
    return fallbackId;
  }
}

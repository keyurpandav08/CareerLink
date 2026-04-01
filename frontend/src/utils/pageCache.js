export const readCachedValue = (key, fallback = null) => {
  if (!key) return fallback;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return parsed?.value ?? fallback;
  } catch {
    return fallback;
  }
};

export const writeCachedValue = (key, value) => {
  if (!key || value === undefined) return;

  try {
    sessionStorage.setItem(key, JSON.stringify({
      savedAt: Date.now(),
      value
    }));
  } catch {
    // Ignore cache write failures when storage is unavailable.
  }
};

export const removeCachedValue = (key) => {
  if (!key) return;

  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore cache removal failures when storage is unavailable.
  }
};

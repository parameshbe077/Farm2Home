const HISTORY_KEY = 'farm2home_track_history';
const MAX_ORDERS = 10;

export function loadTrackHistory() {
  try {
    const list = JSON.parse(sessionStorage.getItem(HISTORY_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addTrackHistory(orderRef, phone) {
  const entry = {
    orderRef: orderRef.trim().toUpperCase(),
    phone: phone.trim(),
    savedAt: Date.now(),
  };

  if (!entry.orderRef || !entry.phone) return;

  const list = loadTrackHistory().filter(
    (item) => !(item.orderRef === entry.orderRef && item.phone === entry.phone),
  );

  list.unshift(entry);
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_ORDERS)));
}

export function getLatestTrack() {
  return loadTrackHistory()[0] || null;
}

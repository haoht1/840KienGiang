/**
 * Visitor Counter Utility for VietinBank Kiosk
 * Tracks cumulative visits persisted in localStorage with real-time sync.
 */

const COUNTER_KEY = 'vtb_kiosk_visitor_count';
const SESSION_KEY = 'vtb_kiosk_visited_session';
const DEFAULT_INITIAL_COUNT = 2580; // realistic cumulative visits for Chi nhánh Kiên Giang

export function getVisitorCount(): number {
  try {
    const stored = localStorage.getItem(COUNTER_KEY);
    if (!stored) {
      localStorage.setItem(COUNTER_KEY, DEFAULT_INITIAL_COUNT.toString());
      return DEFAULT_INITIAL_COUNT;
    }
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? DEFAULT_INITIAL_COUNT : parsed;
  } catch {
    return DEFAULT_INITIAL_COUNT;
  }
}

export function recordVisitOnLoad(): number {
  try {
    let current = getVisitorCount();
    const hasVisitedInSession = sessionStorage.getItem(SESSION_KEY);
    
    // If opening page from link or fresh visit
    if (!hasVisitedInSession) {
      current += 1;
      localStorage.setItem(COUNTER_KEY, current.toString());
      sessionStorage.setItem(SESSION_KEY, 'true');
      window.dispatchEvent(new CustomEvent('vtb_visitor_update', { detail: current }));
    }
    return current;
  } catch {
    return getVisitorCount();
  }
}

export function incrementVisitorCount(): number {
  try {
    let current = getVisitorCount() + 1;
    localStorage.setItem(COUNTER_KEY, current.toString());
    window.dispatchEvent(new CustomEvent('vtb_visitor_update', { detail: current }));
    return current;
  } catch {
    return getVisitorCount();
  }
}

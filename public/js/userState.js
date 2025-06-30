// userState.js
let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user;
  // Optional: Store in localStorage/sessionStorage for persistence
  sessionStorage.setItem(
    "currentUser",
    JSON.stringify({
      user,
      timestamp: Date.now(),
    }),
  );
}

export function getCurrentUser() {
  if (!currentUser) {
    const storedData = sessionStorage.getItem("currentUser");

    if (storedData) {
      const { user, timestamp } = JSON.parse(storedData);
      if (Date.now() - timestamp < 8 * 60 * 60 * 1000) {
        currentUser = user;
      } else {
        sessionStorage.removeItem("currentUser");
      }
    }
  }
  return currentUser;
}

export function clearCurrentUser() {
  currentUser = null;
  sessionStorage.removeItem("currentUser");
}

export function hasActiveSession() {
  return !!getCurrentUser();
}

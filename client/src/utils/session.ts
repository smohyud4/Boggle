export function saveSessionToStorage(playerId: string, roomId: string) {
  localStorage.setItem('player_id', playerId);
  localStorage.setItem('room_id', roomId);
  sessionStorage.setItem('owns_session', 'true');
}

export function getSessionFromStorage() {
  const ownsSession = sessionStorage.getItem('owns_session');
  if (!ownsSession) return null;

  const playerId = localStorage.getItem('player_id');
  const roomId = localStorage.getItem('room_id');
  if (!playerId || !roomId) return null;

  return { playerId, roomId };
}

export function clearSessionFromStorage() {
  localStorage.removeItem('player_id');
  localStorage.removeItem('room_id');
  sessionStorage.removeItem('owns_session');
}

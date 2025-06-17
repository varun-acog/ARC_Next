interface SessionData {
  referenceFile?: string;
  reviewFile?: string;
}

console.log('Initializing sessionStore module');

// Use a global variable to persist the session store across module reloads in development
const globalStore = globalThis as any;
if (!globalStore.__SESSION_STORE) {
  console.log('Creating new session store in globalThis.__SESSION_STORE');
  globalStore.__SESSION_STORE = {};
} else {
  console.log('Reusing existing session store from globalThis.__SESSION_STORE:', globalStore.__SESSION_STORE);
}
const sessionStore: Record<string, SessionData> = globalStore.__SESSION_STORE;

export function setSessionData(sessionId: string, data: Partial<SessionData>) {
  if (!sessionStore[sessionId]) {
    sessionStore[sessionId] = {};
  }
  sessionStore[sessionId] = { ...sessionStore[sessionId], ...data };
  console.log('Session Store Updated:', { sessionId, data: sessionStore[sessionId] });
  console.log('Current Session Store:', sessionStore);
}

export function getSessionData(sessionId: string): SessionData | undefined {
  const data = sessionStore[sessionId];
  console.log('Session Store Retrieved:', { sessionId, data });
  console.log('Current Session Store:', sessionStore);
  return data;
}

export function clearSessionData(sessionId: string) {
  console.log('Session Store Cleared:', { sessionId });
  delete sessionStore[sessionId];
  console.log('Current Session Store:', sessionStore);
}
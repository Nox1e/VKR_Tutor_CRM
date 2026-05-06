export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

type Listener = (state: AuthState) => void;

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
}

let state: AuthState = { user: null, accessToken: null };
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((l) => l(state));
};

export const authStore = {
  getState: () => state,
  getAccessToken: () => state.accessToken,
  getUser: () => state.user,
  isAuthenticated: () => state.accessToken !== null && state.user !== null,

  setAuth: (user: AuthUser, accessToken: string) => {
    state = { user, accessToken };
    emit();
  },

  clear: () => {
    state = { user: null, accessToken: null };
    emit();
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

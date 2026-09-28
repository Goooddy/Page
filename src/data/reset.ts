import { app } from './app';
import { chat } from './chat';
import { clubs } from './clubs';
import { alerts } from '../screens/alerts';

/** Clears everything a signed-in session changed (log out, delete account, screen-list jumps to auth). */
export function signOutAll() {
  app.set({ signedIn: false, loginFails: 0, plan: 'free', sheet: null, hasClubs: true });
  chat.reset();
  clubs.reset();
  alerts.reset();
}

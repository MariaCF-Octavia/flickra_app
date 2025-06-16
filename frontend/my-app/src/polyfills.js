 // src/polyfills.js
import { Buffer } from 'buffer';

window.global = window;
window.Buffer = Buffer;
window.process = {
  env: import.meta.env,  // Map to Vite's environment variables
  versions: {},
  nextTick: (callback) => setTimeout(callback, 0)
};
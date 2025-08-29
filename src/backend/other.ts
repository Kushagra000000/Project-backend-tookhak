import { gameTimers, clearData } from './dataStore';
import { EmptyObject } from './interface';

/**
  * Reset the state of the application back to the start.
  *
  * no params
  *
  * @returns {EmptyObject} - always
*/
function clear(): EmptyObject {
  // Clear the timers
  for (const timer of Array.from(gameTimers.values())) {
    clearTimeout(timer);
  }
  clearData();
  return {};
}

export { clear };

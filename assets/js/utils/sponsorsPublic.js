// assets/js/utils/sponsorsPublic.js
import { loadSponsors } from "../state/sponsorsState.js";

export function loadActiveSponsors() {
  const all = loadSponsors();
  return all.filter((s) => s.active !== false);
}

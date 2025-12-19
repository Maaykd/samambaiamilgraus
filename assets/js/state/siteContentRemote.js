// assets/js/state/siteContentRemote.js
import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const DOC_REF = doc(db, "siteContent", "main");

export async function loadSiteContentRemote() {
  const snap = await getDoc(DOC_REF);
  if (!snap.exists()) {
    return {};
  }
  return snap.data();
}

export async function saveSiteContentRemote(data) {
  await setDoc(DOC_REF, data, { merge: true });
}

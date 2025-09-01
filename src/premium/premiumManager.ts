/*
// src\premium\premiumManager.ts
import { validateLicense } from "./wasm/validatorLoader";
import { Buffer } from "buffer";
export type PremiumState = "initializing" | "free" | "pro" | "invalid_key" | "expired";
let state: {
  status: PremiumState;
  key: string | null;
  payload: Record<string, any> | null;
} = {
  status: "initializing",
  key: null,
  payload: null,
};

type Subscriber = (newState: PremiumState) => void;
const subscribers: Subscriber[] = [];

function notify(): void {
  subscribers.forEach((cb) => cb(state.status));
}

export function onStateChange(callback: Subscriber): () => void {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) subscribers.splice(index, 1);
  };
}

// --- PUBLIKUS KULCS BETÖLTÉSE A KÖRNYEZETBŐL ---
const PUBLIC_KEY_PEM = import.meta.env.VITE_LICENSE_PUBLIC_KEY;

if (!PUBLIC_KEY_PEM) {
  throw new Error('FATAL: VITE_LICENSE_PUBLIC_KEY is not defined in the environment variables. The application cannot validate licenses.');
}
// --- KULCS BETÖLTVE ---

export async function initializePremiumManager(): Promise<void> {
  try {
    const storedKey = localStorage.getItem("newslyfe_license_key");
    await validateAndSetState(storedKey);
  } catch (error) {
    console.error("Failed to initialize Premium Manager:", error);
    state = { status: "free", key: null, payload: null };
    notify();
  }
}

async function validateAndSetState(licenseKey: string | null): Promise<void> {
  if (!licenseKey) {
    state = { status: "free", key: null, payload: null };
    localStorage.removeItem("newslyfe_license_key");
    notify();
    return;
  }
  const isValidSignature = await validateLicense(licenseKey, PUBLIC_KEY_PEM);
  if (!isValidSignature) {
    state = { status: "invalid_key", key: licenseKey, payload: null };
    notify();
    return;
  }
  try {
    const base64Payload = licenseKey.split(".")[0];
    const payloadString = Buffer.from(base64Payload, "base64").toString("utf-8");
    const payload = JSON.parse(payloadString);
    const expiryDate = new Date(payload.exp);
    if (expiryDate < new Date()) {
      state = { status: "expired", key: licenseKey, payload };
    } else {
      state = { status: "pro", key: licenseKey, payload };
      localStorage.setItem("newslyfe_license_key", licenseKey);
    }
  } catch (error) {
    console.error("Payload decoding error:", error);
    state = { status: "invalid_key", key: licenseKey, payload: null };
  }
  notify();
}

export async function storeLicenseKey(key: string): Promise<void> {
  await validateAndSetState(key);
}
export function clearLicenseKey(): void {
  validateAndSetState(null);
}
export function getPremiumState(): PremiumState {
  return state.status;
}
export function getLicensePayload(): Record<string, any> | null {
  return state.payload;
}
*/
/**
 * Összegyűjti a felhasználó összes fontos adatát egyetlen objektumba.
 *//*
export function exportUserData(): object {
  return {
    licenseKey: state.key,
    userSettings: localStorage.getItem("user_settings"),
    userFavorites: localStorage.getItem("user_favorites"),
    // További adatok bővíthetők itt
  };
}
*/
/**
 * Visszaállítja a felhasználó állapotát egy importált adatobjektumból.
 *//*
export async function importUserData(data: any): Promise<void> {
  if (data.userSettings && typeof data.userSettings === "string") {
    localStorage.setItem("user_settings", data.userSettings);
  }
  if (data.userFavorites && typeof data.userFavorites === "string") {
    localStorage.setItem("user_favorites", data.userFavorites);
  }
  if (data.licenseKey && typeof data.licenseKey === "string") {
    await storeLicenseKey(data.licenseKey);
  } else {
    clearLicenseKey();
  }
}

*/
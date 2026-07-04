/** Small formatting helpers for addresses, hashes, and bytes. */

/** Lowercase hex string from raw bytes. */
export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

/** Parse a hex string (with or without 0x) into bytes. */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Middle-truncate a long identifier for display: `abcd…wxyz`. */
export function truncate(value: string, lead = 8, tail = 6): string {
  if (!value) return '';
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

/** A clock time like `21:07:44` for the activity log. */
export function clock(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

/** 32 fresh random bytes — a new Umbra secret key. */
export function randomSecret(): Uint8Array {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return b;
}

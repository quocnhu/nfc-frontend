/* Shared helpers for the ported 3D NFC templates. */
/* eslint-disable @typescript-eslint/no-explicit-any -- three.js is loaded dynamically and has no bundled types. */

export type Lang = "vi" | "en";

export interface TemplateItem {
  id: string;
  url: string;
  itemName: string;
  icon: string;
  iconUrl?: string;
}

export interface TemplateUser {
  fullname: string;
  avatarUrl?: string;
  email: string;
  role?: { id: string; name: string };
}

export interface TemplateProps {
  user: TemplateUser;
  items: TemplateItem[];
}

export type RowKind =
  | "phone"
  | "mail"
  | "fb"
  | "zalo"
  | "pin"
  | "clock"
  | "lic"
  | "gh"
  | "stack"
  | "work"
  | "lang"
  | "link";

export interface Row {
  id: string;
  kind: RowKind;
  label: string;
  text: string;
  href?: string;
  iconUrl?: string;
}

export const COL: Record<RowKind, [string, string]> = {
  phone: ["#17c58a", "#0b8f68"],
  mail: ["#8a5cff", "#5b34d6"],
  fb: ["#2f7bff", "#1a4fd0"],
  zalo: ["#2d8cff", "#0a5fd0"],
  pin: ["#ff8a4a", "#e5501a"],
  clock: ["#14b8c8", "#0a8494"],
  lic: ["#c99a22", "#9a7210"],
  gh: ["#6e56ff", "#3b2fa8"],
  stack: ["#22b573", "#118a55"],
  work: ["#ff8a4a", "#e5501a"],
  lang: ["#12b5cf", "#0a7f96"],
  link: ["#4f46e5", "#3730a3"],
};

export const EMOJI: Record<RowKind, string> = {
  phone: "📞",
  mail: "✉️",
  fb: "👍",
  zalo: "💬",
  pin: "📍",
  clock: "🕘",
  lic: "🪪",
  gh: "🐙",
  stack: "🛠️",
  work: "☁️",
  lang: "🗣️",
  link: "🔗",
};

export const PATHS: Record<string, string> = {
  phone:
    "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z",
  mail:
    "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.6 7v.1L12 12.4 19.4 7.1V7L12 12.2z",
  fb:
    "M14 8.5V6.9c0-.8.2-1.2 1.3-1.2H17V3h-2.6C11.6 3 10.5 4.6 10.5 6.7v1.8H8.3v3h2.2V21H14v-9.5h2.7l.3-3z",
  pin:
    "M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
};

export function formatRole(name?: string): string {
  if (!name) return "Member";
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function displayUrl(url: string): string {
  return url.replace(/^tel:/i, "").replace(/^mailto:/i, "");
}

export function kindOf(item: TemplateItem): RowKind {
  const name = item.itemName.toLowerCase();
  const url = item.url.toLowerCase();
  if (url.startsWith("tel:") || name.includes("phone") || name.includes("mobile") || name.includes("điện thoại")) return "phone";
  if (url.startsWith("mailto:") || name.includes("mail") || name.includes("email")) return "mail";
  if (url.includes("zalo")) return "zalo";
  if (url.includes("facebook") || name.includes("facebook") || name === "fb") return "fb";
  if (url.includes("github")) return "gh";
  if (name.includes("office") || name.includes("văn phòng") || url.includes("maps")) return "pin";
  if (name.includes("hour") || name.includes("giờ")) return "clock";
  if (name.includes("license") || name.includes("chứng chỉ") || name.includes("tax") || name.includes("mst")) return "lic";
  if (name.includes("stack") || name.includes("công nghệ")) return "stack";
  if (name.includes("dịch vụ") || name.includes("service")) return "work";
  if (name.includes("ngôn ngữ") || name.includes("language")) return "lang";
  return "link";
}

export function openHref(href?: string) {
  if (!href) return;
  if (/^https?:\/\//i.test(href)) {
    window.open(href, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = href;
  }
}

let threePromise: Promise<any> | null = null;
export function loadThree(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as any;
  if (w.THREE) return Promise.resolve(w.THREE);
  if (threePromise) return threePromise;
  threePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    script.onload = () => resolve((window as any).THREE);
    script.onerror = () => reject(new Error("Failed to load three.js"));
    document.head.appendChild(script);
  });
  return threePromise;
}

import { loadScript } from "./loadScript";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = "ca-pub-1642118466411022";
let adsensePromise: Promise<void> | null = null;

export const loadAdsense = () => {
  if (adsensePromise) {
    return adsensePromise;
  }

  const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  adsensePromise = loadScript(src, { id: "adsbygoogle-js", attrs: { crossorigin: "anonymous" } });
  return adsensePromise;
};

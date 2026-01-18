import { loadScript } from "./loadScript";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_ID = "G-ZWD31MK9FH";
let gtagPromise: Promise<void> | null = null;

export const loadGtag = () => {
  if (gtagPromise) {
    return gtagPromise;
  }

  gtagPromise = loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`, { id: "gtag-js" }).then(() => {
    window.dataLayer = window.dataLayer || [];
    const gtag = (...args: any[]) => {
      window.dataLayer?.push(args);
    };
    window.gtag = window.gtag || gtag;
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  });

  return gtagPromise;
};

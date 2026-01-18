import React, { useEffect, useState } from "react";
import { loadAdsense } from "@/utils/adsense";

const MemosAds = (props: any) => {
  const { dataAdSlot } = props;
  const [, setAdLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAd = () => {
      try {
        loadAdsense()
          .then(() => {
            if (cancelled) return;
            if (window.adsbygoogle) {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              setAdLoaded(true);
            }
          })
          .catch(() => {});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(loadAd);
    } else {
      setTimeout(loadAd, 300);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // 在小屏幕上不显示广告，避免宽度不足的问题
  //if (!sm) {
  //  return null;
  //}

  return (
    <>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          minWidth: "320px",
          minHeight: "100px",
          width: "100%",
          maxWidth: "100%",
        }}
        data-ad-client="ca-pub-1642118466411022"
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </>
  );
};

export default MemosAds;

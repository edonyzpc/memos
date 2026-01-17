import React, { useEffect, useState } from "react";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";

declare global {
  interface Window {
    // ⚠️ notice that "Window" is capitalized here
    adsbygoogle: any;
  }
}

const MemosMutiplexAds = (props: any) => {
  const { dataAdSlot } = props;
  const [, setAdLoaded] = useState(false);

  useEffect(() => {
    const loadAd = () => {
      try {
        // 确保 adsbygoogle 已加载
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        } else {
          // 如果 adsbygoogle 还没有加载，等待一段时间后重试
          setTimeout(loadAd, 100);
        }
      } catch (e) {
        console.error("AdSense error:", e);
      }
    };

    loadAd();
  }, []);

  // 在小屏幕上不显示广告，避免宽度不足的问题
  //if (!sm) {
  //  return null;
  //}

  return (
    <div className="w-full min-w-[320px] min-h-[100px] flex justify-center items-center">
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          minWidth: "320px",
          minHeight: "100px",
          width: "100%",
          maxWidth: "100%",
        }}
        data-matched-content-rows-num="3,3"
        data-matched-content-columns-num="1,3"
        data-matched-content-ui-type="image_stacked,image_stacked"
        data-ad-format="autorelaxed"
        data-ad-client="ca-pub-1642118466411022"
        data-ad-slot={dataAdSlot}
      ></ins>
    </div>
  );
};

export default MemosMutiplexAds;

import React, { useEffect } from "react";

declare global {
  interface Window {
    // ⚠️ notice that "Window" is capitalized here
    adsbygoogle: any;
  }
}

const MemosAds = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <>
      <ins
        className="adsbygoogle"
        style={{ display: "flex" }}
        data-ad-client="ca-pub-1642118466411022"
        data-ad-slot="9206857864"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </>
  );
};

export default MemosAds;

import React, { useEffect } from "react";

declare global {
  interface Window {
    // ⚠️ notice that "Window" is capitalized here
    adsbygoogle: any;
  }
}

const MemosMutiplexAds = (props: any) => {
  const { dataAdSlot } = props;

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
        data-matched-content-rows-num="3,3"
        data-matched-content-columns-num="1,3"
        data-matched-content-ui-type="image_stacked,image_stacked"
        data-ad-format="autorelaxed"
        data-ad-client="ca-pub-1642118466411022"
        //data-ad-slot="7148428595"
        data-ad-slot={dataAdSlot}
      ></ins>
    </>
  );
};

export default MemosMutiplexAds;

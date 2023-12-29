import React from "react";

const MemosAds = () => {
  const adSenseCode = `
    <!-- Memos Ads -->
    <ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-1642118466411022"
      data-ad-slot="9206857864"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
    `;

  return (
    <div
      className="w-full px-1 py-2 flex flex-col justify-start items-start shrink-0 space-y-2"
      dangerouslySetInnerHTML={{ __html: adSenseCode }}
    />
  );
};

export default MemosAds;

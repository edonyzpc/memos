import { Memo } from "@/types/proto/api/v2/memo_service";

// Update header for mem
export const updateMeta = async (memo: Memo) => {
  let img, des;
  for (const res of memo.resources) {
    if (res.type.startsWith("image/")) img = res.externalLink;
  }

  if (memo.content.length > 160) {
    des = memo.content.substring(0, 156) + "...";
  }

  for (const meta of document.getElementsByTagName("META")) {
    if (meta.getAttribute("property") === "og:title" || meta.getAttribute("name") === "twitter:title") {
      meta.setAttribute(
        "content",
        `${memo.id}-${memo.createTime?.getFullYear()}/${memo.createTime?.getMonth()}/${memo.createTime?.getDay()} | Edony's Memos`
      );
    }
    if (meta.getAttribute("property") === "og:description" || meta.getAttribute("name") === "twitter:description") {
      meta.setAttribute("content", des ? des : memo.content);
    }
    if (meta.getAttribute("property") === "og:url" || meta.getAttribute("property") === "twitter:url") {
      meta.setAttribute("content", `https://twitter.edony.ink/m/${memo.id}/`);
    }
    if (meta.getAttribute("property") === "og:image" || meta.getAttribute("name") === "twitter:image") {
      meta.setAttribute("content", img ? img : "https://img.edony.ink/memos/A822B6B9-500F-49C8-881A-477C130FCB17.jpg");
    }
  }
};

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ShareMemoCard from "@/components/ShareMemoCard";
import { State } from "@/types/proto/api/v1/common";
import { Visibility } from "@/types/proto/api/v1/memo_service";
import { User_Role } from "@/types/proto/api/v1/user_service";

declare global {
  interface Window {
    __MEMO_SHARE_READY__?: boolean;
  }
}

const DEFAULT_WIDTH = 2400;
const DEFAULT_HEIGHT = 1350;
const DEFAULT_MODE = "auto";
const DIALOG_MAX_WIDTH = 672;
const CANVAS_PADDING = 32;
const DIALOG_MARGIN = 32;

const ShareMemoSandbox = () => {
  const [searchParams] = useSearchParams();
  const width = Number(searchParams.get("width") || DEFAULT_WIDTH);
  const height = Number(searchParams.get("height") || DEFAULT_HEIGHT);
  const mode = searchParams.get("mode") || DEFAULT_MODE;
  const [canvasSize, setCanvasSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [cardWidth, setCardWidth] = useState(DIALOG_MAX_WIDTH);
  const cardRef = useRef<HTMLDivElement>(null);

  const sampleImage = useMemo(() => {
    const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"400\" viewBox=\"0 0 800 400\">\n  <defs>\n    <linearGradient id=\"g\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"1\">\n      <stop offset=\"0%\" stop-color=\"#8ec5fc\" />\n      <stop offset=\"100%\" stop-color=\"#e0c3fc\" />\n    </linearGradient>\n  </defs>\n  <rect width=\"800\" height=\"400\" fill=\"url(#g)\" />\n  <circle cx=\"620\" cy=\"140\" r=\"80\" fill=\"rgba(255,255,255,0.55)\" />\n  <text x=\"40\" y=\"90\" font-size=\"40\" font-family=\"Arial, sans-serif\" fill=\"#1f2937\">Share Memo Test</text>\n  <text x=\"40\" y=\"150\" font-size=\"22\" font-family=\"Arial, sans-serif\" fill=\"#374151\">Render pipeline validation</text>\n</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, []);

  const sampleContent = useMemo(() => {
    return [
      "这是一个用于渲染服务验证的临时分享卡片。",
      "包含多行文本与标签，确保排版稳定。",
      "",
      `![cover](${sampleImage})`,
      "",
      "#人间清醒 #跟周至的一场超时空对话",
    ].join("\n");
  }, [sampleImage]);

  useEffect(() => {
    window.__MEMO_SHARE_READY__ = false;
    let cancelled = false;

    const waitForAssets = async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve(true);
                return;
              }
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }),
        ),
      );
      if (document.fonts && "ready" in document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font readiness errors
        }
      }
      if (cancelled) {
        return;
      }
      if (mode !== "auto") {
        setCanvasSize({
          width: Number.isFinite(width) ? width : DEFAULT_WIDTH,
          height: Number.isFinite(height) ? height : DEFAULT_HEIGHT,
        });
        window.__MEMO_SHARE_READY__ = true;
        return;
      }
      const maxAvailableWidth = Number.isFinite(width) ? width : window.innerWidth || DEFAULT_WIDTH;
      const maxAvailableHeight = Number.isFinite(height) ? height : window.innerHeight || DEFAULT_HEIGHT;
      const dialogWidth = Math.max(320, Math.min(DIALOG_MAX_WIDTH, maxAvailableWidth - DIALOG_MARGIN));
      setCardWidth(dialogWidth);
      requestAnimationFrame(() => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) {
          window.__MEMO_SHARE_READY__ = true;
          return;
        }
        const minWidth = Math.ceil(rect.width + CANVAS_PADDING * 2);
        const minHeight = Math.ceil(rect.height + CANVAS_PADDING * 2);
        let targetWidth = Math.max(minWidth, Math.ceil((minHeight * 16) / 9));
        let targetHeight = Math.ceil((targetWidth * 9) / 16);
        if (targetWidth > maxAvailableWidth) {
          targetWidth = maxAvailableWidth;
          targetHeight = Math.ceil((targetWidth * 9) / 16);
        }
        if (targetHeight > maxAvailableHeight) {
          targetHeight = maxAvailableHeight;
          targetWidth = Math.ceil((targetHeight * 16) / 9);
        }
        setCanvasSize({ width: targetWidth, height: targetHeight });
        requestAnimationFrame(() => {
          window.__MEMO_SHARE_READY__ = true;
        });
      });
    };

    void waitForAssets();

    return () => {
      cancelled = true;
    };
  }, [sampleContent, mode, width, height]);

  return (
    <div
      className="share-memo-canvas w-full select-none relative flex flex-col justify-center items-center"
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
        padding: `${CANVAS_PADDING}px`,
      }}
    >
      <div ref={cardRef} style={mode === "auto" ? { width: `${cardWidth}px`, maxWidth: "100%" } : undefined}>
        <ShareMemoCard
          memo={{
            name: "memos/sandbox",
            state: State.NORMAL,
            creator: "users/1",
            createTime: new Date(),
            updateTime: new Date(),
            displayTime: new Date(),
            content: sampleContent,
            visibility: Visibility.PRIVATE,
            tags: [],
            pinned: false,
            attachments: [],
            relations: [],
            reactions: [],
            property: { hasLink: false, hasTaskList: false, hasCode: false, hasIncompleteTasks: false },
            snippet: "",
          }}
          creator={{
            name: "users/1",
            role: User_Role.HOST,
            username: "cuddlepig",
            email: "",
            displayName: "",
            avatarUrl: "",
            description: "",
            password: "",
            state: State.NORMAL,
          }}
        />
      </div>
    </div>
  );
};

export default ShareMemoSandbox;

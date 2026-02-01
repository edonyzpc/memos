import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ShareMemoCard from "@/components/ShareMemoCard";
import Loading from "@/pages/Loading";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { User } from "@/types/proto/api/v1/user_service";

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

const ShareMemo = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const memoId = params.id || "";
  const token = searchParams.get("token") || "";
  const width = Number(searchParams.get("width") || DEFAULT_WIDTH);
  const height = Number(searchParams.get("height") || DEFAULT_HEIGHT);
  const mode = searchParams.get("mode") || DEFAULT_MODE;
  const theme = searchParams.get("theme") || "light";

  const [memo, setMemo] = useState<Memo | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [cardWidth, setCardWidth] = useState(DIALOG_MAX_WIDTH);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    window.__MEMO_SHARE_READY__ = false;

    const fetchShare = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/share/memos/${memoId}?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
          throw new Error(`share memo failed (${response.status})`);
        }
        const data = await response.json();
        if (cancelled) {
          return;
        }
        setMemo(data.memo || null);
        setCreator(data.creator || null);
      } catch (error) {
        console.error(error);
        setMemo(null);
        setCreator(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (memoId && token) {
      void fetchShare();
    } else {
      setLoading(false);
      window.__MEMO_SHARE_READY__ = true;
    }

    return () => {
      cancelled = true;
    };
  }, [memoId, token]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    return () => {
      root.classList.remove("dark");
    };
  }, [theme]);

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

    if (!loading && memo) {
      void waitForAssets();
    } else if (!loading && !memo) {
      window.__MEMO_SHARE_READY__ = true;
    }

    return () => {
      cancelled = true;
    };
  }, [loading, memo, mode, width, height]);

  const content = useMemo(() => {
    if (loading) {
      return <Loading />;
    }
    if (!memo) {
      return <div className="text-center text-sm text-gray-500">Memo not found</div>;
    }
    return (
      <div ref={cardRef} style={mode === "auto" ? { width: `${cardWidth}px`, maxWidth: "100%" } : undefined}>
        <ShareMemoCard memo={memo} creator={creator} />
      </div>
    );
  }, [loading, memo, creator, cardWidth, mode]);

  return (
    <div
      className="share-memo-canvas w-full select-none relative flex flex-col justify-center items-center"
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
        padding: `${CANVAS_PADDING}px`,
      }}
    >
      {content}
    </div>
  );
};

export default ShareMemo;

import { observer } from "mobx-react-lite";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { memoStore } from "@/store";
import { useTranslate } from "@/utils/i18n";
import { remarkPreserveType } from "@/utils/remark-plugins/remark-preserve-type";
import { remarkTag } from "@/utils/remark-plugins/remark-tag";
import { isSuperUser } from "@/utils/user";
import { CodeBlock } from "./CodeBlock";
import { createConditionalComponent, isTagNode, isTaskListItemNode } from "./ConditionalComponent";
import { MemoContentContext } from "./MemoContentContext";
import { Tag } from "./Tag";
import { TaskListItem } from "./TaskListItem";

// MAX_DISPLAY_HEIGHT is the maximum height of the memo content to display in compact mode.
const MAX_DISPLAY_HEIGHT = 256;

const findFirstImageCandidate = (content: string) => {
  const markdownMatch = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(content);
  const htmlTagMatch = /<img\b[^>]*>/i.exec(content);

  const markdownIndex = markdownMatch?.index ?? Number.POSITIVE_INFINITY;
  const htmlIndex = htmlTagMatch?.index ?? Number.POSITIVE_INFINITY;

  if (markdownIndex < htmlIndex && markdownMatch) {
    return { src: markdownMatch[1] };
  }

  if (htmlTagMatch) {
    const tag = htmlTagMatch[0];
    const srcMatch = /src\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(tag);
    if (srcMatch) {
      const src = srcMatch[1] || srcMatch[2] || srcMatch[3];
      const crossOriginMatch = /crossorigin\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(tag);
      const crossOrigin = crossOriginMatch ? crossOriginMatch[1] || crossOriginMatch[2] || crossOriginMatch[3] : undefined;
      return { src, crossOrigin };
    }
  }

  if (markdownMatch) {
    return { src: markdownMatch[1] };
  }

  return undefined;
};

const extractImageDimensions = (src?: string) => {
  if (!src) {
    return undefined;
  }

  try {
    const url = new URL(src, window.location.href);
    const params = url.searchParams;
    const widthParam = params.get("w") || params.get("width");
    const heightParam = params.get("h") || params.get("height");
    const width = widthParam ? Number.parseInt(widthParam, 10) : 0;
    const height = heightParam ? Number.parseInt(heightParam, 10) : 0;

    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height };
    }

    const sizeParam = params.get("size");
    if (sizeParam) {
      const sizeMatch = /(\d+)[xX](\d+)/.exec(sizeParam);
      if (sizeMatch) {
        const sizeWidth = Number.parseInt(sizeMatch[1], 10);
        const sizeHeight = Number.parseInt(sizeMatch[2], 10);
        if (sizeWidth > 0 && sizeHeight > 0) {
          return { width: sizeWidth, height: sizeHeight };
        }
      }
    }
  } catch {
    // Ignore malformed URLs and non-standard sources.
  }

  return undefined;
};

interface Props {
  content: string;
  memoName?: string;
  compact?: boolean;
  readonly?: boolean;
  disableFilter?: boolean;
  className?: string;
  contentClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  parentPage?: string;
  lcpCandidate?: boolean;
  aboveFoldCandidate?: boolean;
}

type ContentCompactView = "ALL" | "SNIPPET";

const MemoContent = observer((props: Props) => {
  const { className, contentClassName, content, memoName, onClick, onDoubleClick } = props;
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const memoContentContainerRef = useRef<HTMLDivElement>(null);
  const [showCompactMode, setShowCompactMode] = useState<ContentCompactView | undefined>(undefined);
  const memo = memoName ? memoStore.getMemoByName(memoName) : null;
  const allowEdit = !props.readonly && memo && (currentUser?.name === memo.creator || isSuperUser(currentUser));
  const firstImageCandidate = useMemo(() => findFirstImageCandidate(content), [content]);

  useEffect(() => {
    if (!props.lcpCandidate || !firstImageCandidate?.src) {
      return;
    }

    if (firstImageCandidate.src.startsWith("data:") || firstImageCandidate.src.startsWith("blob:")) {
      return;
    }

    document.querySelectorAll('link[data-preload="lcp-image"]').forEach((node) => node.remove());

    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    preloadLink.href = firstImageCandidate.src;
    preloadLink.setAttribute("data-preload", "lcp-image");
    if (firstImageCandidate.crossOrigin) {
      preloadLink.crossOrigin = firstImageCandidate.crossOrigin;
    }
    document.head.appendChild(preloadLink);

    return () => {
      preloadLink.remove();
    };
  }, [props.lcpCandidate, firstImageCandidate?.src, firstImageCandidate?.crossOrigin]);

  // Context for custom components
  const contextValue = {
    memoName,
    readonly: !allowEdit,
    disableFilter: props.disableFilter,
    parentPage: props.parentPage,
    containerRef: memoContentContainerRef,
  };

  // Initial compact mode.
  useEffect(() => {
    if (!props.compact) {
      return;
    }
    if (!memoContentContainerRef.current) {
      return;
    }

    if ((memoContentContainerRef.current as HTMLDivElement).getBoundingClientRect().height > MAX_DISPLAY_HEIGHT) {
      setShowCompactMode("ALL");
    }
  }, []);

  const onMemoContentClick = async (e: React.MouseEvent) => {
    // Image clicks and other handlers
    if (onClick) {
      onClick(e);
    }
  };

  const onMemoContentDoubleClick = async (e: React.MouseEvent) => {
    if (onDoubleClick) {
      onDoubleClick(e);
    }
  };

  const compactStates = {
    ALL: { text: t("memo.show-more"), nextState: "SNIPPET" },
    SNIPPET: { text: t("memo.show-less"), nextState: "ALL" },
  };

  let imageIndex = 0;

  return (
    <MemoContentContext.Provider value={contextValue}>
      <div className={`w-full flex flex-col justify-start items-start text-foreground ${className || ""}`}>
        <div
          ref={memoContentContainerRef}
          className={cn(
            "markdown-content relative w-full max-w-full break-words text-base leading-6",
            showCompactMode == "ALL" && "line-clamp-6 max-h-60",
            contentClassName,
          )}
          onClick={onMemoContentClick}
          onDoubleClick={onMemoContentDoubleClick}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkTag, remarkPreserveType]}
            rehypePlugins={[rehypeRaw]}
            components={{
              // Conditionally render custom components based on AST node type
              input: createConditionalComponent(TaskListItem, "input", isTaskListItemNode),
              span: createConditionalComponent(Tag, "span", isTagNode),
              pre: CodeBlock,
              img: ({ src, alt, ...imgProps }) => {
                const currentIndex = imageIndex++;
                const dimensions = extractImageDimensions(src);
                const isPriorityImage = Boolean(props.lcpCandidate && currentIndex === 0);
                const shouldLazyLoad = !isPriorityImage && !props.aboveFoldCandidate;
                const width = imgProps.width ?? dimensions?.width;
                const height = imgProps.height ?? dimensions?.height;
                const style = {
                  ...(imgProps.style as React.CSSProperties | undefined),
                  ...(dimensions ? { aspectRatio: `${dimensions.width} / ${dimensions.height}` } : {}),
                };

                return (
                  <img
                    src={src}
                    alt={alt || ""}
                    loading={isPriorityImage ? "eager" : shouldLazyLoad ? "lazy" : undefined}
                    decoding="async"
                    fetchPriority={isPriorityImage ? "high" : undefined}
                    width={width}
                    height={height}
                    style={style}
                    {...imgProps}
                  />
                );
              },
              a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {showCompactMode == "ALL" && (
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
        )}
        {showCompactMode != undefined && (
          <div className="w-full mt-1">
            <span
              className="w-auto flex flex-row justify-start items-center cursor-pointer text-sm text-primary hover:opacity-80"
              onClick={() => {
                setShowCompactMode(compactStates[showCompactMode].nextState as ContentCompactView);
              }}
            >
              {compactStates[showCompactMode].text}
            </span>
          </div>
        )}
      </div>
    </MemoContentContext.Provider>
  );
});

export default memo(MemoContent);

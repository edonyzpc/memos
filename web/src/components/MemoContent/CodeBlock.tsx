import { CheckIcon, CopyIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const LazyMermaidBlock = lazy(() => import("./MermaidBlock").then((mod) => ({ default: mod.MermaidBlock })));

interface PreProps {
  children?: React.ReactNode;
  className?: string;
}

export const CodeBlock = ({ children, className, ...props }: PreProps) => {
  const [copied, setCopied] = useState(false);
  const [shouldRenderMermaid, setShouldRenderMermaid] = useState(false);
  const mermaidPlaceholderRef = useRef<HTMLPreElement>(null);

  // Extract the code element and its props
  const codeElement = children as React.ReactElement;
  const codeClassName = codeElement?.props?.className || "";
  const codeContent = String(codeElement?.props?.children || "").replace(/\n$/, "");

  // Extract language from className (format: language-xxx)
  const match = /language-(\w+)/.exec(codeClassName);
  const language = match ? match[1] : "";

  useEffect(() => {
    if (language !== "mermaid" || shouldRenderMermaid) {
      return;
    }

    const target = mermaidPlaceholderRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderMermaid(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [language, shouldRenderMermaid]);

  // If it's a mermaid block, render with MermaidBlock component
  if (language === "mermaid") {
    if (!shouldRenderMermaid) {
      return (
        <pre ref={mermaidPlaceholderRef} className={className}>
          <code className="language-mermaid">{codeContent}</code>
        </pre>
      );
    }

    return (
      <Suspense
        fallback={
          <pre className={className}>
            <code className="language-mermaid">{codeContent}</code>
          </pre>
        }
      >
        <LazyMermaidBlock className={className} {...props}>
          {children}
        </LazyMermaidBlock>
      </Suspense>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <pre className="relative group">
      <div className="w-full flex flex-row justify-between items-center">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider select-none">{language}</span>
        <button
          onClick={handleCopy}
          className={cn(
            "p-1.5 rounded-md transition-all",
            "hover:bg-accent/50",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            copied ? "text-primary" : "text-muted-foreground",
          )}
          aria-label={copied ? "Copied" : "Copy code"}
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className={className} {...props}>
        {children}
      </div>
    </pre>
  );
};

import { PlayIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";

interface Props {
  src: string;
  className?: string;
  poster?: string;
}

const LazyVideo = ({ src, className, poster }: Props) => {
  const t = useTranslate();
  const [active, setActive] = useState(false);

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className={cn(
          "w-full h-full min-h-24 rounded-lg border border-border/60 bg-muted/40 text-muted-foreground",
          "flex items-center justify-center gap-2 text-sm hover:opacity-90 transition-colors",
          className,
        )}
        aria-label={t("common.preview")}
      >
        <PlayIcon className="w-4 h-4" />
        <span>{t("common.preview")}</span>
      </button>
    );
  }

  return (
    <video
      className={cn("h-full w-auto rounded-lg border border-border/60 object-contain bg-muted transition-colors", className)}
      preload="metadata"
      crossOrigin="anonymous"
      src={src}
      poster={poster}
      controls
    />
  );
};

export default LazyVideo;

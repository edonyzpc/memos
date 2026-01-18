import { PlayIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";

interface Props {
  src: string;
  className?: string;
  poster?: string;
  previewClassName?: string;
}

const LazyVideo = ({ src, className, poster, previewClassName }: Props) => {
  const t = useTranslate();
  const [active, setActive] = useState(false);

  if (!active) {
    const activate = () => setActive(true);

    return (
      <button
        type="button"
        onClick={activate}
        onPointerEnter={activate}
        onFocus={activate}
        className={cn(
          "inline-flex items-center justify-center cursor-pointer",
          "w-16 h-16 shrink-0 aspect-square rounded-xl border border-border/60 bg-muted/40 text-muted-foreground",
          "hover:opacity-90 transition-colors",
          previewClassName,
        )}
        aria-label={t("common.preview")}
      >
        <PlayIcon className="w-6 h-6" />
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

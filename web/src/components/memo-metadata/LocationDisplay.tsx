import { MapPinIcon, XIcon } from "lucide-react";
import { useState } from "react";
import LazyLeafletMap from "@/components/LazyLeafletMap";
import { cn } from "@/lib/utils";
import type { LatLngLiteral } from "@/types/geo";
import { Location } from "@/types/proto/api/v1/memo_service";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { BaseMetadataProps } from "./types";

interface LocationDisplayProps extends BaseMetadataProps {
  location?: Location;
  onRemove?: () => void;
}

const LocationDisplay = ({ location, mode, onRemove, className }: LocationDisplayProps) => {
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);

  if (!location) {
    return null;
  }

  const displayText = location.placeholder || `Position: [${location.latitude}, ${location.longitude}]`;
  const position: LatLngLiteral = { lat: location.latitude, lng: location.longitude };

  if (mode === "edit") {
    return (
      <div
        className={cn(
          "w-full max-w-full flex flex-row gap-2",
          "relative inline-flex items-center gap-1.5 px-2 h-7 rounded-md border border-border bg-background text-secondary-foreground text-xs transition-colors",
          className,
        )}
      >
        <span className="shrink-0 text-muted-foreground">
          <MapPinIcon className="w-3.5 h-3.5" />
        </span>
        <span className="text-nowrap truncate">{displayText}</span>
        {onRemove && (
          <button
            type="button"
            className="shrink-0 rounded hover:bg-accent transition-colors p-0.5"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove location"
          >
            <XIcon className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full max-w-full flex flex-row gap-2",
            "relative inline-flex items-center gap-1.5 px-2 h-7 rounded-md border border-border bg-background hover:bg-accent text-secondary-foreground text-xs transition-colors cursor-pointer",
            className,
          )}
          onClick={() => setPopoverOpen(true)}
          aria-label="View location"
        >
          <span className="shrink-0 text-muted-foreground">
            <MapPinIcon className="w-3.5 h-3.5" />
          </span>
          <span className="text-nowrap truncate">{displayText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div className="min-w-80 sm:w-lg flex flex-col justify-start items-start">
          <LazyLeafletMap latlng={position} readonly={true} />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LocationDisplay;

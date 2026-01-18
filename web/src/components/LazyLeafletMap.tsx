import { lazy, Suspense } from "react";
import type { LatLngLiteral } from "@/types/geo";

const LeafletMap = lazy(() => import("./LeafletMap"));

interface Props {
  readonly?: boolean;
  latlng?: LatLngLiteral;
  onChange?: (position: LatLngLiteral) => void;
}

const LazyLeafletMap = (props: Props) => {
  return (
    <Suspense fallback={<div className="w-full h-72 bg-muted/30 rounded-md animate-pulse" aria-label="Loading map" />}>
      <LeafletMap {...props} />
    </Suspense>
  );
};

export default LazyLeafletMap;

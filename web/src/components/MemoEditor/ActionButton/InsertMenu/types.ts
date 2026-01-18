import type { LatLngLiteral } from "@/types/geo";
import { Memo } from "@/types/proto/api/v1/memo_service";

export interface LocationState {
  placeholder: string;
  position?: LatLngLiteral;
  latInput: string;
  lngInput: string;
}

export interface LinkMemoState {
  searchText: string;
  isFetching: boolean;
  fetchedMemos: Memo[];
}

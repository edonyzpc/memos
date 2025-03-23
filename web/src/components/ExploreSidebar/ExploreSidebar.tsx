import ClustrBar from "@/components/ClustrBar";
import HitokotoBar from "@/components/HitokotoBar";
import SearchBar from "@/components/SearchBar";
import { cn } from "@/utils";
import TagsSection from "../HomeSidebar/TagsSection";
import StatisticsView from "../StatisticsView";

interface Props {
  className?: string;
}

const ExploreSidebar = (props: Props) => {
  return (
    <aside
      className={cn(
        "relative w-full h-auto max-h-screen overflow-auto hide-scrollbar flex flex-col justify-start items-start",
        props.className,
      )}
    >
      <SearchBar />
      <HitokotoBar />
      <ClustrBar />
      <StatisticsView />
      <TagsSection readonly={true} />
    </aside>
  );
};

export default ExploreSidebar;

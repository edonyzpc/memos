import clsx from "clsx";
import ClustrBar from "../ClustrBar";
import HitokotoBar from "../HitokotoBar";
import TagsSection from "../HomeSidebar/TagsSection";
import SearchBar from "../SearchBar";
import StatisticsView from "../StatisticsView";

interface Props {
  className?: string;
}

const TimelineSidebar = (props: Props) => {
  return (
    <aside
      className={clsx(
        "relative w-full h-auto max-h-screen overflow-auto hide-scrollbar flex flex-col justify-start items-start",
        props.className,
      )}
    >
      <SearchBar />
      <HitokotoBar />
      <ClustrBar />
      <StatisticsView />
      <TagsSection />
    </aside>
  );
};

export default TimelineSidebar;

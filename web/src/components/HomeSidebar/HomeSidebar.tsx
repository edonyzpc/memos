import clsx from "clsx";
import ClustrBar from "@/components/ClustrBar";
import SearchBar from "@/components/SearchBar";
import UserStatisticsView from "@/components/UserStatisticsView";
import TagsSection from "./TagsSection";

interface Props {
  className?: string;
}

const HomeSidebar = (props: Props) => {
  return (
    <aside
      className={clsx(
        "relative w-full h-auto max-h-screen overflow-auto hide-scrollbar flex flex-col justify-start items-start",
        props.className,
      )}
    >
      <SearchBar />
      <ClustrBar />
      <UserStatisticsView />
      <TagsSection />
    </aside>
  );
};

export default HomeSidebar;

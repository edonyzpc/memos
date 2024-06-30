import clsx from "clsx";
import ClustrBar from "@/components/ClustrBar";
import HitokotoBar from "@/components/HitokotoBar";
import SearchBar from "@/components/SearchBar";
import TagsSection from "../HomeSidebar/TagsSection";

interface Props {
  className?: string;
}

const ExploreSidebar = (props: Props) => {
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
      <TagsSection readonly={true} />
    </aside>
  );
};

export default ExploreSidebar;

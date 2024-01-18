import { Link } from "@mui/joy";
import Icon from "@/components/Icon";
import MobileHeader from "@/components/MobileHeader";
import { useGlobalStore } from "@/store/module";
import { edonyVersion } from "@/utils/version";

const About = () => {
  const globalStore = useGlobalStore();
  const profile = globalStore.state.systemStatus.profile;
  const customizedInfo = edonyVersion;

  return (
    <section className="@container w-full max-w-5xl min-h-full flex flex-col justify-start items-center sm:pt-3 md:pt-6 pb-8">
      <MobileHeader />
      <div className="w-full px-4 sm:px-6">
        <div className="w-full shadow flex flex-col justify-start items-start px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-gray-300">
          <a href="https://www.usememos.com" target="_blank">
            <img className="w-auto h-12" src="https://www.usememos.com/full-logo-landscape.png" alt="memos" />
          </a>
          <p className="text-base">A privacy-first, lightweight note-taking service. Easily capture and share your great thoughts.</p>
          <div className="mt-1 flex flex-row items-center flex-wrap">
            <Link underline="always" href="https://www.github.com/usememos/memos" target="_blank">
              GitHub Repo
            </Link>
            <Icon.Dot className="w-4 h-auto opacity-60" />
            <Link underline="always" href="https://www.usememos.com/" target="_blank">
              Offical Website
            </Link>
            <Icon.Dot className="w-4 h-auto opacity-60" />
            <Link underline="always" href="https://www.usememos.com/blog" target="_blank">
              Blogs
            </Link>
            <Icon.Dot className="w-4 h-auto opacity-60" />
            <Link underline="always" href="https://www.usememos.com/docs" target="_blank">
              Documents
            </Link>
          </div>
        </div>
        <div className="w-full flex flex-row justify-start items-center text-sm italic">
          <a className="shrink-0 flex flex-row justify-start items-center mx-1 hover:underline" href="https://usememos.com" target="_blank">
            <img className="w-auto h-7" src="https://www.usememos.com/full-logo-landscape.png" alt="" />
          </a>
          <span>v{profile.version}</span>
          <a
            href="https://github.com/edonyzpc/memos/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex ml-6 justify-end text-sm hover:underline italic text-red-500"
          >
            <img className="w-auto h-7" src="https://img.edony.ink/1573133907wings-cricut-freesvg.org.shadow.walker.edit.svg" alt="" />
            <span className="mx-4 my-auto">{customizedInfo}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default About;

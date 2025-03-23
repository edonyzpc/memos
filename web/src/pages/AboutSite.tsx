import { Link } from "@mui/joy";
import { DotIcon } from "lucide-react";
import MemosAds from "@/components//MemosAds";
//import MobileHeader from "@/components/MobileHeader";
import { useTranslate } from "@/utils/i18n";
import { edonyVersion } from "@/utils/version";

const About = () => {
  const customizedInfo = edonyVersion;
  const t = useTranslate();

  return (
    <section className="@container w-full max-w-5xl min-h-full flex flex-col justify-start items-center sm:pt-3 md:pt-6 pb-8">
      {/*<MobileHeader />*/}
      <div className="w-full px-4 sm:px-6">
        <div className="w-full shadow flex flex-col justify-start items-start px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-gray-300">
          <a href="https://www.usememos.com" target="_blank">
            <img className="w-auto h-12" src="https://www.usememos.com/full-logo-landscape.png" alt="memos" />
          </a>
          <p className="text-base">{t("about.description")}</p>
          <div className="mt-1 flex flex-row items-center flex-wrap">
            <Link underline="always" href="https://www.github.com/usememos/memos" target="_blank">
              {t("about.github-repository")}
            </Link>
            <DotIcon className="w-4 h-auto opacity-60" />
            <Link underline="always" href="https://www.usememos.com/" target="_blank">
              {t("about.official-website")}
            </Link>
            <DotIcon className="w-4 h-auto opacity-60" />
            <Link underline="always" href="https://www.usememos.com/blog" target="_blank">
              {t("about.blogs")}
            </Link>
            <DotIcon className="w-4 h-auto opacity-60" />
            <Link underline="always" href="https://www.usememos.com/docs" target="_blank">
              {t("about.documents")}
            </Link>
          </div>
        </div>
        <div className="w-full shadow flex flex-col justify-start items-start mt-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-gray-300">
          <a
            href="https://github.com/edonyzpc/memos/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-end text-6xl hover:underline font-bold text-red-500"
          >
            <img
              className="w-auto h-12"
              src="https://img.edony.ink/1573133907wings-cricut-freesvg.org.shadow.walker.edit.svg"
              alt="shadow walker logo"
            />
            <span className="mx-4 my-auto text-lg">{customizedInfo}</span>
          </a>
          <p className="text-base">
            生命是有光的，在我熄灭以前，能够照亮你一点，就是我所有能做的了。
            <br />
            山风微微，像月光下晃动的海浪，温和而柔软，停留在时光的背后，变成小时候听过的故事。
          </p>
        </div>
        <div className="w-full h-auto shadow justify-start items-start mt-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-gray-300">
          <MemosAds dataAdSlot="9206857864" />
        </div>
      </div>
    </section>
  );
};

export default About;

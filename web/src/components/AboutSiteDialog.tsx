/*
import { Divider, IconButton } from "@mui/joy";
import { useGlobalStore } from "@/store/module";
import { useTranslate } from "@/utils/i18n";
import { edonyVersion } from "@/utils/version";
import { generateDialog } from "./Dialog";
import Icon from "./Icon";

type Props = DialogProps;

const AboutSiteDialog: React.FC<Props> = ({ destroy }: Props) => {
  const t = useTranslate();
  const globalStore = useGlobalStore();
  const profile = globalStore.state.workspaceProfile;
  const customizedProfile = globalStore.state.systemStatus.customizedProfile;
  const customizedInfo = edonyVersion;

  const handleCloseBtnClick = () => {
    destroy();
  };

  return (
    <>
      <div className="dialog-header-container">
        <p className="title-text flex items-center">
          {t("common.about")} {customizedProfile.name}
        </p>
        <IconButton size="sm" onClick={handleCloseBtnClick}>
          <Icon.X className="opacity-70" />
        </IconButton>
      </div>
      <div className="flex flex-col justify-start items-start w-auto">
        <p className="text-xs">{t("about.memos-description")}</p>
        <p className="text-sm mt-2">{customizedProfile.description || t("about.no-server-description")}</p>
        <Divider className="!my-3" />
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
            <span className="mx-2 my-auto text-">{customizedInfo}</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default function showAboutSiteDialog(): void {
  generateDialog(
    {
      className: "about-site-dialog",
      dialogName: "about-site-dialog",
    },
    AboutSiteDialog,
  );
}
*/

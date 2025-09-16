import { MoreVerticalIcon, PenLineIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDialog } from "@/hooks/useDialog";
import { useTranslate } from "@/utils/i18n";
import { edonyVersion } from "@/utils/version";
import ChangeMemberPasswordDialog from "../ChangeMemberPasswordDialog";
import MemosAds from "../MemosAds";
import UpdateAccountDialog from "../UpdateAccountDialog";
import UserAvatar from "../UserAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import AccessTokenSection from "./AccessTokenSection";
import UserSessionsSection from "./UserSessionsSection";

const MyAccountSection = () => {
  const t = useTranslate();
  const user = useCurrentUser();
  const accountDialog = useDialog();
  const passwordDialog = useDialog();
  const customizedInfo = edonyVersion;

  const handleEditAccount = () => {
    accountDialog.open();
  };

  const handleChangePassword = () => {
    passwordDialog.open();
  };

  return (
    <div className="w-full gap-2 pt-2 pb-4">
      <p className="font-medium text-muted-foreground">{t("setting.account-section.title")}</p>
      <div className="w-full mt-2 flex flex-row justify-start items-center">
        <UserAvatar className="mr-2 shrink-0 w-10 h-10" avatarUrl={user.avatarUrl} />
        <div className="max-w-[calc(100%-3rem)] flex flex-col justify-center items-start">
          <p className="w-full">
            <span className="text-xl leading-tight font-medium">{user.displayName}</span>
            <span className="ml-1 text-base leading-tight text-muted-foreground">({user.username})</span>
          </p>
          <p className="w-4/5 leading-tight text-sm truncate">{user.description}</p>
        </div>
      </div>
      <div className="w-full flex flex-row justify-start items-center mt-2 space-x-2">
        <Button variant="outline" onClick={handleEditAccount}>
          <PenLineIcon className="w-4 h-4 mx-auto mr-1" />
          {t("common.edit")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreVerticalIcon className="w-4 h-4 mx-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleChangePassword}>{t("setting.account-section.change-password")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UserSessionsSection />
      <AccessTokenSection />

      <div className="w-full shadow flex flex-col justify-start items-start mt-2 px-4 py-3 rounded-xl">
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
      <div className="w-full h-auto shadow justify-start items-start mt-2 px-4 py-3 rounded-xl">
        <MemosAds dataAdSlot="9206857864" />
      </div>

      {/* Update Account Dialog */}
      <UpdateAccountDialog open={accountDialog.isOpen} onOpenChange={accountDialog.setOpen} />

      {/* Change Password Dialog */}
      <ChangeMemberPasswordDialog open={passwordDialog.isOpen} onOpenChange={passwordDialog.setOpen} user={user} />
    </div>
  );
};

export default MyAccountSection;

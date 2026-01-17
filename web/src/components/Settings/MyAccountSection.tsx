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
import SettingGroup from "./SettingGroup";
import SettingSection from "./SettingSection";
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
    <SettingSection>
      <SettingGroup title={t("setting.account-section.title")}>
        <div className="w-full flex flex-row justify-start items-center gap-3">
          <UserAvatar className="shrink-0 w-12 h-12" avatarUrl={user.avatarUrl} />
          <div className="flex-1 min-w-0 flex flex-col justify-center items-start gap-1">
            <div className="w-full">
              <span className="text-lg font-semibold">{user.displayName}</span>
              <span className="ml-2 text-sm text-muted-foreground">@{user.username}</span>
            </div>
            {user.description && <p className="w-full text-sm text-muted-foreground truncate">{user.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleEditAccount}>
              <PenLineIcon className="w-4 h-4 mr-1.5" />
              {t("common.edit")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVerticalIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleChangePassword}>{t("setting.account-section.change-password")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SettingGroup>

      <SettingGroup showSeparator>
        <UserSessionsSection />
      </SettingGroup>

      <SettingGroup showSeparator>
        <AccessTokenSection />
      </SettingGroup>

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
    </SettingSection>
  );
};

export default MyAccountSection;

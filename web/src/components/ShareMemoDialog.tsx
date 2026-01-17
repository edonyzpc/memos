import copy from "copy-to-clipboard";
import * as Icon from "lucide-react";
import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDateTimeString } from "@/helpers/datetime";
import { downloadFileFromUrl } from "@/helpers/utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import useLoading from "@/hooks/useLoading";
import toImage from "@/labs/html2image";
import { memoStore, userStore } from "@/store";
import { Visibility } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { convertVisibilityToString } from "@/utils/memo";
import MemoResourceListView from "./MemoAttachmentListView";
import MemoContent from "./MemoContent";
import UserAvatar from "./UserAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memoId: string;
}

const ShareMemoDialog: React.FC<Props> = (props: Props) => {
  const { memoId, open, onOpenChange } = props;
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const downloadingImageState = useLoading(false);
  const loadingState = useLoading();
  const memoContainerRef = useRef<HTMLDivElement>(null);
  const memo = memoStore.getMemoByName(memoId);
  const user = memo ? userStore.getUserByName(memo.creator) : null;
  const readonly = memo?.creator !== currentUser?.name;

  useEffect(() => {
    if (memo) {
      (async () => {
        await userStore.getOrFetchUserByName(memo.creator);
        loadingState.setFinish();

        // Safari-specific fix: Force reflow to ensure proper rendering
        if (memoContainerRef.current) {
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          if (isSafari) {
            // Force a reflow to ensure Safari renders the content properly
            void memoContainerRef.current.offsetHeight;
            // Small delay to ensure all content is rendered
            setTimeout(() => {
              if (memoContainerRef.current) {
                memoContainerRef.current.style.transform = "translateZ(0)";
              }
            }, 100);
          }
        }
      })();
    } else {
      loadingState.setFinish();
    }
  }, [memo]);

  const handleCloseBtnClick = () => {
    onOpenChange(false);
  };

  const handleDownloadImageBtnClick = () => {
    if (!memoContainerRef.current) {
      return;
    }

    downloadingImageState.setLoading();
    toImage(memoContainerRef.current, {
      pixelRatio: window.devicePixelRatio * 2,
      targetAspectRatio: 4 / 3,
    })
      .then((url) => {
        downloadFileFromUrl(url, `memos-${getDateTimeString(Date.now(), "pt-BR")}.png`);
        downloadingImageState.setFinish();
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleDownloadTextFileBtnClick = () => {
    const blob = new Blob([memo.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    downloadFileFromUrl(url, `memos-${getDateTimeString(Date.now())}.md`);
    URL.revokeObjectURL(url);
  };

  const handleCopyLinkBtnClick = () => {
    copy(`${window.location.origin}/m/${memo.name}`);
    toast.success(t("message.succeed-copy-link"));
  };

  const handleMemoVisibilityOptionChanged = async (visibility: Visibility) => {
    const updatedMemo = await memoStore.updateMemo(
      {
        name: memo.name,
        visibility: visibility,
      },
      ["visibility"],
    );

    if (updatedMemo.visibility == visibility) {
      toast.success(t("message.update-succeed"));
    }
  };

  if (!memo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          size="2xl"
          showCloseButton={false}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = "auto";
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{t("common.share")} Memo</span>
              <Button size="sm" variant="ghost" onClick={handleCloseBtnClick}>
                <Icon.X className="w-5 h-auto" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <span>Memo not found</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="2xl"
        showCloseButton={false}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          document.body.style.pointerEvents = "auto";
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t("common.share")} Memo</span>
            <Button size="sm" variant="ghost" onClick={handleCloseBtnClick}>
              <Icon.X className="w-5 h-auto" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="w-full flex flex-col justify-start items-start relative">
          {loadingState.isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Icon.Loader className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <>
              <div className="px-4 pb-3 w-full flex flex-row justify-between items-center space-x-2">
                <div className="flex flex-row justify-start items-center space-x-2">
                  <Button
                    color="neutral"
                    variant="outline"
                    disabled={downloadingImageState.isLoading}
                    onClick={handleDownloadImageBtnClick}
                  >
                    {downloadingImageState.isLoading ? (
                      <Icon.Loader className="w-4 h-auto mr-1 animate-spin" />
                    ) : (
                      <Icon.Download className="w-4 h-auto mr-1" />
                    )}
                    {t("common.image")}
                  </Button>
                  <Button color="neutral" variant="outline" onClick={handleDownloadTextFileBtnClick}>
                    <Icon.File className="w-4 h-auto mr-1" />
                    {t("common.file")}
                  </Button>
                  <Button color="neutral" variant="outline" onClick={handleCopyLinkBtnClick}>
                    <Icon.Link className="w-4 h-auto mr-1" />
                    {t("common.link")}
                  </Button>
                </div>
                {!readonly && (
                  <Select
                    value={memo.visibility}
                    onValueChange={(visibility) => {
                      if (visibility) {
                        handleMemoVisibilityOptionChanged(visibility as Visibility);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[Visibility.PRIVATE, Visibility.PROTECTED, Visibility.PUBLIC].map((item) => (
                        <SelectItem key={item} value={item} className="whitespace-nowrap">
                          {t(`memo.visibility.${convertVisibilityToString(item).toLowerCase()}` as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="w-full border-t dark:border-zinc-700 overflow-clip">
                <div
                  className="w-full h-auto select-none relative flex flex-col justify-start items-start bg-white dark:bg-zinc-800"
                  ref={memoContainerRef}
                  style={{
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    textRendering: "optimizeLegibility",
                  }}
                >
                  <span className="w-full px-6 pt-5 pb-2 text-sm text-gray-500 dark:text-gray-400">
                    {getDateTimeString(memo.displayTime)}
                  </span>
                  <div className="w-full px-6 text-base pb-4 space-y-2">
                    <MemoContent
                      key={`${memo.name}-${memo.updateTime}`}
                      memoName={memo.name}
                      content={memo.content}
                      readonly={true}
                      className="text-gray-900 dark:text-gray-100"
                      contentClassName="text-gray-900 dark:text-gray-100"
                      disableFilter
                    />
                    <div className="w-full">
                      <MemoResourceListView attachments={memo.attachments} />
                    </div>
                  </div>
                  <div className="flex flex-row justify-between items-center w-full bg-gray-100 dark:bg-zinc-900 py-4 px-6">
                    <div className="flex flex-row justify-start items-center">
                      <UserAvatar className="mr-2" avatarUrl={user?.avatarUrl} />
                      <div className="w-auto grow truncate flex mr-2 flex-col justify-center items-start">
                        <span className="w-full text truncate font-medium text-gray-600 dark:text-gray-300">
                          {user?.displayName || user?.username || "Unknown User"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row justify-end items-center">
                      <span className="text-gray-500 dark:text-gray-400 mr-2 font-thin italic">via</span>
                      <img className="w-8 h-8" src="/logo.svg" alt="shadow walker logo" />
                      <span className="text-gray-500 dark:text-gray-400 ml-1 font-mono font-medium">松烟阁</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/*export default function showShareMemoDialog(memoId: string): void {
  generateDialog(
    {
      className: "share-memo-dialog",
      dialogName: "share-memo-dialog",
    },
    ShareMemoDialog,
    { memoId },
  );
}
*/
export default ShareMemoDialog;

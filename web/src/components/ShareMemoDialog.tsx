import copy from "copy-to-clipboard";
import * as Icon from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDateTimeString } from "@/helpers/datetime";
import { downloadFileFromUrl } from "@/helpers/utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import useLoading from "@/hooks/useLoading";
import toImage from "@/labs/html2image";
import { instanceStore, memoStore, userStore } from "@/store";
import { Visibility } from "@/types/proto/api/v1/memo_service";
import { useTranslate } from "@/utils/i18n";
import { convertVisibilityToString } from "@/utils/memo";
import ShareMemoCard from "./ShareMemoCard";
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
  const downloadUrlRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const memo = memoStore.getMemoByName(memoId);
  const user = memo ? userStore.getUserByName(memo.creator) : null;
  const readonly = memo?.creator !== currentUser?.name;
  const shareImageState = useLoading(true);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const shareImageWidth = 2400;
  const shareImageHeight = 1350;
  const shareImageDpr = 5;

  useEffect(() => {
    if (!memo) {
      loadingState.setFinish();
      return;
    }

    let cancelled = false;

    const fetchPreview = async () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
        downloadUrlRef.current = null;
        setShareImageUrl(null);
      }
      await userStore.getOrFetchUserByName(memo.creator);
      loadingState.setFinish();

      try {
        shareImageState.setLoading();
        const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        const locale = instanceStore.state.locale || "en";
        const response = await fetch(`/api/v1/${memo.name}/share-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            mode: "auto",
            width: shareImageWidth,
            height: shareImageHeight,
            deviceScaleFactor: shareImageDpr,
            theme,
            locale,
          }),
        });
        if (!response.ok) {
          throw new Error(`share image failed (${response.status})`);
        }
        const blob = await response.blob();
        if (cancelled) {
          return;
        }
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        downloadUrlRef.current = url;
        setShareImageUrl(url);
      } catch (error) {
        console.error(error);
        setShareImageUrl(null);
      } finally {
        shareImageState.setFinish();
      }

      // Safari-specific fix: Force reflow to ensure proper rendering for fallback
      if (memoContainerRef.current) {
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) {
          void memoContainerRef.current.offsetHeight;
          setTimeout(() => {
            if (memoContainerRef.current) {
              memoContainerRef.current.style.transform = "translateZ(0)";
            }
          }, 100);
        }
      }
    };

    void fetchPreview();

    return () => {
      cancelled = true;
    };
  }, [memo]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleCloseBtnClick = () => {
    onOpenChange(false);
  };

  const handleDownloadImageBtnClick = () => {
    downloadingImageState.setLoading();
    if (downloadUrlRef.current) {
      downloadFileFromUrl(downloadUrlRef.current, `memos-${getDateTimeString(Date.now(), "pt-BR")}.png`);
      downloadingImageState.setFinish();
      return;
    }
    if (!memoContainerRef.current) {
      downloadingImageState.setFinish();
      return;
    }
    toImage(memoContainerRef.current, {
      pixelRatio: window.devicePixelRatio * 2,
      targetAspectRatio: 16 / 9,
    })
      .then((url) => {
        downloadFileFromUrl(url, `memos-${getDateTimeString(Date.now(), "pt-BR")}.png`);
        downloadingImageState.setFinish();
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error(err);
        downloadingImageState.setFinish();
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
                {shareImageState.isLoading && (
                  <div className="flex items-center justify-center p-8">
                    <Icon.Loader className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Rendering...</span>
                  </div>
                )}
                {shareImageUrl && (
                  <div className="w-full bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                    <img className="max-w-full h-auto rounded-xl shadow-sm" src={shareImageUrl} alt="share memo preview" />
                  </div>
                )}
                <div
                  className="share-memo-canvas w-full h-auto select-none relative flex flex-col justify-start items-start"
                  ref={memoContainerRef}
                  style={{
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    textRendering: "optimizeLegibility",
                    display: shareImageUrl ? "none" : "flex",
                  }}
                >
                  <ShareMemoCard memo={memo} creator={user} />
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

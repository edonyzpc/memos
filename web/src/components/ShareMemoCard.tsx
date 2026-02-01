import MemoResourceListView from "@/components/MemoAttachmentListView";
import MemoContent from "@/components/MemoContent";
import UserAvatar from "@/components/UserAvatar";
import { getDateTimeString } from "@/helpers/datetime";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { User } from "@/types/proto/api/v1/user_service";

interface Props {
  memo: Memo;
  creator?: User | null;
}

const ShareMemoCard = ({ memo, creator }: Props) => {
  const displayName = creator?.displayName || creator?.username || "Unknown User";

  return (
    <div className="share-memo-card w-full h-auto relative flex flex-col justify-start items-start bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden">
      <span className="w-full px-6 pt-5 pb-2 text-sm text-gray-500 dark:text-gray-400">{getDateTimeString(memo.displayTime)}</span>
      <div className="w-full px-6 text-base pb-4 space-y-2">
        <MemoContent
          key={`${memo.name}-${memo.updateTime}`}
          memoName={memo.name}
          content={memo.content}
          readonly={true}
          className="text-gray-900 dark:text-gray-100"
          contentClassName="share-memo-markdown text-gray-900 dark:text-gray-100"
          disableFilter
        />
        <div className="w-full">
          <MemoResourceListView attachments={memo.attachments} />
        </div>
      </div>
      <div className="flex flex-row justify-between items-center w-full bg-gray-100 dark:bg-zinc-900 py-4 px-6">
        <div className="flex flex-row justify-start items-center">
          <UserAvatar className="mr-2" avatarUrl={creator?.avatarUrl} />
          <div className="w-auto grow truncate flex mr-2 flex-col justify-center items-start">
            <span className="w-full text truncate font-medium text-gray-600 dark:text-gray-300">{displayName}</span>
          </div>
        </div>
        <div className="flex flex-row justify-end items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-2 font-thin italic">via</span>
          <img className="w-8 h-8" src="/logo.svg" alt="shadow walker logo" />
          <span className="text-gray-500 dark:text-gray-400 ml-1 font-mono font-medium">松烟阁</span>
        </div>
      </div>
    </div>
  );
};

export default ShareMemoCard;

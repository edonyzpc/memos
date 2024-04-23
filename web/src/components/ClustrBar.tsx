import { useEffect } from "react";
import { useMemoStore } from "@/store/v1";
import { User } from "@/types/proto/api/v2/user_service";

interface Props {
  user: User;
}

const ClustrBar = (props: Props) => {
  const { user } = props;
  const memoStore = useMemoStore();
  const memos = Object.values(memoStore.getState().memoMapByName);

  useEffect(() => {}, [memos.length, user.name]);

  return (
    <div className="w-full border mt-2 py-2 px-3 rounded-md space-y-0.5 text-gray-500 dark:text-gray-400 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      {/*
      <script
        type="text/javascript"
        id="clustrmaps"
        src="//clustrmaps.com/map_v2.js?d=qnA6xx_qxjmxISWbS7_0rFrALJmXLF7zntGqtN3QCEs&cl=ffffff&w=a"
      ></script>
      <a href="https://clustrmaps.com/site/1bzf3" title="Visit tracker">
        <img src="//www.clustrmaps.com/map_v2.png?d=qnA6xx_qxjmxISWbS7_0rFrALJmXLF7zntGqtN3QCEs&cl=ffffff" />
      </a>
    */}
      <script
        type="text/javascript"
        id="clstr_globe"
        src="//clustrmaps.com/globe.js?d=qnA6xx_qxjmxISWbS7_0rFrALJmXLF7zntGqtN3QCEs"
      ></script>
    </div>
  );
};

export default ClustrBar;

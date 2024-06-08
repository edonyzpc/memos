import React, { useEffect } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";

const ClustrBar = () => {
  const { name } = useCurrentUser();
  useEffect(() => {
    console.log(name);
  }, []);

  return (
    <div className="flex flex-col w-full border mt-2 py-2 px-3 rounded-md space-y-0.5 text-gray-500 dark:text-gray-400 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      {/*
      <script
        type="text/javascript"
        id="clustrmaps"
        src="//clustrmaps.com/map_v2.js?d=qnA6xx_qxjmxISWbS7_0rFrALJmXLF7zntGqtN3QCEs&cl=ffffff&w=a"
      ></script>
      <script
        type="text/javascript"
        id="clstr_globe"
        src="//clustrmaps.com/globe.js?d=qnA6xx_qxjmxISWbS7_0rFrALJmXLF7zntGqtN3QCEs"
      ></script>
    */}
      <a
        href="https://clustrmaps.com/site/1bzf3"
        title="Visit tracker"
        className="left-1/2 translate-x-2 content-center items-center flex flex-wrap-reverse"
      >
        <img
          className="content-center items-center flex flex-wrap-reverse"
          src="//www.clustrmaps.com/map_v2.png?d=qnA6xx_qxjmxISWbS7_0rFrALJmXLF7zntGqtN3QCEs&cl=ffffff"
        />
      </a>
    </div>
  );
};

export default ClustrBar;

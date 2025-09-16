import React, { useState, useEffect } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";

const HitokotoBar = () => {
  const name = useCurrentUser();
  const [uuid, setUuid] = useState("");
  const [hitokoto, setHitokoto] = useState("");
  const [from_who, setFrom_who] = useState("");
  const [created_at, setCreated_at] = useState("");
  useEffect(() => {
    console.log(name);
    /*
      {
      "id": 8881,
      "uuid": "3ed86f37-3ada-4377-af95-e3c5630d7ebd",
      "hitokoto": "每天都是绝版。",
      "type": "e",
      "from": "无",
      "from_who": "鱼",
      "creator": "鱼",
      "creator_uid": 13290,
      "reviewer": 1,
      "commit_from": "web",
      "created_at": "1666414091",
      "length": 7
      }
    */
    async function fetchHitokoto() {
      try {
        const response = await fetch("https://v1.hitokoto.cn");
        const { uuid, hitokoto, from_who, created_at } = await response.json();
        setUuid(uuid);
        setHitokoto(hitokoto);
        if (!from_who) {
          setFrom_who(" —— 佚名");
        } else {
          setFrom_who(" —— " + from_who);
        }
        setCreated_at(created_at);
      } catch (error) {
        console.error("Error fetching hitokoto:", error);
      }
    }

    fetchHitokoto();
  }, []);

  return (
    <div className="flex flex-col w-full border mt-2 py-2 px-3 rounded-md space-y-0.5 text-gray-500">
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
      <div>
        <span className="font-link text-[16.5px]">{hitokoto}</span>
      </div>
      <div className="text-right text-sm">{from_who}</div>
      <hr className="border-gray-700"></hr>
      <div className="text-gray-700 font-thin text-xs leading-3">
        ({created_at}, {uuid})
      </div>
    </div>
  );
};

export default HitokotoBar;

const ClustrBar = () => {
  return (
    <div className="flex flex-col w-full border items-center mt-2 rounded-md text-gray-500 overflow-hidden">
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
      <a href="https://clustrmaps.com/site/1bzf3" title="Visit tracker" className="block w-full">
        <img
          className="block w-full h-auto"
          src="//www.clustrmaps.com/map_v2.png?d=qnA6xx_qxjmxISWbS7_0rFrALJmXLF7zntGqtN3QCEs&cl=ffffff"
          alt="Visitor map"
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  );
};

export default ClustrBar;

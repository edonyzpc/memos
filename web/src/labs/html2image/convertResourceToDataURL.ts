const cachedResourceMap = new Map<string, string>();

const convertResourceToDataURL = async (url: string, useCache = true): Promise<string> => {
  if (!url) {
    return "";
  }

  if (url.startsWith("data:")) {
    if (useCache) {
      cachedResourceMap.set(url, url);
    }
    return url;
  }

  if (useCache && cachedResourceMap.has(url)) {
    return Promise.resolve(cachedResourceMap.get(url) as string);
  }

  let urlFetch = url;
  if (url.startsWith("https://memos.3ab1964e0709f627a24b9531f2a15373.r2.cloudflarestorage.com/")) {
    const urlWithoutCORS = new URL(url);
    const path = urlWithoutCORS.pathname;
    const fileName = path.substring(path.lastIndexOf("/") + 1);
    urlFetch = "https://img.edony.ink/" + fileName;
  }

  const res = await fetch(urlFetch);
  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      cachedResourceMap.set(url, base64Url);
      resolve(base64Url);
    };
    reader.readAsDataURL(blob);
  });
};

export default convertResourceToDataURL;

/* eslint-disable @typescript-eslint/no-unused-vars */
import convertResourceToDataURL from "./convertResourceToDataURL";

const resolveUrl = (url: string) => {
  if (!url) {
    return "";
  }
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("#")) {
    return url;
  }
  try {
    return new URL(url, window.location.href).toString();
  } catch {
    return url;
  }
};

const setImageAttributes = (image: HTMLImageElement) => {
  image.loading = "eager";
  image.decoding = "sync";
  image.removeAttribute("srcset");
  image.removeAttribute("sizes");
};

const ensureImageDecoded = async (image: HTMLImageElement) => {
  if (!image.src) {
    return;
  }
  if (image.complete && image.naturalWidth !== 0) {
    return;
  }
  if ("decode" in image) {
    try {
      await image.decode();
      return;
    } catch {
      // fall through to onload
    }
  }

  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
};

const preloadImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      setImageAttributes(image);
      await ensureImageDecoded(image);
    }),
  );
};

const convertCssUrlsToDataUrls = async (cssText: string) => {
  if (!cssText || !cssText.includes("url(")) {
    return { text: cssText, failed: false };
  }

  const matches = Array.from(cssText.matchAll(/url\((['"]?)(.*?)\1\)/g));
  if (matches.length === 0) {
    return { text: cssText, failed: false };
  }

  let result = cssText;
  let failed = false;
  for (const match of matches) {
    const rawUrl = match[2].trim();
    if (!rawUrl || rawUrl.startsWith("data:") || rawUrl.startsWith("#")) {
      continue;
    }
    const resolvedUrl = resolveUrl(rawUrl);
    try {
      const dataUrl = await convertResourceToDataURL(resolvedUrl);
      result = result.replace(match[0], `url("${dataUrl}")`);
    } catch {
      failed = true;
      break;
    }
  }

  return { text: result, failed };
};

const applyStyles = async (sourceElement: HTMLElement, clonedElement: HTMLElement) => {
  if (!sourceElement || !clonedElement) {
    return;
  }

  if (sourceElement.tagName === "IMG") {
    const sourceImage = sourceElement as HTMLImageElement;
    const clonedImage = clonedElement as HTMLImageElement;
    const rawUrl = sourceImage.currentSrc || sourceImage.getAttribute("src") || "";
    const resolvedUrl = resolveUrl(rawUrl);
    let convertFailed = false;
    setImageAttributes(clonedImage);
    if (!resolvedUrl) {
      clonedImage.removeAttribute("src");
    } else {
      try {
        const dataUrl = await convertResourceToDataURL(resolvedUrl);
        if (!dataUrl) {
          throw new Error("Empty data URL");
        }
        clonedImage.src = dataUrl;
      } catch (_error) {
        convertFailed = true;
      }
      if (convertFailed) {
        if (resolvedUrl.startsWith("http://") || resolvedUrl.startsWith("https://")) {
          clonedImage.crossOrigin = "anonymous";
        }
        clonedImage.src = resolvedUrl;
      }
    }
  }

  const sourceStyles = window.getComputedStyle(sourceElement);
  const backgroundValue = sourceStyles.getPropertyValue("background");
  if (backgroundValue) {
    clonedElement.style.setProperty("background", backgroundValue, sourceStyles.getPropertyPriority("background"));
  }

  for (const item of sourceStyles) {
    if (
      item === "background" ||
      item === "background-image" ||
      item === "mask-image" ||
      item === "-webkit-mask-image" ||
      item === "border-image-source"
    ) {
      continue;
    }

    clonedElement.style.setProperty(item, sourceStyles.getPropertyValue(item), sourceStyles.getPropertyPriority(item));
  }

  for (const item of ["background-image", "mask-image", "-webkit-mask-image", "border-image-source"] as const) {
    const value = sourceStyles.getPropertyValue(item);
    if (!value) {
      continue;
    }
    const converted = await convertCssUrlsToDataUrls(value);
    if (converted.failed) {
      clonedElement.style.setProperty(item, "none", sourceStyles.getPropertyPriority(item));
    } else {
      clonedElement.style.setProperty(item, converted.text, sourceStyles.getPropertyPriority(item));
    }
  }

  for (let i = 0; i < clonedElement.childElementCount; i++) {
    await applyStyles(sourceElement.children[i] as HTMLElement, clonedElement.children[i] as HTMLElement);
  }
};

const getCloneStyledElement = async (element: HTMLElement) => {
  const clonedElementContainer = document.createElement(element.tagName);
  clonedElementContainer.innerHTML = element.innerHTML;

  await applyStyles(element, clonedElementContainer);
  await preloadImages(clonedElementContainer);

  return clonedElementContainer;
};

export default getCloneStyledElement;

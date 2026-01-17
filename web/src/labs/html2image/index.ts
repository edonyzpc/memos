/**
 * HTML to Image
 *
 * References:
 * 1. html-to-image: https://github.com/bubkoo/html-to-image
 * 2. <foreignObject>: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
 */
import getCloneStyledElement from "./getCloneStyledElement";
import waitImageLoaded from "./waitImageLoaded";

type Options = Partial<{
  backgroundColor: string;
  pixelRatio: number;
  targetAspectRatio: number;
}>;

const getElementSize = (element: HTMLElement) => {
  const { width, height } = window.getComputedStyle(element);

  return {
    width: parseInt(width.replace("px", "")),
    height: parseInt(height.replace("px", "")),
  };
};

const convertSVGToDataURL = (svg: SVGElement): string => {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = encodeURIComponent(xml);
  return `data:image/svg+xml;charset=utf-8,${url}`;
};

const isTransparentColor = (value: string) => {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "transparent" || normalized === "rgba(0, 0, 0, 0)";
};

const getPaddingColor = (element: HTMLElement, options?: Options) => {
  if (options?.backgroundColor) {
    return options.backgroundColor;
  }

  const computedBackground = window.getComputedStyle(element).backgroundColor;
  if (!isTransparentColor(computedBackground)) {
    return computedBackground;
  }

  return undefined;
};

const padCanvasToAspectRatio = (canvas: HTMLCanvasElement, targetRatio: number, paddingColor?: string) => {
  if (!targetRatio || targetRatio <= 0) {
    return canvas;
  }

  const { width, height } = canvas;
  if (width === 0 || height === 0) {
    return canvas;
  }

  const currentRatio = width / height;
  if (Math.abs(currentRatio - targetRatio) < 0.001) {
    return canvas;
  }

  let paddedWidth = width;
  let paddedHeight = height;

  if (currentRatio > targetRatio) {
    paddedHeight = Math.ceil(width / targetRatio);
  } else {
    paddedWidth = Math.ceil(height * targetRatio);
  }

  const paddedCanvas = document.createElement("canvas");
  const paddedContext = paddedCanvas.getContext("2d");
  if (!paddedContext) {
    return canvas;
  }

  paddedCanvas.width = paddedWidth;
  paddedCanvas.height = paddedHeight;

  if (paddingColor) {
    paddedContext.fillStyle = paddingColor;
    paddedContext.fillRect(0, 0, paddedWidth, paddedHeight);
  }

  const offsetX = Math.floor((paddedWidth - width) / 2);
  const offsetY = Math.floor((paddedHeight - height) / 2);
  paddedContext.drawImage(canvas, offsetX, offsetY);

  return paddedCanvas;
};

const generateSVGElement = (width: number, height: number, element: HTMLElement): SVGSVGElement => {
  const xmlNS = "http://www.w3.org/2000/svg";
  const svgElement = document.createElementNS(xmlNS, "svg");

  svgElement.setAttribute("width", `${width}`);
  svgElement.setAttribute("height", `${height}`);
  svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const foreignObject = document.createElementNS(xmlNS, "foreignObject");

  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");
  foreignObject.setAttribute("x", "0");
  foreignObject.setAttribute("y", "0");
  foreignObject.setAttribute("externalResourcesRequired", "true");

  foreignObject.appendChild(element);
  svgElement.appendChild(foreignObject);

  return svgElement;
};

export const toSVG = async (element: HTMLElement, options?: Options) => {
  const { width, height } = getElementSize(element);
  const clonedElement = await getCloneStyledElement(element);

  if (options?.backgroundColor) {
    clonedElement.style.backgroundColor = options.backgroundColor;
  }

  const svg = generateSVGElement(width, height, clonedElement);
  const url = convertSVGToDataURL(svg);

  return url;
};

export const toCanvas = async (element: HTMLElement, options?: Options): Promise<HTMLCanvasElement> => {
  const ratio = options?.pixelRatio || 1;
  const { width, height } = getElementSize(element);

  if (document.fonts && "ready" in document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font readiness errors
    }
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return Promise.reject("Canvas error");
  }

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  canvas.style.width = `${width}`;
  canvas.style.height = `${height}`;

  if (options?.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const url = await toSVG(element, options);
  const imageEl = new Image();
  imageEl.style.zIndex = "-1";
  imageEl.style.position = "fixed";
  imageEl.style.top = "0";
  document.body.append(imageEl);
  await waitImageLoaded(imageEl, url);
  context.drawImage(imageEl, 0, 0, canvas.width, canvas.height);
  imageEl.remove();

  if (options?.targetAspectRatio) {
    return padCanvasToAspectRatio(canvas, options.targetAspectRatio, getPaddingColor(element, options));
  }

  return canvas;
};

const toImage = async (element: HTMLElement, options?: Options) => {
  const canvas = await toCanvas(element, options);
  return canvas.toDataURL();
};

export default toImage;

import { toPng } from "html-to-image";

const DEFAULT_PIXEL_RATIO = 3;
const MAX_CANVAS_EDGE = 16384;

function resolveBackgroundColor(element: HTMLElement): string | undefined {
  let node: HTMLElement | null = element;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      return bg;
    }
    node = node.parentElement;
  }
  return undefined;
}

function effectivePixelRatio(width: number, height: number, desired = DEFAULT_PIXEL_RATIO): number {
  let ratio = desired;
  while ((width * ratio > MAX_CANVAS_EDGE || height * ratio > MAX_CANVAS_EDGE) && ratio > 1) {
    ratio -= 0.5;
  }
  return Math.max(1, ratio);
}

export function pageExportFilename(pathname: string): string {
  const slug =
    pathname
      .replace(/^\/+|\/+$/g, "")
      .replace(/\//g, "-")
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || "page";
  const stamp = new Date().toISOString().slice(0, 10);
  return `mock-interview-pro-${slug}-${stamp}.png`;
}

export async function exportPageToPng(element: HTMLElement, filename: string): Promise<void> {
  const width = element.scrollWidth;
  const height = element.scrollHeight;
  const pixelRatio = effectivePixelRatio(width, height);

  const dataUrl = await toPng(element, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: resolveBackgroundColor(element),
    width,
    height,
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      return node.dataset.pageExportIgnore === undefined;
    },
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

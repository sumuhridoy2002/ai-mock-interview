import { toPng } from "html-to-image";

const DEFAULT_PIXEL_RATIO = 3;
const MAX_CANVAS_EDGE = 16384;
/** Breathing room around content so shadows and edges are not clipped. */
const EXPORT_PADDING_PX = 32;

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

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function bumpPadding(element: HTMLElement, side: "Top" | "Right" | "Bottom" | "Left", extra: number): () => void {
  const key = `padding${side}` as const;
  const prev = element.style[key];
  const computed = parseFloat(getComputedStyle(element)[`padding${side}`] || "0");
  element.style[key] = `${computed + extra}px`;
  return () => {
    element.style[key] = prev;
  };
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
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  window.scrollTo(0, 0);

  const restores: Array<() => void> = [];

  document.querySelectorAll<HTMLElement>("[data-page-export-ignore]").forEach((el) => {
    const prev = el.style.visibility;
    el.style.visibility = "hidden";
    restores.push(() => {
      el.style.visibility = prev;
    });
  });

  const prevOverflow = element.style.overflow;
  element.style.overflow = "visible";
  restores.push(() => {
    element.style.overflow = prevOverflow;
  });

  // Expand nested scroll containers (e.g. overflow-x-auto around wide tables,
  // chat message panes) so full content is captured without scrollbars or clipping.
  const expanded = new Set<HTMLElement>();

  const expandBox = (el: HTMLElement) => {
    if (expanded.has(el)) return;
    expanded.add(el);

    const prev = {
      overflow: el.style.overflow,
      overflowX: el.style.overflowX,
      overflowY: el.style.overflowY,
      maxHeight: el.style.maxHeight,
      height: el.style.height,
      flex: el.style.flex,
      flexGrow: el.style.flexGrow,
      flexShrink: el.style.flexShrink,
      flexBasis: el.style.flexBasis,
    };

    el.style.overflow = "visible";
    el.style.overflowX = "visible";
    el.style.overflowY = "visible";
    el.style.maxHeight = "none";
    el.style.height = "auto";
    // Flex children with flex-1 + overflow can still clamp height — drop flex grow clamp.
    if (getComputedStyle(el).flexGrow !== "0") {
      el.style.flex = "0 0 auto";
    }

    restores.push(() => {
      el.style.overflow = prev.overflow;
      el.style.overflowX = prev.overflowX;
      el.style.overflowY = prev.overflowY;
      el.style.maxHeight = prev.maxHeight;
      el.style.height = prev.height;
      el.style.flex = prev.flex;
      el.style.flexGrow = prev.flexGrow;
      el.style.flexShrink = prev.flexShrink;
      el.style.flexBasis = prev.flexBasis;
    });
  };

  element.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const computed = getComputedStyle(el);
    const scrollable = ["auto", "scroll", "overlay"];
    const isScrollable =
      scrollable.includes(computed.overflowX) || scrollable.includes(computed.overflowY);

    if (!isScrollable) return;

    expandBox(el);

    // Also expand fixed-height ancestors up to the export root so chat cards,
    // vh-clamped panels, etc. grow with their content instead of overlapping.
    let parent: HTMLElement | null = el.parentElement;
    while (parent && parent !== element.parentElement) {
      const parentStyle = getComputedStyle(parent);
      const constrained =
        parentStyle.height !== "auto" ||
        parentStyle.maxHeight !== "none" ||
        parentStyle.flexGrow !== "0" ||
        parent.classList.contains("flex") ||
        parent.classList.contains("flex-col");

      if (constrained) {
        expandBox(parent);
      }

      if (parent === element) break;
      parent = parent.parentElement;
    }
  });

  // Explicit opt-in for panels that need full-height expansion even without overflow.
  element.querySelectorAll<HTMLElement>("[data-page-export-expand]").forEach((el) => {
    expandBox(el);
  });

  restores.push(
    bumpPadding(element, "Top", EXPORT_PADDING_PX),
    bumpPadding(element, "Right", EXPORT_PADDING_PX),
    bumpPadding(element, "Bottom", EXPORT_PADDING_PX),
    bumpPadding(element, "Left", EXPORT_PADDING_PX),
  );

  // Sticky headers clip oddly in html-to-image — flatten during capture.
  element.querySelectorAll<HTMLElement>(".sticky").forEach((el) => {
    const prevPosition = el.style.position;
    const prevTop = el.style.top;
    el.style.position = "relative";
    el.style.top = "auto";
    restores.push(() => {
      el.style.position = prevPosition;
      el.style.top = prevTop;
    });
  });

  element.querySelectorAll<HTMLElement>("[data-page-hero-row]").forEach((row) => {
    if (row.classList.contains("flex-col") || row.classList.contains("mx-auto")) {
      return;
    }

    const prevDisplay = row.style.display;
    const prevColumns = row.style.gridTemplateColumns;
    const prevWidth = row.style.width;
    row.style.display = "grid";
    row.style.gridTemplateColumns = "56px minmax(0, 1fr)";
    row.style.width = "100%";
    restores.push(() => {
      row.style.display = prevDisplay;
      row.style.gridTemplateColumns = prevColumns;
      row.style.width = prevWidth;
    });

    const text = row.querySelector<HTMLElement>("[data-page-hero-text]");
    if (text) {
      const prevPadLeft = text.style.paddingLeft;
      text.style.paddingLeft = "20px";
      restores.push(() => {
        text.style.paddingLeft = prevPadLeft;
      });
    }
  });

  try {
    // Let layout reflow after height/overflow expansions before measuring.
    await waitForNextFrame();
    await waitForNextFrame();

    // Prefer scroll metrics so wide grids / tall content are fully included.
    const width = Math.ceil(Math.max(element.scrollWidth, element.offsetWidth, element.clientWidth));
    const height = Math.ceil(Math.max(element.scrollHeight, element.offsetHeight, element.clientHeight));
    const pixelRatio = effectivePixelRatio(width, height);

    const dataUrl = await toPng(element, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: resolveBackgroundColor(element) ?? "#f8fafc",
      width,
      height,
      style: {
        overflow: "visible",
        maxHeight: "none",
        maxWidth: "none",
        width: `${width}px`,
        height: `${height}px`,
        transform: "none",
        margin: "0",
      },
      filter: (node) => {
        if (node instanceof HTMLScriptElement || node instanceof HTMLIFrameElement) {
          return false;
        }
        if (!(node instanceof HTMLElement)) return true;
        if (node.dataset.pageExportIgnore !== undefined) return false;
        if (node.classList.contains("blur-3xl")) return false;
        return true;
      },
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    restores.forEach((restore) => restore());
    window.scrollTo(scrollX, scrollY);
  }
}

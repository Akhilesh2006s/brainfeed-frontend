import { useState, useEffect, useRef, useCallback, type MutableRefObject } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  ClipboardEvent as ReactClipboardEvent,
  ChangeEvent,
  DragEvent as ReactDragEvent,
} from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Eraser,
  ChevronDown,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/** Snapshots the current selection when it is inside the editor (used before toolbar / menu interactions). */
function captureEditorSelection(editor: HTMLElement | null, savedRange: MutableRefObject<Range | null>) {
  const sel = window.getSelection();
  if (!editor || !sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const inEditor =
    editor.contains(range.startContainer) ||
    editor.contains(range.endContainer) ||
    editor.contains(range.commonAncestorContainer);
  if (inEditor) {
    savedRange.current = range.cloneRange();
  }
}

function rangesMatchSpanContents(range: Range, span: HTMLElement): boolean {
  const r = document.createRange();
  r.selectNodeContents(span);
  return (
    range.compareBoundaryPoints(Range.START_TO_START, r) === 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, r) === 0
  );
}

/** Loose match when browsers normalize boundaries differently but text matches. */
function selectionCoversSpanText(range: Range, span: HTMLElement): boolean {
  if (rangesMatchSpanContents(range, span)) return true;
  const a = (range.toString() || "").trim();
  const b = (span.textContent || "").trim();
  return a.length > 0 && a === b;
}

function getPxFromFontSizeSpan(span: HTMLElement): number {
  const ds = span.getAttribute("data-editor-fs");
  if (ds) {
    const n = parseFloat(ds);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  const inline = span.style?.fontSize;
  if (inline && inline.endsWith("px")) {
    const n = parseFloat(inline);
    if (!Number.isNaN(n)) return n;
  }
  const px = parseFloat(window.getComputedStyle(span).fontSize);
  return Number.isNaN(px) ? 16 : px;
}

/** Walk up from a node; only treat `<a>` with a non-empty `href` as a link (avoids `element.href` resolving to the page URL when `href` is missing). */
function getAncestorAnchorFromNode(editor: HTMLElement, node: Node | null): HTMLAnchorElement | null {
  let n: Node | null = node;
  if (n?.nodeType === Node.TEXT_NODE) n = n.parentElement;
  while (n && n !== editor) {
    if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === "A") {
      const href = (n as HTMLAnchorElement).getAttribute("href")?.trim();
      if (href) return n as HTMLAnchorElement;
    }
    n = n.parentElement;
  }
  return null;
}

/**
 * Link state for toolbar: caret inside a link, or a non-collapsed selection fully inside one `<a>`.
 * Using only `commonAncestorContainer` wrongly matched a parent `<a>` when the selection was plain text
 * in a paragraph that also contained a link elsewhere.
 */
function getLinkAnchorForRange(editor: HTMLElement, range: Range): HTMLAnchorElement | null {
  if (!editor.contains(range.commonAncestorContainer)) return null;

  const startAnchor = getAncestorAnchorFromNode(editor, range.startContainer);
  const endAnchor = getAncestorAnchorFromNode(editor, range.endContainer);

  if (range.collapsed) {
    return startAnchor;
  }
  if (startAnchor && startAnchor === endAnchor) {
    return startAnchor;
  }
  return null;
}

function normalizeLinkUrl(input: string): string {
  let u = input.trim();
  if (!u) return u;
  if (/^(mailto:|tel:|sms:)/i.test(u)) return u;
  if (u.startsWith("#") || u.startsWith("/") || u.startsWith("?")) return u;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

/** Custom type so dragover can allow drop reliably across browsers */
const FIGURE_DRAG_MIME = "application/x-brainfeed-inline-figure";

const BLOCK_SELECTOR = "figure.editor-inline-figure, p, h1, h2, h3, h4, li, blockquote";

function setCaretAtPoint(editor: HTMLElement, clientX: number, clientY: number): boolean {
  const doc = editor.ownerDocument;
  if (doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(clientX, clientY);
    if (r && editor.contains(r.startContainer)) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(r);
      }
      return true;
    }
  }
  const docAny = doc as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  const pos = docAny.caretPositionFromPoint?.(clientX, clientY);
  if (pos?.offsetNode && editor.contains(pos.offsetNode)) {
    const r = doc.createRange();
    r.setStart(pos.offsetNode, pos.offset);
    r.collapse(true);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(r);
    }
    return true;
  }
  return false;
}

/**
 * Move a dragged figure to the drop location. Temporarily ignores the dragged node so
 * elementFromPoint can see the block *under* it (otherwise drops on the image hit the figure and abort).
 */
function isEmptyBlock(el: HTMLElement): boolean {
  const text = (el.textContent || "").replace(/\u200b/g, "").trim();
  if (text.length > 0) return false;
  const children = Array.from(el.children);
  if (children.length === 0) return true;
  return children.length === 1 && children[0].tagName === "BR";
}

/** Figures inside <p> are invalid HTML and break caret placement (typing only “above”). Promote to block level. */
function promoteBlockFigure(editor: HTMLElement, fig: HTMLElement) {
  let parent = fig.parentElement;
  while (parent && parent !== editor && parent.tagName === "P") {
    const p = parent;
    const gp = p.parentNode;
    if (!gp) break;
    gp.insertBefore(fig, p.nextSibling);
    if (isEmptyBlock(p)) p.remove();
    parent = fig.parentElement;
  }
}

/** Ensures an editable paragraph below the figure so the caret can sit “under” the image (Word-like). */
function ensureTrailingParagraphAfterFigure(fig: HTMLElement): HTMLParagraphElement {
  let next = fig.nextSibling;
  if (next && next.nodeName === "P") {
    const p = next as HTMLParagraphElement;
    const hasRealText = Array.from(p.childNodes).some(
      (n) =>
        n.nodeType === Node.TEXT_NODE && (n.textContent || "").replace(/\u200b/g, "").trim().length > 0,
    );
    if (!hasRealText) {
      if (p.childNodes.length === 0) {
        p.appendChild(document.createTextNode("\u200b"));
        p.appendChild(document.createElement("br"));
      } else if (p.childNodes.length === 1 && p.firstChild?.nodeName === "BR") {
        p.insertBefore(document.createTextNode("\u200b"), p.firstChild);
      }
    }
    return p;
  }
  const p = document.createElement("p");
  p.appendChild(document.createTextNode("\u200b"));
  p.appendChild(document.createElement("br"));
  fig.parentNode?.insertBefore(p, fig.nextSibling);
  return p;
}

function moveFigureToDropPoint(editor: HTMLElement, dragSrc: HTMLElement, clientX: number, clientY: number) {
  const prevPeek = dragSrc.style.pointerEvents;
  dragSrc.style.pointerEvents = "none";
  let elBelow: Element | null = null;
  try {
    elBelow = document.elementFromPoint(clientX, clientY);
  } finally {
    dragSrc.style.pointerEvents = prevPeek || "";
  }

  if (!elBelow || !editor.contains(elBelow)) {
    editor.appendChild(dragSrc);
    return;
  }

  const blockEl = (elBelow as HTMLElement).closest?.(BLOCK_SELECTOR) as HTMLElement | null;
  if (!blockEl || !editor.contains(blockEl)) {
    editor.appendChild(dragSrc);
    return;
  }

  if (blockEl === dragSrc) {
    const rect = blockEl.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const parent = blockEl.parentNode;
    if (!parent) return;
    if (clientY < midY) {
      const prev = blockEl.previousElementSibling;
      if (prev) parent.insertBefore(dragSrc, prev);
    } else {
      parent.insertBefore(dragSrc, blockEl.nextSibling);
    }
    return;
  }

  const rect = blockEl.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const parent = blockEl.parentNode;
  if (!parent) return;

  if (clientY < midY) {
    parent.insertBefore(dragSrc, blockEl);
  } else {
    parent.insertBefore(dragSrc, blockEl.nextSibling);
  }
}

/** Percent width on <figure data-editor-img-width> (30–100, step 5). Saved + inline img max-width for public HTML. */
const IMG_WIDTH_MIN = 30;
const IMG_WIDTH_MAX = 100;
const IMG_WIDTH_STEP = 5;
const IMG_WRAP_MODES = ["block", "left", "right"] as const;
type ImgWrapMode = (typeof IMG_WRAP_MODES)[number];

function clampWidthPct(n: number): number {
  const s = Math.round(n / IMG_WIDTH_STEP) * IMG_WIDTH_STEP;
  return Math.min(IMG_WIDTH_MAX, Math.max(IMG_WIDTH_MIN, s));
}

/**
 * Word-like sizing: width lives on the <figure> (so the selection ring hugs the image).
 * Image fills the figure — no full-width “white” box beside a small picture.
 */
function applyFigureWidth(fig: HTMLElement, img: HTMLImageElement, pct: number): boolean {
  let changed = false;
  const w = clampWidthPct(pct);
  const ws = `${w}%`;
  fig.setAttribute("data-editor-img-width", String(w));
  fig.style.boxSizing = "border-box";
  if (fig.style.width !== ws) {
    fig.style.width = ws;
    changed = true;
  }
  if (fig.style.maxWidth !== "100%") {
    fig.style.maxWidth = "100%";
    changed = true;
  }
  if (img.style.width !== "100%") {
    img.style.width = "100%";
    changed = true;
  }
  if (img.style.maxWidth !== "100%") {
    img.style.maxWidth = "100%";
    changed = true;
  }
  if (img.style.height !== "auto") {
    img.style.height = "auto";
    changed = true;
  }
  return changed;
}

/** Sync figure width + img fill from attributes (and migrate legacy data-editor-img-size / img-only %). */
function syncFigureWidthAndMigrate(fig: HTMLElement, img: HTMLImageElement): boolean {
  let changed = false;
  const legacy = fig.getAttribute("data-editor-img-size");
  let pct = parseInt(fig.getAttribute("data-editor-img-width") || "", 10);

  const figWm = fig.style.width.trim().match(/^(\d+(?:\.\d+)?)%$/);
  if (!Number.isFinite(pct) || pct <= 0) {
    if (legacy === "sm") pct = 45;
    else if (legacy === "lg") pct = 100;
    else if (legacy === "md" || legacy) pct = 80;
    else if (figWm) pct = clampWidthPct(parseFloat(figWm[1]));
    else {
      const m = img.style.maxWidth.trim().match(/^(\d+(?:\.\d+)?)%$/);
      pct = m ? clampWidthPct(parseFloat(m[1])) : 80;
    }
    changed = true;
  }
  pct = clampWidthPct(pct);
  if (applyFigureWidth(fig, img, pct)) changed = true;
  if (legacy) {
    fig.removeAttribute("data-editor-img-size");
    changed = true;
  }

  if (!fig.getAttribute("data-editor-img-wrap")) {
    fig.setAttribute("data-editor-img-wrap", "block");
    changed = true;
  } else {
    const w = fig.getAttribute("data-editor-img-wrap") || "block";
    if (!IMG_WRAP_MODES.includes(w as ImgWrapMode)) {
      fig.setAttribute("data-editor-img-wrap", "block");
      changed = true;
    }
  }
  return changed;
}

function syncFigureRotation(fig: HTMLElement, inner: HTMLElement): boolean {
  let changed = false;
  const attr = fig.getAttribute("data-editor-img-rotate");
  let deg: number;
  if (attr != null && attr !== "") {
    deg = parseFloat(attr);
    if (!Number.isFinite(deg)) deg = 0;
  } else {
    const tx = inner.style.transform || "";
    const m = tx.match(/rotate\(([-0-9.]+)deg\)/);
    deg = m ? parseFloat(m[1]) : 0;
    if (!Number.isFinite(deg)) deg = 0;
    fig.setAttribute("data-editor-img-rotate", String(Math.round(deg * 10) / 10));
    changed = true;
  }
  inner.style.transformOrigin = "center center";
  const next = `rotate(${deg}deg)`;
  if (inner.style.transform !== next) {
    inner.style.transform = next;
    changed = true;
  }
  return changed;
}

/** Wraps legacy <figure><img></img> and adds − / + size + text-wrap + Word-style frame handles. Returns true if DOM changed. */
function ensureInlineFigureStructure(fig: HTMLElement): boolean {
  if (!fig.classList.contains("editor-inline-figure")) return false;
  let changed = false;
  if (!fig.classList.contains("group")) {
    fig.classList.add("group");
    changed = true;
  }
  fig.setAttribute("contenteditable", "false");
  fig.draggable = true;
  fig.classList.add("select-none");
  fig.title =
    "Click for resize handles & rotation. Drag block to move. − / + or L / R / B on the toolbar for size & text wrap.";

  const img = fig.querySelector("img.editor-inline-img") as HTMLImageElement | null;
  if (!img) return changed;
  img.draggable = false;
  if (syncFigureWidthAndMigrate(fig, img)) changed = true;

  let inner = fig.querySelector(".editor-inline-figure-inner") as HTMLElement | null;
  if (!inner) {
    inner = document.createElement("div");
    inner.className = "editor-inline-figure-inner relative";
    fig.insertBefore(inner, img);
    inner.appendChild(img);
    changed = true;
  }
  if (syncFigureRotation(fig, inner)) changed = true;

  const mkSizeBtn = (action: "shrink" | "grow", label: string, text: string) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "editor-img-size-btn";
    b.setAttribute("data-editor-img-action", action);
    b.setAttribute("title", label);
    b.setAttribute("aria-label", label);
    b.textContent = text;
    return b;
  };
  const mkWrapBtn = (action: ImgWrapMode, label: string, text: string) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "editor-img-size-btn";
    b.setAttribute("data-editor-img-wrap-action", action);
    b.setAttribute("title", label);
    b.setAttribute("aria-label", label);
    b.textContent = text;
    return b;
  };

  let bar = inner.querySelector(".editor-img-size-bar") as HTMLElement | null;
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "editor-img-size-bar";
    bar.setAttribute("contenteditable", "false");
    bar.appendChild(mkSizeBtn("shrink", "Smaller image", "−"));
    bar.appendChild(mkSizeBtn("grow", "Larger image", "+"));
    bar.appendChild(mkWrapBtn("left", "Float left — type beside image on the right", "L"));
    bar.appendChild(mkWrapBtn("right", "Float right — type beside image on the left", "R"));
    bar.appendChild(mkWrapBtn("block", "Full width block — text below", "B"));
    inner.insertBefore(bar, inner.firstChild);
    changed = true;
  } else if (!bar.querySelector("[data-editor-img-wrap-action]")) {
    bar.appendChild(mkWrapBtn("left", "Float left — type beside image on the right", "L"));
    bar.appendChild(mkWrapBtn("right", "Float right — type beside image on the left", "R"));
    bar.appendChild(mkWrapBtn("block", "Full width block — text below", "B"));
    changed = true;
  }

  if (!inner.querySelector(".editor-img-frame")) {
    const frame = document.createElement("div");
    frame.className = "editor-img-frame";
    frame.setAttribute("contenteditable", "false");
    const positions = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
    for (const pos of positions) {
      const h = document.createElement("div");
      h.className = `editor-img-handle editor-img-handle--${pos}`;
      h.setAttribute("data-resize-handle", pos);
      frame.appendChild(h);
    }
    const rot = document.createElement("button");
    rot.type = "button";
    rot.className = "editor-img-rotate-handle";
    rot.setAttribute("data-rotate-handle", "1");
    rot.setAttribute("aria-label", "Rotate");
    rot.title = "Drag to rotate";
    frame.appendChild(rot);
    inner.appendChild(frame);
    changed = true;
  }
  return changed;
}

/** Innermost `span[data-editor-fs]` that fully contains the range (walk up from start). */
function findFontSizeSpanForRange(range: Range, editor: HTMLElement): HTMLSpanElement | null {
  let node: Node | null = range.startContainer;
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "SPAN" && el.hasAttribute("data-editor-fs")) {
        const r = document.createRange();
        r.selectNodeContents(el);
        if (
          range.compareBoundaryPoints(Range.START_TO_START, r) >= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, r) <= 0
        ) {
          return el;
        }
      }
    }
    node = node.parentNode;
  }
  return null;
}

const FONT_STEPS = [11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 32, 36, 44] as const;

function nearestStep(px: number): number {
  return FONT_STEPS.reduce((best, s, i, arr) =>
    Math.abs(s - px) < Math.abs(arr[best] - px) ? i : best, 0);
}

function nextFontSizePx(currentPx: number, direction: "smaller" | "larger"): number {
  const idx = nearestStep(currentPx);
  if (direction === "larger") return FONT_STEPS[Math.min(idx + 1, FONT_STEPS.length - 1)];
  return FONT_STEPS[Math.max(idx - 1, 0)];
}

function getFontSizePxAt(range: Range, editor: HTMLElement): number {
  let node: Node | null = range.startContainer;
  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement) : (node as HTMLElement);

  while (el && editor.contains(el)) {
    const ds = el.getAttribute("data-editor-fs");
    if (ds) {
      const n = parseFloat(ds);
      if (!Number.isNaN(n)) return n;
    }
    const inline = el.style?.fontSize;
    if (inline && inline.endsWith("px")) {
      const n = parseFloat(inline);
      if (!Number.isNaN(n)) return n;
    }
    el = el.parentElement;
  }

  const start =
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : (range.startContainer as Element);
  if (start && editor.contains(start)) {
    const px = parseFloat(window.getComputedStyle(start).fontSize);
    return Number.isNaN(px) ? 16 : px;
  }
  return 16;
}

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** full = headings, A+/A-, text color (news post). basic = simpler toolbar (pages). */
  variant?: "full" | "basic";
  /**
   * When set (e.g. admin news), enables upload + paste-to-insert for inline images
   * via POST /api/admin/posts/inline-image — inserts responsive <figure><img> in the body.
   */
  uploadInlineImage?: (file: File) => Promise<string>;
};

/**
 * contentEditable + execCommand editor with reliable selection handling:
 * toolbar uses mousedown preventDefault so formatting applies to the user's selection, not random nodes.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  variant = "full",
  uploadInlineImage,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternal = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const emit = () => {
    if (!ref.current) return;
    isInternal.current = true;
    onChangeRef.current(ref.current.innerHTML);
  };
  const emitRef = useRef(emit);
  emitRef.current = emit;
  const savedRange = useRef<Range | null>(null);
  const [formatState, setFormatState] = useState({ bold: false, italic: false, underline: false, strike: false });
  const [currentBlock, setCurrentBlock] = useState<"p" | "h1" | "h2" | "h3" | "h4">("p");
  const [inlineImageBusy, setInlineImageBusy] = useState(false);
  /** URL of <a> at caret / selection — so authors can confirm before saving. */
  const [selectionLinkUrl, setSelectionLinkUrl] = useState<string | null>(null);

  const captureSelection = useCallback(() => captureEditorSelection(ref.current, savedRange), []);
  const toolbarMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      captureSelection();
    },
    [captureSelection],
  );

  const updateFormatState = useCallback(() => {
    const el = ref.current;
    if (!el || !document.contains(el)) return;
    const sel = window.getSelection();
    const inEditor = sel && (el.contains(sel.anchorNode) || el.contains(sel.focusNode));
    if (!inEditor) {
      setSelectionLinkUrl(null);
      return;
    }
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strike: document.queryCommandState("strikeThrough"),
    });

    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      const anchor = getLinkAnchorForRange(el, r);
      const href = anchor?.getAttribute("href")?.trim();
      setSelectionLinkUrl(href || null);
    } else {
      setSelectionLinkUrl(null);
    }

    const rawBlock = (document.queryCommandValue("formatBlock") || "")
      .toString()
      .replace(/[<>]/g, "")
      .toLowerCase();
    if (rawBlock === "div") {
      setCurrentBlock("p");
    } else if (rawBlock === "h1" || rawBlock === "h2" || rawBlock === "h3" || rawBlock === "h4" || rawBlock === "p") {
      setCurrentBlock(rawBlock);
    } else {
      setCurrentBlock("p");
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (isInternal.current) {
      isInternal.current = false;
      return;
    }
    if (ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
    /* Loaded/saved HTML: figures as draggable islands + − / + size controls */
    let structureChanged = false;
    ref.current.querySelectorAll("figure.editor-inline-figure").forEach((node) => {
      const fig = node as HTMLElement;
      if (ensureInlineFigureStructure(fig)) structureChanged = true;
      /* Allow typing below the image: ensure a paragraph exists after the figure block */
      if (fig.nextSibling === null && fig.parentNode) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode("\u200b"));
        p.appendChild(document.createElement("br"));
        fig.parentNode.appendChild(p);
        structureChanged = true;
      }
    });
    if (structureChanged) {
      isInternal.current = true;
      onChangeRef.current(ref.current.innerHTML);
    }
  }, [value]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateFormatState);
    return () => document.removeEventListener("selectionchange", updateFormatState);
  }, [updateFormatState]);

  /** − / + / wrap buttons on inline images (pointerdown + capture so contenteditable doesn’t swallow) */
  useEffect(() => {
    const ed = ref.current;
    if (!ed) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const sizeBtn = t.closest("[data-editor-img-action]");
      const wrapBtn = t.closest("[data-editor-img-wrap-action]");
      const btn = (sizeBtn || wrapBtn) as HTMLElement | null;
      if (!btn || !ed.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      const fig = btn.closest("figure.editor-inline-figure") as HTMLElement | null;
      if (!fig) return;
      const img = fig.querySelector("img.editor-inline-img") as HTMLImageElement | null;
      if (!img) return;

      if (sizeBtn) {
        const action = sizeBtn.getAttribute("data-editor-img-action");
        let pct = clampWidthPct(parseInt(fig.getAttribute("data-editor-img-width") || "80", 10));
        if (action === "shrink") pct = clampWidthPct(pct - IMG_WIDTH_STEP);
        else if (action === "grow") pct = clampWidthPct(pct + IMG_WIDTH_STEP);
        applyFigureWidth(fig, img, pct);
      } else if (wrapBtn) {
        const mode = wrapBtn.getAttribute("data-editor-img-wrap-action") as ImgWrapMode | null;
        if (mode && IMG_WRAP_MODES.includes(mode)) fig.setAttribute("data-editor-img-wrap", mode);
      }
      emitRef.current();
      requestAnimationFrame(() => updateFormatState());
    };
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(".editor-img-size-bar")) e.stopPropagation();
    };
    ed.addEventListener("pointerdown", onPointerDown, true);
    ed.addEventListener("mousedown", onMouseDown, true);
    return () => {
      ed.removeEventListener("pointerdown", onPointerDown, true);
      ed.removeEventListener("mousedown", onMouseDown, true);
    };
  }, [updateFormatState]);

  /** Word-style selection ring + drag resize / rotate handles */
  useEffect(() => {
    const ed = ref.current;
    if (!ed) return;

    type ResizeSession = {
      fig: HTMLElement;
      img: HTMLImageElement;
      handle: string;
      startX: number;
      startY: number;
      /** Figure width in px at drag start — resize by pixel delta (Word-like), then map to % of editor. */
      startFigWidthPx: number;
      editorW: number;
    };
    type RotateSession = {
      fig: HTMLElement;
      inner: HTMLElement;
      cx: number;
      cy: number;
      startAngle: number;
      startRotate: number;
    };

    let resize: ResizeSession | null = null;
    let rotate: RotateSession | null = null;

    const clearSelectionExcept = (keep: HTMLElement | null) => {
      ed.querySelectorAll("figure.editor-inline-figure.editor-selected").forEach((f) => {
        if (keep && f === keep) return;
        f.classList.remove("editor-selected");
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (resize) {
        e.preventDefault();
        const dX = e.clientX - resize.startX;
        const dY = e.clientY - resize.startY;
        const h = resize.handle;
        let dw = 0;
        if (h.includes("e") || h === "se" || h === "ne") dw += dX;
        if (h.includes("w") || h === "sw" || h === "nw") dw -= dX;
        if (h === "s" || h === "se" || h === "sw") dw += dY * 0.35;
        if (h === "n" || h === "ne" || h === "nw") dw -= dY * 0.35;
        const newW = Math.max(24, resize.startFigWidthPx + dw);
        const next = clampWidthPct((newW / resize.editorW) * 100);
        applyFigureWidth(resize.fig, resize.img, next);
      }
      if (rotate) {
        e.preventDefault();
        const angle = (Math.atan2(e.clientY - rotate.cy, e.clientX - rotate.cx) * 180) / Math.PI;
        let deg = rotate.startRotate + (angle - rotate.startAngle);
        while (deg > 180) deg -= 360;
        while (deg < -180) deg += 360;
        rotate.fig.setAttribute("data-editor-img-rotate", String(Math.round(deg * 10) / 10));
        rotate.inner.style.transform = `rotate(${deg}deg)`;
        rotate.inner.style.transformOrigin = "center center";
      }
    };

    const endDrag = () => {
      if (resize || rotate) {
        emitRef.current();
        requestAnimationFrame(() => updateFormatState());
      }
      resize = null;
      rotate = null;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
    };

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ed.contains(t)) return;

      const rh = t.closest("[data-resize-handle]") as HTMLElement | null;
      const roth = t.closest("[data-rotate-handle]") as HTMLElement | null;

      if (rh || roth) {
        const fig = t.closest("figure.editor-inline-figure") as HTMLElement | null;
        const inner = fig?.querySelector(".editor-inline-figure-inner") as HTMLElement | null;
        const img = fig?.querySelector("img.editor-inline-img") as HTMLImageElement | null;
        if (!fig || !ed.contains(fig) || !inner || !img) return;

        e.preventDefault();
        e.stopPropagation();
        clearSelectionExcept(null);
        fig.classList.add("editor-selected");

        if (rh) {
          const handle = rh.getAttribute("data-resize-handle") || "e";
          const edRect = ed.getBoundingClientRect();
          const figRect = fig.getBoundingClientRect();
          resize = {
            fig,
            img,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startFigWidthPx: Math.max(1, figRect.width),
            editorW: Math.max(1, edRect.width),
          };
          rotate = null;
        } else {
          const r = inner.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
          const startRotate = parseFloat(fig.getAttribute("data-editor-img-rotate") || "0") || 0;
          rotate = { fig, inner, cx, cy, startAngle, startRotate };
          resize = null;
        }

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", endDrag);
        document.addEventListener("pointercancel", endDrag);
        return;
      }

      if (t.closest(".editor-img-size-bar")) return;

      const fig = t.closest("figure.editor-inline-figure") as HTMLElement | null;
      clearSelectionExcept(fig);
      if (fig && ed.contains(fig)) fig.classList.add("editor-selected");
    };

    ed.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      ed.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
    };
  }, [updateFormatState]);

  /** HTML5 drag state for reordering figures (ref survives async / React batching). */
  const dragSrcRef = useRef<HTMLElement | null>(null);
  const uploadInlineImageRef = useRef(uploadInlineImage);
  uploadInlineImageRef.current = uploadInlineImage;
  const insertInlineRef = useRef<(url: string, alt: string) => void>(() => {});

  const restoreSavedSelection = (): boolean => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel) return false;

    el.focus();

    if (savedRange.current) {
      const r = savedRange.current;
      const inEditor =
        el.contains(r.startContainer) || el.contains(r.endContainer) || el.contains(r.commonAncestorContainer);
      if (inEditor) {
        try {
          sel.removeAllRanges();
          sel.addRange(r);
          return true;
        } catch {
          savedRange.current = null;
        }
      }
    }

    if (sel.rangeCount > 0) {
      const cur = sel.getRangeAt(0);
      if (el.contains(cur.commonAncestorContainer)) return true;
    }
    return false;
  };

  const cmd = (command: string, value?: string) => {
    const el = ref.current;
    if (!el) return;
    restoreSavedSelection();
    document.execCommand(command, false, value);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
    emit();
    requestAnimationFrame(() => updateFormatState());
  };

  const addLink = () => {
    const raw = window.prompt("Link URL (https://…):", selectionLinkUrl || "");
    if (raw === null) return;
    const url = normalizeLinkUrl(raw);
    if (!url) {
      toast.error("Enter a valid URL.");
      return;
    }
    restoreSavedSelection();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      toast.error("Select text first to add a link.");
      return;
    }
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      toast.error("Select text first to add a link.");
      return;
    }

    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.appendChild(range.extractContents());
      range.insertNode(a);

      /* Caret inside <a> so “Linked to” preview stays visible until you move away */
      const after = document.createRange();
      after.setStart(a, 0);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
      savedRange.current = after.cloneRange();

      emit();
      requestAnimationFrame(() => updateFormatState());
      toast.success("Link set — check the bar below before posting.", {
        description: url,
        duration: 6000,
      });
    } catch {
      cmd("createLink", url);
      toast.success("Link set — check the bar below before posting.", { description: url, duration: 6000 });
    }
  };

  const editCurrentLink = () => {
    const el = ref.current;
    if (!el) return;
    restoreSavedSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      toast.error("Click a link or select linked text.");
      return;
    }
    const range = sel.getRangeAt(0);
    const a = getLinkAnchorForRange(el, range);
    if (!a) {
      toast.error("No link at this selection.");
      return;
    }
    const current = a.getAttribute("href") || "";
    const raw = window.prompt("Edit link URL:", current);
    if (raw === null) return;
    const url = normalizeLinkUrl(raw);
    if (!url) {
      toast.error("Enter a valid URL.");
      return;
    }
    a.href = url;
    emit();
    requestAnimationFrame(() => updateFormatState());
    toast.success("Link updated.", { description: url, duration: 5000 });
  };

  /** Inserts a responsive figure+img at the caret (WordPress-style inline images). */
  const insertInlineImageAtCursor = (imageUrl: string, alt: string) => {
    const el = ref.current;
    if (!el) return;

    if (!restoreSavedSelection()) {
      el.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        if (el.contains(r.commonAncestorContainer)) {
          savedRange.current = r.cloneRange();
        }
      }
      if (!restoreSavedSelection()) {
        const sel2 = window.getSelection();
        const end = document.createRange();
        end.selectNodeContents(el);
        end.collapse(false);
        if (sel2) {
          sel2.removeAllRanges();
          sel2.addRange(end);
          savedRange.current = end.cloneRange();
        }
      }
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const fig = document.createElement("figure");
    fig.className = "editor-inline-figure editor-inline-draggable select-none";
    fig.setAttribute("data-editor-img-width", "55");
    /* Float left + ~half width so text can sit beside (Word-like); user can tap B for block or R for right. */
    fig.setAttribute("data-editor-img-wrap", "left");
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = alt.trim();
    img.loading = "lazy";
    img.decoding = "async";
    img.className = "editor-inline-img";
    fig.appendChild(img);

    try {
      range.deleteContents();
      range.insertNode(fig);
    } catch {
      el.appendChild(fig);
    }

    promoteBlockFigure(el, fig);
    ensureInlineFigureStructure(fig);
    const p = ensureTrailingParagraphAfterFigure(fig);

    const nr = document.createRange();
    const fc = p.firstChild;
    if (fc && fc.nodeType === Node.TEXT_NODE) {
      nr.setStart(fc, 0);
    } else {
      nr.setStart(p, 0);
    }
    nr.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nr);
    savedRange.current = nr.cloneRange();
    el.focus();
    emit();
    requestAnimationFrame(() => updateFormatState());
  };

  const insertImageFromUrl = () => {
    const url = window.prompt("Image URL (https://…):");
    if (!url?.trim()) return;
    const alt = window.prompt("Alt text (accessibility, recommended):", "") ?? "";
    insertInlineImageAtCursor(url.trim(), alt);
  };

  const onInlineImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !uploadInlineImage) return;
    setInlineImageBusy(true);
    try {
      let sharedAlt: string | null = null;
      if (files.length > 1) {
        sharedAlt = window.prompt(
          `Alt text for all ${files.length} images (optional — leave empty to use each file name):`,
          "",
        );
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadInlineImage(file);
        if (!url) throw new Error("No image URL returned");
        const defaultAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        let alt: string;
        if (files.length === 1) {
          alt = window.prompt("Alt text (accessibility, recommended):", defaultAlt) ?? "";
        } else if (sharedAlt && sharedAlt.trim()) {
          alt = files.length > 1 ? `${sharedAlt.trim()} (${i + 1})` : sharedAlt.trim();
        } else {
          alt = defaultAlt;
        }
        insertInlineImageAtCursor(url, alt);
      }

      toast.success(
        files.length === 1
          ? "Image inserted. Drag the image block to place it between paragraphs."
          : `${files.length} images inserted. Drag blocks to reorder.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setInlineImageBusy(false);
    }
  };

  insertInlineRef.current = insertInlineImageAtCursor;

  const handleEditorDragStart = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest?.(".editor-img-size-bar") || t.closest?.(".editor-img-frame")) {
      e.preventDefault();
      return;
    }
    const fig = t.closest?.("figure.editor-inline-figure") as HTMLElement | null;
    const ed = ref.current;
    if (!fig || !ed?.contains(fig)) return;
    dragSrcRef.current = fig;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(FIGURE_DRAG_MIME, "1");
    e.dataTransfer.setData("text/plain", "");
  }, []);

  const handleEditorDragEnd = useCallback(() => {
    dragSrcRef.current = null;
  }, []);

  const handleEditorDragOver = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    const types = e.dataTransfer?.types;
    const hasInternal =
      dragSrcRef.current != null || (types != null && Array.from(types).includes(FIGURE_DRAG_MIME));
    const hasFiles = types != null && Array.from(types).includes("Files");
    if (hasInternal || (hasFiles && uploadInlineImageRef.current)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = hasFiles && !dragSrcRef.current ? "copy" : "move";
    }
  }, []);

  const handleEditorDragEnter = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    const types = e.dataTransfer?.types;
    if (types && Array.from(types).includes("Files") && uploadInlineImageRef.current) {
      e.preventDefault();
    }
  }, []);

  const handleEditorDrop = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const ed = ref.current;
      if (!ed) return;

      const dragSrc = dragSrcRef.current;
      const files = e.dataTransfer?.files;

      if (files && files.length && uploadInlineImageRef.current && !dragSrc) {
        const file = Array.from(files).find((f) => f.type.startsWith("image/"));
        if (file) {
          const upload = uploadInlineImageRef.current;
          if (!upload) return;
          setCaretAtPoint(ed, e.clientX, e.clientY);
          setInlineImageBusy(true);
          void upload(file)
            .then((url) => {
              if (!url) throw new Error("No image URL returned");
              const defaultAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
              insertInlineRef.current(url, defaultAlt);
              toast.success("Image placed in article.");
            })
            .catch((err) => {
              toast.error(err instanceof Error ? err.message : "Upload failed");
            })
            .finally(() => setInlineImageBusy(false));
        }
        return;
      }

      if (!dragSrc || !ed.contains(dragSrc)) return;
      moveFigureToDropPoint(ed, dragSrc, e.clientX, e.clientY);
      emitRef.current();
      requestAnimationFrame(() => updateFormatState());
    },
    [updateFormatState],
  );

  const handlePasteInlineImage = async (e: ReactClipboardEvent<HTMLDivElement>) => {
    if (!uploadInlineImage || inlineImageBusy) return;
    const files = e.clipboardData?.files;
    if (!files?.length) return;
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    e.preventDefault();
    setInlineImageBusy(true);
    try {
      const url = await uploadInlineImage(file);
      if (!url) throw new Error("No image URL returned");
      insertInlineImageAtCursor(url, "Pasted image");
      toast.success("Image pasted into article.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setInlineImageBusy(false);
    }
  };

  const btn = (active: boolean) =>
    active ? "h-8 w-8 bg-accent/20 text-accent hover:bg-accent/30" : "h-8 w-8";

  const applyHeading = (level: "p" | "h1" | "h2" | "h3" | "h4") => {
    const tag = level === "p" ? "p" : level;
    cmd("formatBlock", `<${tag}>`);
  };

  const changeFontSize = (direction: "smaller" | "larger") => {
    const el = ref.current;
    if (!el) return;

    if (!restoreSavedSelection()) {
      toast.error("Click in the editor and select text first.");
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      toast.error("Select text to change size.");
      return;
    }

    const fsSpan = findFontSizeSpanForRange(range, el);
    if (fsSpan && selectionCoversSpanText(range, fsSpan)) {
      const currentPx = getPxFromFontSizeSpan(fsSpan);
      const nextPx = nextFontSizePx(currentPx, direction);
      fsSpan.style.fontSize = `${nextPx}px`;
      fsSpan.setAttribute("data-editor-fs", String(nextPx));

      const newSel = window.getSelection();
      if (newSel) {
        newSel.removeAllRanges();
        const nr = document.createRange();
        nr.selectNodeContents(fsSpan);
        newSel.addRange(nr);
        savedRange.current = nr.cloneRange();
      }

      emit();
      requestAnimationFrame(() => updateFormatState());
      return;
    }

    const currentPx = getFontSizePxAt(range, el);
    const nextPx = nextFontSizePx(currentPx, direction);

    const span = document.createElement("span");
    span.style.fontSize = `${nextPx}px`;
    span.setAttribute("data-editor-fs", String(nextPx));

    try {
      range.surroundContents(span);
    } catch {
      // Selection crosses element boundaries — wrap using extractContents (keeps structure inside fragment).
      try {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      } catch {
        toast.error("Could not resize this selection. Try a smaller selection.");
        return;
      }
    }

    const newSel = window.getSelection();
    if (newSel) {
      newSel.removeAllRanges();
      const nr = document.createRange();
      nr.selectNodeContents(span);
      newSel.addRange(nr);
      savedRange.current = nr.cloneRange();
    }

    emit();
    requestAnimationFrame(() => updateFormatState());
  };

  const applyTextColor = (color: string) => {
    if (!color) return;
    restoreSavedSelection();
    try {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, color);
    } finally {
      document.execCommand("styleWithCSS", false, "false");
    }
    const el = ref.current;
    const sel = window.getSelection();
    if (el && sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
    emit();
    requestAnimationFrame(() => updateFormatState());
  };

  /** Clears inline styles only — does not toggle lists/headings (avoids “one thing turns another on”). */
  const clearFormatting = () => {
    const el = ref.current;
    if (!el) return;

    restoreSavedSelection();

    document.execCommand("removeFormat", false);
    document.execCommand("unlink", false);

    el.querySelectorAll("span[data-editor-fs], span.editor-fs-lg, span.editor-fs-sm").forEach((node) => {
      const span = node as HTMLElement;
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    });

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
    emit();
    requestAnimationFrame(() => updateFormatState());
  };

  const blockLabel: Record<string, string> = {
    p: "Paragraph",
    h1: "Heading 1",
    h2: "Heading 2",
    h3: "Heading 3",
    h4: "Heading 4",
  };

  const editorClassName =
    variant === "full"
      ? "rich-editor-body flow-root min-h-[200px] p-3 text-foreground focus:outline-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h1]:text-[1.8rem] [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mt-3 [&_h1]:mb-2 [&_h2]:text-[1.5rem] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-[1.25rem] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:mt-2.5 [&_h3]:mb-1.5 [&_h4]:text-[1.05rem] [&_h4]:font-semibold [&_h4]:leading-snug [&_h4]:mt-2 [&_h4]:mb-1 [&_.editor-fs-lg]:text-lg [&_.editor-fs-sm]:text-xs [&_.editor-inline-figure]:my-4 [&_.editor-inline-figure]:cursor-grab [&_.editor-inline-figure]:active:cursor-grabbing [&_.editor-inline-figure]:rounded-lg [&_.editor-inline-figure]:ring-1 [&_.editor-inline-figure]:ring-border/40 [&_.editor-inline-figure-inner]:min-h-[2.5rem] [&_.editor-inline-img]:h-auto [&_.editor-inline-img]:rounded-lg [&_.editor-inline-img]:block [&_.editor-img-size-bar]:pointer-events-auto [&_.editor-img-size-bar]:absolute [&_.editor-img-size-bar]:top-2 [&_.editor-img-size-bar]:right-2 [&_.editor-img-size-bar]:z-20 [&_.editor-img-size-bar]:flex [&_.editor-img-size-bar]:flex-wrap [&_.editor-img-size-bar]:gap-0.5 [&_.editor-img-size-bar]:rounded-md [&_.editor-img-size-bar]:border [&_.editor-img-size-bar]:border-border [&_.editor-img-size-bar]:bg-background/95 [&_.editor-img-size-bar]:p-0.5 [&_.editor-img-size-bar]:shadow-sm [&_.editor-img-size-bar]:opacity-0 [&_.editor-img-size-bar]:transition-opacity [&_.editor-inline-figure:hover_.editor-img-size-bar]:opacity-100 [&_.editor-inline-figure:focus-within_.editor-img-size-bar]:opacity-100 [&_.editor-img-size-btn]:flex [&_.editor-img-size-btn]:h-7 [&_.editor-img-size-btn]:min-w-[1.75rem] [&_.editor-img-size-btn]:items-center [&_.editor-img-size-btn]:justify-center [&_.editor-img-size-btn]:rounded [&_.editor-img-size-btn]:text-xs [&_.editor-img-size-btn]:font-bold [&_.editor-img-size-btn]:text-foreground [&_.editor-img-size-btn]:hover:bg-muted empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
      : "rich-editor-body min-h-[200px] p-3 text-foreground focus:outline-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:text-xl [&_h2]:font-semibold empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground";

  return (
    <div className="rounded-md border border-input bg-background overflow-visible">
      <div
        className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-input bg-muted/50"
        onPointerDownCapture={captureSelection}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btn(formatState.bold)}
          onMouseDown={toolbarMouseDown}
          onClick={() => cmd("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btn(formatState.italic)}
          onMouseDown={toolbarMouseDown}
          onClick={() => cmd("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btn(formatState.underline)}
          onMouseDown={toolbarMouseDown}
          onClick={() => cmd("underline")}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btn(formatState.strike)}
          onMouseDown={toolbarMouseDown}
          onClick={() => cmd("strikeThrough")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <span className="w-px h-6 bg-border mx-0.5" />

        {variant === "full" ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={toolbarMouseDown}
              onClick={() => applyHeading("h2")}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-[11px] text-muted-foreground border border-border"
                  onMouseDown={toolbarMouseDown}
                >
                  {blockLabel[currentBlock]}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[10rem]"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {(["p", "h1", "h2", "h3", "h4"] as const).map((lvl) => (
                  <DropdownMenuItem
                    key={lvl}
                    onPointerDown={captureSelection}
                    onSelect={() => requestAnimationFrame(() => applyHeading(lvl))}
                  >
                    {blockLabel[lvl]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onMouseDown={toolbarMouseDown}
            onClick={() => cmd("formatBlock", "<h2>")}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={toolbarMouseDown}
          onClick={() => cmd("insertUnorderedList")}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={toolbarMouseDown}
          onClick={() => cmd("insertOrderedList")}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={toolbarMouseDown}
          onClick={addLink}
          title="Link — select a word or sentence in the box, then click and paste the URL"
          aria-label="Add link to selected text"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {variant === "full" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              aria-hidden
              onChange={onInlineImageFileChange}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={inlineImageBusy}
                  onMouseDown={toolbarMouseDown}
                  title="Insert image in article"
                >
                  {inlineImageBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[12rem]" onCloseAutoFocus={(e) => e.preventDefault()}>
                {uploadInlineImage ? (
                  <DropdownMenuItem
                    onPointerDown={captureSelection}
                    onSelect={() => requestAnimationFrame(() => fileInputRef.current?.click())}
                  >
                    Upload image…
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onPointerDown={captureSelection} onSelect={() => requestAnimationFrame(insertImageFromUrl)}>
                  Image from URL…
                </DropdownMenuItem>
                {uploadInlineImage ? (
                  <div className="px-2 py-1.5 text-[11px] text-muted-foreground leading-snug border-t border-border mt-1">
                    Tip: new images float left so you can type beside them (use B for centered block, R to float right). Click for handles — resize drags the frame, not a zoom. Drag the block to reorder; paste or drop files.
                  </div>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {variant === "full" && (
          <>
            <span className="w-px h-6 bg-border mx-0.5" />
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-xs font-semibold"
                onMouseDown={toolbarMouseDown}
                onClick={() => changeFontSize("smaller")}
                title="Smaller text"
              >
                A-
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-xs font-semibold"
                onMouseDown={toolbarMouseDown}
                onClick={() => changeFontSize("larger")}
                title="Larger text"
              >
                A+
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-8 gap-1 px-2 text-[11px] text-muted-foreground border border-border"
                  onMouseDown={toolbarMouseDown}
                >
                  Text color
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[10rem]"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem
                  onPointerDown={captureSelection}
                  onSelect={() => requestAnimationFrame(() => applyTextColor("#111827"))}
                >
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onPointerDown={captureSelection}
                  onSelect={() => requestAnimationFrame(() => applyTextColor("#374151"))}
                >
                  Muted
                </DropdownMenuItem>
                <DropdownMenuItem
                  onPointerDown={captureSelection}
                  onSelect={() => requestAnimationFrame(() => applyTextColor("#DC2626"))}
                >
                  Red
                </DropdownMenuItem>
                <DropdownMenuItem
                  onPointerDown={captureSelection}
                  onSelect={() => requestAnimationFrame(() => applyTextColor("#2563EB"))}
                >
                  Blue
                </DropdownMenuItem>
                <DropdownMenuItem
                  onPointerDown={captureSelection}
                  onSelect={() => requestAnimationFrame(() => applyTextColor("#059669"))}
                >
                  Green
                </DropdownMenuItem>
                <DropdownMenuItem
                  onPointerDown={captureSelection}
                  onSelect={() => requestAnimationFrame(() => applyTextColor("#CA8A04"))}
                >
                  Gold
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={toolbarMouseDown}
          onClick={clearFormatting}
          title="Clear formatting"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      {selectionLinkUrl ? (
        <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-input bg-muted/40 text-[11px]">
          <span className="text-muted-foreground font-medium shrink-0">Linked to:</span>
          <a
            href={selectionLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-mono break-all min-w-0 flex-1 underline-offset-2 hover:underline"
            title={selectionLinkUrl}
          >
            {selectionLinkUrl}
          </a>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 text-[10px] shrink-0"
            onMouseDown={toolbarMouseDown}
            onClick={editCurrentLink}
          >
            Change URL
          </Button>
        </div>
      ) : null}

      <div
        ref={ref}
        contentEditable
        className={editorClassName}
        data-placeholder={placeholder}
        onInput={emit}
        onPaste={uploadInlineImage ? handlePasteInlineImage : undefined}
        onMouseUp={updateFormatState}
        onKeyUp={updateFormatState}
        onDragStart={handleEditorDragStart}
        onDragEnd={handleEditorDragEnd}
        onDragOver={handleEditorDragOver}
        onDragEnter={handleEditorDragEnter}
        onDrop={handleEditorDrop}
        suppressContentEditableWarning
      />
    </div>
  );
}

export default RichTextEditor;

/// <reference types="vite/client" />

declare module "react-pageflip" {
  import type { CSSProperties, ReactNode, ForwardRefExoticComponent, RefAttributes } from "react";

  export interface HTMLFlipBookProps {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    renderOnlyPageLengthChange?: boolean;
    className?: string;
    style?: CSSProperties;
    startPage?: number;
    onFlip?: (e: unknown) => void;
    children?: ReactNode;
  }

  const HTMLFlipBook: ForwardRefExoticComponent<
    HTMLFlipBookProps & RefAttributes<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } }>
  >;
  export default HTMLFlipBook;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export {};

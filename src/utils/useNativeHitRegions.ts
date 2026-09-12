import { useLayoutEffect, useRef } from 'react';
import { isTauri, NativeHitRegion, setNativeHitRegions } from './tauriBridge';

const HIT_REGION_SELECTOR = '[data-native-hit-region]';

const toPhysicalRegion = (element: HTMLElement): NativeHitRegion | null => {
  const rect = element.getBoundingClientRect();
  const paddingValue = Number(element.dataset.nativeHitPadding || 0);
  const padding = Number.isFinite(paddingValue) && paddingValue > 0 ? paddingValue : 0;
  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const right = Math.min(window.innerWidth, rect.right + padding);
  const bottom = Math.min(window.innerHeight, rect.bottom + padding);
  if (!Number.isFinite(left) || !Number.isFinite(top) || right <= left || bottom <= top) return null;

  const dpr = window.devicePixelRatio;
  const scale = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const physicalLeft = Math.floor(left * scale);
  const physicalTop = Math.floor(top * scale);
  const physicalRight = Math.ceil(right * scale);
  const physicalBottom = Math.ceil(bottom * scale);
  return {
    x: physicalLeft,
    y: physicalTop,
    width: Math.max(1, physicalRight - physicalLeft),
    height: Math.max(1, physicalBottom - physicalTop),
    ...(element.dataset.nativeHitShape === 'ellipse' ? { shape: 'ellipse' as const } : {})
  };
};

/**
 * Sends explicit visible component rectangles to native hit testing.
 * DOM mutations cover mount/unmount and Framer Motion transforms; resize and
 * scroll events cover responsive layout and viewport/DPI changes.
 */
export const useNativeHitRegions = (stateKey = '') => {
  const frameRef = useRef<number | null>(null);
  const lastSignatureRef = useRef('');

  useLayoutEffect(() => {
    if (!isTauri() || typeof document === 'undefined') return;

    let disposed = false;
    lastSignatureRef.current = '';
    const resizeObserver = new ResizeObserver(() => schedule());

    const measure = () => {
      frameRef.current = null;
      if (disposed) return;
      const elements = Array.from(document.querySelectorAll<HTMLElement>(HIT_REGION_SELECTOR));
      elements.forEach(element => resizeObserver.observe(element));
      const regions = elements
        .map(toPhysicalRegion)
        .filter((region): region is NativeHitRegion => region !== null);
      const signature = JSON.stringify(regions);
      if (signature === lastSignatureRef.current) return;
      void setNativeHitRegions(regions).then(applied => {
        if (disposed) return;
        if (applied) lastSignatureRef.current = signature;
        else schedule();
      });
    };

    const schedule = () => {
      if (disposed || frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(measure);
    };

    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-native-hit-region', 'data-native-hit-padding']
    });

    const visualViewport = window.visualViewport;
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    visualViewport?.addEventListener('resize', schedule);
    visualViewport?.addEventListener('scroll', schedule);
    schedule();
    const followUpFrames: number[] = [];
    let animationFramesRemaining = 14;
    const followAnimation = () => {
      if (disposed || animationFramesRemaining <= 0) return;
      animationFramesRemaining -= 1;
      schedule();
      followUpFrames.push(window.requestAnimationFrame(followAnimation));
    };
    followUpFrames.push(window.requestAnimationFrame(followAnimation));

    return () => {
      disposed = true;
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      visualViewport?.removeEventListener('resize', schedule);
      visualViewport?.removeEventListener('scroll', schedule);
      followUpFrames.forEach(frame => window.cancelAnimationFrame(frame));
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [stateKey]);
};

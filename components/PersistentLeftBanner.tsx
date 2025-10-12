'use client';
import React, { useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LeftBanner from './LeftBanner';

export const BANNER_W = 260;

export default function PersistentLeftBanner() {
  const pathname = usePathname();
  const isProjects = pathname === '/projects' || (pathname?.startsWith('/projects') ?? false);

  const [top, setTop] = useState(0);
  const [height, setHeight] = useState<number | '100vh'>('100vh');

  useLayoutEffect(() => {
    if (!isProjects) {
      setTop(0);
      setHeight('100vh');
      return;
    }

    const el = document.querySelector('.shell') as HTMLElement | null;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setTop(Math.max(0, Math.round(r.top)));
      setHeight(Math.max(0, Math.round(r.height)));
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    update();

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update);
    };
  }, [isProjects]);

  return (
    <div style={{ position: 'fixed', left: 0, top, height, width: BANNER_W, boxSizing: 'border-box', zIndex: 1000, display: 'flex' }}>
      <div style={{ flex: 1, height: '100%' }}>
        <LeftBanner />
      </div>
    </div>
  );
}

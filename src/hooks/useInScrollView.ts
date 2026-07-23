'use client';

import { useRef, useState, useEffect, CSSProperties } from 'react';

export function useInScrollView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export function scrollStyle(
  isInView: boolean,
  options?: { delay?: number; direction?: 'up' | 'left' | 'right' }
): CSSProperties {
  const delay = options?.delay ?? 0;
  const dir = options?.direction ?? 'up';

  const transforms: Record<string, string> = {
    up: `translateY(${isInView ? '0px' : '24px'})`,
    left: `translateX(${isInView ? '0px' : '24px'})`,
    right: `translateX(${isInView ? '0px' : '-24px'})`,
  };

  return {
    opacity: isInView ? 1 : 0,
    transform: transforms[dir],
    transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
  };
}

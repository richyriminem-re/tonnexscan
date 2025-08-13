import { useEffect, useRef, useState } from "react";

interface ScrollFadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollFadeIn({ children, className = "", delay = 0 }: ScrollFadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fallback: make visible after a short delay even if observer doesn't work
    const fallbackTimer = setTimeout(() => setIsVisible(true), delay + 100);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallbackTimer);
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [delay]);

  return (
    <div 
      ref={ref} 
      className={`fade-in-up ${isVisible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
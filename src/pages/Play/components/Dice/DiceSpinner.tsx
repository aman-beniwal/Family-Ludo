import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import animationData from '../../../../assets/theme/dice-spin.json';

type Props = {
  className?: string;
};

/**
 * Plays the rolling-dice Lottie loop (an embedded image-sequence animation)
 * while a roll is in progress. Uses the canvas renderer — cheaper than SVG for
 * an image-sequence and smoother in the iPad WKWebView. The animation only
 * mounts during the spin, so it costs nothing while idle.
 */
export function DiceSpinner({ className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const anim = lottie.loadAnimation({
      container,
      renderer: 'canvas',
      loop: true,
      autoplay: true,
      animationData,
    });
    anim.setSpeed(1.15); // 15% snappier spin
    return () => anim.destroy();
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}

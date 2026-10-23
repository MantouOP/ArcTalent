'use client';

import dynamic from 'next/dynamic';
import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import './unicorn-background.css';

const UnicornScene = dynamic(() => import('unicornstudio-react/next'), {
  ssr: false,
});

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function UnicornBackground() {
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>(
    'loading',
  );

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setMotionAllowed(!preference.matches);
    syncPreference();
    preference.addEventListener('change', syncPreference);
    return () => preference.removeEventListener('change', syncPreference);
  }, []);

  const handleLoad = useCallback(() => setStatus('ready'), []);
  const handleError = useCallback(() => setStatus('unavailable'), []);

  return (
    <div
      className="unicorn-background"
      aria-hidden="true"
      inert
      data-state={motionAllowed ? status : 'static'}
    >
      {motionAllowed && status !== 'unavailable' && (
        <SceneBoundary onError={handleError}>
          <UnicornScene
            projectId="1tL5S72Xeil63nK5HBc1"
            width="100%"
            height="100%"
            scale={1}
            dpi={1.5}
            fps={30}
            className="unicorn-background__scene"
            production
            lazyLoad
            showPlaceholderWhileLoading={false}
            showPlaceholderOnError={false}
            onLoad={handleLoad}
            onError={handleError}
          />
        </SceneBoundary>
      )}
    </div>
  );
}

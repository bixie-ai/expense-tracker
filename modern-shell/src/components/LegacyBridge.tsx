import { useLocation } from 'react-router-dom';
import { getAngularPath, ANGULAR_BASE_URL } from '../config';
import { useState } from 'react';

export function LegacyBridge() {
  const location = useLocation();
  const [loadError, setLoadError] = useState(false);

  const angularPath = getAngularPath(location.pathname);
  const iframeSrc = `${ANGULAR_BASE_URL}${angularPath}${location.search}${location.hash}`;

  if (loadError) {
    return (
      <div role="alert">
        <h2>Legacy route unavailable</h2>
        <p>
          The legacy application at <code>{angularPath}</code> could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={iframeSrc}
      title={`Legacy route: ${angularPath}`}
      style={{
        width: '100%',
        height: '100%',
        borderStyle: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onError={() => setLoadError(true)}
      data-testid="legacy-bridge-iframe"
    />
  );
}

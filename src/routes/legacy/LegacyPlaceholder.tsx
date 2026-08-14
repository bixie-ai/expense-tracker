import { type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

export default function LegacyPlaceholder(): ReactNode {
  const { '*': path } = useParams();
  return (
    <div>
      <h1>Legacy Route</h1>
      <p>
        This route (<code>/{path}</code>) is served by the legacy Angular
        application and has not yet been migrated.
      </p>
    </div>
  );
}

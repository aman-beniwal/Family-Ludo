import React from 'react';
import ReactDOM from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

// Disable React DevTools in production
if (import.meta.env.PROD) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook && typeof hook === 'object') {
    for (const key in hook) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      hook[key] = typeof hook[key] === 'function' ? () => {} : null;
    }
  }
}

console.log(
  `%c Family Ludo v${__LIBRELUDO_VERSION__} `,
  'background: #ef7d3a; color: #fff; padding: 5px 10px; border-radius: 3px; font-weight: bold;'
);

ReactDOM.hydrateRoot(
  document,
  <React.StrictMode>
    <HydratedRouter />
  </React.StrictMode>
);

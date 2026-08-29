import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { Provider } from 'react-redux';
import { store } from './state/store';
import { PWAUpdater } from './components/PWAUpdater/PWAUpdater';
import { RollHistoryHydrator } from './components/RollHistoryHydrator/RollHistoryHydrator';
import { SoundUnlocker } from './components/SoundUnlocker/SoundUnlocker';
import ErrorBoundaryPage from './pages/ErrorBoundary/ErrorBoundary';
import './fonts.css';
import './index.css';

export function Layout({ children }: { children: React.ReactNode }) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': ['VideoGame', 'WebApplication'],
    name: 'Family Ludo',
    description:
      'Play Ludo together on one device. Local multiplayer and bot opponents, offline and private.',
    playMode: ['MultiPlayer', 'SinglePlayer'],
    genre: ['Board Game', 'Local Multiplayer', 'Casual Game'],
    applicationCategory: 'Game',
    inLanguage: 'en',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta
          name="description"
          content="Play Ludo together on one device. Local multiplayer and bot opponents, offline and private."
        />

        <meta name="theme-color" content="#ef7d3a" />
        <meta name="apple-mobile-web-app-title" content="Family Ludo" />
        <meta property="og:site_name" content="Family Ludo" />

        <link
          rel="icon"
          type="image/png"
          href={`${import.meta.env.BASE_URL}icons/favicon-96x96.png`}
          sizes="96x96"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href={`${import.meta.env.BASE_URL}icons/favicon.svg`}
        />
        <link rel="shortcut icon" href={`${import.meta.env.BASE_URL}icons/favicon.ico`} />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${import.meta.env.BASE_URL}icons/apple-touch-icon.png`}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />

        <Meta />
        <Links />
      </head>
      <body>
        <Provider store={store}>
          <PWAUpdater />
          <RollHistoryHydrator />
          <SoundUnlocker />
          {children}
        </Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function ErrorBoundary() {
  return <ErrorBoundaryPage />;
}

import './globals.css';

export const metadata = {
  title: 'YESCARE Sales Balance Tracker',
  description: 'Sistem disiplin, SLA, dan pembelajaran untuk sales B2B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

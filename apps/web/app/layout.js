import './globals.css';

export const metadata = {
  title: 'OSS v2 Virtual Filing Cabinet PoC',
  description: 'Virtual Filing Cabinet PoC based on the OSS v2 requirement registry'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

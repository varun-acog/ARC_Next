import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DocumentProvider } from './contexts/DocumentContext';
import Header from './components/Header';
import ReloadConfirmation from './components/ReloadConfirmation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ARC Legal Documents Application',
  description: 'Streamline your legal document workflows with AI-powered generation, review, and comparison tools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DocumentProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <ReloadConfirmation>{children}</ReloadConfirmation>
          </div>
        </DocumentProvider>
      </body>
    </html>
  );
}

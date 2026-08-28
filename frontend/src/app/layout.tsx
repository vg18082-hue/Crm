import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import MainLayout from '@/components/layout/main-layout';
import { AuthProvider } from '@/lib/auth-context';
import QueryProvider from '@/lib/query-provider';
import { ThemeProvider } from '@/lib/theme-context';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'CRM SaaS — Облачная CRM система для малого и среднего бизнеса',
  description: 'Управление клиентами, лидами, продажами, заказами, товарами и абонентскими платежами',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <MainLayout>{children}</MainLayout>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

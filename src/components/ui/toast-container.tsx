'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastContainer() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          fontSize: '14px',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
          duration: 5000,
        },
      }}
    />
  );
}
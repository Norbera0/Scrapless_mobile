import React from 'react';

export default function BpiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      {children}
    </div>
  );
}



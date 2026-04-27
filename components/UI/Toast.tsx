import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const showToast = (message: string) => {
    const id = Date.now();
    setToast({ id, message });
    setTimeout(() => {
      setToast(current => (current?.id === id ? null : current));
    }, 2000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-neutral-200 px-3 py-1.5 rounded shadow-xl text-xs font-medium border border-neutral-700 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};
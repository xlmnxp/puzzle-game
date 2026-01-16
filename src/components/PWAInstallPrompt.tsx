import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
      });
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-blue-100 p-4 rounded-lg shadow-lg flex items-center justify-between">
      <p className="text-blue-800 font-semibold">قم بتثبيت لعبة المكعبات للحصول على تجربة أفضل!</p>
      <div className="flex items-center">
        <button
          onClick={handleInstall}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors mr-2 brick-button"
        >
          تثبيت
        </button>
        <button
          onClick={handleClose}
          className="text-blue-800 bg-blue-200 p-1 rounded hover:bg-blue-300 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
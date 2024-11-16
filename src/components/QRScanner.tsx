import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Target } from 'lucide-react';

interface QRScannerProps {
  onTokenFound: (token: string) => void;
  isDisabled?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onTokenFound,
  isDisabled = false
}) => {
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    if (isDisabled || scannerRef.current) return;

    try {
      setError("");
      setIsScanning(true);
      await stopScanner(); // Ensure there's no existing instance

      const html5QrCode = new Html5Qrcode("reader", { verbose: false });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 350, height: 350 },
        aspectRatio: 1
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (!isDisabled) {
            onTokenFound(decodedText);
            stopScanner();
          }
        },
        () => {} // Silent error handling for scanning errors
      );

      const videoElement = document.querySelector('#reader video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.style.cssText = 'width: 100% !important; height: 100% !important; object-fit: cover !important;';
      }
    } catch (err) {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setIsScanning(false);
      scannerRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        const videoElements = document.querySelectorAll('#reader video');
        videoElements.forEach(element => element.remove());
      } catch (error) {
        console.error('Erreur lors de l\'arrêt du scanner:', error);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const toggleScanner = async () => {
    if (isScanning) {
      await stopScanner();
    } else {
      await startScanner();
    }
  };

  useEffect(() => {
    return () => {
      stopScanner(); // Cleanup on component unmount
    };
  }, []);

  useEffect(() => {
    if (isDisabled) {
      stopScanner(); // Stop scanner if disabled
    }
  }, [isDisabled]);

  return (
    <div className="relative w-full mx-auto max-w-sm md:max-w-md">
      <div
        className={`relative overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl bg-black ${isDisabled ? 'opacity-50' : ''}`}
      >
        <div id="reader" className="w-full aspect-square" />
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-3 md:inset-4 border-2 border-white/30 rounded-lg md:rounded-xl">
            <div className="absolute top-0 left-0 w-6 md:w-8 h-6 md:h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 md:w-8 h-6 md:h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 md:w-8 h-6 md:h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 md:w-8 h-6 md:h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
          </div>
          <Target className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 text-white/30" />
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={toggleScanner}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm md:text-base font-medium rounded-lg transition-colors"
          disabled={isDisabled}
        >
          {isScanning ? "Arrêter le scan" : "Démarrer le scan"}
        </button>
      </div>

      <div className="mt-4 md:mt-6 text-center px-4">
        <p className="text-xs md:text-sm text-gray-500">
          {isDisabled ? "Scanner temporairement désactivé" : "Placez le code QR dans le cadre pour le scanner"}
        </p>
      </div>

      {error && (
        <div className="mt-4 text-center text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};
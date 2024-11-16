import React, { useState, useEffect } from 'react';
import { QRScanner } from './components/QRScanner';
import { QrCode, CheckCircle2, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Component() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [lastScannedToken, setLastScannedToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [peopleCount, setPeopleCount] = useState(0);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:5001/api/tokens');
      if (!response.ok) throw new Error(`Erreur HTTP! statut: ${response.status}`);
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des tokens:', error);
      toast.error('Échec de la récupération des tokens');
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenFound = async (token: string) => {
    if (scanning) return;

    setScanning(true);
    const trimmedToken = token.trim();
    setLastScannedToken(trimmedToken);

    try {
      const response = await fetch('https://qrgenerator-production-dd2c.up.railway.app/api/tokens');
      if (!response.ok) throw new Error(`Erreur HTTP! statut: ${response.status}`);
      
      const data = await response.json();
      const freshTokens = data.map((token: string) => token.trim());
      const isValid = freshTokens.includes(trimmedToken);
      
      setVerificationStatus(isValid);

      setIsPopupVisible(true);
      toast(isValid ? 'Code QR valide' : 'Code QR invalide', {
        icon: isValid ? '✅' : '❌',
        duration: 2000
      });

      if (isValid) {
        await invalidateToken(trimmedToken);
        setPeopleCount(prevCount => prevCount + 1);
      }

      setTimeout(() => {
        setIsPopupVisible(false);
        setScanning(false);
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      toast.error('Échec de la vérification');
      setVerificationStatus(false);
      setScanning(false);
    }
  };

  const invalidateToken = async (token: string) => {
    try {
      const response = await fetch('https://qrgenerator-production-dd2c.up.railway.app/api/tokens/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error('Échec de l\'invalidation du token');
      await fetchTokens();
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du token:', error);
      toast.error('Échec de l\'invalidation du token');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Toaster position="top-center" />
      
      <header className="bg-white shadow-lg">
        <div className="p-4 md:p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 md:p-3 rounded-full">
                <QrCode className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vérificateur de QR Code</h1>
                <p className="text-xs md:text-sm text-gray-500">Scannez et vérifiez les QR codes en toute sécurité</p>
              </div>
            </div>
            <div className="text-lg font-semibold text-blue-600">
              Personnes présentes: {peopleCount}
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <div className="flex-1">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <QRScanner onTokenFound={handleTokenFound} isDisabled={scanning} />
            </div>
          </div>
        </div>

        {isPopupVisible && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-sm w-full transform scale-100 animate-in fade-in duration-200">
              <div className="text-center">
                {verificationStatus ? (
                  <>
                    <CheckCircle2 className="mx-auto w-12 h-12 md:w-16 md:h-16 text-green-500 mb-4" />
                    <h2 className="text-xl md:text-2xl font-bold text-green-700 mb-2">Code QR valide</h2>
                    <p className="text-sm md:text-base text-green-600">Code QR vérifié avec succès</p>
                  </>
                ) : (
                  <>
                    <XCircle className="mx-auto w-12 h-12 md:w-16 md:h-16 text-red-500 mb-4" />
                    <h2 className="text-xl md:text-2xl font-bold text-red-700 mb-2">Code QR invalide</h2>
                    <p className="text-sm md:text-base text-red-600">Ce code QR n'est pas valide</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
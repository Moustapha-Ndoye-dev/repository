import React, { useState, useEffect } from 'react';
import { QRScanner } from './components/QRScanner';
import { QrCode, CheckCircle2, XCircle, History } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Component() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [lastScannedToken, setLastScannedToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<{ token: string; isValid: boolean; timestamp: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:5001/api/tokens');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to fetch tokens');
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
      const response = await fetch('http://127.0.0.1:5001/api/tokens');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const freshTokens = data.map((token: string) => token.trim());
      const isValid = freshTokens.includes(trimmedToken);
      
      setVerificationStatus(isValid);
      
      setScanHistory(prev => [{
        token: trimmedToken,
        isValid,
        timestamp: new Date().toLocaleString()
      }, ...prev].slice(0, 10));

      setIsPopupVisible(true);
      toast(isValid ? 'Valid token detected' : 'Invalid token', {
        icon: isValid ? '✅' : '❌',
        duration: 2000
      });

      if (isValid) {
        await invalidateToken(trimmedToken);
      }

      setTimeout(() => {
        setIsPopupVisible(false);
        setScanning(false);
      }, 2000);

    } catch (error) {
      console.error('Error verifying token:', error);
      toast.error('Verification failed');
      setVerificationStatus(false);
      setScanning(false);
    }
  };

  const invalidateToken = async (token: string) => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/tokens/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error('Failed to invalidate token');
      await fetchTokens();
    } catch (error) {
      console.error('Error invalidating token:', error);
      toast.error('Failed to invalidate token');
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">QR Token Verifier</h1>
                <p className="text-xs md:text-sm text-gray-500">Scan and verify QR tokens securely</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full md:w-auto"
            >
              <History className="w-5 h-5" />
              <span>History</span>
            </button>
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

          {showHistory && (
            <div className="w-full md:w-96">
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Scan History
                </h2>
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {scan.token}
                        </span>
                        {scan.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {scan.timestamp}
                      </div>
                    </div>
                  ))}
                  {scanHistory.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No scan history yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isPopupVisible && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-sm w-full transform scale-100 animate-in fade-in duration-200">
              <div className="text-center">
                {verificationStatus ? (
                  <>
                    <CheckCircle2 className="mx-auto w-12 h-12 md:w-16 md:h-16 text-green-500 mb-4" />
                    <h2 className="text-xl md:text-2xl font-bold text-green-700 mb-2">Valid Token</h2>
                    <p className="text-sm md:text-base text-green-600">Token successfully verified</p>
                  </>
                ) : (
                  <>
                    <XCircle className="mx-auto w-12 h-12 md:w-16 md:h-16 text-red-500 mb-4" />
                    <h2 className="text-xl md:text-2xl font-bold text-red-700 mb-2">Invalid Token</h2>
                    <p className="text-sm md:text-base text-red-600">This token is not valid</p>
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
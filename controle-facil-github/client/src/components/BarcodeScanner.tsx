import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, Loader2, X, ScanLine, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

interface BarcodeDetectorLike {
  new (options?: { formats?: string[] }): {
    detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
  };
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorLike;
  }
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'ready' | 'error' | 'unsupported'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualCode, setManualCode] = useState('');

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  };

  const closeScanner = () => {
    stopCamera();
    setManualCode('');
    setErrorMessage('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      setCameraState('starting');
      setErrorMessage('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('error');
        setErrorMessage('Este navegador não liberou acesso à câmera. Digite o código abaixo para continuar.');
        return;
      }

      if (!window.BarcodeDetector) {
        setCameraState('unsupported');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState('ready');

        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']
        });

        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const detected = await detector.detect(videoRef.current);
            const code = detected[0]?.rawValue?.trim();
            if (code) {
              onDetected(code);
              closeScanner();
            }
          } catch {
            // O leitor tenta novamente no próximo intervalo; não interrompe a câmera por um frame inválido.
          }
        }, 250);
      } catch (error) {
        console.error(error);
        setCameraState('error');
        setErrorMessage('Não foi possível abrir a câmera. Confira a permissão do navegador e tente novamente.');
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // O modal inicia/encerra a câmera apenas quando isOpen muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const submitManualCode = (event: React.FormEvent) => {
    event.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    onDetected(code);
    closeScanner();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-slate-300 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Ler código ou QR Code</h2>
              <p className="text-sm font-semibold text-slate-500">Aponte a câmera para o código do produto</p>
            </div>
          </div>
          <button onClick={closeScanner} type="button" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500" aria-label="Fechar leitor">
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border-4 border-slate-200">
            {cameraState === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                <span className="font-bold">Abrindo câmera...</span>
              </div>
            )}
            {cameraState === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                <Camera className="w-12 h-12 text-slate-400" />
                <span className="font-bold">Preparando leitor</span>
              </div>
            )}
            {cameraState === 'unsupported' && (
              <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-2 text-white text-center">
                <CameraOff className="w-12 h-12 text-amber-300" />
                <p className="font-bold">A leitura automática não é suportada neste navegador.</p>
                <p className="text-sm text-slate-300">Use o campo abaixo para digitar o código de barras ou o texto do QR Code.</p>
              </div>
            )}
            {cameraState === 'error' && (
              <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-2 text-white text-center">
                <AlertCircle className="w-12 h-12 text-rose-300" />
                <p className="font-bold">{errorMessage}</p>
              </div>
            )}
            <video ref={videoRef} muted playsInline className={`w-full h-full object-cover ${cameraState === 'ready' ? 'block' : 'hidden'}`} />
            {cameraState === 'ready' && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-4 border-blue-300 rounded-xl shadow-[0_0_0_999px_rgba(15,23,42,0.45)] pointer-events-none">
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black whitespace-nowrap">
                  Centralize o código aqui
                </span>
              </div>
            )}
          </div>

          {cameraState === 'ready' && (
            <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Câmera ativa — procurando código automaticamente
            </div>
          )}

          <div className="flex items-center gap-3 text-slate-500 text-sm font-bold">
            <div className="h-px bg-slate-200 flex-1" />
            <span>ou digite o código / QR</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <form onSubmit={submitManualCode} className="flex gap-2">
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              inputMode="text"
              autoFocus={cameraState === 'unsupported' || cameraState === 'error'}
              placeholder="Ex: 7891234567890 ou texto do QR"
              className="min-w-0 flex-1 px-4 py-3.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-bold"
            />
            <button type="submit" className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg">
              Buscar
            </button>
          </form>

          <button type="button" onClick={closeScanner} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold">
            Fechar leitor
          </button>
        </div>
      </div>
    </div>
  );
};

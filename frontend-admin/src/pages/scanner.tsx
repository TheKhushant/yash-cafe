// Create /home/workdir/attachments/yash-cafe-main/src/routes/_authenticated.scanner.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckCircle, XCircle, RefreshCw, QrCode, User, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { bookingsService } from "@/lib/api/services/bookings.service";
import { useAuthStore } from "@/stores/auth-store";
import type { CheckInResult } from "@/lib/api/services/bookings.service";

export const Route = createFileRoute("/_authenticated/scanner")({
  component: QRScannerPage,
});

function QRScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const user = useAuthStore((s) => s.user);

  const startScanner = () => {
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const checkInResult = await bookingsService.checkIn(decodedText, user?.name || "Admin");
          setResult(checkInResult);

          if (checkInResult.ok) {
            toast.success("Entry Approved!");
          } else {
            toast.error(checkInResult.reason);
          }

          // Add to history
          setScanHistory(prev => [{
            id: Date.now(),
            payload: decodedText,
            result: checkInResult,
            time: new Date().toLocaleTimeString()
          }, ...prev].slice(0, 10));

          // Auto hide success after 3s
          if (checkInResult.ok) {
            setTimeout(() => setResult(null), 3000);
          }
        } catch (err) {
          toast.error("Scan failed");
          setResult({ ok: false, reason: "Scan error" });
        }
      },
      (error) => {
        console.warn(error);
      }
    );

    scannerRef.current = scanner;
    setScanning(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
    setResult(null);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="QR Scanner" 
        description="Scan tickets for event entry validation"
        // icon={QrCode}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Scanner Area */}
        <div className="lg:col-span-7">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Live Scanner</h3>
              <div className="flex gap-3">
                {!scanning ? (
                  <Button onClick={startScanner} className="gap-2">
                    <QrCode className="size-4" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={stopScanner} className="gap-2">
                    <RefreshCw className="size-4" />
                    Stop Scanner
                  </Button>
                )}
              </div>
            </div>

            <div id="reader" className="mx-auto rounded-xl overflow-hidden border bg-black min-h-[320px]" />

            {result && (
              <div className={`mt-6 rounded-xl p-6 ${result.ok ? 'bg-emerald-500/10 border-emerald-500' : 'bg-red-500/10 border-red-500'} border`}>
                <div className="flex items-start gap-4">
                  {result.ok ? (
                    <CheckCircle className="size-10 text-emerald-500 mt-1" />
                  ) : (
                    <XCircle className="size-10 text-red-500 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="text-xl font-semibold mb-1">
                      {result.ok ? "ENTRY GRANTED" : result.reason.toUpperCase()}
                    </div>
                    {result.booking && (
                      <div className="space-y-2 text-sm mt-4">
                        <div className="flex items-center gap-2"><User className="size-4" /> {result.booking.customerName}</div>
                        <div className="flex items-center gap-2"><Calendar className="size-4" /> {result.booking.eventTitle}</div>
                        <div className="flex items-center gap-2"><MapPin className="size-4" /> Table {result.booking.tableNumber}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Scan History */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col">
            <h3 className="font-semibold mb-4">Recent Scans</h3>
            
            <div className="flex-1 space-y-3 overflow-auto">
              {scanHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                  <QrCode className="size-12 mb-4 opacity-40" />
                  <p>No scans yet</p>
                </div>
              ) : (
                scanHistory.map((scan) => (
                  <div key={scan.id} className="flex gap-3 border rounded-lg p-4">
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${scan.result.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {scan.result.ok ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{scan.result.booking?.customerName || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{scan.result.reason}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{scan.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminLayout from '../Admin/AdminLayout';

interface ScanTicket {
  id: number;
  code: string;
  status: string;
  scanned_at?: string | null;
  ticket_tier?: {
    name: string;
  };
  event_leg?: {
    venue_name: string;
    city?: string | null;
    event?: {
      name: string;
    };
  };
}

interface ScanResult {
  status: 'ok' | 'not_found' | 'void' | 'already_scanned';
  code?: string;
  scanned_at?: string | null;
  ticket?: ScanTicket;
}

interface PageProps {
  result?: ScanResult;
}

export default function Scan() {
  const { result } = usePage<PageProps>().props;

  const [code, setCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [result]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    setCameraError(null);

    try {
      if (scannerRef.current) {
        await stopCamera();
      }

      const scanner = new Html5Qrcode('ticket-qr-reader');

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (scanningRef.current || submitting) return;

          scanningRef.current = true;

          const value = decodedText.trim().toUpperCase();

          setCode(value);

          await stopCamera();

          submitCode(value);
        },
        () => {
          // Ignore individual frame decode failures.
        }
      );

      setCameraActive(true);
    } catch (error) {
      console.error('Camera error:', error);

      setCameraError(
        'Unable to access the camera. Check your browser camera permission.'
      );

      scannerRef.current = null;
      setCameraActive(false);
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current;

    if (!scanner) {
      setCameraActive(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
    }

    try {
      scanner.clear();
    } catch {
      // Scanner may already be cleared.
    }

    scannerRef.current = null;
    setCameraActive(false);
    scanningRef.current = false;
  }

  function submitCode(value: string) {
    const trimmed = value.trim().toUpperCase();

    if (!trimmed || submitting) {
      scanningRef.current = false;
      return;
    }

    setSubmitting(true);

    router.post(
      route('staff.scan.store'),
      { code: trimmed },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          scanningRef.current = false;

          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        },
      }
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();

    submitCode(code);
  }

  async function scanAgain() {
    setCode('');
    setCameraError(null);
    setSubmitting(false);

    await startCamera();
  }

  return (
      <AdminLayout>
      <Head title="Ticket Scanner" />

      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="max-w-xl mx-auto px-4 py-8 sm:py-10">

          {/* Header */}
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Door staff
            </p>

            <h1 className="text-3xl font-semibold mt-2">
              Ticket scanner
            </h1>

            <p className="text-sm text-neutral-500 mt-2">
              Scan the buyer's QR code to validate their ticket.
            </p>
          </div>

          {/* Camera */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    QR scanner
                  </p>

                  <p className="text-xs text-neutral-500 mt-1">
                    Point the camera at the ticket QR code.
                  </p>
                </div>

                {cameraActive && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Camera active
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 pb-5">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40"
                >
                  Open camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={submitting}
                  className="w-full h-11 rounded-xl border border-neutral-700 text-neutral-300 text-sm hover:bg-neutral-800 transition-colors"
                >
                  Stop camera
                </button>
              )}

              {cameraError && (
                <div className="mt-3 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2.5 text-xs text-red-300">
                  {cameraError}
                </div>
              )}

              {/* html5-qrcode mounts here */}
             <div
  id="ticket-qr-reader"
  className="mt-4 min-h-[300px] w-full overflow-hidden rounded-xl border border-neutral-800 bg-black"
/>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-neutral-800" />
            <span className="text-xs uppercase tracking-wider text-neutral-600">
              Or enter code
            </span>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>

          {/* Manual input */}
          <form
            onSubmit={submit}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"
          >
            <label className="block text-sm text-neutral-400 mb-2">
              Ticket code
            </label>

            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PQS8-VIWO-M6HP"
              autoComplete="off"
              autoCapitalize="characters"
              className="w-full h-14 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-lg font-mono tracking-wider text-neutral-100 placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 focus:ring-2 focus:ring-neutral-800"
            />

            <button
              type="submit"
              disabled={!code.trim() || submitting}
              className="w-full mt-4 h-12 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              {submitting ? 'Checking...' : 'Check ticket'}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className="mt-6">
              <ResultCard
                result={result}
                onScanAgain={scanAgain}
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function ResultCard({
  result,
  onScanAgain,
}: {
  result: ScanResult;
  onScanAgain: () => void;
}) {
  if (result.status === 'not_found') {
    return (
      <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-6">
        <StatusHeader
          title="Ticket not found"
          message={`No ticket exists for code ${result.code ?? ''}.`}
          icon="x"
        />

        <ScanAgainButton onClick={onScanAgain} />
      </div>
    );
  }

  if (result.status === 'void') {
    return (
      <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-6">
        <StatusHeader
          title="Ticket is void"
          message="This ticket cannot be used."
          icon="x"
        />

        <TicketSummary ticket={result.ticket} />

        <ScanAgainButton onClick={onScanAgain} />
      </div>
    );
  }

  if (result.status === 'already_scanned') {
    return (
      <div className="rounded-2xl border border-amber-900/60 bg-amber-950/30 p-6">
        <StatusHeader
          title="Already scanned"
          message={
            result.scanned_at
              ? `Scanned at ${new Date(
                  result.scanned_at
                ).toLocaleString('en-AU')}.`
              : 'This ticket has already been used.'
          }
          icon="warning"
        />

        <TicketSummary ticket={result.ticket} />

        <ScanAgainButton onClick={onScanAgain} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-green-900/60 bg-green-950/30 p-6">
      <StatusHeader
        title="Ticket accepted"
        message="This ticket is valid and has been marked as used."
        icon="check"
      />

      <TicketSummary ticket={result.ticket} />

      <ScanAgainButton onClick={onScanAgain} />
    </div>
  );
}

function StatusHeader({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon: 'check' | 'x' | 'warning';
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 shrink-0 rounded-full border border-white/10 flex items-center justify-center">
        {icon === 'check' && (
          <span className="text-green-400 text-xl">✓</span>
        )}

        {icon === 'x' && (
          <span className="text-red-400 text-xl">×</span>
        )}

        {icon === 'warning' && (
          <span className="text-amber-400 text-xl">!</span>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-neutral-400 mt-1">
          {message}
        </p>
      </div>
    </div>
  );
}

function TicketSummary({
  ticket,
}: {
  ticket?: ScanTicket;
}) {
  if (!ticket) return null;

  return (
    <div className="mt-6 pt-5 border-t border-white/10 space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-neutral-500">Event</span>
        <span className="text-neutral-200 text-right">
          {ticket.event_leg?.event?.name ?? '—'}
        </span>
      </div>

      <div className="flex justify-between gap-4">
        <span className="text-neutral-500">Ticket</span>
        <span className="text-neutral-200">
          {ticket.ticket_tier?.name ?? '—'}
        </span>
      </div>

      <div className="flex justify-between gap-4">
        <span className="text-neutral-500">Venue</span>
        <span className="text-neutral-200 text-right">
          {ticket.event_leg?.venue_name ?? '—'}
          {ticket.event_leg?.city
            ? ` · ${ticket.event_leg.city}`
            : ''}
        </span>
      </div>

      <div className="flex justify-between gap-4">
        <span className="text-neutral-500">Code</span>
        <span className="font-mono text-neutral-200">
          {ticket.code}
        </span>
      </div>
    </div>
  );
}

function ScanAgainButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full mt-6 h-11 rounded-xl bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
    >
      Scan another ticket
    </button>
  );
}
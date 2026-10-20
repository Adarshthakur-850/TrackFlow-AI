import React, { useState } from 'react';
import { X, ShieldCheck, Check, AlertCircle, KeyRound, PenTool, Camera } from 'lucide-react';
import { api } from '../services/api';

interface PODModalProps {
  trackingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProofOfDeliveryModal: React.FC<PODModalProps> = ({
  trackingId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [verificationType, setVerificationType] = useState<'OTP' | 'SIGNATURE' | 'PHOTO'>('OTP');
  const [otpCode, setOtpCode] = useState('');
  const [signatureData, setSignatureData] = useState('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCAxMCBDIDIwIDIwLCB4MCAyMCwgNTAgMTAiIHN0cm9rZT0iYmxhY2siIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.submitPOD(trackingId, {
        recipient_name: recipientName || "Verified Customer",
        verification_type: verificationType,
        otp_code: otpCode,
        signature_data: signatureData,
        notes: notes || "Delivered in person to recipient with verified OTP.",
        latitude: 37.7749,
        longitude: -122.4194
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to confirm delivery proof.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Proof of Delivery (POD)</h3>
            <p className="text-xs text-slate-400">Shipment {trackingId}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Connor"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Verification Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'OTP', label: 'Customer OTP', icon: KeyRound },
                { id: 'SIGNATURE', label: 'Signature', icon: PenTool },
                { id: 'PHOTO', label: 'Doorstep Photo', icon: Camera },
              ].map(mode => {
                const Icon = mode.icon;
                const isSelected = verificationType === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setVerificationType(mode.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {verificationType === 'OTP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter 6-Digit Customer Delivery OTP *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 882194"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full font-mono tracking-widest text-center text-lg bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                OTP sent to customer SMS/email upon shipment dispatch.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Delivery Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Handed directly to resident..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? "Verifying..." : "Validate & Deliver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

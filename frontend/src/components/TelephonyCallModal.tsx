import React, { useState } from 'react';
import { X, PhoneCall, Mic, CheckCircle2, User, PhoneForwarded } from 'lucide-react';
import { api } from '../services/api';

interface TelephonyModalProps {
  trackingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TelephonyCallModal: React.FC<TelephonyModalProps> = ({
  trackingId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('Recipient unreachable at delivery gate');
  const [channel, setChannel] = useState<'TELEPHONY_CALL' | 'SMS'>('TELEPHONY_CALL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleTriggerContact = async () => {
    setLoading(true);
    try {
      const res = await api.contactCustomer(trackingId, {
        channel,
        reason,
        custom_message: `TrackFlow AI alert regarding package ${trackingId}: ${reason}.`
      });
      setResult(res);
      onSuccess();
    } catch (err: any) {
      alert("Error initiating contact: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <PhoneForwarded className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Customer Communication Gateway</h3>
            <p className="text-xs text-slate-400">Authorized IVR Voice Calling & SMS Dispatch</p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Communication Channel
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setChannel('TELEPHONY_CALL')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 ${
                    channel === 'TELEPHONY_CALL'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Automated Voice Call (IVR)
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 ${
                    channel === 'SMS'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  SMS Message Alert
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Contact
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Recipient unreachable at delivery gate">Recipient unreachable at delivery gate</option>
                <option value="Incomplete street address or missing apartment unit">Incomplete street address or missing apartment unit</option>
                <option value="Customer requested dynamic delivery reschedule">Customer requested dynamic delivery reschedule</option>
                <option value="High-value OTP verification pre-call">High-value OTP verification pre-call</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              In accordance with operational policy, calls request only minimum necessary delivery details. The outcome will be recorded directly into the immutable event history.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerContact}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" />
                {loading ? "Dialing PSTN Carrier..." : "Initiate Authorized Call"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold mb-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Call Successfully Executed & Confirmed</span>
              </div>
              <p className="text-slate-300 font-mono text-[11px] mb-2">{result.transcript}</p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                  Customer Speech Response
                </span>
                <span className="text-emerald-400 font-medium">"{result.customer_response}"</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

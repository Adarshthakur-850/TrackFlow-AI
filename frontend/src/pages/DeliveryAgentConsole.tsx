import React, { useState } from 'react';
import { 
  Truck, Navigation, ShieldCheck, AlertTriangle, KeyRound, 
  MapPin, CheckCircle2, PhoneCall, Radio, Send 
} from 'lucide-react';
import { api } from '../services/api';
import { ProofOfDeliveryModal } from '../components/ProofOfDeliveryModal';
import { TelephonyCallModal } from '../components/TelephonyCallModal';

export const DeliveryAgentConsole: React.FC = () => {
  const [activeTrackingId, setActiveTrackingId] = useState('TRK-20261020-1001');
  const [showPODModal, setShowPODModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('CUSTOMER_UNREACHABLE');
  const [exceptionDetails, setExceptionDetails] = useState('Doorbell unanswered; no safe drop location available.');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulated GPS Broadcast
  const handleBroadcastGPS = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      // Simulate random step along Market Street
      const lat = 37.7792 + (Math.random() - 0.5) * 0.005;
      const lng = -122.4175 + (Math.random() - 0.5) * 0.005;
      await api.updateLocation(activeTrackingId, {
        latitude: lat,
        longitude: lng,
        location_name: "Market St & 5th Ave",
        speed_kmh: 28.5,
        is_verified: true
      });
      setStatusMessage(`Broadcasting GPS Telemetry: [${lat.toFixed(5)}, ${lng.toFixed(5)}] at 28.5 km/h. Verified lock.`);
    } catch (err: any) {
      alert("Error broadcasting telemetry: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportException = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      await api.reportException(activeTrackingId, {
        reason_code: exceptionReason,
        description: exceptionDetails,
        trigger_customer_contact: true,
        latitude: 37.7792,
        longitude: -122.4175
      });
      setStatusMessage(`Delivery exception recorded. Automated IVR telephony contact initiated with customer.`);
    } catch (err: any) {
      alert("Error recording exception: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Courier Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Courier Dispatch Console</h1>
            <p className="text-xs text-slate-400">
              Agent: <span className="text-amber-400 font-semibold">Alex Mercer (AGT-101)</span> • Vehicle: <span className="text-slate-300 font-mono">Electric Van #CA-7TF901</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> GPS Unit Active
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Active Package Runsheet Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Current Delivery Stop (Tracking ID)
          </label>
          <input
            type="text"
            value={activeTrackingId}
            onChange={(e) => setActiveTrackingId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Action 1: Live Telemetry Broadcast */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-200">Broadcast Device Telemetry</h4>
            <p className="text-[11px] text-slate-400">Transmits verified GPS fix and speed to the tracking portal.</p>
          </div>
          <button
            onClick={handleBroadcastGPS}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Ping GPS Fix
          </button>
        </div>

        {/* Primary Delivery Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Submit POD Button */}
          <button
            onClick={() => setShowPODModal(true)}
            className="py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            Submit Verified Delivery (POD)
          </button>

          {/* Trigger Telephony Contact */}
          <button
            onClick={() => setShowCallModal(true)}
            className="py-4 px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm transition shadow-xl shadow-cyan-600/20 flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-5 h-5" />
            Contact Customer via IVR Call
          </button>
        </div>
      </div>

      {/* Exception Reporting Module */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Report Delivery Exception</h3>
            <p className="text-xs text-slate-400">
              Never mark delivered if customer is unreachable or address is incorrect.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Failure Reason Code
            </label>
            <select
              value={exceptionReason}
              onChange={(e) => setExceptionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="CUSTOMER_UNREACHABLE">Customer Unreachable</option>
              <option value="SECURITY_GATE_LOCKED">Security Gate Locked / Access Denied</option>
              <option value="INCOMPLETE_ADDRESS">Incomplete or Missing Address</option>
              <option value="PACKAGE_DAMAGED">Package Damaged During Transit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Field Notes
            </label>
            <input
              type="text"
              value={exceptionDetails}
              onChange={(e) => setExceptionDetails(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <button
          onClick={handleReportException}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Record Delivery Exception & Trigger Auto-Recovery
        </button>
      </div>

      {/* Proof of Delivery Modal */}
      <ProofOfDeliveryModal
        trackingId={activeTrackingId}
        isOpen={showPODModal}
        onClose={() => setShowPODModal(false)}
        onSuccess={() => setStatusMessage(`Delivery confirmed and verified for ${activeTrackingId}. Proof recorded.`)}
      />

      {/* Telephony Call Modal */}
      <TelephonyCallModal
        trackingId={activeTrackingId}
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        onSuccess={() => setStatusMessage(`Customer contact call completed for ${activeTrackingId}.`)}
      />
    </div>
  );
};

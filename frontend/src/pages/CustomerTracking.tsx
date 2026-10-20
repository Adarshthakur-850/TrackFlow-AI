import React, { useState, useEffect } from 'react';
import { 
  Search, Package, Calendar, Clock, MapPin, ShieldCheck, 
  AlertTriangle, KeyRound, ArrowRight, UserCheck, PhoneCall 
} from 'lucide-react';
import { api, PackageDetail } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';
import { TrackingTimeline } from '../components/TrackingTimeline';
import { LiveMap } from '../components/LiveMap';
import { TelephonyCallModal } from '../components/TelephonyCallModal';

export const CustomerTracking: React.FC = () => {
  const [trackingIdInput, setTrackingIdInput] = useState('TRK-20261020-1001');
  const [packageData, setPackageData] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Package marked delivered but not received at doorstep');

  const fetchTracking = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getShipment(id.trim());
      setPackageData(data);
    } catch (err: any) {
      setError(err.message || 'Tracking ID not found.');
      setPackageData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking(trackingIdInput);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingIdInput) fetchTracking(trackingIdInput);
  };

  const handleDisputeSubmit = async () => {
    if (!packageData) return;
    try {
      await api.reportNonReceipt(packageData.tracking_id, { reason: disputeReason });
      alert("Your non-receipt dispute has been registered. An investigation ticket has been created.");
      setShowDisputeModal(false);
      fetchTracking(packageData.tracking_id);
    } catch (err: any) {
      alert("Failed to submit dispute: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Bar & Demo Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-6">
          <span className="text-xs uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Real-Time Shipment Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Track Every Package End-to-End
          </h1>
          <p className="text-sm text-slate-400">
            Audit-grade verification, live GPS telemetry, and AI delay predictions from order placement to doorstep.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={trackingIdInput}
              onChange={(e) => setTrackingIdInput(e.target.value)}
              placeholder="Enter Tracking ID (e.g. TRK-20261020-1001)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Locating..." : "Track"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo IDs Quick Selection */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-500">Demo Packages:</span>
          {['TRK-20261020-1001', 'TRK-20261020-1002', 'TRK-20261020-1003'].map(id => (
            <button
              key={id}
              onClick={() => { setTrackingIdInput(id); fetchTracking(id); }}
              className="font-mono px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {packageData && (
        <div className="space-y-8">
          {/* Top Shipment Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-slate-400">TRACKING NUMBER</span>
                  <StatusBadge status={packageData.current_status} />
                  <RiskBadge risk={packageData.current_risk_category} />
                </div>
                <h2 className="text-2xl font-black text-white font-mono tracking-wide">
                  {packageData.tracking_id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Recipient: <span className="text-slate-200 font-semibold">{packageData.customer_name || 'Customer'}</span> • Destination: <span className="text-slate-200 font-semibold">{packageData.destination_city || 'San Francisco, CA'}</span>
                </p>
              </div>

              {/* Delivery OTP Security Badge */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5 flex items-center gap-3.5 shadow-lg">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Secure Delivery OTP
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-400 tracking-widest">
                    882194
                  </span>
                </div>
              </div>
            </div>

            {/* AI Risk Explanation Notice if not Normal */}
            {packageData.current_risk_category !== 'Normal' && (
              <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">
                    AI Monitoring Notice: {packageData.current_risk_category}
                  </p>
                  <p className="text-slate-300">{packageData.risk_explanation}</p>
                  <p className="text-emerald-400 font-medium">Recommended Action: {packageData.recommended_action}</p>
                </div>
              </div>
            )}

            {/* Key Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Estimated Delivery
                </span>
                <span className="font-semibold text-slate-200">
                  {packageData.estimated_delivery_date
                    ? new Date(packageData.estimated_delivery_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Within 2 business days'}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Last Known Location
                </span>
                <span className="font-semibold text-slate-200 truncate block">
                  {packageData.last_known_location_name || 'In Transit Corridor'}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Weight & Specs
                </span>
                <span className="font-semibold text-slate-200">
                  {packageData.weight_kg} kg • {packageData.dimensions}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Last Telemetry Scan
                </span>
                <span className="font-semibold text-slate-200">
                  {packageData.last_location_timestamp 
                    ? new Date(packageData.last_location_timestamp).toLocaleTimeString() 
                    : 'Live'}
                </span>
              </div>
            </div>

            {/* Customer Dispute Button (Stage 7 Non-Receipt Clause) */}
            {packageData.current_status === 'DELIVERED' && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Did not receive your package? Report non-receipt to trigger investigation.</span>
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-semibold transition"
                >
                  Report Non-Receipt
                </button>
              </div>
            )}
          </div>

          {/* Live Telemetry Radar */}
          <LiveMap
            currentLat={packageData.last_known_lat}
            currentLng={packageData.last_known_lng}
            locationName={packageData.last_known_location_name}
            isVerified={packageData.is_location_verified}
            destinationCity={packageData.destination_city}
          />

          {/* 8-Stage Visual Timeline & Audit Trail */}
          <TrackingTimeline
            currentStatus={packageData.current_status}
            events={packageData.events}
            proofOfDelivery={packageData.proof_of_delivery}
          />
        </div>
      )}

      {/* Customer Non-Receipt Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2">Report Delivery Non-Receipt</h3>
            <p className="text-xs text-slate-400 mb-4">
              Our automated logistics system will flag this shipment, open an official investigation ticket, and contact the carrier delivery supervisor.
            </p>
            <div className="space-y-3 mb-5">
              <label className="text-xs font-semibold text-slate-300 block">Select Issue Reason</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Package marked delivered but not received at doorstep">Package marked delivered but not received at doorstep</option>
                <option value="Delivered to wrong address or unauthorized neighbor">Delivered to wrong address or unauthorized neighbor</option>
                <option value="Empty box or missing contents upon arrival">Empty box or missing contents upon arrival</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDisputeSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
              >
                File Dispute & Investigate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorized Telephony Call Modal */}
      {packageData && (
        <TelephonyCallModal
          trackingId={packageData.tracking_id}
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          onSuccess={() => fetchTracking(packageData.tracking_id)}
        />
      )}
    </div>
  );
};

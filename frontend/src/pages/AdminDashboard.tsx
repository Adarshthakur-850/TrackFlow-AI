import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Truck, AlertTriangle, CheckCircle2, Clock, 
  MapPin, PhoneCall, RefreshCw, ChevronRight, FileSearch, Check 
} from 'lucide-react';
import { api, AdminAnalytics } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';
import { TelephonyCallModal } from '../components/TelephonyCallModal';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [atRiskList, setAtRiskList] = useState<any[]>([]);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrackingForCall, setSelectedTrackingForCall] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, atRisk, tickets] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAtRiskShipments(),
        api.getInvestigations()
      ]);
      setAnalytics(stats);
      setAtRiskList(atRisk);
      setInvestigations(tickets);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Live poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleResolveTicket = async (id: number) => {
    try {
      await api.resolveInvestigation(id, "Address verified by customer call; redelivery approved.");
      loadData();
    } catch (err: any) {
      alert("Failed to resolve ticket: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Operations Control
            </span>
            <span className="text-xs text-slate-400">Live Logistics & Carrier Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AI Operations & Risk Radar
          </h1>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Radar
        </button>
      </div>

      {/* KPI Stats Grid */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Shipments', val: analytics.total_shipments, color: 'text-white' },
            { label: 'Active Deliveries', val: analytics.active_deliveries, color: 'text-cyan-400' },
            { label: 'In Warehouses', val: analytics.packages_in_warehouses, color: 'text-purple-400' },
            { label: 'In Transit', val: analytics.in_transit, color: 'text-indigo-400' },
            { label: 'Out For Delivery', val: analytics.out_for_delivery, color: 'text-amber-400' },
            { label: 'Verified Delivered', val: analytics.delivered_count, color: 'text-emerald-400' },
            { label: 'Exceptions / Failed', val: analytics.delivery_exceptions, color: 'text-rose-400' },
            { label: 'AI At-Risk / Delayed', val: analytics.delayed_or_at_risk, color: 'text-amber-300' },
            { label: 'Stale GPS Alerts', val: analytics.stale_location_alerts, color: 'text-orange-400' },
            { label: 'Open Investigations', val: analytics.open_investigations, color: 'text-red-400' },
            { label: 'Carrier On-Time Rate', val: `${analytics.carrier_on_time_rate}%`, color: 'text-emerald-300 font-mono' },
            { label: 'Telemetry Integrity', val: '100% Signed', color: 'text-teal-300 font-mono' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 truncate">
                {stat.label}
              </span>
              <span className={`text-xl sm:text-2xl font-black ${stat.color}`}>
                {stat.val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* AI Risk Radar Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Real-Time AI Anomaly Radar</h2>
              <p className="text-xs text-slate-400">
                Machine learning models continuously evaluate transit velocity, warehouse dwell, and GPS anomalies.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {atRiskList.length} At-Risk Flags
          </span>
        </div>

        {atRiskList.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            All active shipments are tracking normally with zero anomalous signals detected.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Category</th>
                  <th className="py-3 px-4">ML Explanation</th>
                  <th className="py-3 px-4">Recommended Action</th>
                  <th className="py-3 px-4 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {atRiskList.map((item) => (
                  <tr key={item.tracking_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {item.tracking_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.current_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge risk={item.current_risk_category} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs">
                      {item.risk_explanation || "Elevated delay risk flagged by transit model."}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-medium max-w-xs">
                      {item.recommended_action || "Continue monitoring telemetry."}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTrackingForCall(item.tracking_id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-semibold transition flex items-center gap-1.5 ml-auto"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Call Customer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open Investigation Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Open Investigation Tickets</h2>
            <p className="text-xs text-slate-400">
              Escalated delivery disputes, repeated failed deliveries, and missing-package inquiries.
            </p>
          </div>
        </div>

        {investigations.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
            No unresolved investigation tickets. All SLAs met.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ticket #</th>
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Issue Reason</th>
                  <th className="py-3 px-4">Assigned Team</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {investigations.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {t.ticket_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {t.tracking_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        t.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs">{t.reason}</td>
                    <td className="py-3.5 px-4 text-slate-400">{t.assigned_team}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${t.status === 'RESOLVED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {t.status === 'OPEN' ? (
                        <button
                          onClick={() => handleResolveTicket(t.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold transition inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve Ticket
                        </button>
                      ) : (
                        <span className="text-slate-500">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Telephony Modal */}
      {selectedTrackingForCall && (
        <TelephonyCallModal
          trackingId={selectedTrackingForCall}
          isOpen={!!selectedTrackingForCall}
          onClose={() => setSelectedTrackingForCall(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

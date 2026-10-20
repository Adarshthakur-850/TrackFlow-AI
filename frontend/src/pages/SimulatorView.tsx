import React, { useState } from 'react';
import { 
  Cpu, Play, RefreshCw, AlertTriangle, PhoneCall, PlusCircle, 
  CheckCircle2, Clock, ShieldAlert, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';

export const SimulatorView: React.FC = () => {
  const [targetTrackingId, setTargetTrackingId] = useState('TRK-20261020-1002');
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const res = await api.createOrder({
        customer_name: "Bruce Wayne",
        customer_email: "bruce@wayneenterprises.com",
        customer_phone: "+1 555-0999",
        item_description: "Tactical Sensor Unit",
        total_amount: 890.0,
        weight_kg: 3.4,
        delivery_address: {
          street_address: "1007 Mountain Drive",
          city: "Gotham Metro",
          state: "NJ",
          postal_code: "07001"
        }
      });
      setTargetTrackingId(res.tracking_id);
      addLog(`ORDER CREATED: Tracking ID: ${res.tracking_id}. Status: ${res.current_status}.`);
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateFullJourney = async () => {
    setLoading(true);
    try {
      addLog(`Starting full lifecycle simulation for ${targetTrackingId}...`);
      const res = await api.simulateFullJourney(targetTrackingId);
      addLog(`SIMULATION FINISHED: ${res.message}`);
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInjectStaleScan = async () => {
    setLoading(true);
    try {
      const res = await api.injectStaleScan(targetTrackingId);
      addLog(`STALE SCAN INJECTED: Risk updated to [${res.risk_category}]. Explanation: ${res.explanation}`);
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInjectException = async () => {
    setLoading(true);
    try {
      const res = await api.injectDeliveryException(targetTrackingId);
      addLog(`EXCEPTION INJECTED: Risk: [${res.risk_category}]. Telephony call initiated!`);
      addLog(`TELEPHONY OUTCOME: Customer responded: "${res.customer_response}"`);
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedNetwork = async () => {
    setLoading(true);
    try {
      const res = await api.seedDemoData();
      addLog(`FLEET SEEDED: ${res.message}`);
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Testing Sandbox
          </span>
          <span className="text-xs text-slate-400">Edge Case Simulator & Event Injector</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Simulation Lab & Scenarios
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Shipment
              </label>
              <input
                type="text"
                value={targetTrackingId}
                onChange={(e) => setTargetTrackingId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> 1. Create New Order (Stage 1)
            </button>

            <button
              onClick={handleSimulateFullJourney}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> 2. Simulate Full Journey (Stages 2-7 POD)
            </button>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Edge Case Injections
              </span>

              <button
                onClick={handleInjectStaleScan}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" /> Inject Stale Telemetry Anomaly
              </button>

              <button
                onClick={handleInjectException}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Inject Delivery Exception & Phone Call
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleSeedNetwork}
                disabled={loading}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 font-semibold transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Seed Logistics Hubs & Fleet
              </button>
            </div>
          </div>
        </div>

        {/* Console Logs Column */}
        <div className="lg:col-span-2">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl h-full min-h-[420px] flex flex-col font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Live Simulation Event Log
              </span>
              <button 
                onClick={() => setLog([])}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Clear Log
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {log.length === 0 ? (
                <p className="text-slate-600 text-center py-16">
                  Ready. Click a scenario button above to inject telemetry events or simulate package lifecycles.
                </p>
              ) : (
                log.map((line, i) => (
                  <div key={i} className="leading-relaxed">
                    <span className={
                      line.includes('ERROR') ? 'text-rose-400' :
                      line.includes('EXCEPTION') ? 'text-amber-400' :
                      line.includes('TELEPHONY') ? 'text-cyan-400 font-semibold' :
                      line.includes('ORDER') ? 'text-emerald-400' : 'text-slate-300'
                    }>
                      {line}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

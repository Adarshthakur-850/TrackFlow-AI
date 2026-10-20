import React, { useState } from 'react';
import { 
  Building2, Scan, ArrowRightCircle, CheckCircle2, Box, 
  MapPin, AlertCircle, ArrowUpRight 
} from 'lucide-react';
import { api } from '../services/api';

export const WarehouseTerminal: React.FC = () => {
  const [scanTrackingId, setScanTrackingId] = useState('TRK-20261020-1002');
  const [warehouseCode, setWarehouseCode] = useState('WH-SFO-01');
  const [storageBin, setStorageBin] = useState('ZONE-B-SHELF-04-BIN-18');
  const [nextDestination, setNextDestination] = useState('San Jose Regional Hub');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.warehouseReceipt(scanTrackingId, {
        warehouse_code: warehouseCode,
        scanned_barcode: scanTrackingId,
        storage_bin: storageBin,
        condition_notes: "Scanned intact at intake conveyor belt."
      });
      setMessage(`Successfully scanned ${scanTrackingId} into ${warehouseCode} at Bin [${storageBin}]. Status: ${res.new_status}.`);
    } catch (err: any) {
      setError(err.message || "Failed to check in package.");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.warehouseDispatch(scanTrackingId, {
        warehouse_code: warehouseCode,
        next_destination: nextDestination,
        carrier_name: "TrackFlow Line-Haul Express"
      });
      setMessage(`Dispatched ${scanTrackingId} from ${warehouseCode} towards ${nextDestination}. New status: ${res.new_status}.`);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch package.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase tracking-widest font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            Fulfillment & Distribution
          </span>
          <span className="text-xs text-slate-400">Warehouse Staff Terminal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Warehouse Intake & Sortation Terminal
        </h1>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Module 1: Scan & Inventory Check-In */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Inbound Check-In & Bin Shelving</h2>
              <p className="text-xs text-slate-400">Scan package barcode and allocate storage bin</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Scan Tracking Barcode
              </label>
              <input
                type="text"
                value={scanTrackingId}
                onChange={(e) => setScanTrackingId(e.target.value)}
                placeholder="e.g. TRK-20261020-1002"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Warehouse Facility
                </label>
                <select
                  value={warehouseCode}
                  onChange={(e) => setWarehouseCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="WH-SFO-01">WH-SFO-01 (San Francisco Hub)</option>
                  <option value="WH-OAK-02">WH-OAK-02 (Oakland Distribution)</option>
                  <option value="WH-SJC-03">WH-SJC-03 (Silicon Valley Hub)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Storage Bin
                </label>
                <input
                  type="text"
                  value={storageBin}
                  onChange={(e) => setStorageBin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleCheckin}
              disabled={loading || !scanTrackingId}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Scan className="w-4 h-4" />
              Confirm Inbound Scan & Register Bin
            </button>
          </div>
        </div>

        {/* Module 2: Outbound Line-Haul Dispatch */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Outbound Sortation & Dispatch</h2>
              <p className="text-xs text-slate-400">Assign to line-haul carrier freight route</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dispatch Target Destination
              </label>
              <input
                type="text"
                value={nextDestination}
                onChange={(e) => setNextDestination(e.target.value)}
                placeholder="e.g. San Jose Regional Hub"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Automated Audit Rules:</p>
              <p>• Scanning departure automatically updates immutable shipment leg history.</p>
              <p>• AI monitors dwell time; packages exceeding 18 hours trigger warehouse dwell alerts.</p>
            </div>

            <button
              onClick={handleDispatch}
              disabled={loading || !scanTrackingId}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowRightCircle className="w-4 h-4" />
              Dispatch to Freight Transit Corridor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

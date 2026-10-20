import React from 'react';
import { MapPin, Navigation, Compass, Signal, ShieldCheck, AlertCircle } from 'lucide-react';

interface LiveMapProps {
  currentLat?: number;
  currentLng?: number;
  locationName?: string;
  isVerified?: boolean;
  destinationCity?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  currentLat = 37.7749,
  currentLng = -122.4194,
  locationName = "San Francisco Logistics Corridor",
  isVerified = true,
  destinationCity = "San Francisco, CA"
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-200">Live Telemetry & Route Radar</h3>
        </div>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified GPS Telemetry
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5" /> Estimated / Stale Location
            </span>
          )}
        </div>
      </div>

      {/* Styled Interactive Radar Simulation Canvas */}
      <div className="relative h-64 w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
        {/* Radar concentric circular grids */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-96 h-96 border border-emerald-500/30 rounded-full" />
          <div className="w-64 h-64 border border-emerald-500/40 rounded-full absolute" />
          <div className="w-32 h-32 border border-emerald-500/60 rounded-full absolute" />
          <div className="w-full h-[1px] bg-emerald-500/20 absolute" />
          <div className="h-full w-[1px] bg-emerald-500/20 absolute" />
        </div>

        {/* Route Line SVG */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 60 190 Q 180 80 320 120 T 520 140"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="6,6"
            className="opacity-70 animate-pulse"
          />
        </svg>

        {/* Origin Marker */}
        <div className="absolute left-14 bottom-14 flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/30">
            <span className="text-[10px] font-bold">WH</span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
            Central Hub
          </span>
        </div>

        {/* Active Courier Location Marker */}
        <div className="absolute top-[38%] left-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-xl shadow-emerald-500/50">
              <Navigation className="w-5 h-5 stroke-[2.5] transform rotate-45" />
            </div>
            <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-40" />
          </div>
          <div className="mt-2 text-center bg-slate-900/95 border border-emerald-500/40 px-2.5 py-1 rounded-md shadow-lg">
            <p className="text-[11px] font-bold text-emerald-300">{locationName}</p>
            <p className="text-[10px] text-slate-400 font-mono">
              {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Destination Marker */}
        <div className="absolute right-12 top-14 flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-400 font-semibold mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
            {destinationCity}
          </span>
        </div>

        {/* Overlay HUD Telemetry */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Signal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Carrier GPS 4G/LTE</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>34 km/h • Heading NE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

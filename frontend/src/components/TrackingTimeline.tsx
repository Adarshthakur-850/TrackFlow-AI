import React from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, MapPin, Truck, Box, ShieldCheck, 
  FileText, User, Camera, Lock
} from 'lucide-react';
import { ShipmentEvent, ProofOfDelivery } from '../services/api';

interface TimelineProps {
  currentStatus: string;
  events: ShipmentEvent[];
  proofOfDelivery?: ProofOfDelivery;
  deliveryOtp?: string;
}

export const TrackingTimeline: React.FC<TimelineProps> = ({ 
  currentStatus, 
  events, 
  proofOfDelivery 
}) => {
  const STAGES = [
    { key: 'ORDER_PLACED', label: 'Order Placed', desc: 'Order confirmed & tracking ID assigned' },
    { key: 'PICKED_UP', label: 'Package Collected', desc: 'Picked up from merchant with security check' },
    { key: 'RECEIVED_AT_WAREHOUSE', label: 'Warehouse Check-in', desc: 'Scanned into hub & assigned to inventory bin' },
    { key: 'IN_TRANSIT', label: 'In Transit', desc: 'Dispatched on freight line-haul corridor' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Handed over to courier with route GPS active' },
    { key: 'DELIVERED', label: 'Verified Delivery', desc: 'Strict POD confirmed via OTP / Signature' },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'ORDER_PLACED': return 0;
      case 'PICKUP_ASSIGNED':
      case 'READY_FOR_PICKUP':
      case 'PICKED_UP': return 1;
      case 'IN_TRANSIT_TO_WAREHOUSE':
      case 'RECEIVED_AT_WAREHOUSE':
      case 'PROCESSING':
      case 'SORTED': return 2;
      case 'DISPATCHED':
      case 'IN_TRANSIT': return 3;
      case 'OUT_FOR_DELIVERY': return 4;
      case 'DELIVERED': return 5;
      case 'DELIVERY_EXCEPTION': return 4;
      default: return 0;
    }
  };

  const activeStageIdx = getStageIndex(currentStatus);
  const isDelivered = currentStatus === 'DELIVERED';
  const isException = currentStatus === 'DELIVERY_EXCEPTION' || currentStatus === 'UNDER_INVESTIGATION';

  return (
    <div className="space-y-6">
      {/* 1. Stage Stepper Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-200 mb-6 flex items-center justify-between">
          <span>Delivery Progress</span>
          {isException && (
            <span className="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> Exception Flagged
            </span>
          )}
        </h3>

        <div className="relative">
          <div className="hidden md:flex justify-between items-center relative z-10">
            {STAGES.map((stg, idx) => {
              const isPast = idx < activeStageIdx;
              const isCurrent = idx === activeStageIdx;
              return (
                <div key={stg.key} className="flex flex-col items-center flex-1 text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                      isPast || (isCurrent && isDelivered)
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30'
                        : isCurrent
                        ? isException
                          ? 'bg-rose-500 border-rose-400 text-white animate-pulse'
                          : 'bg-emerald-950 border-emerald-400 text-emerald-400 animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {isPast || (isCurrent && isDelivered) ? (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    ) : isCurrent && isException ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-xs font-semibold mt-2.5 ${isCurrent ? 'text-emerald-400 font-bold' : isPast ? 'text-slate-300' : 'text-slate-500'}`}>
                    {stg.label}
                  </span>
                  <span className="text-[11px] text-slate-500 max-w-[110px] hidden lg:block mt-0.5">
                    {stg.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar background line */}
          <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-slate-800 -z-0">
            <div 
              className={`h-full transition-all duration-500 ${isException ? 'bg-gradient-to-r from-emerald-500 to-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (activeStageIdx / (STAGES.length - 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Proof of Delivery Card if Delivered */}
      {proofOfDelivery && (
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-300">Verified Proof of Delivery (POD)</h4>
              <p className="text-xs text-slate-400">Delivered on {new Date(proofOfDelivery.delivered_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block mb-1">Recipient Name</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> {proofOfDelivery.recipient_name}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Verification Method</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> {proofOfDelivery.verification_type} (OTP Matched)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Receipt Status</span>
              {proofOfDelivery.customer_reported_non_receipt ? (
                <span className="font-bold text-rose-400">DISPUTED BY CUSTOMER</span>
              ) : (
                <span className="font-semibold text-emerald-400">Customer Confirmed</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Detailed Immutable Event Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center justify-between">
          <span>Immutable Event Audit Log</span>
          <span className="text-xs text-slate-500 font-mono">{events.length} Recorded Events</span>
        </h3>

        <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
          {events.slice().reverse().map((evt, idx) => (
            <div key={evt.id || idx} className="relative pl-6">
              {/* Event Marker */}
              <div 
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
                  idx === 0 
                    ? evt.exception_code ? 'bg-rose-500 border-rose-300' : 'bg-emerald-500 border-emerald-300 shadow-sm shadow-emerald-500/50' 
                    : 'bg-slate-800 border-slate-600'
                }`} 
              />
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                    {evt.event_type}
                    {evt.is_verified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        VERIFIED
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>
                
                {/* Event meta tags */}
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
                  {evt.location_name && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3 h-3 text-emerald-400" /> {evt.location_name}
                    </span>
                  )}
                  {evt.actor_id && (
                    <span className="text-slate-400">
                      Actor: <span className="text-slate-300">{evt.actor_id}</span>
                    </span>
                  )}
                  <span className="text-slate-400">
                    Source: <span className="text-slate-300">{evt.source}</span>
                  </span>
                  <span className="ml-auto text-slate-500 text-[10px]">
                    ID: {evt.event_id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

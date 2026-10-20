import React from 'react';
import { 
  Package, Truck, CheckCircle2, AlertTriangle, Clock, 
  MapPin, ShieldAlert, ArrowRightCircle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'ORDER_PLACED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950 text-blue-400 border border-blue-800 ${className}`}>
          <Package className="w-3.5 h-3.5" /> Order Placed
        </span>
      );
    case 'PICKUP_ASSIGNED':
    case 'READY_FOR_PICKUP':
    case 'PICKED_UP':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950 text-cyan-400 border border-cyan-800 ${className}`}>
          <ArrowRightCircle className="w-3.5 h-3.5" /> Picked Up
        </span>
      );
    case 'IN_TRANSIT_TO_WAREHOUSE':
    case 'RECEIVED_AT_WAREHOUSE':
    case 'PROCESSING':
    case 'SORTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950 text-purple-400 border border-purple-800 ${className}`}>
          <MapPin className="w-3.5 h-3.5" /> In Warehouse
        </span>
      );
    case 'DISPATCHED':
    case 'IN_TRANSIT':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-950 text-indigo-400 border border-indigo-800 ${className}`}>
          <Truck className="w-3.5 h-3.5" /> In Transit
        </span>
      );
    case 'OUT_FOR_DELIVERY':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800 animate-pulse ${className}`}>
          <Truck className="w-3.5 h-3.5" /> Out For Delivery
        </span>
      );
    case 'DELIVERED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
        </span>
      );
    case 'DELIVERY_EXCEPTION':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5" /> Delivery Exception
        </span>
      );
    case 'UNDER_INVESTIGATION':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-950 text-red-400 border border-red-800 ${className}`}>
          <ShieldAlert className="w-3.5 h-3.5" /> Under Investigation
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
          <Clock className="w-3.5 h-3.5" /> {status}
        </span>
      );
  }
};

export const RiskBadge: React.FC<{ risk: string }> = ({ risk }) => {
  if (risk === 'Normal') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
        <CheckCircle2 className="w-3 h-3" /> Normal Risk
      </span>
    );
  }
  if (risk.includes('delay') || risk === 'Delayed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/50">
        <Clock className="w-3 h-3" /> {risk}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-900/60 text-rose-300 border border-rose-700/50">
      <AlertTriangle className="w-3 h-3" /> {risk}
    </span>
  );
};

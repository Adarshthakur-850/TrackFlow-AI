export interface ShipmentEvent {
  id: number;
  event_id: string;
  tracking_id: string;
  previous_status?: string;
  new_status: string;
  event_type: string;
  description: string;
  timestamp: string;
  facility_id?: string;
  actor_id?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  source: string;
  is_verified: boolean;
  proof_reference?: string;
  exception_code?: string;
}

export interface ProofOfDelivery {
  id: number;
  recipient_name: string;
  delivered_at: string;
  verification_type: string;
  otp_code_matched: boolean;
  signature_svg_or_url?: string;
  photo_evidence_url?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  customer_confirmed_receipt: boolean;
  customer_reported_non_receipt: boolean;
  non_receipt_reason?: string;
}

export interface PackageDetail {
  id: number;
  tracking_id: string;
  order_id: number;
  weight_kg: number;
  dimensions: string;
  is_fragile: boolean;
  current_status: string;
  current_risk_category: string;
  risk_explanation?: string;
  recommended_action?: string;
  last_known_lat?: number;
  last_known_lng?: number;
  last_known_location_name?: string;
  last_location_timestamp?: string;
  is_location_verified: boolean;
  estimated_delivery_date?: string;
  created_at: string;
  updated_at: string;
  events: ShipmentEvent[];
  proof_of_delivery?: ProofOfDelivery;
  customer_name?: string;
  customer_phone?: string;
  destination_city?: string;
  delivery_otp_required: boolean;
}

export interface AdminAnalytics {
  total_shipments: number;
  active_deliveries: number;
  awaiting_pickup: number;
  packages_in_warehouses: number;
  in_transit: number;
  out_for_delivery: number;
  delivered_count: number;
  delivery_exceptions: number;
  delayed_or_at_risk: number;
  stale_location_alerts: number;
  open_investigations: number;
  carrier_on_time_rate: number;
}

const API_BASE = '/api/v1';

export const api = {
  async getShipment(trackingId: string): Promise<PackageDetail> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getTimeline(trackingId: string): Promise<ShipmentEvent[]> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/timeline`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createOrder(data: any): Promise<PackageDetail> {
    const res = await fetch(`${API_BASE}/orders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async pickupPackage(trackingId: string, data: any): Promise<ShipmentEvent> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async warehouseReceipt(trackingId: string, data: any): Promise<ShipmentEvent> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/warehouse-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async warehouseDispatch(trackingId: string, data: any): Promise<ShipmentEvent> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async assignAgent(trackingId: string, data: any): Promise<ShipmentEvent> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/assign-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateLocation(trackingId: string, data: any): Promise<ShipmentEvent> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async submitPOD(trackingId: string, data: any): Promise<ShipmentEvent> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/proof-of-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async reportException(trackingId: string, data: any): Promise<ShipmentEvent> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/delivery-attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async reportNonReceipt(trackingId: string, data: any): Promise<ShipmentEvent> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/report-non-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async contactCustomer(trackingId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/shipments/${trackingId}/contact-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const res = await fetch(`${API_BASE}/admin/analytics`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAtRiskShipments(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/shipments/at-risk`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getInvestigations(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/investigations`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async resolveInvestigation(ticketId: number, notes: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/investigations/${ticketId}/resolve?resolution_notes=${encodeURIComponent(notes)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getWarehouses(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/warehouses`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAgents(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/agents`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async simulateFullJourney(trackingId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/simulate-full-journey/${trackingId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async injectStaleScan(trackingId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/inject-stale-scan/${trackingId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async injectDeliveryException(trackingId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/inject-delivery-exception/${trackingId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async seedDemoData(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/seed-demo-data`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

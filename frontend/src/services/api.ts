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

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api/v1';

// --- IN-BROWSER FALLBACK ENGINE FOR STATIC HOSTING (GITHUB PAGES) ---
const initialPackages: Record<string, PackageDetail> = {
  "TRK-20261020-1001": {
    id: 101,
    tracking_id: "TRK-20261020-1001",
    order_id: 1,
    weight_kg: 2.5,
    dimensions: "30x20x15 cm",
    is_fragile: false,
    current_status: "OUT_FOR_DELIVERY",
    current_risk_category: "Normal",
    risk_explanation: "Shipment proceeding according to standard transit schedule.",
    recommended_action: "Continue regular telemetry monitoring.",
    last_known_lat: 37.7792,
    last_known_lng: -122.4175,
    last_known_location_name: "Market St & 5th Ave",
    last_location_timestamp: new Date().toISOString(),
    is_location_verified: true,
    estimated_delivery_date: new Date(Date.now() + 4 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    customer_name: "Sarah Connor",
    customer_phone: "+1 (555) 901-2244",
    destination_city: "San Francisco, CA",
    delivery_otp_required: true,
    events: [
      {
        id: 1,
        event_id: "EVT-1001-A",
        tracking_id: "TRK-20261020-1001",
        new_status: "ORDER_PLACED",
        event_type: "ORDER_PLACED",
        description: "Order ORD-1001 confirmed. Delivery OTP 882194 issued.",
        timestamp: new Date(Date.now() - 10 * 3600000).toISOString(),
        source: "SYSTEM_AUTOMATION",
        is_verified: true
      },
      {
        id: 2,
        event_id: "EVT-1001-B",
        tracking_id: "TRK-20261020-1001",
        new_status: "PICKED_UP",
        event_type: "PACKAGE_COLLECTED",
        description: "Package collected from merchant depot with verified scan.",
        timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
        source: "BARCODE_SCAN",
        is_verified: true
      },
      {
        id: 3,
        event_id: "EVT-1001-C",
        tracking_id: "TRK-20261020-1001",
        new_status: "RECEIVED_AT_WAREHOUSE",
        event_type: "WAREHOUSE_CHECKIN",
        description: "Scanned into San Francisco Mega-Hub. Allocated Bin [ZONE-A-04].",
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        facility_id: "WH-SFO-01",
        source: "BARCODE_SCAN",
        is_verified: true
      },
      {
        id: 4,
        event_id: "EVT-1001-D",
        tracking_id: "TRK-20261020-1001",
        new_status: "OUT_FOR_DELIVERY",
        event_type: "OUT_FOR_DELIVERY",
        description: "Handed over to courier Alex Mercer (Van #CA-7TF901). Out for delivery.",
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
        actor_id: "AGT-101",
        latitude: 37.7792,
        longitude: -122.4175,
        location_name: "Market St & 5th Ave",
        source: "BARCODE_SCAN",
        is_verified: true
      }
    ]
  },
  "TRK-20261020-1002": {
    id: 102,
    tracking_id: "TRK-20261020-1002",
    order_id: 2,
    weight_kg: 1.8,
    dimensions: "25x15x10 cm",
    is_fragile: false,
    current_status: "IN_TRANSIT",
    current_risk_category: "At risk of delay",
    risk_explanation: "Severe traffic congestion in East Bay; ML delay probability 78%.",
    recommended_action: "Prioritize last-mile dispatch slot and notify recipient.",
    last_known_lat: 37.8044,
    last_known_lng: -122.2712,
    last_known_location_name: "I-80 Westbound Freight Corridor",
    last_location_timestamp: new Date().toISOString(),
    is_location_verified: true,
    estimated_delivery_date: new Date(Date.now() + 6 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    customer_name: "David Bowman",
    customer_phone: "+1 (555) 345-6677",
    destination_city: "Oakland, CA",
    delivery_otp_required: true,
    events: [
      {
        id: 11,
        event_id: "EVT-1002-A",
        tracking_id: "TRK-20261020-1002",
        new_status: "ORDER_PLACED",
        event_type: "ORDER_PLACED",
        description: "Order ORD-1002 confirmed. Delivery OTP 654321.",
        timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
        source: "SYSTEM_AUTOMATION",
        is_verified: true
      },
      {
        id: 12,
        event_id: "EVT-1002-B",
        tracking_id: "TRK-20261020-1002",
        new_status: "IN_TRANSIT",
        event_type: "DISPATCHED_IN_TRANSIT",
        description: "Departed Oakland Distribution Center toward regional sorting hub.",
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
        source: "GPS_DEVICE",
        is_verified: true
      }
    ]
  },
  "TRK-20261020-1003": {
    id: 103,
    tracking_id: "TRK-20261020-1003",
    order_id: 3,
    weight_kg: 3.2,
    dimensions: "35x25x20 cm",
    is_fragile: true,
    current_status: "DELIVERY_EXCEPTION",
    current_risk_category: "Delivery failed",
    risk_explanation: "Customer unreachable at gate code; auto-telephony call scheduled.",
    recommended_action: "Trigger authorized customer contact workflow and schedule redelivery.",
    last_known_lat: 37.7858,
    last_known_lng: -122.4065,
    last_known_location_name: "Mission District Logistics Drop",
    last_location_timestamp: new Date().toISOString(),
    is_location_verified: true,
    estimated_delivery_date: new Date(Date.now() + 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    customer_name: "Rachel Tyrell",
    customer_phone: "+1 (555) 123-9988",
    destination_city: "San Francisco, CA",
    delivery_otp_required: true,
    events: [
      {
        id: 21,
        event_id: "EVT-1003-A",
        tracking_id: "TRK-20261020-1003",
        new_status: "ORDER_PLACED",
        event_type: "ORDER_PLACED",
        description: "Order ORD-1003 placed.",
        timestamp: new Date(Date.now() - 14 * 3600000).toISOString(),
        source: "SYSTEM_AUTOMATION",
        is_verified: true
      },
      {
        id: 22,
        event_id: "EVT-1003-B",
        tracking_id: "TRK-20261020-1003",
        new_status: "DELIVERY_EXCEPTION",
        event_type: "DELIVERY_EXCEPTION",
        description: "Delivery attempt #1 unsuccessful: Security gate locked; intercom unresponsive.",
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        source: "SYSTEM_AUTOMATION",
        is_verified: true,
        exception_code: "SECURITY_GATE_LOCKED"
      }
    ]
  }
};

let fallbackStore = { ...initialPackages };
let fallbackInvestigations = [
  {
    id: 1,
    ticket_number: "TKT-884912",
    tracking_id: "TRK-20261020-1003",
    reason: "Security gate locked; intercom unresponsive.",
    severity: "HIGH",
    status: "OPEN",
    assigned_team: "Last-Mile Operations",
    created_at: new Date(Date.now() - 40 * 60000).toISOString()
  }
];

export const api = {
  async getShipment(trackingId: string): Promise<PackageDetail> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback
    const pkg = fallbackStore[trackingId];
    if (pkg) return pkg;
    throw new Error(`Shipment with tracking ID '${trackingId}' was not found.`);
  },

  async getTimeline(trackingId: string): Promise<ShipmentEvent[]> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/timeline`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const pkg = fallbackStore[trackingId];
    if (pkg) return pkg.events;
    return [];
  },

  async createOrder(data: any): Promise<PackageDetail> {
    try {
      const res = await fetch(`${API_BASE}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const newId = `TRK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPkg: PackageDetail = {
      id: Math.floor(Math.random() * 10000),
      tracking_id: newId,
      order_id: Math.floor(Math.random() * 10000),
      weight_kg: data.weight_kg || 1.5,
      dimensions: data.dimensions || "25x20x15 cm",
      is_fragile: data.is_fragile || false,
      current_status: "ORDER_PLACED",
      current_risk_category: "Normal",
      risk_explanation: "Order registered. Initial transit routing confirmed.",
      recommended_action: "Awaiting pickup from merchant.",
      last_known_lat: 37.7749,
      last_known_lng: -122.4194,
      last_known_location_name: "Merchant Fulfillment Center",
      last_location_timestamp: new Date().toISOString(),
      is_location_verified: true,
      estimated_delivery_date: new Date(Date.now() + 48 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_name: data.customer_name || "Customer",
      customer_phone: data.customer_phone || "+1 555-0100",
      destination_city: data.delivery_address?.city || "San Francisco",
      delivery_otp_required: true,
      events: [
        {
          id: Math.floor(Math.random() * 10000),
          event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
          tracking_id: newId,
          new_status: "ORDER_PLACED",
          event_type: "ORDER_PLACED",
          description: `Order registered for ${data.item_description || 'Package'}. Secure Delivery OTP: 882194`,
          timestamp: new Date().toISOString(),
          source: "SYSTEM_AUTOMATION",
          is_verified: true
        }
      ]
    };
    fallbackStore[newId] = newPkg;
    return newPkg;
  },

  async pickupPackage(trackingId: string, data: any): Promise<ShipmentEvent> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const evt: ShipmentEvent = {
      id: Math.floor(Math.random() * 10000),
      event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
      tracking_id: trackingId,
      new_status: "PICKED_UP",
      event_type: "PACKAGE_COLLECTED",
      description: `Package collected by agent ${data.pickup_agent_id}.`,
      timestamp: new Date().toISOString(),
      source: "BARCODE_SCAN",
      is_verified: true
    };
    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "PICKED_UP";
      fallbackStore[trackingId].events.push(evt);
    }
    return evt;
  },

  async warehouseReceipt(trackingId: string, data: any): Promise<ShipmentEvent> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/warehouse-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const evt: ShipmentEvent = {
      id: Math.floor(Math.random() * 10000),
      event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
      tracking_id: trackingId,
      new_status: "RECEIVED_AT_WAREHOUSE",
      event_type: "WAREHOUSE_CHECKIN",
      description: `Scanned into ${data.warehouse_code} at Bin [${data.storage_bin || 'BIN-01'}].`,
      timestamp: new Date().toISOString(),
      source: "BARCODE_SCAN",
      is_verified: true
    };
    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "RECEIVED_AT_WAREHOUSE";
      fallbackStore[trackingId].events.push(evt);
    }
    return evt;
  },

  async warehouseDispatch(trackingId: string, data: any): Promise<ShipmentEvent> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const evt: ShipmentEvent = {
      id: Math.floor(Math.random() * 10000),
      event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
      tracking_id: trackingId,
      new_status: "IN_TRANSIT",
      event_type: "DISPATCHED_IN_TRANSIT",
      description: `Dispatched toward ${data.next_destination} via ${data.carrier_name || 'Line-Haul'}.`,
      timestamp: new Date().toISOString(),
      source: "BARCODE_SCAN",
      is_verified: true
    };
    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "IN_TRANSIT";
      fallbackStore[trackingId].events.push(evt);
    }
    return evt;
  },

  async assignAgent(trackingId: string, data: any): Promise<ShipmentEvent> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/assign-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const evt: ShipmentEvent = {
      id: Math.floor(Math.random() * 10000),
      event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
      tracking_id: trackingId,
      new_status: "OUT_FOR_DELIVERY",
      event_type: "OUT_FOR_DELIVERY",
      description: `Handed over to courier. Out for final delivery.`,
      timestamp: new Date().toISOString(),
      source: "BARCODE_SCAN",
      is_verified: true
    };
    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "OUT_FOR_DELIVERY";
      fallbackStore[trackingId].events.push(evt);
    }
    return evt;
  },

  async updateLocation(trackingId: string, data: any): Promise<ShipmentEvent> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const evt: ShipmentEvent = {
      id: Math.floor(Math.random() * 10000),
      event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
      tracking_id: trackingId,
      new_status: fallbackStore[trackingId]?.current_status || "IN_TRANSIT",
      event_type: "GPS_LOCATION_PING",
      description: `GPS telemetry received at [${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}]. Speed: ${data.speed_kmh} km/h.`,
      timestamp: new Date().toISOString(),
      latitude: data.latitude,
      longitude: data.longitude,
      source: "GPS_DEVICE",
      is_verified: true
    };
    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].last_known_lat = data.latitude;
      fallbackStore[trackingId].last_known_lng = data.longitude;
      fallbackStore[trackingId].last_location_timestamp = new Date().toISOString();
      fallbackStore[trackingId].events.push(evt);
    }
    return evt;
  },

  async submitPOD(trackingId: string, data: any): Promise<ShipmentEvent> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/proof-of-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const pod: ProofOfDelivery = {
      id: Math.floor(Math.random() * 10000),
      recipient_name: data.recipient_name,
      delivered_at: new Date().toISOString(),
      verification_type: data.verification_type,
      otp_code_matched: true,
      signature_svg_or_url: data.signature_data,
      delivery_latitude: data.latitude,
      delivery_longitude: data.longitude,
      customer_confirmed_receipt: true,
      customer_reported_non_receipt: false
    };

    const evt: ShipmentEvent = {
      id: Math.floor(Math.random() * 10000),
      event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
      tracking_id: trackingId,
      new_status: "DELIVERED",
      event_type: "PACKAGE_DELIVERED",
      description: `Package securely delivered to ${data.recipient_name} via ${data.verification_type} verification.`,
      timestamp: new Date().toISOString(),
      source: "SYSTEM_AUTOMATION",
      is_verified: true
    };

    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "DELIVERED";
      fallbackStore[trackingId].current_risk_category = "Normal";
      fallbackStore[trackingId].proof_of_delivery = pod;
      fallbackStore[trackingId].events.push(evt);
    }
    return evt;
  },

  async reportException(trackingId: string, data: any): Promise<ShipmentEvent> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/delivery-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const evt: ShipmentEvent = {
      id: Math.floor(Math.random() * 10000),
      event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
      tracking_id: trackingId,
      new_status: "DELIVERY_EXCEPTION",
      event_type: "DELIVERY_EXCEPTION",
      description: `Delivery exception: [${data.reason_code}] - ${data.description}`,
      timestamp: new Date().toISOString(),
      source: "SYSTEM_AUTOMATION",
      is_verified: true,
      exception_code: data.reason_code
    };

    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "DELIVERY_EXCEPTION";
      fallbackStore[trackingId].current_risk_category = "Delivery failed";
      fallbackStore[trackingId].risk_explanation = `Delivery exception: ${data.description}`;
      fallbackStore[trackingId].events.push(evt);
    }
    return evt;
  },

  async reportNonReceipt(trackingId: string, data: any): Promise<ShipmentEvent> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/report-non-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const evt: ShipmentEvent = {
      id: Math.floor(Math.random() * 10000),
      event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
      tracking_id: trackingId,
      new_status: "UNDER_INVESTIGATION",
      event_type: "NON_RECEIPT_REPORTED",
      description: `Recipient reported non-receipt. Reason: ${data.reason}. Investigation ticket opened.`,
      timestamp: new Date().toISOString(),
      source: "MANUAL_ENTRY",
      is_verified: true
    };

    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "UNDER_INVESTIGATION";
      fallbackStore[trackingId].current_risk_category = "Under investigation";
      if (fallbackStore[trackingId].proof_of_delivery) {
        fallbackStore[trackingId].proof_of_delivery!.customer_reported_non_receipt = true;
      }
      fallbackStore[trackingId].events.push(evt);
    }
    return evt;
  },

  async contactCustomer(trackingId: string, data: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/shipments/${trackingId}/contact-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      status: "SUCCESS",
      attempt_id: Math.floor(Math.random() * 1000),
      channel: data.channel || "TELEPHONY_CALL",
      call_status: "COMPLETED",
      customer_response: "Customer answered: 'Please leave with security desk or gate code 4491.'",
      transcript: `[IVR Gateway]: Dialing customer for tracking ${trackingId} regarding: ${data.reason || 'Delivery'}. Call duration: 42s.`
    };
  },

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const pkgs = Object.values(fallbackStore);
    return {
      total_shipments: pkgs.length,
      active_deliveries: pkgs.filter(p => p.current_status !== 'DELIVERED').length,
      awaiting_pickup: pkgs.filter(p => p.current_status === 'ORDER_PLACED').length,
      packages_in_warehouses: pkgs.filter(p => p.current_status === 'RECEIVED_AT_WAREHOUSE').length,
      in_transit: pkgs.filter(p => p.current_status === 'IN_TRANSIT').length,
      out_for_delivery: pkgs.filter(p => p.current_status === 'OUT_FOR_DELIVERY').length,
      delivered_count: pkgs.filter(p => p.current_status === 'DELIVERED').length,
      delivery_exceptions: pkgs.filter(p => p.current_status === 'DELIVERY_EXCEPTION').length,
      delayed_or_at_risk: pkgs.filter(p => p.current_risk_category !== 'Normal').length,
      stale_location_alerts: pkgs.filter(p => p.current_risk_category === 'Location unavailable').length,
      open_investigations: fallbackInvestigations.filter(i => i.status === 'OPEN').length,
      carrier_on_time_rate: 98.4
    };
  },

  async getAtRiskShipments(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/shipments/at-risk`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return Object.values(fallbackStore).filter(p => p.current_risk_category !== 'Normal');
  },

  async getInvestigations(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/investigations`);
      if (res.ok) return await res.json();
    } catch (e) {}

    return fallbackInvestigations;
  },

  async resolveInvestigation(ticketId: number, notes: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/admin/investigations/${ticketId}/resolve?resolution_notes=${encodeURIComponent(notes)}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const ticket = fallbackInvestigations.find(t => t.id === ticketId);
    if (ticket) ticket.status = "RESOLVED";
    return { status: "SUCCESS", message: `Ticket #${ticketId} marked resolved.` };
  },

  async getWarehouses(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/warehouses`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      { id: 1, warehouse_code: "WH-SFO-01", name: "San Francisco Fulfillment Mega-Hub", city: "San Francisco", state: "CA" },
      { id: 2, warehouse_code: "WH-OAK-02", name: "Oakland Distribution Center", city: "Oakland", state: "CA" }
    ];
  },

  async getAgents(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/agents`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      { id: 1, agent_code: "AGT-101", name: "Alex Mercer", phone: "+1 (555) 234-8891", service_zone: "San Francisco Downtown" }
    ];
  },

  async simulateFullJourney(trackingId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/simulation/simulate-full-journey/${trackingId}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "DELIVERED";
      fallbackStore[trackingId].current_risk_category = "Normal";
      fallbackStore[trackingId].proof_of_delivery = {
        id: Math.floor(Math.random() * 1000),
        recipient_name: fallbackStore[trackingId].customer_name || "Authorized Recipient",
        delivered_at: new Date().toISOString(),
        verification_type: "OTP",
        otp_code_matched: true,
        delivery_latitude: 37.7850,
        delivery_longitude: -122.4080,
        customer_confirmed_receipt: true,
        customer_reported_non_receipt: false
      };
      fallbackStore[trackingId].events.push({
        id: Math.floor(Math.random() * 10000),
        event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
        tracking_id: trackingId,
        new_status: "DELIVERED",
        event_type: "PACKAGE_DELIVERED",
        description: "[SIMULATION] Verified delivery completed with matching customer OTP.",
        timestamp: new Date().toISOString(),
        source: "SYSTEM_AUTOMATION",
        is_verified: true
      });
    }
    return { status: "SUCCESS", message: `Full lifecycle simulated for ${trackingId}.` };
  },

  async injectStaleScan(trackingId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/simulation/inject-stale-scan/${trackingId}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_risk_category = "Location unavailable";
      fallbackStore[trackingId].risk_explanation = "No GPS or scan update received for 6.5 hours during transit.";
      fallbackStore[trackingId].recommended_action = "Ping carrier IoT unit or request driver telemetry refresh.";
    }
    return {
      status: "STALE_TELEMETRY_INJECTED",
      tracking_id: trackingId,
      risk_category: "Location unavailable",
      explanation: "No GPS or scan update received for 6.5 hours during transit.",
      recommended_action: "Ping carrier IoT unit or request driver telemetry refresh."
    };
  },

  async injectDeliveryException(trackingId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/simulation/inject-delivery-exception/${trackingId}`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    if (fallbackStore[trackingId]) {
      fallbackStore[trackingId].current_status = "DELIVERY_EXCEPTION";
      fallbackStore[trackingId].current_risk_category = "Delivery failed";
      fallbackStore[trackingId].risk_explanation = "Security gate locked; intercom unresponsive; call box code needed.";
      fallbackStore[trackingId].events.push({
        id: Math.floor(Math.random() * 10000),
        event_id: `EVT-${Math.floor(Math.random() * 100000)}`,
        tracking_id: trackingId,
        new_status: "DELIVERY_EXCEPTION",
        event_type: "DELIVERY_EXCEPTION",
        description: "Delivery exception: Security gate locked. Recipient intercom unanswered.",
        timestamp: new Date().toISOString(),
        source: "SYSTEM_AUTOMATION",
        is_verified: true,
        exception_code: "SECURITY_GATE_LOCKED"
      });
    }
    return {
      status: "EXCEPTION_INJECTED",
      tracking_id: trackingId,
      risk_category: "Delivery failed",
      customer_response: "Customer answered: 'Please leave with reception/security or re-attempt tomorrow after 2 PM'."
    };
  },

  async seedDemoData(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/simulation/seed-demo-data`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    fallbackStore = { ...initialPackages };
    return { status: "SUCCESS", message: "Demo hubs, agents, vehicles, and active shipments initialized." };
  }
};

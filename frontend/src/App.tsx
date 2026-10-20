import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerTracking } from './pages/CustomerTracking';
import { AdminDashboard } from './pages/AdminDashboard';
import { WarehouseTerminal } from './pages/WarehouseTerminal';
import { DeliveryAgentConsole } from './pages/DeliveryAgentConsole';
import { SimulatorView } from './pages/SimulatorView';

export function App() {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'warehouse' | 'agent' | 'simulator'>('customer');
  const [wsStatus, setWsStatus] = useState('Online • Live Telemetry');

  // Establish background WebSocket connection to the server
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/admin/live-feed`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsStatus('Connected • Live Telemetry');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Live Feed Event]', data);
        } catch (e) {}
      };

      ws.onclose = () => {
        setWsStatus('Polling • Local Cache');
      };
    } catch (e) {
      setWsStatus('Active');
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab as any} liveStatus={wsStatus} />

      <main className="flex-1 pb-16">
        {activeTab === 'customer' && <CustomerTracking />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'warehouse' && <WarehouseTerminal />}
        {activeTab === 'agent' && <DeliveryAgentConsole />}
        {activeTab === 'simulator' && <SimulatorView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>
          TrackFlow AI — Intelligent Package Tracking & Delivery Management System • Built with FastAPI, PyTorch/Scikit-Learn & React
        </p>
      </footer>
    </div>
  );
}

export default App;

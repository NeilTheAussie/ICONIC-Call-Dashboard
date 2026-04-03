import { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from '../components/Navbar';

export default function PaymentDashboard() {
  const [overdue, setOverdue] = useState([]);
  const [promises, setPromises] = useState([]);
  const [subHealth, setSubHealth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [o, p, sh] = await Promise.all([
          api.getOverdue(),
          api.getPromises(),
          api.getSubHealth(),
        ]);
        setOverdue(o.payments);
        setPromises(p.payments);
        setSubHealth(sh);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  const totalOverdue = overdue.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPromises = promises.reduce((sum, p) => sum + (p.amount || 0), 0);
  const promisesPending = promises.filter(p => p.status === 'pending').length;
  const promisesCollected = promises.filter(p => p.status === 'collected').length;
  const promiseRate = promises.length > 0 ? Math.round((promisesCollected / promises.length) * 100) : 0;

  const markCollected = async (id) => {
    await api.updatePayment(id, { status: 'collected' });
    const { payments } = await api.getOverdue();
    setOverdue(payments);
    const { payments: proms } = await api.getPromises();
    setPromises(proms);
  };

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="text-pur">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <h1 className="text-lg font-bold text-txtb">Payment Dashboard</h1>

        {/* Collection Funnel */}
        <div className="bg-bg2 border border-bdr rounded-lg p-4">
          <div className="text-[10px] font-bold text-txtd uppercase tracking-wider mb-3">Collection Funnel</div>
          <div className="flex gap-2 flex-wrap mb-3">
            <div className="bg-bg3 border border-bdr rounded px-4 py-2 text-center flex-1">
              <div className="font-mono text-lg font-bold text-red">${(totalOverdue / 100).toLocaleString()}</div>
              <div className="text-[10px] text-txtd uppercase">Total Overdue</div>
            </div>
            <div className="bg-bg3 border border-bdr rounded px-4 py-2 text-center flex-1">
              <div className="font-mono text-lg font-bold text-org">{overdue.length}</div>
              <div className="text-[10px] text-txtd uppercase">Overdue Accounts</div>
            </div>
            <div className="bg-bg3 border border-bdr rounded px-4 py-2 text-center flex-1">
              <div className="font-mono text-lg font-bold text-org">${(totalPromises / 100).toLocaleString()}</div>
              <div className="text-[10px] text-txtd uppercase">Promise Total</div>
            </div>
            <div className="bg-bg3 border border-bdr rounded px-4 py-2 text-center flex-1">
              <div className={`font-mono text-lg font-bold ${promiseRate >= 30 ? 'text-grn' : 'text-yel'}`}>{promiseRate}%</div>
              <div className="text-[10px] text-txtd uppercase">Promise→Pay Rate</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-bg3 rounded-full h-4 overflow-hidden">
            <div className="bg-pur h-full rounded-full transition-all" style={{ width: `${Math.min(promiseRate, 100)}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-txtd mt-1">
            <span>Promise-to-Pay: <strong>{promiseRate}%</strong></span>
            <span>Target 30% · Stretch 40%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue Payments */}
          <div className="bg-bg2 border border-bdr rounded-lg p-4">
            <div className="text-[10px] font-bold text-red uppercase tracking-wider mb-3">Overdue Payments ({overdue.length})</div>
            {overdue.length === 0 ? (
              <p className="text-xs text-txtd text-center py-4">No overdue payments</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {overdue.map(p => (
                  <div key={p.id} className="bg-bg3 border border-bdr rounded p-2.5 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-txtb">{p.first_name} {p.last_name}</div>
                      <div className="text-[10px] text-txtd">
                        ${(p.amount / 100).toFixed(2)} · Due: {p.due_date ? new Date(p.due_date).toLocaleDateString() : 'N/A'}
                        {p.due_date && new Date(p.due_date) < new Date() && (
                          <span className="text-red font-semibold ml-1">
                            OVERDUE {Math.ceil((Date.now() - new Date(p.due_date).getTime()) / 86400000)} days
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => markCollected(p.id)} className="text-[10px] bg-grn/15 text-grn px-2 py-1 rounded font-semibold hover:bg-grn/25">Paid</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promise Tracker */}
          <div className="bg-bg2 border border-bdr rounded-lg p-4">
            <div className="text-[10px] font-bold text-org uppercase tracking-wider mb-3">Promise Tracker ({promises.length})</div>
            {promises.length === 0 ? (
              <p className="text-xs text-txtd text-center py-4">No promises logged</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {promises.map(p => (
                  <div key={p.id} className="bg-bg3 border border-bdr rounded p-2.5 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-txtb">{p.first_name} {p.last_name}</div>
                      <div className="text-[10px] text-txtd">
                        ${(p.amount / 100).toFixed(2)} promised
                        {p.due_date && <> · by {new Date(p.due_date).toLocaleDateString()}</>}
                        {p.viewer_name && <> · via {p.viewer_name}</>}
                      </div>
                    </div>
                    <div>
                      {p.status === 'collected' ? (
                        <span className="text-[10px] bg-grn/15 text-grn px-2 py-1 rounded font-semibold">✓ Paid</span>
                      ) : (
                        <button onClick={() => markCollected(p.id)} className="text-[10px] bg-pur/15 text-pur px-2 py-1 rounded font-semibold hover:bg-pur/25">Mark Paid</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subscription Health */}
        <div className="bg-bg2 border border-bdr rounded-lg p-4">
          <div className="text-[10px] font-bold text-grn uppercase tracking-wider mb-3">Subscription Health</div>
          <div className="flex gap-3 flex-wrap text-xs text-txtd">
            <span>Active: <strong className="text-grn">{subHealth.active || 0}</strong></span>
            <span>·</span>
            <span>Reduced: <strong className="text-yel">{subHealth.reduced || 0}</strong></span>
            <span>·</span>
            <span>Paused: <strong className="text-org">{subHealth.paused || 0}</strong></span>
            <span>·</span>
            <span>Churned: <strong className="text-red">{subHealth.churned || 0}</strong></span>
            <span>·</span>
            <span>MRR: <strong className="text-pur">${((subHealth.mrr_cents || 0) / 100).toLocaleString()}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import WeightBadge from '../components/WeightBadge';

export default function ViewerDashboard() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState(user.status || 'offline');
  const [currentLead, setCurrentLead] = useState(null);
  const [myStats, setMyStats] = useState({ calls: 0, closes: 0, revenue_cents: 0, promises: 0, deal_rate: 0 });
  const [outcome, setOutcome] = useState('');
  const [paymentTier, setPaymentTier] = useState('');
  const [revenueOnCall, setRevenueOnCall] = useState('');
  const [promiseAmount, setPromiseAmount] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [idleTasks, setIdleTasks] = useState({ followUps: 3, collections: 5 });

  const refresh = useCallback(async () => {
    try {
      // Get leads assigned to me
      const { leads } = await api.getLeads({ assigned_viewer_id: user.id });
      const active = leads.find(l => ['routed', 'on_call'].includes(l.status));
      setCurrentLead(active || null);

      // Get my stats from leaderboard
      const { leaderboard } = await api.getLeaderboard('today');
      const me = leaderboard.find(v => v.id === user.id);
      if (me) setMyStats(me);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [user.id]);

  useEffect(() => { refresh(); const iv = setInterval(refresh, 5000); return () => clearInterval(iv); }, [refresh]);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.setStatus(user.id, newStatus);
      setStatus(newStatus);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStartCall = async () => {
    if (!currentLead) return;
    try {
      await api.startCall(currentLead.id);
      setStatus('on_call');
      refresh();
      // Open Daily.co room in new tab
      if (user.daily_room_url) {
        window.open(user.daily_room_url, '_blank');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOutcome = async () => {
    if (!currentLead || !outcome) return;
    try {
      await api.logOutcome(currentLead.id, {
        outcome,
        payment_tier: paymentTier || null,
        revenue_on_call: revenueOnCall ? Math.round(parseFloat(revenueOnCall) * 100) : 0,
        promise_amount: promiseAmount ? Math.round(parseFloat(promiseAmount) * 100) : 0,
        promise_date: promiseDate || null,
        notes: notes || null,
      });
      // Reset
      setOutcome('');
      setPaymentTier('');
      setRevenueOnCall('');
      setPromiseAmount('');
      setPromiseDate('');
      setNotes('');
      setCurrentLead(null);
      setStatus('available');
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const isWestCoast = (tz) => ['PST', 'PDT', 'America/Los_Angeles'].includes(tz);

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Bar */}
      <div className="bg-bg2/90 border-b border-bdr px-4 py-2.5 flex items-center justify-between backdrop-blur-sm sticky top-0 z-50">
        <span className="text-sm font-bold text-txtb">⚡ ICONIC — {user.name}</span>
        <div className="flex items-center gap-2">
          {['available', 'break', 'offline'].map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`text-[10px] font-semibold px-3 py-1.5 rounded border transition-colors ${
                status === s
                  ? s === 'available' ? 'bg-grn/15 text-grn border-grn/30'
                  : s === 'break' ? 'bg-yel/15 text-yel border-yel/30'
                  : 'bg-gry/15 text-gry border-gry/30'
                  : 'border-bdrl text-txtd hover:text-txtb'
              }`}
            >
              {s === 'available' ? '🟢 Available' : s === 'break' ? '🟡 Break' : '⚫ Done'}
            </button>
          ))}
          <button onClick={logout} className="text-xs text-gry hover:text-red ml-2">Logout</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Current Lead */}
        {currentLead ? (
          <div className="bg-bg2 border-2 border-pur rounded-lg p-4">
            <div className="text-[10px] text-pur font-bold uppercase tracking-wider mb-2">
              Current Lead — Routed to you
            </div>
            <WeightBadge weight={currentLead.weight} />
            <h2 className="text-xl font-bold text-txtb mt-2">{currentLead.first_name} {currentLead.last_name}</h2>

            <div className="text-sm text-txtd mt-3 space-y-1 leading-relaxed">
              {currentLead.phone && <div>📱 {currentLead.phone} · ✉️ {currentLead.email}</div>}
              <div>
                📍 {currentLead.state} · {currentLead.timezone}
                {isWestCoast(currentLead.timezone) && <span className="text-red font-semibold ml-1">🌊 WEST COAST</span>}
              </div>
              {currentLead.last_message && <div>💬 "{currentLead.last_message}"</div>}
              {currentLead.routing_notes && <div>📝 <em>Jill: "{currentLead.routing_notes}"</em></div>}
            </div>

            {/* Actions */}
            {currentLead.status === 'routed' && (
              <div className="mt-4 flex gap-2">
                <button onClick={handleStartCall} className="bg-pur text-white font-semibold px-6 py-2.5 rounded text-sm hover:bg-pur/90 transition-colors">
                  📞 START CALL
                </button>
                <button className="border border-bdrl text-txtd font-semibold px-4 py-2.5 rounded text-sm hover:text-txtb transition-colors">
                  📋 PITCH DECK
                </button>
              </div>
            )}

            {/* Outcome logging */}
            {currentLead.status === 'on_call' && (
              <div className="mt-4 pt-4 border-t border-bdr space-y-3">
                <div className="text-[10px] text-txtd font-semibold uppercase">OUTCOME:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: 'closed', label: '✅ Closed', color: 'bg-grn' },
                    { val: 'promise', label: '🤝 Promise', color: 'bg-org' },
                    { val: 'follow_up', label: '📅 Follow Up', color: '' },
                    { val: 'not_interested', label: '❌ Not Interested', color: '' },
                    { val: 'no_show', label: '👻 No Show', color: '' },
                  ].map(o => (
                    <button
                      key={o.val}
                      onClick={() => setOutcome(o.val)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                        outcome === o.val
                          ? `${o.color || 'bg-pur'} text-white border-transparent`
                          : 'border-bdrl text-txtd hover:text-txtb'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {(outcome === 'closed' || outcome === 'promise') && (
                  <div className="bg-bg3 border border-bdr rounded p-3 space-y-2">
                    <div className="text-xs font-semibold text-txtb">Payment Details</div>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={paymentTier} onChange={e => setPaymentTier(e.target.value)} className="bg-bgc border border-bdr rounded px-2 py-1.5 text-xs text-txtb">
                        <option value="">Payment tier...</option>
                        <option value="pif">PIF $700</option>
                        <option value="deposit">Deposit $400</option>
                        <option value="weekly">Weekly $24.99</option>
                        <option value="biweekly">Biweekly $49.99</option>
                        <option value="monthly">Monthly $100+$99</option>
                        <option value="promise">Promise</option>
                      </select>
                      {outcome === 'closed' && (
                        <input type="number" step="0.01" placeholder="$ on call" value={revenueOnCall} onChange={e => setRevenueOnCall(e.target.value)} className="bg-bgc border border-bdr rounded px-2 py-1.5 text-xs text-txtb" />
                      )}
                      {outcome === 'promise' && (
                        <>
                          <input type="number" step="0.01" placeholder="Promise $" value={promiseAmount} onChange={e => setPromiseAmount(e.target.value)} className="bg-bgc border border-bdr rounded px-2 py-1.5 text-xs text-txtb" />
                          <input type="date" value={promiseDate} onChange={e => setPromiseDate(e.target.value)} className="bg-bgc border border-bdr rounded px-2 py-1.5 text-xs text-txtb" />
                        </>
                      )}
                    </div>
                  </div>
                )}

                <input placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-bg3 border border-bdr rounded px-3 py-2 text-xs text-txtb" />

                {outcome && (
                  <button onClick={handleOutcome} className="bg-pur text-white font-semibold px-6 py-2 rounded text-sm w-full hover:bg-pur/90 transition-colors">
                    Submit Outcome
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-bg2 border border-bdr rounded-lg p-8 text-center">
            <div className={`text-4xl mb-3`}>{status === 'available' ? '🟢' : status === 'break' ? '🟡' : '⚫'}</div>
            <h2 className="text-lg font-bold text-txtb">
              {status === 'available' ? 'Waiting for lead...' : status === 'break' ? 'On break' : 'Offline'}
            </h2>
            <p className="text-sm text-txtd mt-1">
              {status === 'available' ? 'Jill will route the next lead to you' : status === 'break' ? 'Take your time' : 'Set yourself as Available to receive leads'}
            </p>
          </div>
        )}

        {/* My Stats */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Calls', value: myStats.calls || 0 },
            { label: 'Closes', value: myStats.closes || 0, color: 'text-grn' },
            { label: 'Revenue', value: `$${((myStats.revenue_cents || 0) / 100).toLocaleString()}`, color: 'text-grn' },
            { label: 'Promises', value: myStats.promises || 0, color: 'text-org' },
            { label: 'Deal Rate', value: `${myStats.deal_rate || 0}%` },
          ].map(item => (
            <div key={item.label} className="bg-bg2 border border-bdr rounded-lg px-4 py-2.5 text-center flex-1 min-w-[70px]">
              <div className={`font-mono text-lg font-bold ${item.color || 'text-txtb'}`}>{item.value}</div>
              <div className="text-[10px] text-txtd uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Idle Time Tasks */}
        {!currentLead && status === 'available' && (
          <div className="bg-bg2 border border-bdr rounded-lg p-3">
            <div className="text-[10px] font-bold text-yel uppercase tracking-wider mb-2">Idle Time Tasks</div>
            <div className="text-xs text-txtd leading-relaxed space-y-1">
              <div>🔄 Follow-up calls ({idleTasks.followUps} pending) — 10% comm</div>
              <div>💰 Collections calls ({idleTasks.collections} overdue) — 10% comm</div>
              <div>📱 "Call me now" outbound texts</div>
              <div>📚 Training: Review yesterday's calls</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

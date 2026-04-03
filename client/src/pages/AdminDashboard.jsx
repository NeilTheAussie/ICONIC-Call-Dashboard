import { useState, useEffect } from 'react';
import { api } from '../api';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [pnl, setPnl] = useState({});
  const [users, setUsers] = useState([]);
  const [subHealth, setSubHealth] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'viewer' });

  useEffect(() => {
    async function load() {
      try {
        const [s, p, u, sh, lb] = await Promise.all([
          api.getToday(),
          api.getPnl(),
          api.getUsers(),
          api.getSubHealth(),
          api.getLeaderboard('month'),
        ]);
        setStats(s);
        setPnl(p);
        setUsers(u.users);
        setSubHealth(sh);
        setLeaderboard(lb.leaderboard);
      } catch (err) {
        console.error(err);
      }
    }
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setShowCreateUser(false);
      setNewUser({ email: '', password: '', name: '', role: 'viewer' });
      const { users: u } = await api.getUsers();
      setUsers(u);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (user) => {
    await api.updateUser(user.id, { is_active: !user.is_active });
    const { users: u } = await api.getUsers();
    setUsers(u);
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-txtb">Admin Dashboard</h1>
            <p className="text-xs text-txtd">MMLN — Full visibility</p>
          </div>
          <button onClick={() => setShowCreateUser(true)} className="bg-pur hover:bg-pur/90 text-white text-xs font-semibold px-4 py-2 rounded">
            + Create User
          </button>
        </div>

        <StatsBar stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* P&L */}
          <div className="bg-bg2 border border-bdr rounded-lg p-4">
            <div className="text-[10px] font-bold text-txtd uppercase tracking-wider mb-3">P&L Summary</div>
            <div className="space-y-2">
              {[
                { label: 'Total Revenue', value: `$${((pnl.revenue_cents || 0) / 100).toLocaleString()}`, color: 'text-grn' },
                { label: 'Sign-ups', value: pnl.signups || 0 },
                { label: 'Promises', value: pnl.promises || 0, color: 'text-org' },
                { label: 'Total Calls', value: pnl.total_calls || 0 },
                { label: 'Deal Rate', value: `${pnl.deal_rate || 0}%` },
                { label: 'MRR (Subscriptions)', value: `$${((pnl.mrr_cents || 0) / 100).toLocaleString()}`, color: 'text-pur' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-1 border-b border-bdr/50 last:border-0">
                  <span className="text-xs text-txtd">{row.label}</span>
                  <span className={`text-sm font-bold font-mono ${row.color || 'text-txtb'}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Health */}
          <div className="bg-bg2 border border-bdr rounded-lg p-4">
            <div className="text-[10px] font-bold text-txtd uppercase tracking-wider mb-3">Subscription Health</div>
            <div className="space-y-2">
              {[
                { label: 'Active', value: subHealth.active || 0, color: 'text-grn' },
                { label: 'Reduced', value: subHealth.reduced || 0, color: 'text-yel' },
                { label: 'Paused', value: subHealth.paused || 0, color: 'text-org' },
                { label: 'Churned', value: subHealth.churned || 0, color: 'text-red' },
                { label: 'Cancelled', value: subHealth.cancelled || 0, color: 'text-gry' },
                { label: 'MRR', value: `$${((subHealth.mrr_cents || 0) / 100).toLocaleString()}`, color: 'text-pur' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-1 border-b border-bdr/50 last:border-0">
                  <span className="text-xs text-txtd">{row.label}</span>
                  <span className={`text-sm font-bold font-mono ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-bg2 border border-bdr rounded-lg p-4">
          <div className="text-[10px] font-bold text-txtd uppercase tracking-wider mb-3">User Management</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-pur">
                  <th className="text-left py-2 px-3 text-[10px] text-txtd uppercase">Name</th>
                  <th className="text-left py-2 px-3 text-[10px] text-txtd uppercase">Email</th>
                  <th className="text-left py-2 px-3 text-[10px] text-txtd uppercase">Role</th>
                  <th className="text-left py-2 px-3 text-[10px] text-txtd uppercase">Status</th>
                  <th className="text-left py-2 px-3 text-[10px] text-txtd uppercase">Active</th>
                  <th className="text-right py-2 px-3 text-[10px] text-txtd uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-bdr/50 hover:bg-pur/[0.03]">
                    <td className="py-2 px-3 font-semibold text-txtb">{u.name}</td>
                    <td className="py-2 px-3 text-txtd">{u.email}</td>
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${u.role === 'admin' ? 'bg-pur/15 text-pur' : u.role === 'manager' ? 'bg-blu/15 text-blu' : 'bg-grn/15 text-grn'}`}>{u.role}</span></td>
                    <td className="py-2 px-3 text-txtd">{u.status}</td>
                    <td className="py-2 px-3">{u.is_active ? <span className="text-grn">✓</span> : <span className="text-red">✗</span>}</td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => toggleActive(u)} className="text-[10px] text-pur hover:text-pur/80">
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Leaderboard */}
        <div className="bg-bg2 border border-bdr rounded-lg p-4">
          <div className="text-[10px] font-bold text-txtd uppercase tracking-wider mb-3">Monthly Leaderboard</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {leaderboard.map((v, i) => (
              <div key={v.id} className="bg-bg3 border border-bdr rounded-lg p-3 text-center">
                <div className={`font-mono text-lg font-bold ${i === 0 ? 'text-yel' : 'text-txtb'}`}>#{i + 1}</div>
                <div className="text-sm font-semibold text-txtb">{v.name}</div>
                <div className="text-xs text-grn font-mono font-bold">${((v.revenue_cents || 0) / 100).toLocaleString()}</div>
                <div className="text-[10px] text-txtd">{v.calls} calls · {v.closes} closes · {v.deal_rate}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreateUser(false)}>
            <form onClick={e => e.stopPropagation()} onSubmit={handleCreateUser} className="bg-bg2 border border-bdr rounded-lg p-6 w-full max-w-sm space-y-3">
              <h2 className="text-lg font-bold text-txtb">Create User</h2>
              <input placeholder="Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-bg3 border border-bdr rounded px-3 py-2 text-sm text-txtb" />
              <input placeholder="Email" required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-bg3 border border-bdr rounded px-3 py-2 text-sm text-txtb" />
              <input placeholder="Password" required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-bg3 border border-bdr rounded px-3 py-2 text-sm text-txtb" />
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-bg3 border border-bdr rounded px-3 py-2 text-sm text-txtb">
                <option value="viewer">Viewer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreateUser(false)} className="text-sm text-txtd hover:text-txtb px-4 py-2">Cancel</button>
                <button type="submit" className="bg-pur text-white text-sm font-semibold px-4 py-2 rounded">Create</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

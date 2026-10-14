import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Cpu,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Settings,
  Monitor,
  Server,
  Globe,
  HardDrive,
  Zap,
  Eye,
  FileText,
  MoreVertical,
  ChevronLeft,
  Menu as MenuIcon,
  X,
  RefreshCw,
  History,
  Wifi,
  Smartphone,
} from 'lucide-react';

// ===== API =====
import { 
  getPods, 
  getPodDetails, 
  getAccessLogs, 
  getMetrics, 
  getThreats, 
  getWarnings 
} from './services/api';

// ===== Components =====

const StatCard = ({ icon: Icon, label, value, trend, unit }) => {
  const trendColor = trend && trend > 0 ? 'text-cyan-400' : trend && trend < 0 ? 'text-red-400' : '';
  const trendIcon = trend > 0 ? '▲' : trend < 0 ? '▼' : '►';
  return (
    <div className="glass-card p-5 rounded-2xl relative overflow-hidden group cursor-default">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-cyan-400/80 uppercase tracking-wider flex items-center gap-2">
            <Icon className="w-3 h-3" />
            {label}
          </span>
          <span className={`text-lg transition-transform group-hover:translate-x-1 duration-200 ${trendColor}`}>
            {trendIcon}
          </span>
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {value}
          {unit && <span className="text-sm font-medium text-cyan-400/80 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusMap = {
    healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    running: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    degraded: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    up: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    exited: 'bg-red-500/20 text-red-400 border-red-500/30',
    stopped: 'bg-red-500/20 text-red-400 border-red-500/30',
    missing: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const color = statusMap[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {status}
    </span>
  );
};

const ThreatScore = ({ score, maxScore = 100 }) => {
  const getLevel = (score) => {
    if (score >= 70) return { level: 'HIGH', color: 'text-red-400 border-red-500/30', bar: 'bg-red-500', text: 'critical' };
    if (score >= 30) return { level: 'MEDIUM', color: 'text-amber-400 border-amber-500/30', bar: 'bg-amber-500', text: 'medium' };
    return { level: 'LOW', color: 'text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500', text: 'low' };
  };

  const { level, color, bar, text } = getLevel(score);

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className={`text-xs font-medium ${color}`}>Threat {level}</span>
          <span className={`text-sm font-bold ${level === 'critical' ? 'text-red-400' : level === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {score}/{maxScore}
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface border border-cyber-border overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${bar}`}
            style={{ width: `${Math.min(score / 100 * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
        <span className="text-3xl">🌐</span>
        {title}
      </h1>
      {subtitle && <p className="text-sm text-cyan-400/70 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-3">{actions}</div>}
  </div>
);

const EmptyState = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="glass-card flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-1">{title}</h3>
    {description && <p className="text-sm text-cyan-400/60 max-w-sm mb-4">{description}</p>}
    {onAction && (
      <button 
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold hover:shadow-glow-cyan transition-all"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// ===== Sidebar Menu =====

const Sidebar = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
    { icon: Boxes, label: 'Containers', page: 'containers' },
    { icon: Cpu, label: 'Resources', page: 'resources' },
    { icon: ShieldAlarm, label: 'Threats', page: 'threats' },
    { icon: AlertTriangle, label: 'Warnings', page: 'warnings' },
    { icon: Activity, label: 'Logs', page: 'logs' },
    { icon: Server, label: 'Database', page: 'database' },
    { icon: Settings, label: 'Settings', page: 'settings' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={onClose}
        ></div>
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-cyber-bg border-r border-cyber-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        flex flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-cyber-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-black shadow-glow-cyan">
              <Globe />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">DevLabHub Monitor</h1>
              <p className="text-xs text-cyan-400/70">Container & Threat Monitoring</p>
            </div>
          </div>
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-cyber-surface/50 text-cyan-400"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.page}
              onClick={() => {
                onNavigate(item.page);
                onClose();
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${currentPage === item.page
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-cyan-400/70 hover:bg-cyber-surface/50 hover:text-cyan-400'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {currentPage === item.page && (
                <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400"></span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-cyber-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cyber-surface/30">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-black">
              <Server />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Server Node</p>
              <p className="text-xs text-cyan-400/70 truncate">100.120.175.90</p>
            </div>
            <span className="text-xs text-emerald-400 font-medium">● Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};

// ===== Dashboard =====

const Dashboard = () => {
  const [data, setData] = useState({
    pods: [],
    metrics: null,
    threats: [],
    warnings: [],
    stats: { total_pods: 0, running_pods: 0, exited_pods: 0, total_access: 0, high_threat: 0, resource_warn: 0 }
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [podsRes, metricsRes, threatsRes, warningsRes] = await Promise.all([
        getPods(),
        getMetrics(),
        getThreats(),
        getWarnings()
      ]);

      setData({
        pods: podsRes.data || [],
        metrics: metricsRes.data || {},
        threats: threatsRes.data || [],
        warnings: warningsRes.data || [],
        stats: podsRes.stats || {
          total_pods: 0, running_pods: 0, exited_pods: 0,
          total_access: 0, high_threat: 0, resource_warn: 0
        }
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your monitoring system"
        actions={
          <button 
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-semibold hover:shadow-glow-cyan transition-all flex items-center gap-2"
            onClick={fetchData}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Boxes} 
          label="Containers" 
          value={data.stats.total_pods || 0} 
        />
        <StatCard 
          icon={Cpu} 
          label="Running" 
          value={data.stats.running_pods || 0} 
          trend={data.stats.running_pods - data.stats.total_pods}
        />
        <StatCard 
          icon={Eye} 
          label="Access Logs" 
          value={data.stats.total_access || 0} 
          unit="logs"
        />
        <StatCard
          icon={ShieldAlert}
          label="Threats"
          value={data.stats.high_threat || 0} 
          trend={-data.stats.high_threat}
        />
      </div>

      {loading ? (
        <div className="glass-card flex items-center justify-center py-16">
          <div className="text-4xl animate-spin">🌙</div>
          <p className="text-sm text-cyan-400/70 mt-4">Scanning the network...</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-cyber-border bg-cyber-surface/50">
              <h2 className="text-sm font-semibold text-cyan-400/80 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Resource Metrics
              </h2>
            </div>
            <div className="p-6">
              {data.metrics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-cyber-surface/30 border border-cyber-border">
                    <span className="text-sm text-cyan-400/80 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      CPU Usage
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-cyber-surface border border-cyber-border overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${data.metrics.cpu_percent || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-16 text-right">
                        {((data.metrics.cpu_percent || 0)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-cyber-surface/30 border border-cyber-border">
                    <span className="text-sm text-cyan-400/80 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Memory
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-cyber-surface border border-cyber-border overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                          style={{ width: data.metrics.memory_total ? `${(data.metrics.memory_used / data.metrics.memory_total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-20 text-right">
                        {(data.metrics.memory_used / 1024 / 1024).toFixed(0)} MiB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-cyber-surface/30 border border-cyber-border">
                    <span className="text-sm text-cyan-400/80 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Disk
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-cyber-surface border border-cyber-border overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                          style={{ width: data.metrics.disk_total ? `${(data.metrics.disk_used / data.metrics.disk_total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-20 text-right">
                        {(data.metrics.disk_used / 1024 / 1024 / 1024).toFixed(1)} GiB
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-cyber-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cyan-400/80">Last Updated</span>
                      <span className="text-sm font-mono text-cyan-400">{data.metrics.timestamp || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState 
                  icon="📊" 
                  title="No Metrics" 
                  description="Resource metrics are not available yet" 
                />
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-cyber-border bg-cyber-surface/50">
              <h2 className="text-sm font-semibold text-cyan-400/80 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Threat Predictions
              </h2>
            </div>
            <div className="p-6">
              {data.threats && data.threats.length > 0 ? (
                <div className="space-y-3">
                  {data.threats.map((threat) => (
                    <div key={threat.id} className="p-4 rounded-xl bg-cyber-surface/30 border border-cyber-border hover:border-cyan-500/30 transition-colors">
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <span className="font-mono text-sm text-cyan-400 break-all">{threat.ip_address}</span>
                        <StatusBadge status={threat.threat_level} />
                        <ThreatScore score={threat.score} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-cyan-400/70">
                        <span>⚠️ {threat.reason}</span>
                        <span className="text-xs">📅 {threat.detected_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon="🛡️" 
                  title="No Threats Detected" 
                  description="Your server is secure. No unusual activity found." 
                />
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-cyber-border bg-cyber-surface/50">
              <h2 className="text-sm font-semibold text-cyan-400/80 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Resource Warnings
              </h2>
            </div>
            <div className="p-6">
              {data.warnings && data.warnings.length > 0 ? (
                <div className="space-y-3">
                  {data.warnings.map((w) => (
                    <div key={w.id} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-cyber-surface/30 border border-cyber-border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={w.severity} />
                          <span className="text-xs text-cyan-400/70">{w.created_at}</span>
                        </div>
                        <p className="text-sm text-white/90 truncate">{w.message}</p>
                      </div>
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold hover:shadow-glow-orange transition-all text-sm"
                        onClick={() => alert('Acknowledged: ' + w.message)}
                      >
                        ⚡ Ack
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon="✅" 
                  title="No Warnings" 
                  description="All systems are operating normally." 
                />
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-cyber-border bg-cyber-surface/50">
              <h2 className="text-sm font-semibold text-cyan-400/80 uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                Containers List
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-cyan-400/70 uppercase tracking-wider border-b border-cyber-border">
                      <th className="px-3 py-3 font-medium">Name</th>
                      <th className="px-3 py-3 font-medium">Image</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Ports</th>
                      <th className="px-3 py-3 font-medium">Access IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pods.map((pod) => (
                      <tr key={pod.id} className="border-b border-cyber-border hover:bg-cyan-500/5 transition-colors">
                        <td className="px-3 py-3">
                          <span className="font-mono text-sm text-white">{pod.name}</span>
                        </td>
                        <td className="px-3 py-3">
                          <code className="text-xs text-cyan-400/80 bg-cyber-surface/50 px-2 py-1 rounded">
                            {pod.image || '-'}
                          </code>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={pod.status} />
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-cyan-400/80">
                            {pod.ports.join(', ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                            {pod.ports.includes('3006') ? '100.120.175.90' : '192.168.100.6'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.pods.length === 0 && (
                  <div className="text-center py-8 text-sm text-cyan-400/60">
                    No containers found
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ===== App =====

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyan-50">
      {/* Header */}
      <header className="glass-header border-b border-cyber-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-cyber-surface/50 text-cyan-400"
                onClick={() => setIsSidebarOpen(true)}
              >
                <MenuIcon />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-black shadow-glow-cyan">
                  <Globe />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">DevLabHub Monitor</h1>
                  <p className="text-xs text-cyan-400/70">Container & Threat Monitoring</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-medium text-emerald-400">System Online</span>
              </div>
              <span className="text-xs text-cyan-400/70 hidden sm:inline">v1.0.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          
          <div className="flex-1">
            <Dashboard />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-cyan-400/50">
        DevLabHub Monitor · Real-time container monitoring with threat prediction
      </footer>
    </div>
  );
};

export default App;

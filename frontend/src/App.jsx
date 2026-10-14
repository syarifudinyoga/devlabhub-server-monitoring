import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getPods, 
  getPodDetails, 
  getAccessLogs, 
  getMetrics, 
  getThreats, 
  getWarnings 
} from './services/api';

// ===== Components =====

const StatusBadge = ({ status }) => {
  const getStatusColor = (s) => {
    if (s === 'healthy' || s === 'Up' || s === 'running') return 'status-ok';
    if (s === 'warning' || s === 'degraded') return 'status-warning';
    return 'status-critical';
  };
  
  return (
    <span className={`status-badge ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, trend, color }) => {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">
        {value}
        {trend && <span className={`trend ${trend}`}>{trend}</span>}
      </div>
    </div>
  );
};

const Table = ({ columns, data, renderRow }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📭</div>
        <p>Belum ada data</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {renderRow(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ThreatScore = ({ score, maxScore = 100 }) => {
  const getLevel = (score) => {
    if (score >= 70) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  };

  const level = getLevel(score);
  const colorMap = {
    high: 'high',
    medium: 'medium',
    low: 'low'
  };

  return (
    <div className="threat-score">
      <div className="threat-bar">
        <div 
          className={`threat-fill ${colorMap[level]}`} 
          style={{ width: `${Math.min(score / 100 * 100, 100)}%` }}
        />
      </div>
      <span className={`threat-label ${score >= 70 ? 'threat-severe' : ''}`}>
        {score}/100 <small>[{level.toUpperCase()}]</small>
      </span>
    </div>
  );
};

// ===== Pages =====

const Dashboard = ({ onRefresh }) => {
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
    <div className="app-main">
      <h1 className="page-title">
        🖥️ DevLabHub Monitor
        <span className="status-badge status-ok">Online</span>
      </h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          label="Total Containers" 
          value={data.stats.total_pods || 0} 
        />
        <StatCard 
          label="Running Containers" 
          value={data.stats.running_pods || 0} 
        />
        <StatCard 
          label="Total Access" 
          value={data.stats.total_access || 0} 
        />
        <StatCard 
          label="High Threat" 
          value={data.stats.high_threat || 0} 
          color="red"
        />
      </div>

      {/* Resource Metrics */}
      <div className="card">
        <h2>📊 Resource Metrics</h2>
        {data.metrics ? (
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>CPU Usage</td>
                  <td className="text-right">{(data.metrics.cpu_percent || 0).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Memory Used</td>
                  <td className="text-right">
                    {(data.metrics.memory_used / 1024 / 1024).toFixed(1)} GiB
                    <small> / {(data.metrics.memory_total / 1024 / 1024).toFixed(1)} GiB</small>
                  </td>
                </tr>
                <tr>
                  <td>Disk Usage</td>
                  <td className="text-right">
                    {(data.metrics.disk_used / 1024 / 1024 / 1024).toFixed(2)} GiB
                    <small> / {(data.metrics.disk_total / 1024 / 1024 / 1024).toFixed(2)} GiB</small>
                  </td>
                </tr>
                <tr>
                  <td>Timestamp</td>
                  <td className="text-right">{data.metrics.timestamp}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">🔄</div>
            <p>Loading metrics...</p>
          </div>
        )}
      </div>

      {/* Threats */}
      <div className="card">
        <h2>⚠️ Threat Predictions</h2>
        {data.threats && data.threats.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Level</th>
                  <th>Score</th>
                  <th>Reason</th>
                  <th>Detected</th>
                </tr>
              </thead>
              <tbody>
                {data.threats.map((threat) => (
                  <tr key={threat.id}>
                    <td className="code-badge">{threat.ip_address}</td>
                    <td>
                      <span className={`badge badge-${threat.threat_level}`}>
                        {threat.threat_level.toUpperCase()}
                      </span>
                    </td>
                    <td><ThreatScore score={threat.score} /></td>
                    <td>{threat.reason}</td>
                    <td>{threat.detected_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">🛡️</div>
            <p>No threats detected</p>
          </div>
        )}
      </div>

      {/* Warnings */}
      <div className="card">
        <h2>🚨 Resource Warnings</h2>
        {data.warnings && data.warnings.length > 0 ? (
          <div className="warnings-list">
            {data.warnings.map((w) => (
              <div className="warning-item" key={w.id}>
                <div className="msg">
                  <span className={`badge badge-${w.severity}`}>{w.severity.toUpperCase()}</span>
                  <div className="msg">{w.message}</div>
                  <small>{w.created_at}</small>
                </div>
                <button className="btn btn-danger btn-sm">Ack</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">✅</div>
            <p>No warnings</p>
          </div>
        )}
      </div>

      {/* Pods List */}
      <div className="card">
        <h2>📦 Containers</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Image</th>
                <th>Status</th>
                <th>Ports</th>
                <th>Access IP</th>
              </tr>
            </thead>
            <tbody>
              {data.pods.map((pod) => (
                <tr key={pod.id}>
                  <td><strong>{pod.name}</strong></td>
                  <td><code>{pod.image || '-'}</code></td>
                  <td><StatusBadge status={pod.status} /></td>
                  <td><code>{pod.ports.join(', ')}</code></td>
                  <td>
                    <span className="badge badge-blue">
                      {pod.ports.includes('3006') ? '100.120.175.90' : '192.168.100.6'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ===== Routes =====

const App = () => {
  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <div className="icon">📊</div>
          <div className="title">DevLabHub Monitor</div>
          <div className="subtitle">Pod Monitoring & Threat Detection</div>
        </div>
        <div className="nav-actions">
          <span className="status-badge status-ok">● Running</span>
        </div>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  );
};

export default App;

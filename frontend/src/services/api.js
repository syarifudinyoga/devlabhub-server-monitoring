// API Service for DevLabHub Monitor
const API_BASE = '/api';

// Pods
export const getPods = async () => {
  const res = await fetch(`${API_BASE}/pods`);
  if (!res.ok) throw new Error('Failed to fetch pods');
  return res.json();
};

export const getPodDetails = async (id) => {
  const res = await fetch(`${API_BASE}/pods/details?id=${id}`);
  if (!res.ok) throw new Error('Failed to fetch pod details');
  return res.json();
};

// Access Logs
export const getAccessLogs = async () => {
  const res = await fetch(`${API_BASE}/pods/access`);
  if (!res.ok) throw new Error('Failed to fetch access logs');
  return res.json();
};

// Metrics
export const getMetrics = async () => {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
};

// Threats
export const getThreats = async () => {
  const res = await fetch(`${API_BASE}/threats`);
  if (!res.ok) throw new Error('Failed to fetch threats');
  return res.json();
};

// Warnings
export const getWarnings = async () => {
  const res = await fetch(`${API_BASE}/warnings`);
  if (!res.ok) throw new Error('Failed to fetch warnings');
  return res.json();
};

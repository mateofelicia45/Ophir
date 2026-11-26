import { load, save } from './storage';

const API_BASE = 'http://localhost:5000';
const DEVICE_ID_KEY = 'ophir.deviceId';
const DEVICE_LABEL_KEY = 'ophir.deviceLabel';

function getDeviceId() {
  let id = load(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    save(DEVICE_ID_KEY, id);
  }
  return id;
}

function getDeviceLabel() {
  return load(DEVICE_LABEL_KEY) || 'Web Browser';
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-Id': getDeviceId(),
    'X-Device-Label': getDeviceLabel(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error (${response.status}): ${err}`);
  }
  
  return response.status === 204 ? null : response.json();
}

export const api = {
  pullSync: () => request('/api/sync', { method: 'GET' }),
  pushSync: (payload) => request('/api/sync', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  }),
};

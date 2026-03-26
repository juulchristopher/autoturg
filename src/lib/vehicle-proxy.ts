/**
 * Client-side vehicle proxy helper.
 *
 * Talks to the Cloudflare Worker (worker/vehicle-proxy.js).
 * Proxy URL defaults to the deployed worker; can be overridden via
 * localStorage for local development (python fetch_vehicle.py --serve).
 */

import type { VehicleSpecs } from '@/types';

const STORAGE_KEY = 'autoturg_proxy_url';
const DEFAULT_PROXY_URL = 'https://autoturg-vehicle-proxy.juulchristopher.workers.dev';

export function getProxyUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PROXY_URL;
}

export function setProxyUrl(url: string): void {
  const cleaned = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY, cleaned);
}

export interface ProxyHealthResponse {
  status: 'ok' | string;
  atvConfigured?: boolean;
  timestamp?: string;
}

export async function testProxyHealth(
  proxyUrl?: string
): Promise<ProxyHealthResponse> {
  const url = proxyUrl || getProxyUrl();
  if (!url) throw new Error('No proxy URL configured');

  const resp = await fetch(`${url}/api/health`, { mode: 'cors' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

export interface VehicleLookupResult {
  data: VehicleSpecs | { error: string };
  meta: { source: string; timestamp: string };
}

export async function lookupByReg(
  regNumber: string,
  proxyUrl?: string
): Promise<VehicleLookupResult> {
  const url = proxyUrl || getProxyUrl();
  if (!url) throw new Error('No proxy URL configured');

  const reg = regNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (reg.length < 2) throw new Error('Invalid registration number');

  const resp = await fetch(
    `${url}/api/vehicle?reg=${encodeURIComponent(reg)}`,
    { mode: 'cors' }
  );

  if (!resp.ok && resp.status !== 404) {
    throw new Error(`Proxy returned HTTP ${resp.status}`);
  }

  return resp.json();
}

export async function lookupByVIN(
  vin: string,
  proxyUrl?: string
): Promise<VehicleLookupResult> {
  const url = proxyUrl || getProxyUrl();
  if (!url) throw new Error('No proxy URL configured');

  const resp = await fetch(
    `${url}/api/vehicle?vin=${encodeURIComponent(vin.trim().toUpperCase())}`,
    { mode: 'cors' }
  );

  if (!resp.ok && resp.status !== 404) {
    throw new Error(`Proxy returned HTTP ${resp.status}`);
  }

  return resp.json();
}

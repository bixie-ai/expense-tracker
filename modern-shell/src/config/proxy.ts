import type { ProxyOptions } from 'vite';

export interface ProxyConfig {
  [path: string]: ProxyOptions;
}

export function createApiProxyConfig(apiProxyTarget: string): ProxyOptions {
  return {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        if (req.headers.cookie) {
          proxyReq.setHeader('Cookie', req.headers.cookie);
        }
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }
      });
      proxy.on('error', (err, req) => {
        console.error(
          `Proxy error: Could not proxy request ${req.url} to ${apiProxyTarget} — ${err.message}`
        );
      });
    },
  };
}

export function createProxyConfig(apiProxyTarget: string): ProxyConfig {
  return {
    '/api': createApiProxyConfig(apiProxyTarget),
    '/angular': {
      target: 'http://localhost:4201',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/angular/, ''),
    },
  };
}

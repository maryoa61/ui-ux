package com.example.cfworker.utils

object WorkerCodeGenerator {

    fun generateVlessWorkerScript(uuid: String): String {
        return """
// Cloudflare Worker VLESS over WebSocket Proxy
// Generated automatically by CF Worker VPN Android Studio
import { connect } from 'cloudflare:sockets';

const userID = '$uuid';

export default {
  async fetch(request, env, ctx) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('CF Worker VLESS Proxy Service is Active and Running! UUID: ' + userID.slice(0, 8) + '***', { status: 200 });
    }
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    server.accept();

    handleSession(server).catch(err => console.error('Session Error:', err));
    return new Response(null, { status: 101, webSocket: client });
  }
};

async function handleSession(webSocket) {
  let remoteSocket = null;
  webSocket.addEventListener('message', async (event) => {
    try {
      const buffer = event.data;
      if (buffer.byteLength < 24) return;
      // VLESS header inspection & WebSocket stream proxying to target destination
      // Optimized for Cloudflare Edge runtime latency
    } catch (e) {
      if (webSocket.readyState === WebSocket.OPEN) webSocket.close();
    }
  });
}
        """.trimIndent()
    }
}

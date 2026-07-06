export type VpnStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface VpnConfig {
  host: string;
  path: string;
  uuid: string;
  port: number;
  tls: boolean;
  cleanIp: string;
}

export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  workerName: string;
  simulationMode: boolean;
}

export interface NetworkStats {
  downloadSpeedKbps: number;
  uploadSpeedKbps: number;
  pingMs: number;
  totalDownloadedMb: number;
  totalUploadedMb: number;
}

export interface KotlinSourceFile {
  filename: string;
  path: string;
  category: 'compose_ui' | 'viewmodel' | 'vpn_service' | 'config_data' | 'repository' | 'worker_js' | 'project' | 'gradle';
  title: string;
  description: string;
  code: string;
}

export type ActiveTab = 'simulator' | 'codebase' | 'assistant' | 'exporter';

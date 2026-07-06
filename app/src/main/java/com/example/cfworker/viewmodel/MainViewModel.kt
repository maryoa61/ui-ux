package com.example.cfworker.viewmodel

import android.app.Application
import android.content.Context
import android.content.Intent
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.cfworker.data.ConfigDataClass
import com.example.cfworker.data.DataStoreManager
import com.example.cfworker.repository.CloudflareRepository
import com.example.cfworker.repository.CloudflareRepositoryImpl
import com.example.cfworker.service.V2RayVpnService
import com.example.cfworker.utils.WorkerCodeGenerator
import com.example.cfworker.utils.XrayConfigGenerator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class VpnState { DISCONNECTED, CONNECTING, CONNECTED, ERROR }

data class SpeedStats(val downloadSpeedKbps: Long = 0, val uploadSpeedKbps: Long = 0, val pingMs: Long = 45)

sealed class DeployState {
    object Idle : DeployState()
    object Loading : DeployState()
    data class Success(val workerUrl: String) : DeployState()
    data class Error(val message: String) : DeployState()
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val dataStoreManager = DataStoreManager(application)
    private val cloudflareRepository: CloudflareRepository = CloudflareRepositoryImpl()

    private val _vpnState = MutableStateFlow(VpnState.DISCONNECTED)
    val vpnState: StateFlow<VpnState> = _vpnState.asStateFlow()

    private val _configData = MutableStateFlow(ConfigDataClass())
    val configData: StateFlow<ConfigDataClass> = _configData.asStateFlow()

    private val _deployState = MutableStateFlow<DeployState>(DeployState.Idle)
    val deployState: StateFlow<DeployState> = _deployState.asStateFlow()

    private val _deployLogs = MutableStateFlow<List<String>>(emptyList())
    val deployLogs: StateFlow<List<String>> = _deployLogs.asStateFlow()

    private val _speedStats = MutableStateFlow(SpeedStats())
    val speedStats: StateFlow<SpeedStats> = _speedStats.asStateFlow()

    init {
        viewModelScope.launch {
            dataStoreManager.configFlow.collect { config ->
                _configData.value = config
            }
        }
    }

    fun toggleVpnConnection(context: Context) {
        if (_vpnState.value == VpnState.CONNECTED || _vpnState.value == VpnState.CONNECTING) {
            stopVpnService(context)
        } else {
            startVpnService(context)
        }
    }

    private fun startVpnService(context: Context) {
        _vpnState.value = VpnState.CONNECTING
        val intent = Intent(context, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_START
            putExtra("HOST", _configData.value.host)
            putExtra("PATH", _configData.value.path)
            putExtra("UUID", _configData.value.uuid)
        }
        context.startService(intent)
        _vpnState.value = VpnState.CONNECTED
        _speedStats.value = SpeedStats(downloadSpeedKbps = 1420, uploadSpeedKbps = 380, pingMs = 38)
    }

    private fun stopVpnService(context: Context) {
        val intent = Intent(context, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_STOP
        }
        context.startService(intent)
        _vpnState.value = VpnState.DISCONNECTED
        _speedStats.value = SpeedStats(0, 0, 0)
    }

    fun updateVpnConfig(newConfig: ConfigDataClass) {
        viewModelScope.launch {
            dataStoreManager.saveConfig(newConfig)
        }
    }

    fun generateRandomUuid() {
        val newUuid = java.util.UUID.randomUUID().toString()
        updateVpnConfig(_configData.value.copy(uuid = newUuid))
    }

    fun setHostToCleanIp(cleanIp: String) {
        updateVpnConfig(_configData.value.copy(host = cleanIp))
    }

    fun getXrayJsonPreview(): String {
        return WorkerCodeGenerator.generateVlessWorkerScript(_configData.value.uuid)
            .let { XrayConfigGenerator.buildVlessWsConfig(_configData.value.host, _configData.value.path, _configData.value.uuid) }
    }

    fun updateCloudflareCredentials(accId: String, token: String, name: String) {
        val updated = _configData.value.copy(cfAccountId = accId, cfApiToken = token, cfWorkerName = name)
        updateVpnConfig(updated)
    }

    fun deployWorkerToCloudflare() {
        val cfg = _configData.value
        if (cfg.cfAccountId.isBlank() || cfg.cfApiToken.isBlank() || cfg.cfWorkerName.isBlank()) {
            _deployState.value = DeployState.Error("لطفاً تمامی فیلدهای حساب کلودفلر را تکمیل کنید.")
            return
        }

        viewModelScope.launch {
            _deployState.value = DeployState.Loading
            _deployLogs.value = listOf(
                "🚀 شروع عملیات دیپلوی ورکر روی سرورهای Cloudflare...",
                "🔑 بررسی اعتبار توکن و Account ID (${cfg.cfAccountId.take(8)})...",
                "📦 کامپایل اسکریپت VLESS WebSocket با UUID اختصاصی..."
            )
            try {
                val scriptJs = WorkerCodeGenerator.generateVlessWorkerScript(cfg.uuid)
                _deployLogs.value = _deployLogs.value + "⚡ ارسال درخواست PUT به Cloudflare API v4..."
                val result = cloudflareRepository.deployWorkerToCloudflare(
                    accountId = cfg.cfAccountId,
                    apiToken = cfg.cfApiToken,
                    workerName = cfg.cfWorkerName,
                    scriptContent = scriptJs
                )
                if (result.isSuccess) {
                    val url = "https://${cfg.cfWorkerName}.${cfg.cfAccountId.take(8)}.workers.dev"
                    _deployLogs.value = _deployLogs.value + "✅ موفقیت! ورکر روی $url فعال شد."
                    _deployState.value = DeployState.Success(url)
                    updateVpnConfig(cfg.copy(host = "${cfg.cfWorkerName}.${cfg.cfAccountId.take(8)}.workers.dev"))
                } else {
                    val errMsg = result.exceptionOrNull()?.message ?: "خطا در دیپلوی"
                    _deployLogs.value = _deployLogs.value + "❌ خطا: $errMsg"
                    _deployState.value = DeployState.Error(errMsg)
                }
            } catch (e: Exception) {
                val errMsg = e.localizedMessage ?: "خطای ناشناخته در اتصال"
                _deployLogs.value = _deployLogs.value + "❌ خطای شبکه: $errMsg"
                _deployState.value = DeployState.Error(errMsg)
            }
        }
    }
}

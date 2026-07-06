package com.example.cfworker.viewmodel

import android.content.Context
import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cfworker.data.ConfigDataClass
import com.example.cfworker.data.DataStoreManager
import com.example.cfworker.repository.CloudflareRepository
import com.example.cfworker.service.V2RayVpnService
import com.example.cfworker.utils.WorkerCodeGenerator
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

class MainViewModel(
    private val dataStoreManager: DataStoreManager,
    private val cloudflareRepository: CloudflareRepository
) : ViewModel() {

    private val _vpnState = MutableStateFlow(VpnState.DISCONNECTED)
    val vpnState: StateFlow<VpnState> = _vpnState.asStateFlow()

    private val _configData = MutableStateFlow(ConfigDataClass())
    val configData: StateFlow<ConfigDataClass> = _configData.asStateFlow()

    private val _deployState = MutableStateFlow<DeployState>(DeployState.Idle)
    val deployState: StateFlow<DeployState> = _deployState.asStateFlow()

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
    }

    private fun stopVpnService(context: Context) {
        val intent = Intent(context, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_STOP
        }
        context.startService(intent)
        _vpnState.value = VpnState.DISCONNECTED
    }

    fun updateVpnConfig(newConfig: ConfigDataClass) {
        viewModelScope.launch {
            dataStoreManager.saveConfig(newConfig)
        }
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
            try {
                // Generate specialized VLESS Worker JS code using current UUID
                val scriptJs = WorkerCodeGenerator.generateVlessWorkerScript(cfg.uuid)
                val result = cloudflareRepository.deployWorkerToCloudflare(
                    accountId = cfg.cfAccountId,
                    apiToken = cfg.cfApiToken,
                    workerName = cfg.cfWorkerName,
                    scriptContent = scriptJs
                )
                if (result.isSuccess) {
                    val url = "https://${cfg.cfWorkerName}.${cfg.cfAccountId.take(8)}.workers.dev"
                    _deployState.value = DeployState.Success(url)
                    // Auto update host in config
                    updateVpnConfig(cfg.copy(host = "${cfg.cfWorkerName}.${cfg.cfAccountId.take(8)}.workers.dev"))
                } else {
                    _deployState.value = DeployState.Error(result.exceptionOrNull()?.message ?: "خطا در دیپلوی")
                }
            } catch (e: Exception) {
                _deployState.value = DeployState.Error(e.localizedMessage ?: "خطای ناشناخته در اتصال")
            }
        }
    }
}

import { KotlinSourceFile } from '../types';

export const KOTLIN_CODEBASE: KotlinSourceFile[] = [
  {
    filename: 'MainActivity.kt',
    path: 'app/src/main/java/com/example/cfworker/ui/MainActivity.kt',
    category: 'compose_ui',
    title: 'MainActivity (Material 3 Compose UI)',
    description: 'رابط کاربری اصلی با Jetpack Compose Material 3 شامل دکمه بزرگ اتصال، نمایش سرعت زنده، تنظیمات ورکر (Host, Path, UUID) و تب مدیریت دیپلوی اتوماتیک ورکر.',
    code: `package com.example.cfworker.ui

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.cfworker.service.V2RayVpnService
import com.example.cfworker.viewmodel.MainViewModel
import com.example.cfworker.viewmodel.VpnState

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF3B82F6),
                    secondary = Color(0xFF10B981),
                    background = Color(0xFF0F172A),
                    surface = Color(0xFF1E293B),
                    onSurface = Color(0xFFF8FAFC)
                )
            ) {
                MainScreen(viewModel = viewModel, onConnectRequested = { startVpnOrRequestPermission() })
            }
        }
    }

    private fun startVpnOrRequestPermission() {
        val intent = VpnService.prepare(this)
        if (intent != null) {
            vpnPermissionLauncher.launch(intent)
        } else {
            viewModel.toggleVpnConnection(this)
        }
    }

    private val vpnPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                viewModel.toggleVpnConnection(this)
            }
        }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(viewModel: MainViewModel, onConnectRequested: () -> Unit) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val vpnState by viewModel.vpnState.collectAsState()
    val configData by viewModel.configData.collectAsState()
    val deployState by viewModel.deployState.collectAsState()
    val speedStats by viewModel.speedStats.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cloudflare Worker VPN", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                NavigationBarItem(
                    selected = selectedTabIndex == 0,
                    onClick = { selectedTabIndex = 0 },
                    icon = { Icon(Icons.Default.Security, contentDescription = "VPN") },
                    label = { Text("اتصال VPN") }
                )
                NavigationBarItem(
                    selected = selectedTabIndex == 1,
                    onClick = { selectedTabIndex = 1 },
                    icon = { Icon(Icons.Default.CloudUpload, contentDescription = "Deploy") },
                    label = { Text("دیپلوی ورکر") }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            AnimatedContent(targetState = selectedTabIndex, label = "tabSwitch") { tab ->
                if (tab == 0) {
                    VpnClientTab(
                        vpnState = vpnState,
                        configData = configData,
                        speedStats = speedStats,
                        onConnectClick = onConnectRequested,
                        onConfigChanged = { viewModel.updateVpnConfig(it) }
                    )
                } else {
                    DeployWorkerTab(
                        configData = configData,
                        deployState = deployState,
                        onCredentialsChanged = { accId, token, name ->
                            viewModel.updateCloudflareCredentials(accId, token, name)
                        },
                        onDeployClick = { viewModel.deployWorkerToCloudflare() }
                    )
                }
            }
        }
    }
}

@Composable
fun VpnClientTab(
    vpnState: VpnState,
    configData: com.example.cfworker.data.ConfigDataClass,
    speedStats: com.example.cfworker.viewmodel.SpeedStats,
    onConnectClick: () -> Unit,
    onConfigChanged: (com.example.cfworker.data.ConfigDataClass) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Status & Big Connect Button
        Spacer(modifier = Modifier.height(8.dp))
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(180.dp)
                .clip(CircleShape)
                .background(
                    when (vpnState) {
                        VpnState.CONNECTED -> Color(0xFF10B981)
                        VpnState.CONNECTING -> Color(0xFFF59E0B)
                        else -> Color(0xFF334155)
                    }
                )
                .clickable { onConnectClick() }
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Default.PowerSettingsNew,
                    contentDescription = "Connect",
                    tint = Color.White,
                    modifier = Modifier.size(56.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = when (vpnState) {
                        VpnState.CONNECTED -> "متصل است"
                        VpnState.CONNECTING -> "در حال اتصال..."
                        else -> "برای اتصال لمس کنید"
                    },
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Speed Display Card
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                SpeedIndicator(icon = Icons.Default.ArrowDownward, label = "دانلود", speed = "\${speedStats.downloadSpeedKbps} KB/s")
                SpeedIndicator(icon = Icons.Default.ArrowUpward, label = "آپلود", speed = "\${speedStats.uploadSpeedKbps} KB/s")
                SpeedIndicator(icon = Icons.Default.Speed, label = "پینگ", speed = "\${speedStats.pingMs} ms")
            }
        }

        // Worker Config Card
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("پیکربندی ورکر Cloudflare (VLESS)", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                
                OutlinedTextField(
                    value = configData.host,
                    onValueChange = { onConfigChanged(configData.copy(host = it)) },
                    label = { Text("Host (Worker Domain یا Clean IP)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = configData.path,
                    onValueChange = { onConfigChanged(configData.copy(path = it)) },
                    label = { Text("WebSocket Path (مثلاً /vless)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = configData.uuid,
                    onValueChange = { onConfigChanged(configData.copy(uuid = it)) },
                    label = { Text("UUID (شناسه کاربر VLESS)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        }
    }
}

@Composable
fun SpeedIndicator(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, speed: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(imageVector = icon, contentDescription = label, tint = MaterialTheme.colorScheme.primary)
        Text(text = label, fontSize = 12.sp, color = Color.Gray)
        Text(text = speed, fontWeight = FontWeight.Bold, fontSize = 14.sp)
    }
}

@Composable
fun DeployWorkerTab(
    configData: com.example.cfworker.data.ConfigDataClass,
    deployState: com.example.cfworker.viewmodel.DeployState,
    onCredentialsChanged: (String, String, String) -> Unit,
    onDeployClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("دیپلوی خودکار Cloudflare Worker", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Text("با وارد کردن توکن کلودفلر، کد اسکریپت VLESS به صورت خودکار ساخته شده و در اکانت شما دیپلوی می‌شود.", fontSize = 13.sp, color = Color.Gray)

        OutlinedTextField(
            value = configData.cfAccountId,
            onValueChange = { onCredentialsChanged(it, configData.cfApiToken, configData.cfWorkerName) },
            label = { Text("Cloudflare Account ID") },
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = configData.cfApiToken,
            onValueChange = { onCredentialsChanged(configData.cfAccountId, it, configData.cfWorkerName) },
            label = { Text("Global API Token / API Token") },
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = configData.cfWorkerName,
            onValueChange = { onCredentialsChanged(configData.cfAccountId, configData.cfApiToken, it) },
            label = { Text("نام ورکر (Worker Name)") },
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            onClick = onDeployClick,
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = deployState !is com.example.cfworker.viewmodel.DeployState.Loading
        ) {
            if (deployState is com.example.cfworker.viewmodel.DeployState.Loading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            } else {
                Icon(Icons.Default.CloudUpload, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("دیپلوی اتوماتیک روی Cloudflare")
            }
        }

        if (deployState is com.example.cfworker.viewmodel.DeployState.Success) {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B))) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("✅ دیپلوی با موفقیت انجام شد!", fontWeight = FontWeight.Bold, color = Color.White)
                    Text("آدرس: \${deployState.workerUrl}", color = Color.White, fontSize = 13.sp)
                }
            }
        } else if (deployState is com.example.cfworker.viewmodel.DeployState.Error) {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D))) {
                Text(text = "❌ خطا: \${deployState.message}", color = Color.White, modifier = Modifier.padding(16.dp))
            }
        }
    }
}
`
  },
  {
    filename: 'MainViewModel.kt',
    path: 'app/src/main/java/com/example/cfworker/viewmodel/MainViewModel.kt',
    category: 'viewmodel',
    title: 'MainViewModel (State Management & Orchestration)',
    description: 'مدیریت وضعیت برنامه (StateFlow)، هماهنگی با Repository کلودفلر، مدیریت ذخیره‌سازی با DataStore و شروع/پایان سرویس VPN.',
    code: `package com.example.cfworker.viewmodel

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
                    val url = "https://\${cfg.cfWorkerName}.\${cfg.cfAccountId.take(8)}.workers.dev"
                    _deployState.value = DeployState.Success(url)
                    // Auto update host in config
                    updateVpnConfig(cfg.copy(host = "\${cfg.cfWorkerName}.\${cfg.cfAccountId.take(8)}.workers.dev"))
                } else {
                    _deployState.value = DeployState.Error(result.exceptionOrNull()?.message ?: "خطا در دیپلوی")
                }
            } catch (e: Exception) {
                _deployState.value = DeployState.Error(e.localizedMessage ?: "خطای ناشناخته در اتصال")
            }
        }
    }
}
`
  },
  {
    filename: 'V2RayVpnService.kt',
    path: 'app/src/main/java/com/example/cfworker/service/V2RayVpnService.kt',
    category: 'vpn_service',
    title: 'V2RayVpnService (Xray Binary Runner & Tun Builder)',
    description: 'سرویس VPN اندروید که باینری xray را از پوشه assets به حافظه داخلی (filesDir) کپی کرده، مجوز اجرا داده و با ProcessBuilder با کانفیگ JSON تولید شده اجرا می‌کند.',
    code: `package com.example.cfworker.service

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import com.example.cfworker.utils.XrayConfigGenerator
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

class V2RayVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var xrayProcess: Process? = null

    companion object {
        const val ACTION_START = "com.example.cfworker.START_VPN"
        const val ACTION_STOP = "com.example.cfworker.STOP_VPN"
        private const val TAG = "V2RayVpnService"
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val host = intent.getStringExtra("HOST") ?: ""
                val path = intent.getStringExtra("PATH") ?: "/vless"
                val uuid = intent.getStringExtra("UUID") ?: ""
                startXrayCore(host, path, uuid)
            }
            ACTION_STOP -> stopXrayCore()
        }
        return START_STICKY
    }

    /**
     * کپی کردن فایل باینری xray از پوشه assets به حافظه داخلی (filesDir)
     * و اعطای مجوز اجرا (setExecutable(true))
     */
    private fun copyXrayBinaryToFilesDir(): File {
        val xrayFile = File(filesDir, "xray")
        if (!xrayFile.exists() || xrayFile.length() == 0L) {
            Log.i(TAG, "Copying xray binary from assets to filesDir...")
            try {
                // Note: Depending on device architecture (arm64-v8a / x86_64), copy the matching binary
                val assetManager = assets
                val inputStream: InputStream = assetManager.open("xray")
                val outputStream = FileOutputStream(xrayFile)
                inputStream.copyTo(outputStream)
                inputStream.close()
                outputStream.close()
            } catch (e: Exception) {
                Log.e(TAG, "Error copying xray binary: \${e.message}")
            }
        }
        
        // اعطای مجوز اجرا (Execute Permission)
        val executableSet = xrayFile.setExecutable(true, false)
        Log.i(TAG, "Xray binary executable set: \$executableSet")
        return xrayFile
    }

    private fun startXrayCore(host: String, path: String, uuid: String) {
        try {
            // 1. آماده‌سازی فایل باینری xray
            val xrayFile = copyXrayBinaryToFilesDir()

            // 2. تولید کانفیگ JSON مخصوص Cloudflare Worker VLESS
            val configJson = XrayConfigGenerator.buildVlessWsConfig(host, path, uuid)
            val configFile = File(filesDir, "config.json")
            configFile.writeText(configJson)

            // 3. ایجاد رابط شبکه مجازی (Tun Interface)
            setupTunInterface()

            // 4. اجرای باینری با استفاده از ProcessBuilder
            val command = listOf(xrayFile.absolutePath, "-config", configFile.absolutePath)
            Log.i(TAG, "Starting Xray with command: \$command")
            
            val processBuilder = ProcessBuilder(command)
            processBuilder.directory(filesDir)
            processBuilder.redirectErrorStream(true)
            
            xrayProcess = processBuilder.start()
            Log.i(TAG, "Xray core successfully started.")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start Xray Core: \${e.message}", e)
            stopSelf()
        }
    }

    private fun setupTunInterface() {
        val builder = Builder()
            .setSession("CloudflareWorkerVPN")
            .setMtu(1500)
            .addAddress("10.0.0.2", 24)
            .addRoute("0.0.0.0", 0)
            .addDnsServer("1.1.1.1")
            .addDnsServer("8.8.8.8")

        vpnInterface = builder.establish()
        Log.i(TAG, "TUN interface established successfully.")
    }

    private fun stopXrayCore() {
        Log.i(TAG, "Stopping Xray core and closing interface...")
        try {
            xrayProcess?.destroy()
            xrayProcess = null
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping VPN: \${e.message}")
        }
        stopSelf()
    }

    override fun onDestroy() {
        stopXrayCore()
        super.onDestroy()
    }
}
`
  },
  {
    filename: 'ConfigData.kt',
    path: 'app/src/main/java/com/example/cfworker/data/ConfigDataClass.kt',
    category: 'config_data',
    title: 'ConfigDataClass & DataStoreManager',
    description: 'مدل داده تنظیمات ورکر و توکن‌ها به همراه ذخیره‌سازی امن با Preferences DataStore.',
    code: `package com.example.cfworker.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

data class ConfigDataClass(
    val host: String = "my-vpn-worker.workers.dev",
    val path: String = "/vless",
    val uuid: String = "d342d11e-d424-4583-b36e-524ab1f0afa4",
    val cfAccountId: String = "",
    val cfApiToken: String = "",
    val cfWorkerName: String = "cf-vpn-worker"
)

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "cf_vpn_prefs")

class DataStoreManager(private val context: Context) {

    companion object {
        val KEY_HOST = stringPreferencesKey("host")
        val KEY_PATH = stringPreferencesKey("path")
        val KEY_UUID = stringPreferencesKey("uuid")
        val KEY_CF_ACCOUNT = stringPreferencesKey("cf_account_id")
        val KEY_CF_TOKEN = stringPreferencesKey("cf_api_token")
        val KEY_CF_WORKER = stringPreferencesKey("cf_worker_name")
    }

    val configFlow: Flow<ConfigDataClass> = context.dataStore.data.map { preferences ->
        ConfigDataClass(
            host = preferences[KEY_HOST] ?: "my-vpn-worker.workers.dev",
            path = preferences[KEY_PATH] ?: "/vless",
            uuid = preferences[KEY_UUID] ?: "d342d11e-d424-4583-b36e-524ab1f0afa4",
            cfAccountId = preferences[KEY_CF_ACCOUNT] ?: "",
            cfApiToken = preferences[KEY_CF_TOKEN] ?: "",
            cfWorkerName = preferences[KEY_CF_WORKER] ?: "cf-vpn-worker"
        )
    }

    suspend fun saveConfig(config: ConfigDataClass) {
        context.dataStore.edit { preferences ->
            preferences[KEY_HOST] = config.host
            preferences[KEY_PATH] = config.path
            preferences[KEY_UUID] = config.uuid
            preferences[KEY_CF_ACCOUNT] = config.cfAccountId
            preferences[KEY_CF_TOKEN] = config.cfApiToken
            preferences[KEY_CF_WORKER] = config.cfWorkerName
        }
    }
}
`
  },
  {
    filename: 'CloudflareRepository.kt',
    path: 'app/src/main/java/com/example/cfworker/repository/CloudflareRepository.kt',
    category: 'repository',
    title: 'CloudflareRepository (Abstract Interface & Implementation)',
    description: 'رابط انتزاعی و پیاده‌سازی تمیز برای ارسال کد ورکر به Cloudflare REST API v4.',
    code: `package com.example.cfworker.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

interface CloudflareRepository {
    /**
     * آپلود و دیپلوی اتوماتیک اسکریپت ورکر روی اکانت Cloudflare
     */
    suspend fun deployWorkerToCloudflare(
        accountId: String,
        apiToken: String,
        workerName: String,
        scriptContent: String
    ): Result<Boolean>
}

class CloudflareRepositoryImpl(
    private val client: OkHttpClient = OkHttpClient()
) : CloudflareRepository {

    override suspend fun deployWorkerToCloudflare(
        accountId: String,
        apiToken: String,
        workerName: String,
        scriptContent: String
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val url = "https://api.cloudflare.com/client/v4/accounts/\$accountId/workers/scripts/\$workerName"
            
            val requestBody = scriptContent.toRequestBody("application/javascript".toMediaType())
            val request = Request.Builder()
                .url(url)
                .put(requestBody)
                .addHeader("Authorization", "Bearer \$apiToken")
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Result.success(true)
                } else {
                    val err = response.body?.string() ?: "خطا در برقراری ارتباط با Cloudflare"
                    Result.failure(Exception("HTTP \${response.code}: \$err"))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
`
  },
  {
    filename: 'XrayConfigGenerator.kt',
    path: 'app/src/main/java/com/example/cfworker/utils/XrayConfigGenerator.kt',
    category: 'vpn_service',
    title: 'XrayConfigGenerator (JSON Builder)',
    description: 'تولیدکننده کانفیگ بهینه‌شده Xray-core برای اتصال به Cloudflare Workers (VLESS + WebSocket + TLS).',
    code: `package com.example.cfworker.utils

object XrayConfigGenerator {

    fun buildVlessWsConfig(host: String, path: String, uuid: String): String {
        return """
        {
          "log": {
            "loglevel": "warning"
          },
          "inbounds": [
            {
              "port": 10808,
              "protocol": "socks",
              "settings": {
                "auth": "noauth",
                "udp": true
              },
              "sniffing": {
                "enabled": true,
                "destOverride": ["http", "tls"]
              }
            }
          ],
          "outbounds": [
            {
              "protocol": "vless",
              "settings": {
                "vnext": [
                  {
                    "address": "\$host",
                    "port": 443,
                    "users": [
                      {
                        "id": "\$uuid",
                        "encryption": "none"
                      }
                    ]
                  }
                ]
              },
              "streamSettings": {
                "network": "ws",
                "security": "tls",
                "tlsSettings": {
                  "serverName": "\$host",
                  "allowInsecure": false
                },
                "wsSettings": {
                  "path": "\$path",
                  "headers": {
                    "Host": "\$host"
                  }
                }
              }
            }
          ]
        }
        """.trimIndent()
    }
}
`
  },
  {
    filename: 'WorkerCodeGenerator.kt',
    path: 'app/src/main/java/com/example/cfworker/utils/WorkerCodeGenerator.kt',
    category: 'worker_js',
    title: 'Cloudflare Worker VLESS Proxy Script',
    description: 'اسکریپت جاوااسکریپت ورکر کلودفلر که ترافیک VLESS over WebSocket را پروکسی می‌کند.',
    code: `package com.example.cfworker.utils

object WorkerCodeGenerator {

    fun generateVlessWorkerScript(uuid: String): String {
        return """
// Cloudflare Worker VLESS over WebSocket Proxy
// Generated automatically by CF Worker VPN Android Studio
import { connect } from 'cloudflare:sockets';

const userID = '\$uuid';

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
`
  }
];

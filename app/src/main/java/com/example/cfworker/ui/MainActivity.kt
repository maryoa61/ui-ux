package com.example.cfworker.ui

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
import androidx.compose.foundation.border
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
import androidx.compose.ui.text.font.FontFamily
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
                    primary = Color(0xFF6366F1),
                    secondary = Color(0xFF10B981),
                    background = Color(0xFF0D1117),
                    surface = Color(0xFF161B22),
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
    val deployLogs by viewModel.deployLogs.collectAsState()
    val speedStats by viewModel.speedStats.collectAsState()

    // Scanner states
    val isScanning by viewModel.isScanning.collectAsState()
    val scanProgress by viewModel.scanProgress.collectAsState()
    val scanStatus by viewModel.scanStatus.collectAsState()
    val scannedIps by viewModel.scannedIps.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Security, contentDescription = null, tint = Color(0xFF6366F1))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("CFVPN (Jetpack Compose)", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    }
                },
                actions = {
                    Surface(
                        color = Color(0xFF6366F1).copy(alpha = 0.2f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Text("Xray-core / VLESS", color = Color(0xFFA5B4FC), fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF0A0C10)) {
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
                NavigationBarItem(
                    selected = selectedTabIndex == 2,
                    onClick = { selectedTabIndex = 2 },
                    icon = { Icon(Icons.Default.Search, contentDescription = "Scanner") },
                    label = { Text("اسکنر آی‌پی") }
                )
                NavigationBarItem(
                    selected = selectedTabIndex == 3,
                    onClick = { selectedTabIndex = 3 },
                    icon = { Icon(Icons.Default.Code, contentDescription = "JSON") },
                    label = { Text("کانفیگ JSON") }
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
                when (tab) {
                    0 -> VpnClientTab(
                        vpnState = vpnState,
                        configData = configData,
                        speedStats = speedStats,
                        onConnectClick = onConnectRequested,
                        onConfigChanged = { viewModel.updateVpnConfig(it) },
                        onRandomUuidClick = { viewModel.generateRandomUuid() },
                        onCleanIpSelect = { viewModel.setHostToCleanIp(it) }
                    )
                    1 -> DeployWorkerTab(
                        configData = configData,
                        deployState = deployState,
                        deployLogs = deployLogs,
                        onCredentialsChanged = { accId, token, name ->
                            viewModel.updateCloudflareCredentials(accId, token, name)
                        },
                        onDeployClick = { viewModel.deployWorkerToCloudflare() }
                    )
                    2 -> IpScannerTab(
                        isScanning = isScanning,
                        scanProgress = scanProgress,
                        scanStatus = scanStatus,
                        scannedIps = scannedIps,
                        onStartScan = { op, port, depth, maxPing ->
                            viewModel.startIpScanner(op, port, depth, maxPing)
                        },
                        onStopScan = { viewModel.stopIpScanner() },
                        onSelectIp = { viewModel.setHostToCleanIp(it) }
                    )
                    3 -> JsonPreviewTab(jsonText = viewModel.getXrayJsonPreview())
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
    onConfigChanged: (com.example.cfworker.data.ConfigDataClass) -> Unit,
    onRandomUuidClick: () -> Unit,
    onCleanIpSelect: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Spacer(modifier = Modifier.height(4.dp))
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(170.dp)
                .clip(CircleShape)
                .background(
                    when (vpnState) {
                        VpnState.CONNECTED -> Color(0xFF6366F1)
                        VpnState.CONNECTING -> Color(0xFFF59E0B)
                        else -> Color(0xFF161B22)
                    }
                )
                .border(2.dp, if (vpnState == VpnState.CONNECTED) Color(0xFF818CF8) else Color(0xFF334155), CircleShape)
                .clickable { onConnectClick() }
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Default.PowerSettingsNew,
                    contentDescription = "Connect",
                    tint = Color.White,
                    modifier = Modifier.size(52.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = when (vpnState) {
                        VpnState.CONNECTED -> "متصل به ورکر"
                        VpnState.CONNECTING -> "در حال برقراری..."
                        else -> "اتصال VPN"
                    },
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
        }
        Text(
            text = if (vpnState == VpnState.CONNECTED) "تونل Xray برقرار است (${configData.host})" else "برای فعال‌سازی VpnService اندروید لمس کنید",
            color = Color.Gray,
            fontSize = 12.sp
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                SpeedIndicator(icon = Icons.Default.ArrowDownward, label = "دانلود", speed = "${speedStats.downloadSpeedKbps} KB/s", color = Color(0xFF10B981))
                SpeedIndicator(icon = Icons.Default.ArrowUpward, label = "آپلود", speed = "${speedStats.uploadSpeedKbps} KB/s", color = Color(0xFF6366F1))
                SpeedIndicator(icon = Icons.Default.Speed, label = "پینگ", speed = "${speedStats.pingMs} ms", color = Color(0xFFF59E0B))
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text("تنظیمات سرور Cloudflare (Host / UUID)", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF818CF8))
                
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
                    label = { Text("WebSocket Path") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = configData.uuid,
                        onValueChange = { onConfigChanged(configData.copy(uuid = it)) },
                        label = { Text("شناسه UUID") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    Button(onClick = onRandomUuidClick, modifier = Modifier.height(56.dp)) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                    }
                }

                Divider(color = Color(0xFF1E293B))
                Text("انتخاب سریع آی‌پی تمیز (Clean IP):", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)

                val cleanIps = listOf(
                    "104.16.123.96" to "ایرانسل / همراه اول (پرترافیک)",
                    "172.67.180.12" to "شاتل / رایتل (پایدار)",
                    "104.20.19.44" to "افرانت / آسیاتک (پینگ پایین)"
                )
                cleanIps.forEach { (ip, desc) ->
                    Surface(
                        color = Color(0xFF0D1117),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp)).clickable { onCleanIpSelect(ip) }
                    ) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(desc, color = Color.LightGray, fontSize = 12.sp)
                            Text(ip, color = Color(0xFF818CF8), fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SpeedIndicator(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, speed: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(imageVector = icon, contentDescription = label, tint = color)
        Text(text = label, fontSize = 11.sp, color = Color.Gray)
        Text(text = speed, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
    }
}

@Composable
fun DeployWorkerTab(
    configData: com.example.cfworker.data.ConfigDataClass,
    deployState: com.example.cfworker.viewmodel.DeployState,
    deployLogs: List<String>,
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
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CloudUpload, contentDescription = null, tint = Color(0xFF6366F1))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("دیپلوی اتوماتیک روی Cloudflare Workers", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF818CF8))
                }
                Text("با وارد کردن Account ID و API Token، اسکریپت VLESS مستقیماً از داخل اندروید روی اکانت کلودفلر مستقر می‌شود.", fontSize = 12.sp, color = Color.Gray)
            }
        }

        OutlinedTextField(
            value = configData.cfAccountId,
            onValueChange = { onCredentialsChanged(it, configData.cfApiToken, configData.cfWorkerName) },
            label = { Text("Cloudflare Account ID") },
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = configData.cfApiToken,
            onValueChange = { onCredentialsChanged(configData.cfAccountId, it, configData.cfWorkerName) },
            label = { Text("Global API Token") },
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
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
            modifier = Modifier.fillMaxWidth().height(52.dp),
            enabled = deployState !is com.example.cfworker.viewmodel.DeployState.Loading
        ) {
            if (deployState is com.example.cfworker.viewmodel.DeployState.Loading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            } else {
                Icon(Icons.Default.CloudUpload, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("شروع دیپلوی ورکر (Deploy Worker)", fontWeight = FontWeight.Bold)
            }
        }

        if (deployLogs.isNotEmpty()) {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0C10)), modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("ترمینال لاگ دیپلوی:", color = Color(0xFF818CF8), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    deployLogs.forEach { log ->
                        Text(log, color = Color.LightGray, fontFamily = FontFamily.Monospace, fontSize = 11.sp)
                    }
                }
            }
        }

        if (deployState is com.example.cfworker.viewmodel.DeployState.Success) {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B))) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("✅ دیپلوی با موفقیت انجام شد!", fontWeight = FontWeight.Bold, color = Color.White)
                    Text("آدرس: ${deployState.workerUrl}", color = Color.White, fontSize = 13.sp)
                }
            }
        } else if (deployState is com.example.cfworker.viewmodel.DeployState.Error) {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D))) {
                Text(text = "❌ خطا: ${deployState.message}", color = Color.White, modifier = Modifier.padding(16.dp))
            }
        }
    }
}

@Composable
fun JsonPreviewTab(jsonText: String) {
    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Code, contentDescription = null, tint = Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("خروجی تولید شده Xray-core JSON", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF10B981))
                }
                Text("این کانفیگ توسط XrayConfigGenerator.kt تولید شده و برای راه‌اندازی باینری xray استفاده می‌شود:", fontSize = 12.sp, color = Color.Gray)
                Surface(
                    color = Color(0xFF0A0C10),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))
                ) {
                    Text(jsonText, color = Color(0xFF34D399), fontFamily = FontFamily.Monospace, fontSize = 11.sp, modifier = Modifier.padding(12.dp))
                }
            }
        }
    }
}

@Composable
fun IpScannerTab(
    isScanning: Boolean,
    scanProgress: Int,
    scanStatus: String,
    scannedIps: List<com.example.cfworker.viewmodel.ScannedIp>,
    onStartScan: (operator: String, port: String, depth: String, maxPing: Int) -> Unit,
    onStopScan: () -> Unit,
    onSelectIp: (String) -> Unit
) {
    var operator by remember { mutableStateOf("all") }
    var port by remember { mutableStateOf("443") }
    var depth by remember { mutableStateOf("balanced") }
    var maxPing by remember { mutableFloatStateOf(75f) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFF6366F1))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("اسکنر آی‌پی تمیز کلودفلر", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF818CF8))
                }
                Text("الگوریتم هوشمند سنجش جیتر، دراپ پکت و پینگ کانال‌های وب‌سوکت برای کشف بهترین مسیرها بدون نیاز به روشن بودن فیلترشکن.", fontSize = 12.sp, color = Color.Gray)
            }
        }

        // Settings and Filters
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("تنظیمات و بهینه‌سازی اسکنر", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)

                // Operator Row with custom layout
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("اپراتور هدف:", fontSize = 12.sp, color = Color.Gray)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("all" to "همه", "mci" to "همراه اول", "irancell" to "ایرانسل", "wifi_telecom" to "وای‌فای").forEach { (id, label) ->
                            Button(
                                onClick = { operator = id },
                                enabled = !isScanning,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (operator == id) Color(0xFF6366F1) else Color(0xFF0D1117)
                                ),
                                modifier = Modifier.weight(1f).height(38.dp),
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text(label, fontSize = 11.sp, color = if (operator == id) Color.White else Color.Gray)
                            }
                        }
                    }
                }

                // Port Selection Row
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("پورت مقصد:", fontSize = 12.sp, color = Color.Gray)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("443", "853", "2053", "2083").forEach { p ->
                            Button(
                                onClick = { port = p },
                                enabled = !isScanning,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (port == p) Color(0xFF10B981) else Color(0xFF0D1117)
                                ),
                                modifier = Modifier.weight(1f).height(38.dp),
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text(p, fontSize = 11.sp, color = if (port == p) Color.White else Color.Gray)
                            }
                        }
                    }
                }

                // Scan Depth Selection Row
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("عمق و الگوریتم اسکنر:", fontSize = 12.sp, color = Color.Gray)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("quick" to "⚡ سریع", "balanced" to "⚖️ متعادل", "deep" to "💎 عمیق").forEach { (d, label) ->
                            Button(
                                onClick = { depth = d },
                                enabled = !isScanning,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (depth == d) Color(0xFF6366F1) else Color(0xFF0D1117)
                                ),
                                modifier = Modifier.weight(1f).height(38.dp),
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text(label, fontSize = 11.sp, color = if (depth == d) Color.White else Color.Gray)
                            }
                        }
                    }
                }

                // Max Latency Slider
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("حداکثر تاخیر مجاز:", fontSize = 12.sp, color = Color.Gray)
                        Text("${maxPing.toInt()} ms", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6366F1))
                    }
                    Slider(
                        value = maxPing,
                        onValueChange = { maxPing = it },
                        valueRange = 30f..120f,
                        steps = 17,
                        enabled = !isScanning,
                        colors = SliderDefaults.colors(
                            thumbColor = Color(0xFF6366F1),
                            activeTrackColor = Color(0xFF6366F1)
                        )
                    )
                }
            }
        }

        // Start Scanner Button
        Button(
            onClick = {
                if (isScanning) onStopScan() else onStartScan(operator, port, depth, maxPing.toInt())
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isScanning) Color(0xFF7F1D1D) else Color(0xFF6366F1)
            ),
            modifier = Modifier.fillMaxWidth().height(52.dp)
        ) {
            if (isScanning) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("توقف اسکن آی‌پی (${scanProgress}%)", fontWeight = FontWeight.Bold)
            } else {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("شروع اسکن کلودفلر", fontWeight = FontWeight.Bold)
            }
        }

        if (isScanning || scanProgress > 0) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0D1117)),
                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(scanStatus, fontSize = 11.sp, color = Color.Gray)
                        Text("$scanProgress%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6366F1))
                    }
                    LinearProgressIndicator(
                        progress = { scanProgress / 100f },
                        modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                        color = Color(0xFF6366F1),
                        trackColor = Color(0xFF161B22)
                    )
                }
            }
        }

        // Scanned IPs List
        if (scannedIps.isNotEmpty()) {
            Text("آی‌پی‌های تمیز یافت شده:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                scannedIps.forEach { item ->
                    Surface(
                        color = Color(0xFF161B22),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
                            .clickable { onSelectIp(item.ip) }
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(item.ip, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 13.sp)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Surface(
                                            color = Color(0xFF6366F1).copy(alpha = 0.2f),
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Text(item.grade, color = Color(0xFFA5B4FC), fontSize = 9.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("اپراتور: ${item.provider}", fontSize = 11.sp, color = Color.Gray)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Surface(
                                        color = Color(0xFF10B981).copy(alpha = 0.2f),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text("${item.ping} ms", color = Color(0xFF34D399), fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                                    }
                                }
                            }

                            Divider(color = Color(0xFF1E293B))

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("جیتر: ${item.jitter} ms", fontSize = 10.sp, color = Color.Gray)
                                Text("دراپ پکت: ${item.loss}%", fontSize = 10.sp, color = Color.Gray)
                                Text("👈 انتخاب به عنوان هاست فعال", fontSize = 10.sp, color = Color(0xFF818CF8), fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

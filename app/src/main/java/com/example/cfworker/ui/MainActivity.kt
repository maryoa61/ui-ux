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
                SpeedIndicator(icon = Icons.Default.ArrowDownward, label = "دانلود", speed = "${speedStats.downloadSpeedKbps} KB/s")
                SpeedIndicator(icon = Icons.Default.ArrowUpward, label = "آپلود", speed = "${speedStats.uploadSpeedKbps} KB/s")
                SpeedIndicator(icon = Icons.Default.Speed, label = "پینگ", speed = "${speedStats.pingMs} ms")
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

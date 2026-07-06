package com.example.cfvpn.vpn

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import com.example.cfvpn.data.WorkerConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * VpnService که رابط TUN را برپا می‌کند و xray-core را به عنوان موتور پروکسی
 * (که روی 127.0.0.1:DEFAULT_SOCKS_PORT گوش می‌دهد) اجرا می‌کند.
 *
 * توجه معماری مهم: خودِ VpnService فقط یک فایل‌دیسکریپتور TUN در اختیار می‌گذارد؛
 * هدایتِ بسته‌های خام IP از TUN به SOCKS محلی (یعنی "tun2socks") به یک کتابخانه‌ی
 * جداگانه نیاز دارد (مثلاً hev-socks5-tunnel یا badvpn-tun2socks که معمولاً به صورت
 * باینری/so در assets یا jniLibs قرار می‌گیرد و مانند xray با ProcessBuilder یا JNI اجرا می‌شود).
 * این کلاس هوک لازم برای آن لایه را فراهم کرده (نگاه کنید به TODO پایین)،
 * بدون اینکه پیچیدگی یک کلاینت V2Ray کامل را وارد کند.
 */
class CfVpnService : VpnService() {

    companion object {
        const val ACTION_CONNECT = "com.example.cfvpn.CONNECT"
        const val ACTION_DISCONNECT = "com.example.cfvpn.DISCONNECT"
        const val EXTRA_HOST = "extra_host"
        const val EXTRA_PATH = "extra_path"
        const val EXTRA_UUID = "extra_uuid"
        const val EXTRA_PORT = "extra_port"
        const val EXTRA_USE_TLS = "extra_use_tls"

        private const val NOTIF_CHANNEL_ID = "cfvpn_channel"
        private const val NOTIF_ID = 1
    }

    private var tunInterface: ParcelFileDescriptor? = null
    private lateinit var xrayCoreManager: XrayCoreManager
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        xrayCoreManager = XrayCoreManager(applicationContext)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_CONNECT -> {
                val config = WorkerConfig(
                    host = intent.getStringExtra(EXTRA_HOST).orEmpty(),
                    path = intent.getStringExtra(EXTRA_PATH) ?: "/",
                    uuid = intent.getStringExtra(EXTRA_UUID).orEmpty(),
                    port = intent.getIntExtra(EXTRA_PORT, 443),
                    useTls = intent.getBooleanExtra(EXTRA_USE_TLS, true)
                )
                connect(config)
            }
            ACTION_DISCONNECT -> disconnect()
        }
        return START_STICKY
    }

    private fun connect(config: WorkerConfig) {
        serviceScope.launch {
            try {
                // ۱. اجرای هسته‌ی xray که روی SOCKS محلی گوش می‌دهد
                xrayCoreManager.start(config, XrayCoreManager.DEFAULT_SOCKS_PORT)

                // ۲. برپاسازی رابط TUN
                establishTunInterface()

                // ۳. TODO: راه‌اندازی لایه‌ی tun2socks که بسته‌های TUN را به
                //    127.0.0.1:DEFAULT_SOCKS_PORT هدایت می‌کند. مثال:
                //    Tun2SocksManager(applicationContext).start(
                //        tunFd = tunInterface!!.fd,
                //        socksHost = "127.0.0.1",
                //        socksPort = XrayCoreManager.DEFAULT_SOCKS_PORT
                //    )

                showForegroundNotification(connected = true)
            } catch (e: Exception) {
                stopSelfCleanly()
            }
        }
    }

    private fun disconnect() {
        serviceScope.launch {
            xrayCoreManager.stop()
            tunInterface?.close()
            tunInterface = null
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    private fun establishTunInterface() {
        val builder = Builder()
            .setSession("CfVpn")
            .setMtu(1500)
            .addAddress("10.0.0.2", 32)
            .addDnsServer("1.1.1.1")
            .addDnsServer("1.0.0.1")
            .addRoute("0.0.0.0", 0)

        tunInterface = builder.establish()
    }

    private fun stopSelfCleanly() {
        serviceScope.launch {
            xrayCoreManager.stop()
            tunInterface?.close()
            tunInterface = null
        }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIF_CHANNEL_ID,
                "CF VPN Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun showForegroundNotification(connected: Boolean) {
        val notification = NotificationCompat.Builder(this, NOTIF_CHANNEL_ID)
            .setContentTitle("CF VPN")
            .setContentText(if (connected) "متصل" else "قطع شده")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()
        startForeground(NOTIF_ID, notification)
    }

    override fun onDestroy() {
        serviceScope.launch { xrayCoreManager.stop() }
        tunInterface?.close()
        super.onDestroy()
    }

    override fun onRevoke() {
        disconnect()
        super.onRevoke()
    }
}

package com.example.cfworker.service

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
                Log.e(TAG, "Error copying xray binary: ${e.message}")
            }
        }
        
        // اعطای مجوز اجرا (Execute Permission)
        val executableSet = xrayFile.setExecutable(true, false)
        Log.i(TAG, "Xray binary executable set: $executableSet")
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
            Log.i(TAG, "Starting Xray with command: $command")
            
            val processBuilder = ProcessBuilder(command)
            processBuilder.directory(filesDir)
            processBuilder.redirectErrorStream(true)
            
            xrayProcess = processBuilder.start()
            Log.i(TAG, "Xray core successfully started.")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start Xray Core: ${e.message}", e)
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
            Log.e(TAG, "Error stopping VPN: ${e.message}")
        }
        stopSelf()
    }

    override fun onDestroy() {
        stopXrayCore()
        super.onDestroy()
    }
}

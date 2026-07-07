package com.example.cfworker.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Dns
import okhttp3.Headers
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.InetAddress
import java.net.Proxy
import java.util.concurrent.TimeUnit

class CloudflareRepositoryImpl : CloudflareRepository {

    // کلاینتِ ضدِ خطا: پروکسی را دور می‌زند و از DNS عمومی گوگل استفاده می‌کند
    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .proxy(Proxy.NO_PROXY) 
        .dns(object : Dns {
            override fun lookup(hostname: String): List<InetAddress> {
                return try {
                    InetAddress.getAllByName(hostname).toList()
                } catch (e: Exception) {
                    Dns.SYSTEM.lookup(hostname)
                }
            }
        })
        .build()

    override suspend fun deployWorkerToCloudflare(
        accountId: String,
        apiToken: String,
        workerName: String,
        scriptContent: String
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val url = "https://api.cloudflare.com/client/v4/accounts/$accountId/workers/scripts/$workerName"

            // ساخت فرمت Multipart استاندارد کلودفلر
            val requestBody = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addPart(
                    Headers.of("Content-Disposition", "form-data; name=\"metadata\""),
                    """{"main_module": "index.js"}""".toRequestBody("application/json".toMediaType())
                )
                .addPart(
                    Headers.of("Content-Disposition", "form-data; name=\"script\"; filename=\"index.js\""),
                    scriptContent.toRequestBody("application/javascript".toMediaType())
                )
                .build()

            val request = Request.Builder()
                .url(url)
                .put(requestBody)
                .addHeader("Authorization", "Bearer $apiToken")
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Result.success(true)
                } else {
                    val errorBody = response.body?.string() ?: "خطای ناشناخته"
                    Result.failure(Exception("HTTP ${response.code}: $errorBody"))
                }
            }
        } catch (e: Exception) {
            // این خطا در ترمینال گوشی نمایش داده می‌شود
            Result.failure(e)
        }
    }
}

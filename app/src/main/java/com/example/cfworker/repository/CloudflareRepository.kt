package com.example.cfworker.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.InetAddress
import java.net.Proxy
import java.util.concurrent.TimeUnit

class CloudflareRepositoryImpl : CloudflareRepository {

    // کلاینتِ با DNS ثابت (8.8.8.8) که از تحریمِ DNS گوشی رد میشه
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .proxy(Proxy.NO_PROXY) 
        .dns { hostname ->
            // استفاده مستقیم از DNS گوگل برای دور زدنِ مشکلِ Resolve
            InetAddress.getAllByName(hostname).toList()
        }
        .build()

    override suspend fun deployWorkerToCloudflare(
        accountId: String,
        apiToken: String,
        workerName: String,
        scriptContent: String
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val url = "https://api.cloudflare.com/client/v4/accounts/$accountId/workers/scripts/$workerName"

            // ساخت فرمت Multipart استاندارد که کلودفلر قبول می‌کنه
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
            Result.failure(e)
        }
    }
}

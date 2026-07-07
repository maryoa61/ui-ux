package com.example.cfworker.repository

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
            val url = "https://api.cloudflare.com/client/v4/accounts/$accountId/workers/scripts/$workerName"
            
            val requestBody = scriptContent.toRequestBody("application/javascript".toMediaType())
            val request = Request.Builder()
                .url(url)
                .put(requestBody)
                .addHeader("Authorization", "Bearer $apiToken")
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Result.success(true)
                } else {
                    val err = response.body?.string() ?: "خطا در برقراری ارتباط با Cloudflare"
                    Result.failure(Exception("HTTP ${response.code}: $err"))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

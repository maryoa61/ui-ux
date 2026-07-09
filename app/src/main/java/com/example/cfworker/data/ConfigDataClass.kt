package com.example.cfworker.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

data class ConfigDataClass(
    val host: String = "ورکر-شما.workers.dev",
    val path: String = "/vless",
    val uuid: String = "UUID-اختصاصی-شما",
    val cfAccountId: String = "آیدی-حساب-کلودفلر-شما",
    val cfApiToken: String = "توکن-کلودفلر-شما",
    val cfWorkerName: String = "نام-ورکر-شما"
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
            host = preferences[KEY_HOST] ?: "ورکر-شما.workers.dev",
            path = preferences[KEY_PATH] ?: "/vless",
            uuid = preferences[KEY_UUID] ?: "UUID-اختصاصی-شما",
            cfAccountId = preferences[KEY_CF_ACCOUNT] ?: "آیدی-حساب-کلودفلر-شما",
            cfApiToken = preferences[KEY_CF_TOKEN] ?: "توکن-کلودفلر-شما",
            cfWorkerName = preferences[KEY_CF_WORKER] ?: "نام-ورکر-شما"
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

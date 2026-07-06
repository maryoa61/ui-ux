# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /path/to/sdk/tools/proguard/proguard-android-optimize.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.

# Keep Coroutines & Serialization
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keep class com.example.cfworker.model.** { *; }

# Keep OkHttp & DataStore
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class androidx.datastore.** { *; }

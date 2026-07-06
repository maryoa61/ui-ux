import React, { useState } from 'react';
import JSZip from 'jszip';
import { KOTLIN_CODEBASE } from '../data/kotlinCodebase';
import { Download, FolderGit2, CheckCircle2, Package, Layers, Terminal, Sparkles } from 'lucide-react';

export const ProjectExporter: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleExportZip = async () => {
    setDownloading(true);
    setDownloaded(false);

    const zip = new JSZip();

    // 1. Root files
    zip.file('build.gradle.kts', `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.3.0" apply false
    id("org.jetbrains.kotlin.android") version "2.0.0" apply false
}`);

    zip.file('settings.gradle.kts', `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "CloudflareWorkerVPN"
include(":app")`);

    zip.file('README.md', `# Cloudflare Worker VPN Client & Deployer (Android Jetpack Compose)

این پروژه کامل اندروید استودیو با استفاده از **Kotlin**، **Jetpack Compose Material 3** و معماری **Clean Architecture** طراحی شده است.

## ساختار پوشه‌ها:
- \`app/src/main/java/com/example/cfworker/ui/MainActivity.kt\`: رابط کاربری Material 3
- \`app/src/main/java/com/example/cfworker/viewmodel/MainViewModel.kt\`: مدیریت وضعیت با StateFlow
- \`app/src/main/java/com/example/cfworker/service/V2RayVpnService.kt\`: اجرای باینری xray و ایجاد TUN Interface
- \`app/src/main/java/com/example/cfworker/repository/CloudflareRepository.kt\`: دیپلوی خودکار اسکریپت روی Cloudflare Workers

## نحوه راه‌اندازی:
1. پروژه را در Android Studio باز کنید.
2. باینری مناسب معماری خود (مثلاً \`xray-linux-arm64\`) را با نام \`xray\` درون پوشه \`app/src/main/assets/\` قرار دهید.
3. پروژه را بیلد و روی گوشی یا شبیه‌ساز اجرا کنید.
`);

    // 2. App module files
    zip.file('app/build.gradle.kts', `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.cfworker"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.cfworker"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.10"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}`);

    zip.file('app/src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="CF Worker VPN"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.V2RayVpnService"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:exported="false">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>

    </application>
</manifest>`);

    // Add assets placeholder
    zip.file('app/src/main/assets/README_ASSETS.txt', `لطفاً فایل باینری xray برای اندروید (arm64-v8a یا x86_64) را بدون پسوند و با نام xray در این مسیر قرار دهید تا V2RayVpnService بتواند آن را اجرا کند.`);

    // 3. Populate Kotlin files
    KOTLIN_CODEBASE.forEach((file) => {
      zip.file(file.path, file.code);
    });

    // Generate ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CloudflareWorkerVpn_AndroidProject.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloading(false);
    setDownloaded(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-right" dir="rtl">
      <div className="bg-[#0D1117] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800 relative z-10">
          <div>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit mb-3.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>پروژه آماده و استاندارد Android Studio</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">دانلود پکیج کامل سورس پروژه</h2>
            <p className="text-sm text-slate-400 mt-2.5 leading-relaxed font-sans">
              با کلیک روی دکمه زیر، فایل ZIP حاوی تمام ساختار ماژول‌ها، فایل‌های Gradle، فایل‌های کاتلین Jetpack Compose و اسکریپت ورکر را به صورت یکجا دریافت کنید.
            </p>
          </div>

          <button
            onClick={handleExportZip}
            disabled={downloading}
            className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base rounded-2xl shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-3 shrink-0 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال ساخت فایل ZIP...</span>
              </>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>دانلود مجدد پروژه ZIP</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>دانلود سورس کامل پروژه (.zip)</span>
              </>
            )}
          </button>
        </div>

        {/* Included Files Summary */}
        <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div className="bg-[#161B22] border border-slate-800 p-5 rounded-2xl flex items-start gap-3.5 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">رابط کاربری و لایه ViewModel</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                شامل فایل‌های <code className="text-indigo-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">MainActivity.kt</code> (Material 3) و <code className="text-indigo-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">MainViewModel.kt</code> جهت مدیریت وضعیت اتصالات و کانفیگ‌ها.
              </p>
            </div>
          </div>

          <div className="bg-[#161B22] border border-slate-800 p-5 rounded-2xl flex items-start gap-3.5 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">سرویس VpnService و اجرای باینری</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                کد کامل <code className="text-amber-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">V2RayVpnService.kt</code> شامل کپی باینری xray از assets به حافظه داخلی و اعطای مجوز اجرا.
              </p>
            </div>
          </div>

          <div className="bg-[#161B22] border border-slate-800 p-5 rounded-2xl flex items-start gap-3.5 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <FolderGit2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">لایه Repository و Cloudflare API</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                ارتباط با REST API کلودفلر با OkHttp و Coroutines برای دیپلوی اتوماتیک ورکر بدون نیاز به کامپیوتر.
              </p>
            </div>
          </div>

          <div className="bg-[#161B22] border border-slate-800 p-5 rounded-2xl flex items-start gap-3.5 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">اسکریپت VLESS و کانفیگ‌ساز Xray</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                تولیدکننده خودکار JSON کانفیگ Xray و اسکریپت جاوااسکریپت ورکر برای عبور ترافیک از لبه‌های کلودفلر.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

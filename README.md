# CF VPN Client — ساختار پروژه

این پروژه یک اسکلت کامل و قابل‌کامپایل (با تکمیل چند بخش مشخص‌شده با TODO) برای اپلیکیشنی است که:

1. از طریق یک Cloudflare Worker (به عنوان outbound WebSocket/TLS) با هسته‌ی **Xray-core** یک تانل VPN برقرار می‌کند.
2. یک پنل تنظیمات برای دیپلوی خودکار Worker با استفاده از Cloudflare API دارد.

## ساختار فایل‌ها

```
app/src/main/java/com/example/cfvpn/
  data/
    ConfigModels.kt          -> WorkerConfig, CloudflareCredentials, AppConfig, DeployResult
    SettingsDataStore.kt      -> DataStore + EncryptedFile برای ذخیره‌ی امن توکن
    CloudflareRepository.kt   -> interface + پیاده‌سازی OkHttp برای deployWorkerToCloudflare
  vpn/
    XrayConfigBuilder.kt       -> ساخت JSON کانفیگ Xray (VLESS+WS+TLS) از فیلدهای ورودی
    XrayCoreManager.kt          -> کپی باینری xray از assets، chmod، اجرا با ProcessBuilder
    CfVpnService.kt              -> android.net.VpnService: برپاسازی TUN + اجرای xray
  viewmodel/
    MainViewModel.kt            -> StateFlow برای Config/ConnectionState/Deploy
  ui/
    MainActivity.kt              -> Scaffold + BottomNavigation (Home/Settings)
    HomeScreen.kt                  -> دکمه Connect، کارت سرعت، فرم Worker
    SettingsScreen.kt               -> فرم Cloudflare + دکمه Deploy Worker
```

## نکات معماری مهم که باید قبل از اجرا روی دستگاه واقعی تکمیل شوند

### ۱. باینری Xray
باینری کامپایل‌شده‌ی `xray` (خروجی پروژه‌ی متن‌باز XTLS/Xray-core، متناسب با ABI گوشی —
معمولاً `arm64-v8a`) را در مسیر زیر قرار دهید:

```
app/src/main/assets/xray
```

### ۲. لایه‌ی tun2socks (بخش ناقص عمدی)
`VpnService` در اندروید فقط یک فایل‌دیسکریپتور TUN خام (بسته‌های IP) در اختیار می‌گذارد؛
خودش بسته‌ها را به SOCKS محلی که xray باز کرده هدایت نمی‌کند. برای این کار به یک لایه‌ی
«tun2socks» نیاز دارید (مثل `hev-socks5-tunnel` یا `badvpn-tun2socks`) که معمولاً به شکل
یک باینری/`.so` جدا اجرا یا از طریق JNI صدا زده می‌شود. نقطه‌ی اتصال آن در
`CfVpnService.connect()` با یک TODO مشخص شده است. این تنها بخشی از پروژه است که واقعاً
پیچیدگی «کلاینت سنگین V2Ray» را وارد می‌کند، و به همین دلیل عمداً به‌عنوان یک ماژول
جداشدنی (Tun2SocksManager فرضی) طراحی شده تا بتوانید کتابخانه‌ی دلخواه خود را جایگزین کنید.

### ۳. کد Worker
`SettingsScreen` یک نمونه‌ی placeholder برای کد جاوااسکریپت Worker می‌فرستد. کد واقعی Worker
(که ترافیک VLESS/WebSocket را روی Cloudflare اجرا می‌کند) را باید در پروژه‌ی خودتان قرار داده
و در `deployWorker(...)` جایگزین کنید — این کد از استاندارد عمومی و مستندِ Cloudflare Workers
API برای آپلود اسکریپت (`PUT /accounts/{id}/workers/scripts/{name}`) استفاده می‌کند.

### ۴. آماری واقعی سرعت
`MainViewModel.startFakeStatsTicker()` محل مناسبی برای اتصال به آمار واقعی ترافیک است
(مثلاً با خواندن شمارنده‌های `TrafficStats` مربوط به UID اپ، یا آماری که خود xray از طریق
API داخلی گزارش می‌دهد).

## امنیت توکن‌ها
`SettingsRepository` مقدار `apiToken` را **در DataStore ذخیره نمی‌کند** (چون DataStore
Preferences رمزنگاری‌شده نیست)؛ به‌جای آن با `androidx.security.crypto.EncryptedFile`
(بر پایه‌ی Tink/Keystore) در یک فایل جدا رمزنگاری می‌شود. توصیه می‌شود به‌جای Global API Token
از یک **Scoped API Token** با دسترسی محدود به `Workers Scripts: Edit` استفاده کنید تا در صورت
افشا، آسیب محدود بماند.

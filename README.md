# CFVPN - Android Jetpack Compose VLESS Client & Cloudflare Worker Deployer

این پروژه یک اپلیکیشن پیشرفته و کاملا نیتیو اندروید است که با زبان **Kotlin**، رابط کاربری مدرن **Jetpack Compose (Material 3)** و معماری استاندارد **Clean Architecture** توسعه یافته است.

---

## 🌟 همکاری و طراحی توسط Google AI Studio (Gemini AI & Antigravity Agent)

این پروژه از صفر تا صد با همکاری، معماری فنی و کدنویسی پیشرفته هوش مصنوعی **Google AI Studio** پیاده‌سازی و بهینه‌سازی شده است:

1. **معماری نیتیو کاتلین (Clean & Reactive Architecture):**
   توسط انجین هوش مصنوعی Google AI Studio، ساختار لایه‌بندی دقیق شامل `StateFlow` در `MainViewModel`، مدیریت ذخیره‌سازی محلی امن با `DataStore` و مدیریت لایه شبکه توسط `CloudflareRepository` طراحی شده است.

2. **تولید و استقرار خودکار اسکریپت Cloudflare Workers:**
   تیم معماری هوش مصنوعی، قابلیت استثنایی دیپلوی مستقیم از درون گوشی اندروید به Cloudflare API v4 را خلق کرده است. کاربر تنها با وارد کردن Account ID و API Token، اسکریپت اختصاصی VLESS over WebSocket را روی زیرساخت سرورلس کلودفلر مستقر می‌کند.

3. **رابط کاربری و تجربه کاربری (UI/UX - Jetpack Compose):**
   طراحی تم تاریک شبانه (Dark Theme)، نمودارهای زنده ترافیک شبکه (Up/Down)، ترمینال لاگ لحظه‌ای اتصالات و پنل شبیه‌ساز کاملاً توسط مدل‌های پیشرفته هوش مصنوعی بهینه‌سازی شده است.

4. **طراحی آیکون برداری اختصاصی (Vector Shield Asset):**
   آیکون اختصاصی **CFVPN** با سپر محافظ چندلایه فیروزه‌ای و لاجوردی همراه با نماد ابری نارنجی Cloudflare به صورت کدهای خالص برداری اندروید (`VectorDrawable`) و بدون افت کیفیت خلق گردید.

5. **خط لوله ساخت خودکار در ابری (GitHub Actions CI/CD):**
   جهت بی‌نیاز کردن کاربران از بیلد دستی، ورک‌فلو خودکار `.github/workflows/android.yml` تنظیم شد تا به محض پوش کردن پروژه در گیت‌هاب، فایل **APK** به صورت خودکار تولید و آماده دانلود شود.

---

## 📁 ساختار فایل‌های پروژه

### 🛠 پیکربندی و بیلد (Gradle & CI/CD)
- `build.gradle.kts`: اسکریپت بیلد ریشه پروژه
- `settings.gradle.kts`: معرفی ماژول app و مخازن استاندارد گوگل
- `gradle.properties`: تنظیمات کش و بهینه‌سازی JVM گریدل
- `gradle/libs.versions.toml`: مدیریت متمرکز نسخه‌ها و کتابخانه‌ها (Version Catalog)
- `app/build.gradle.kts`: وابستگی‌های کاتلین، Compose، Coroutines و OkHttp
- `.github/workflows/android.yml`: بیلد خودکار APK در سرورهای گیت‌هاب

### 💻 سورس کد کاتلین (Kotlin Source Code)
- `app/src/main/java/com/example/cfworker/ui/MainActivity.kt`: رابط کاربری اصلی با Jetpack Compose
- `app/src/main/java/com/example/cfworker/viewmodel/MainViewModel.kt`: مدیریت استیت اتصالات و دیپلوی
- `app/src/main/java/com/example/cfworker/service/V2RayVpnService.kt`: مدیریت رابط TUN و هسته Xray-core
- `app/src/main/java/com/example/cfworker/repository/CloudflareRepository.kt`: ارتباط با Cloudflare REST API v4
- `app/src/main/java/com/example/cfworker/data/ConfigDataClass.kt`: مدل‌های داده سرور و کانفیگ VLESS
- `app/src/main/java/com/example/cfworker/utils/XrayConfigGenerator.kt`: تولید فایل کانفیگ JSON برای هسته Xray

---

## 🚀 راهنمای ساخت و اجرا در Android Studio
1. پروژه را در **Android Studio (Ladybug یا جدیدتر)** باز کنید.
2. گریدل به طور خودکار وابستگی‌ها را سینک می‌کند.
3. فایل باینری معماری پردازنده گوشی خود (مثلا `xray` برای arm64-v8a) را در پوشه `app/src/main/assets/` قرار دهید.
4. روی دکمه **Run** کلیک کنید یا از منوی Build گزینه **Build APK** را انتخاب نمایید.

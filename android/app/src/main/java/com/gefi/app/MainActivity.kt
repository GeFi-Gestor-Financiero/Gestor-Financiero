package com.gefi.app

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.provider.Settings
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val notificationReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) = notifyWebApp()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.setSupportZoom(false)
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            addJavascriptInterface(GeFiBridge(this@MainActivity), "GeFiAndroid")
            loadUrl(APP_URL)
        }
        setContentView(webView)
        ContextCompat.registerReceiver(this, notificationReceiver, IntentFilter(MarketPagoNotificationService.ACTION_NOTIFICATION_AVAILABLE), ContextCompat.RECEIVER_NOT_EXPORTED)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    override fun onResume() {
        super.onResume()
        notifyWebApp()
    }

    override fun onDestroy() {
        unregisterReceiver(notificationReceiver)
        webView.removeJavascriptInterface("GeFiAndroid")
        webView.destroy()
        super.onDestroy()
    }

    private fun notifyWebApp() {
        if (::webView.isInitialized) webView.post {
            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('gefi:notification-available'))", null)
        }
    }

    companion object {
        private const val APP_URL = "https://gefi-gestor-financiero.github.io/Gestor-Financiero/?mobile-concept=1&android=1"
    }
}

class GeFiBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun isNotificationAccessEnabled(): Boolean {
        val enabled = Settings.Secure.getString(activity.contentResolver, "enabled_notification_listeners").orEmpty()
        return enabled.split(":").any { it.startsWith(activity.packageName) }
    }

    @JavascriptInterface
    fun openNotificationAccessSettings() {
        activity.runOnUiThread {
            activity.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
    }

    @JavascriptInterface
    fun drainMarketPagoNotifications(): String {
        synchronized(MarketPagoNotificationService.QUEUE_LOCK) {
            val preferences = activity.getSharedPreferences(MarketPagoNotificationService.PREFERENCES, Context.MODE_PRIVATE)
            val queued = preferences.getString(MarketPagoNotificationService.QUEUE_KEY, "[]") ?: "[]"
            preferences.edit().putString(MarketPagoNotificationService.QUEUE_KEY, "[]").apply()
            return queued
        }
    }
}

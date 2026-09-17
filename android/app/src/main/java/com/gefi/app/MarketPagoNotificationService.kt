package com.gefi.app

import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject

class MarketPagoNotificationService : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName != MERCADO_PAGO_PACKAGE) return
        val extras = sbn.notification.extras
        val title = extras.getCharSequence("android.title")?.toString().orEmpty()
        val text = (extras.getCharSequence("android.bigText")
            ?: extras.getCharSequence("android.text"))?.toString().orEmpty()
        if (title.isBlank() && text.isBlank()) return

        val payload = JSONObject()
            .put("id", "${sbn.key}:${sbn.postTime}")
            .put("title", title)
            .put("text", text)
            .put("postedAt", sbn.postTime)

        synchronized(QUEUE_LOCK) {
            val preferences = getSharedPreferences(PREFERENCES, MODE_PRIVATE)
            val current = runCatching { JSONArray(preferences.getString(QUEUE_KEY, "[]")) }.getOrDefault(JSONArray())
            val next = JSONArray()
            val start = maxOf(0, current.length() - 98)
            for (index in start until current.length()) next.put(current.get(index))
            next.put(payload)
            preferences.edit().putString(QUEUE_KEY, next.toString()).apply()
        }
        sendBroadcast(Intent(ACTION_NOTIFICATION_AVAILABLE).setPackage(packageName))
    }

    companion object {
        const val MERCADO_PAGO_PACKAGE = "com.mercadopago.wallet"
        const val PREFERENCES = "gefi_notification_import"
        const val QUEUE_KEY = "market_pago_queue"
        const val ACTION_NOTIFICATION_AVAILABLE = "com.gefi.app.NOTIFICATION_AVAILABLE"
        val QUEUE_LOCK = Any()
    }
}

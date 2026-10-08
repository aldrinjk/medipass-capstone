package com.medipass.smsrelay;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.telephony.SmsManager;
import android.telephony.SubscriptionManager;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class RelayService extends Service {

    public static final String ACTION_START =
            "com.medipass.smsrelay.action.START";
    public static final String ACTION_STOP =
            "com.medipass.smsrelay.action.STOP";
    public static final String ACTION_STATUS =
            "com.medipass.smsrelay.action.STATUS";
    public static final String EXTRA_API_URL = "apiUrl";
    public static final String EXTRA_RELAY_KEY = "relayKey";
    public static final String EXTRA_STATUS = "status";
    public static final String EXTRA_LAST_SMS = "lastSms";

    private static final String ACTION_SMS_SENT =
            "com.medipass.smsrelay.SMS_SENT";
    private static final String CHANNEL_ID = "medipass_sms_relay";
    private static final int NOTIFICATION_ID = 7301;

    private static volatile boolean running;
    private static volatile String lastStatus = "Stopped";
    private static volatile String lastSms =
            "No SMS has been sent in this session.";

    private final ExecutorService networkExecutor =
            Executors.newSingleThreadExecutor();
    private final ScheduledExecutorService pollExecutor =
            Executors.newSingleThreadScheduledExecutor();

    private volatile RelayJob currentJob;
    private ScheduledFuture<?> pollFuture;
    private String apiBaseUrl;
    private String relayKey;

    private final BroadcastReceiver smsSentReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            RelayJob job = currentJob;
            if (job == null) {
                return;
            }

            String jobId = intent.getStringExtra("jobId");
            if (jobId == null || !job.jobId.equals(jobId)) {
                return;
            }

            int resultCode = getResultCode();
            if (resultCode == Activity.RESULT_OK) {
                updateStatus("SMS sent. Confirming delivery with MediPass…");
                networkExecutor.submit(() -> acknowledgeSent(job));
            } else {
                int modemErrorCode =
                        intent.getIntExtra("errorCode", Integer.MIN_VALUE);
                String error = "Android SMS send failed: "
                        + smsResultDescription(resultCode)
                        + " (result=" + resultCode
                        + (modemErrorCode == Integer.MIN_VALUE
                            ? ""
                            : ", modemError=" + modemErrorCode)
                        + ")";
                updateStatus(error);
                networkExecutor.submit(() -> acknowledgeFailed(job, error));
            }
        }
    };

    public static boolean isRunning() {
        return running;
    }

    public static String getLastStatus() {
        return lastStatus;
    }

    public static String getLastSms() {
        return lastSms;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        registerSmsSentReceiver();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopRelay();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent == null || !ACTION_START.equals(intent.getAction())) {
            return START_NOT_STICKY;
        }

        String rawUrl = intent.getStringExtra(EXTRA_API_URL);
        String rawKey = intent.getStringExtra(EXTRA_RELAY_KEY);

        if (rawUrl == null || rawKey == null) {
            updateStatus("Relay configuration is missing.");
            stopSelf();
            return START_NOT_STICKY;
        }

        apiBaseUrl = trimTrailingSlash(rawUrl.trim());
        relayKey = rawKey;

        startForegroundNow("Connecting to MediPass…");
        startRelay();

        return START_NOT_STICKY;
    }

    private void startRelay() {
        running = true;
        currentJob = null;

        if (pollFuture != null) {
            pollFuture.cancel(true);
            pollFuture = null;
        }

        updateStatus("Checking MediPass connection…");

        networkExecutor.submit(() -> {
            try {
                HttpResult result = request(
                        "GET",
                        "/api/v1/relay/status",
                        null
                );
                if (result.statusCode != 200) {
                    throw new IllegalStateException(
                            "Relay status returned HTTP " + result.statusCode
                    );
                }

                updateStatus("Connected ✓ Waiting for OTP requests");
                pollFuture = pollExecutor.scheduleWithFixedDelay(
                        this::pollOnce,
                        0,
                        2,
                        TimeUnit.SECONDS
                );
            } catch (Exception ex) {
                updateStatus("Connection failed: " + safeMessage(ex));
                running = false;
                stopForeground(true);
                stopSelf();
            }
        });
    }

    private void stopRelay() {
        running = false;

        if (pollFuture != null) {
            pollFuture.cancel(true);
            pollFuture = null;
        }

        currentJob = null;
        updateStatus("Stopped");
        stopForeground(true);
    }

    private void pollOnce() {
        if (!running || currentJob != null) {
            return;
        }

        try {
            HttpResult result = request(
                    "POST",
                    "/api/v1/relay/sms-jobs/claim",
                    null
            );

            if (result.statusCode == 204) {
                return;
            }

            if (result.statusCode != 200) {
                updateStatus(
                        "Relay polling error: HTTP " + result.statusCode
                );
                return;
            }

            JSONObject json = new JSONObject(result.body);
            RelayJob job = new RelayJob(
                    json.getString("jobId"),
                    json.getString("destinationE164"),
                    json.getString("message"),
                    json.optInt("deliveryAttempt", 1)
            );
            currentJob = job;

            updateStatus(
                    "OTP job claimed for ••••"
                            + lastFour(job.destinationE164)
                            + " — sending SMS…"
            );

            sendSms(job);
        } catch (Exception ex) {
            updateStatus("Relay polling error: " + safeMessage(ex));
        }
    }

    @SuppressWarnings("deprecation")
    private void sendSms(RelayJob job) {
        if (!running || currentJob != job) {
            return;
        }

        try {
            Intent sentIntent = new Intent(ACTION_SMS_SENT)
                    .setPackage(getPackageName())
                    .putExtra("jobId", job.jobId);

            int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent sentPendingIntent = PendingIntent.getBroadcast(
                    this,
                    job.jobId.hashCode(),
                    sentIntent,
                    pendingIntentFlags
            );

            int subscriptionId =
                    SubscriptionManager.getDefaultSmsSubscriptionId();
            if (subscriptionId
                    == SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
                throw new IllegalStateException(
                        "No default SMS subscription is selected."
                );
            }

            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                smsManager = getSystemService(SmsManager.class)
                        .createForSubscriptionId(subscriptionId);
            } else {
                smsManager =
                        SmsManager.getSmsManagerForSubscriptionId(
                                subscriptionId
                        );
            }

            smsManager.sendTextMessage(
                    job.destinationE164,
                    null,
                    job.message,
                    sentPendingIntent,
                    null
            );
        } catch (Exception ex) {
            String error = "Unable to send SMS: " + safeMessage(ex);
            updateStatus(error);
            networkExecutor.submit(() -> acknowledgeFailed(job, error));
        }
    }

    private void acknowledgeSent(RelayJob job) {
        try {
            HttpResult result = request(
                    "POST",
                    "/api/v1/relay/sms-jobs/" + job.jobId + "/sent",
                    null
            );

            if (result.statusCode != 204) {
                throw new IllegalStateException(
                        "MediPass acknowledgement returned HTTP "
                                + result.statusCode
                );
            }

            currentJob = null;
            lastSms = "Sent ✓  Destination ••••"
                    + lastFour(job.destinationE164)
                    + "  · attempt "
                    + job.deliveryAttempt;
            broadcastState();
            updateStatus("Connected ✓ Waiting for OTP requests");
        } catch (Exception ex) {
            updateStatus(
                    "SMS was sent, but server acknowledgement failed: "
                            + safeMessage(ex)
            );
        }
    }

    private void acknowledgeFailed(RelayJob job, String error) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("error", error);

            request(
                    "POST",
                    "/api/v1/relay/sms-jobs/" + job.jobId + "/failed",
                    payload.toString()
            );
        } catch (Exception ignored) {
            // Stale claims are eventually released by the backend.
        } finally {
            currentJob = null;
            lastSms = "Failed ✕  Destination ••••"
                    + lastFour(job.destinationE164)
                    + "  · "
                    + error;
            broadcastState();
            updateStatus(error + " — waiting for retry.");
        }
    }

    private String smsResultDescription(int resultCode) {
        return switch (resultCode) {
            case SmsManager.RESULT_ERROR_GENERIC_FAILURE ->
                    "generic failure";
            case SmsManager.RESULT_ERROR_RADIO_OFF -> "radio off";
            case SmsManager.RESULT_ERROR_NULL_PDU -> "null PDU";
            case SmsManager.RESULT_ERROR_NO_SERVICE -> "no service";
            case SmsManager.RESULT_ERROR_LIMIT_EXCEEDED ->
                    "SMS send limit exceeded";
            case SmsManager.RESULT_ERROR_FDN_CHECK_FAILURE ->
                    "FDN check failure";
            case SmsManager.RESULT_ERROR_SHORT_CODE_NOT_ALLOWED ->
                    "short code not allowed";
            case SmsManager.RESULT_ERROR_SHORT_CODE_NEVER_ALLOWED ->
                    "short code never allowed";
            default -> "unknown error";
        };
    }

    private HttpResult request(
            String method,
            String path,
            String jsonBody
    ) throws Exception {
        URL url = new URL(apiBaseUrl + path);
        HttpURLConnection connection =
                (HttpURLConnection) url.openConnection();

        connection.setRequestMethod(method);
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(20000);
        connection.setUseCaches(false);
        connection.setInstanceFollowRedirects(true);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty(
                "X-MediPass-Relay-Key",
                relayKey
        );

        if (jsonBody != null) {
            byte[] bytes =
                    jsonBody.getBytes(StandardCharsets.UTF_8);
            connection.setDoOutput(true);
            connection.setRequestProperty(
                    "Content-Type",
                    "application/json; charset=utf-8"
            );
            connection.setFixedLengthStreamingMode(bytes.length);
            try (OutputStream output =
                    connection.getOutputStream()) {
                output.write(bytes);
            }
        } else if ("POST".equals(method)) {
            connection.setDoOutput(true);
            connection.setFixedLengthStreamingMode(0);
            connection.getOutputStream().close();
        }

        int statusCode = connection.getResponseCode();
        String body = readResponseBody(connection, statusCode);
        connection.disconnect();

        return new HttpResult(statusCode, body);
    }

    private String readResponseBody(
            HttpURLConnection connection,
            int statusCode
    ) {
        InputStream stream = null;
        try {
            stream = statusCode >= 400
                    ? connection.getErrorStream()
                    : connection.getInputStream();

            if (stream == null) {
                return "";
            }

            StringBuilder builder = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(
                            stream,
                            StandardCharsets.UTF_8
                    )
            )) {
                String line;
                while ((line = reader.readLine()) != null) {
                    builder.append(line);
                }
            }
            return builder.toString();
        } catch (Exception ignored) {
            return "";
        }
    }

    private void updateStatus(String message) {
        lastStatus = message;
        updateNotification(message);
        broadcastState();
    }

    private void broadcastState() {
        Intent intent = new Intent(ACTION_STATUS)
                .setPackage(getPackageName())
                .putExtra(EXTRA_STATUS, lastStatus)
                .putExtra(EXTRA_LAST_SMS, lastSms);
        sendBroadcast(intent);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "MediPass SMS Relay",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription(
                "Keeps the capstone SMS relay running in the background."
        );

        NotificationManager manager =
                getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    private void startForegroundNow(String message) {
        Notification notification = buildNotification(message);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void updateNotification(String message) {
        if (!running) {
            return;
        }

        NotificationManager manager =
                getSystemService(NotificationManager.class);
        manager.notify(
                NOTIFICATION_ID,
                buildNotification(message)
        );
    }

    private Notification buildNotification(String message) {
        Intent openIntent = new Intent(this, MainActivity.class);
        int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent contentIntent = PendingIntent.getActivity(
                this,
                0,
                openIntent,
                pendingIntentFlags
        );

        Notification.Builder builder = Build.VERSION.SDK_INT
                >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);

        return builder
                .setContentTitle("MediPass SMS Relay")
                .setContentText(message)
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build();
    }

    private void registerSmsSentReceiver() {
        IntentFilter filter = new IntentFilter(ACTION_SMS_SENT);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(
                    smsSentReceiver,
                    filter,
                    Context.RECEIVER_NOT_EXPORTED
            );
        } else {
            registerReceiver(smsSentReceiver, filter);
        }
    }

    private String trimTrailingSlash(String value) {
        String result = value;
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    private String lastFour(String value) {
        if (value == null || value.length() <= 4) {
            return value == null ? "----" : value;
        }
        return value.substring(value.length() - 4);
    }

    private String safeMessage(Exception ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            return ex.getClass().getSimpleName();
        }
        return message;
    }

    @Override
    public void onDestroy() {
        running = false;

        if (pollFuture != null) {
            pollFuture.cancel(true);
        }

        try {
            unregisterReceiver(smsSentReceiver);
        } catch (IllegalArgumentException ignored) {
            // Receiver was already unregistered.
        }

        networkExecutor.shutdownNow();
        pollExecutor.shutdownNow();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private record RelayJob(
            String jobId,
            String destinationE164,
            String message,
            int deliveryAttempt
    ) {
    }

    private record HttpResult(
            int statusCode,
            String body
    ) {
    }
}

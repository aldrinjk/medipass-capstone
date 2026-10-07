package com.medipass.smsrelay;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsManager;
import android.text.InputType;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

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

public class MainActivity extends Activity {

    private static final int SMS_PERMISSION_REQUEST = 7001;
    private static final String ACTION_SMS_SENT =
            "com.medipass.smsrelay.SMS_SENT";

    private final ExecutorService networkExecutor =
            Executors.newSingleThreadExecutor();
    private final ScheduledExecutorService pollExecutor =
            Executors.newSingleThreadScheduledExecutor();

    private EditText apiUrlInput;
    private EditText relayKeyInput;
    private TextView statusText;
    private TextView lastSmsText;
    private Button startButton;

    private volatile boolean relayActive;
    private volatile RelayJob currentJob;
    private ScheduledFuture<?> pollFuture;

    private String apiBaseUrl;
    private String relayKey;
    private boolean startAfterPermissionGrant;

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

            if (getResultCode() == Activity.RESULT_OK) {
                updateStatus("SMS sent. Confirming delivery with MediPass…");
                networkExecutor.submit(() -> acknowledgeSent(job));
            } else {
                String error = "Android SMS send failed with result code "
                        + getResultCode();
                updateStatus(error);
                networkExecutor.submit(() -> acknowledgeFailed(job, error));
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerSmsSentReceiver();
        setContentView(buildUi());
    }

    @Override
    protected void onDestroy() {
        stopRelay();
        try {
            unregisterReceiver(smsSentReceiver);
        } catch (IllegalArgumentException ignored) {
            // Receiver was already unregistered.
        }
        networkExecutor.shutdownNow();
        pollExecutor.shutdownNow();
        super.onDestroy();
    }

    private ScrollView buildUi() {
        int padding = dp(20);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(padding, padding, padding, padding);

        TextView title = new TextView(this);
        title.setText("MediPass SMS Relay");
        title.setTextSize(26);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        content.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText(
                "Foreground-only capstone relay. This phone sends responder OTPs "
                        + "through its SIM and never receives patient clinical data."
        );
        subtitle.setTextSize(15);
        subtitle.setPadding(0, dp(8), 0, dp(22));
        content.addView(subtitle);

        content.addView(label("MediPass API URL"));
        apiUrlInput = new EditText(this);
        apiUrlInput.setHint("http://192.168.1.50:8080");
        apiUrlInput.setSingleLine(true);
        apiUrlInput.setInputType(
                InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI
        );
        content.addView(apiUrlInput);

        content.addView(label("Relay key"));
        relayKeyInput = new EditText(this);
        relayKeyInput.setHint("Enter the same SMS_RELAY_SHARED_KEY used by the API");
        relayKeyInput.setSingleLine(true);
        relayKeyInput.setInputType(
                InputType.TYPE_CLASS_TEXT
                        | InputType.TYPE_TEXT_VARIATION_PASSWORD
        );
        content.addView(relayKeyInput);

        TextView keyNote = new TextView(this);
        keyNote.setText(
                "The relay key stays in app memory only and is not saved to device storage."
        );
        keyNote.setTextSize(12);
        keyNote.setPadding(0, dp(4), 0, dp(18));
        content.addView(keyNote);

        startButton = new Button(this);
        startButton.setText("Start Relay");
        startButton.setOnClickListener(view -> {
            if (relayActive) {
                stopRelay();
            } else {
                beginRelayStart();
            }
        });
        content.addView(startButton);

        TextView statusLabel = label("Status");
        statusLabel.setPadding(0, dp(24), 0, 0);
        content.addView(statusLabel);

        statusText = new TextView(this);
        statusText.setText("Stopped");
        statusText.setTextSize(17);
        statusText.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        statusText.setPadding(0, dp(6), 0, dp(18));
        content.addView(statusText);

        TextView lastLabel = label("Last SMS");
        content.addView(lastLabel);

        lastSmsText = new TextView(this);
        lastSmsText.setText("No SMS has been sent in this session.");
        lastSmsText.setTextSize(15);
        lastSmsText.setPadding(0, dp(6), 0, dp(22));
        content.addView(lastSmsText);

        TextView instructions = new TextView(this);
        instructions.setText(
                "Demo checklist:\n"
                        + "• Keep this app open while testing.\n"
                        + "• Keep the Android phone online.\n"
                        + "• Make sure its SIM can send SMS.\n"
                        + "• On dual-SIM phones, select a default SMS SIM.\n"
                        + "• The responder can receive the OTP on Android or iPhone."
        );
        instructions.setTextSize(14);
        content.addView(instructions);

        ScrollView scrollView = new ScrollView(this);
        scrollView.addView(content);
        return scrollView;
    }

    private TextView label(String value) {
        TextView label = new TextView(this);
        label.setText(value);
        label.setTextSize(14);
        label.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        label.setPadding(0, dp(10), 0, dp(2));
        return label;
    }

    private void beginRelayStart() {
        if (checkSelfPermission(Manifest.permission.SEND_SMS)
                != PackageManager.PERMISSION_GRANTED) {
            startAfterPermissionGrant = true;
            requestPermissions(
                    new String[]{Manifest.permission.SEND_SMS},
                    SMS_PERMISSION_REQUEST
            );
            return;
        }

        startRelayAfterValidation();
    }

    private void startRelayAfterValidation() {
        String rawUrl = apiUrlInput.getText().toString().trim();
        String rawKey = relayKeyInput.getText().toString();

        if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
            updateStatus("Enter an API URL beginning with http:// or https://");
            return;
        }

        if (rawKey.length() < 32) {
            updateStatus("Relay key must be at least 32 characters.");
            return;
        }

        apiBaseUrl = trimTrailingSlash(rawUrl);
        relayKey = rawKey;

        updateStatus("Checking MediPass connection…");
        startButton.setEnabled(false);

        networkExecutor.submit(() -> {
            try {
                HttpResult result = request("GET", "/api/v1/relay/status", null);
                if (result.statusCode != 200) {
                    throw new IllegalStateException(
                            "Relay status returned HTTP " + result.statusCode
                    );
                }

                runOnUiThread(() -> {
                    relayActive = true;
                    apiUrlInput.setEnabled(false);
                    relayKeyInput.setEnabled(false);
                    startButton.setEnabled(true);
                    startButton.setText("Stop Relay");
                    getWindow().addFlags(
                            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    );
                    updateStatus("Connected ✓ Waiting for OTP requests");
                    pollFuture = pollExecutor.scheduleWithFixedDelay(
                            this::pollOnce,
                            0,
                            2,
                            TimeUnit.SECONDS
                    );
                });
            } catch (Exception ex) {
                runOnUiThread(() -> {
                    startButton.setEnabled(true);
                    updateStatus("Connection failed: " + safeMessage(ex));
                });
            }
        });
    }

    private void stopRelay() {
        relayActive = false;

        if (pollFuture != null) {
            pollFuture.cancel(true);
            pollFuture = null;
        }

        currentJob = null;

        if (startButton != null) {
            runOnUiThread(() -> {
                startButton.setText("Start Relay");
                startButton.setEnabled(true);
                apiUrlInput.setEnabled(true);
                relayKeyInput.setEnabled(true);
                updateStatus("Stopped");
                getWindow().clearFlags(
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                );
            });
        }
    }

    private void pollOnce() {
        if (!relayActive || currentJob != null) {
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

            runOnUiThread(() -> sendSms(job));
        } catch (Exception ex) {
            updateStatus("Relay polling error: " + safeMessage(ex));
        }
    }

    @SuppressWarnings("deprecation")
    private void sendSms(RelayJob job) {
        if (!relayActive || currentJob != job) {
            return;
        }

        try {
            Intent sentIntent = new Intent(ACTION_SMS_SENT)
                    .setPackage(getPackageName())
                    .putExtra("jobId", job.jobId);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent sentPendingIntent = PendingIntent.getBroadcast(
                    this,
                    job.jobId.hashCode(),
                    sentIntent,
                    flags
            );

            SmsManager.getDefault().sendTextMessage(
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
            runOnUiThread(() -> {
                lastSmsText.setText(
                        "Sent ✓  Destination ••••"
                                + lastFour(job.destinationE164)
                                + "  · attempt "
                                + job.deliveryAttempt
                );
                updateStatus("Connected ✓ Waiting for OTP requests");
            });
        } catch (Exception ex) {
            updateStatus(
                    "SMS was sent, but server acknowledgement failed. "
                            + "Keep the app open and check the API connection: "
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
            // The backend releases stale claims so a temporary acknowledgement
            // failure does not permanently lose the OTP job.
        } finally {
            currentJob = null;
            updateStatus("SMS delivery failed. Waiting for retry.");
        }
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
        connection.setConnectTimeout(7000);
        connection.setReadTimeout(7000);
        connection.setUseCaches(false);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("X-MediPass-Relay-Key", relayKey);

        if (jsonBody != null) {
            byte[] bytes = jsonBody.getBytes(StandardCharsets.UTF_8);
            connection.setDoOutput(true);
            connection.setRequestProperty(
                    "Content-Type",
                    "application/json; charset=utf-8"
            );
            connection.setFixedLengthStreamingMode(bytes.length);
            try (OutputStream output = connection.getOutputStream()) {
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
                    new InputStreamReader(stream, StandardCharsets.UTF_8)
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

    private void updateStatus(String message) {
        runOnUiThread(() -> {
            if (statusText != null) {
                statusText.setText(message);
            }
        });
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

    private int dp(int value) {
        return Math.round(
                value * getResources().getDisplayMetrics().density
        );
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(
                requestCode,
                permissions,
                grantResults
        );

        if (requestCode != SMS_PERMISSION_REQUEST) {
            return;
        }

        boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;

        if (granted && startAfterPermissionGrant) {
            startAfterPermissionGrant = false;
            startRelayAfterValidation();
        } else {
            startAfterPermissionGrant = false;
            updateStatus(
                    "SMS permission is required for this phone to act as the relay."
            );
        }
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

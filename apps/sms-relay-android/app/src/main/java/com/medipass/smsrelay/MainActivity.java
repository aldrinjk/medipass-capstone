package com.medipass.smsrelay;

import android.Manifest;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {

    private static final int SMS_PERMISSION_REQUEST = 7001;
    private static final String PUBLIC_API_URL =
            "https://medipass-api-aldrinjk.onrender.com";

    private EditText apiUrlInput;
    private EditText relayKeyInput;
    private TextView statusText;
    private TextView lastSmsText;
    private Button startButton;

    private boolean startAfterPermissionGrant;
    private String pendingUrl;
    private String pendingKey;
    private boolean statusReceiverRegistered;

    private final BroadcastReceiver statusReceiver =
            new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String status = intent.getStringExtra(
                    RelayService.EXTRA_STATUS
            );
            String lastSms = intent.getStringExtra(
                    RelayService.EXTRA_LAST_SMS
            );

            if (status != null) {
                statusText.setText(status);
            }
            if (lastSms != null) {
                lastSmsText.setText(lastSms);
            }

            refreshControls();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildUi());
        refreshFromService();
    }

    @Override
    protected void onStart() {
        super.onStart();
        registerStatusReceiver();
        refreshFromService();
    }

    @Override
    protected void onStop() {
        if (statusReceiverRegistered) {
            unregisterReceiver(statusReceiver);
            statusReceiverRegistered = false;
        }
        super.onStop();
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
                "Background capstone relay. Once connected, you can "
                        + "switch to the MediPass patient app on this same "
                        + "phone while the relay keeps sending responder OTPs."
        );
        subtitle.setTextSize(15);
        subtitle.setPadding(0, dp(8), 0, dp(22));
        content.addView(subtitle);

        content.addView(label("MediPass API URL"));
        apiUrlInput = new EditText(this);
        apiUrlInput.setText(PUBLIC_API_URL);
        apiUrlInput.setSingleLine(true);
        apiUrlInput.setInputType(
                InputType.TYPE_CLASS_TEXT
                        | InputType.TYPE_TEXT_VARIATION_URI
        );
        content.addView(apiUrlInput);

        content.addView(label("Relay key"));
        relayKeyInput = new EditText(this);
        relayKeyInput.setHint(
                "Enter the same SMS_RELAY_SHARED_KEY used by the API"
        );
        relayKeyInput.setSingleLine(true);
        relayKeyInput.setInputType(
                InputType.TYPE_CLASS_TEXT
                        | InputType.TYPE_TEXT_VARIATION_PASSWORD
        );
        content.addView(relayKeyInput);

        TextView keyNote = new TextView(this);
        keyNote.setText(
                "The relay key stays in memory only and is not saved "
                        + "to device storage."
        );
        keyNote.setTextSize(12);
        keyNote.setPadding(0, dp(4), 0, dp(18));
        content.addView(keyNote);

        startButton = new Button(this);
        startButton.setText("Start Relay");
        startButton.setOnClickListener(view -> {
            if (RelayService.isRunning()) {
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

        content.addView(label("Last SMS"));

        lastSmsText = new TextView(this);
        lastSmsText.setText(
                "No SMS has been sent in this session."
        );
        lastSmsText.setTextSize(15);
        lastSmsText.setPadding(0, dp(6), 0, dp(22));
        content.addView(lastSmsText);

        TextView instructions = new TextView(this);
        instructions.setText(
                "Demo checklist:\n"
                        + "• Tap Start Relay and wait for Connected ✓.\n"
                        + "• You may then switch to MediPass Patient.\n"
                        + "• Keep this phone online.\n"
                        + "• Make sure its SIM can send SMS.\n"
                        + "• On dual-SIM phones, select a default SMS SIM.\n"
                        + "• Do not force-stop the relay app during the demo."
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
        pendingUrl = apiUrlInput.getText().toString().trim();
        pendingKey = relayKeyInput.getText().toString();

        if (!pendingUrl.startsWith("http://")
                && !pendingUrl.startsWith("https://")) {
            statusText.setText(
                    "Enter an API URL beginning with http:// or https://"
            );
            return;
        }

        if (pendingKey.length() < 32) {
            statusText.setText(
                    "Relay key must be at least 32 characters."
            );
            return;
        }

        if (checkSelfPermission(Manifest.permission.SEND_SMS)
                != PackageManager.PERMISSION_GRANTED) {
            startAfterPermissionGrant = true;
            requestPermissions(
                    new String[]{Manifest.permission.SEND_SMS},
                    SMS_PERMISSION_REQUEST
            );
            return;
        }

        startRelayService(pendingUrl, pendingKey);
    }

    private void startRelayService(String url, String key) {
        Intent intent = new Intent(this, RelayService.class)
                .setAction(RelayService.ACTION_START)
                .putExtra(RelayService.EXTRA_API_URL, url)
                .putExtra(RelayService.EXTRA_RELAY_KEY, key);

        statusText.setText("Starting background relay…");
        startButton.setEnabled(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
    }

    private void stopRelay() {
        stopService(new Intent(this, RelayService.class));
        statusText.setText("Stopped");
        refreshControls();
    }

    private void refreshFromService() {
        statusText.setText(RelayService.getLastStatus());
        lastSmsText.setText(RelayService.getLastSms());
        refreshControls();
    }

    private void refreshControls() {
        boolean running = RelayService.isRunning();

        startButton.setEnabled(true);
        startButton.setText(running ? "Stop Relay" : "Start Relay");
        apiUrlInput.setEnabled(!running);
        relayKeyInput.setEnabled(!running);
    }

    private void registerStatusReceiver() {
        if (statusReceiverRegistered) {
            return;
        }

        IntentFilter filter =
                new IntentFilter(RelayService.ACTION_STATUS);

        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(
                    statusReceiver,
                    filter,
                    Context.RECEIVER_NOT_EXPORTED
            );
        } else {
            registerReceiver(statusReceiver, filter);
        }

        statusReceiverRegistered = true;
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
                && grantResults[0]
                == PackageManager.PERMISSION_GRANTED;

        if (granted && startAfterPermissionGrant) {
            startAfterPermissionGrant = false;
            startRelayService(pendingUrl, pendingKey);
        } else {
            startAfterPermissionGrant = false;
            statusText.setText(
                    "SMS permission is required for this phone "
                            + "to act as the relay."
            );
        }
    }
}

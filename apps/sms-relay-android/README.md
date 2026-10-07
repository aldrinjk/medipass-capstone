# MediPass Android SMS Relay

Prototype foreground-only Android transport adapter for MediPass responder OTP delivery.

## Purpose

The Spring Boot API remains responsible for generating, hashing, expiring and
verifying responder OTPs. This Android app only:

1. authenticates to the MediPass relay endpoints with a shared relay key;
2. claims the next pending SMS job;
3. sends that SMS using the Android phone's SIM;
4. reports SENT or FAILED back to the API.

The relay receives no patient clinical data.

## Demo security model

- The relay key is entered at runtime and kept in memory only.
- OTPs are short-lived and stored hashed by the backend.
- The relay queue clears the destination number/message after delivery and
  clears the OTP hash after verification/expiry.
- Five wrong responder OTP attempts lock the challenge.
- The app is intentionally foreground-only for capstone reliability. Keep the
  app open while demonstrating responder verification.
- Cleartext HTTP is permitted in this prototype so the APK can reach a laptop
  on the same Wi-Fi/hotspot. A production deployment must use HTTPS and a
  carrier-grade SMS transport.

## Build

The feature-branch CI builds a debug APK. It can also be opened directly in
Android Studio.

Minimum Android version: Android 8.0 (API 26).

## Runtime setup

Start the MediPass API with:

    RESPONDER_OTP_PROVIDER=android-relay
    SMS_RELAY_SHARED_KEY=<random secret at least 32 characters>

Enter the laptop API URL in the app, for example:

    http://192.168.1.50:8080

Enter the exact same relay key, grant the SMS permission, then tap Start Relay.

The Android phone needs:

- internet/LAN access to the API;
- an active SIM capable of sending SMS;
- a default SMS SIM selected if the device is dual-SIM.

Do not commit the relay key.

# MediPass Android SMS Relay

Android transport adapter for MediPass responder OTP delivery.

## Purpose

The Spring Boot API remains responsible for generating, hashing, expiring and
verifying responder OTPs. This Android app only:

1. authenticates to the MediPass relay endpoints with a shared relay key;
2. claims the next pending SMS job;
3. sends that SMS using the Android phone's SIM;
4. reports SENT or FAILED back to the API.

The relay receives no patient clinical data.

## Background demo mode

The relay now runs as an Android foreground service after you tap **Start Relay**.
That means the same Android phone can also run the MediPass Patient app during
the capstone demo while the relay continues polling and sending OTP SMS messages.

A persistent Android notification indicates that the relay service is active.
Do not force-stop the relay app during the demo.

The relay key is kept only in process memory. If Android terminates the relay
process or the phone is restarted, reopen the relay app, re-enter the key and
tap **Start Relay** again.

## Demo security model

- The relay key is entered at runtime and is not saved to device storage.
- OTPs are short-lived and stored hashed by the backend.
- The relay queue clears the destination number/message after delivery and
  clears the OTP hash after verification/expiry.
- Five wrong responder OTP attempts lock the challenge.
- HTTPS is used for the public capstone API.
- A production deployment should use a carrier-grade SMS provider rather than
  a personal Android relay phone.

## Build

CI builds a debug APK from `apps/sms-relay-android`.

Minimum Android version: Android 8.0 (API 26).

## Runtime setup

The public capstone API is:

    https://medipass-api-aldrinjk.onrender.com

The backend must use:

    RESPONDER_OTP_PROVIDER=android-relay
    SMS_RELAY_SHARED_KEY=<random secret at least 32 characters>

Enter the exact same relay key in the app, grant SMS permission, then tap
**Start Relay**. Wait until the app shows:

    Connected ✓ Waiting for OTP requests

You can then switch to the MediPass Patient app on the same phone.

The Android phone needs:

- internet access to the public MediPass API;
- an active SIM capable of sending SMS;
- a default SMS SIM selected if the device is dual-SIM.

Do not commit the relay key.

package com.medipass.pass;

/**
 * How responder accountability was established for a public emergency view.
 * PHONE_OTP verifies control of the supplied phone number; it does not by
 * itself prove the responder's legal name. The remaining methods are reserved
 * for stronger future identity integrations.
 */
public enum ResponderVerificationMethod {
    PHONE_OTP,
    EMERGENCY_OVERRIDE,
    AADHAAR_OFFLINE,
    ORGANIZATION_SSO,
    PASSKEY
}

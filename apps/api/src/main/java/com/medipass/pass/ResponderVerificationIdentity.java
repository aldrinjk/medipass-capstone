package com.medipass.pass;

public record ResponderVerificationIdentity(
        String responderName,
        String responderRole,
        String responderOrganization,
        String phoneLast4,
        ResponderVerificationMethod verificationMethod,
        String verificationNote
) {
}

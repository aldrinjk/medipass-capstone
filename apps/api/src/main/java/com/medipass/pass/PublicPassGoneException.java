package com.medipass.pass;

public class PublicPassGoneException extends RuntimeException {

    private final PassStatus passStatus;

    public PublicPassGoneException(PassStatus passStatus) {
        super(passStatus == PassStatus.REVOKED
                ? "Public emergency pass has been revoked."
                : "Public emergency pass has expired.");
        this.passStatus = passStatus;
    }

    public PassStatus getPassStatus() {
        return passStatus;
    }
}

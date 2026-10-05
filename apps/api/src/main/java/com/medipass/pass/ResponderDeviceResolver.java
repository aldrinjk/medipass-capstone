package com.medipass.pass;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Produces a privacy-conscious, browser-visible responder device label.
 *
 * Browsers intentionally do not expose a user's personal device name
 * (for example "Alex's iPhone"). iOS Safari also does not reliably expose
 * an exact iPhone model. This resolver therefore records only information
 * supplied by ordinary browser headers and does not attempt fingerprinting.
 */
public final class ResponderDeviceResolver {

    private static final Pattern ANDROID_MODEL = Pattern.compile(
            "Android[^;)]*;\\s*([^;)]+?)(?:\\s+Build/[^;)]+)?[;)]",
            Pattern.CASE_INSENSITIVE
    );

    private ResponderDeviceResolver() {
    }

    public static String resolve(String userAgent, String clientHintModel) {
        String ua = userAgent == null ? "" : userAgent;
        String browser = browserLabel(ua);
        String hintedModel = cleanClientHint(clientHintModel);

        if (isUsefulModel(hintedModel)) {
            return truncate(hintedModel + " · " + browser);
        }

        if (ua.contains("iPhone")) {
            return "iPhone · " + browser;
        }
        if (ua.contains("iPad")) {
            return "iPad · " + browser;
        }
        if (ua.contains("Android")) {
            Matcher matcher = ANDROID_MODEL.matcher(ua);
            if (matcher.find()) {
                String model = matcher.group(1).trim();
                if (isUsefulModel(model)) {
                    return truncate(model + " · " + browser);
                }
            }
            return "Android device · " + browser;
        }
        if (ua.contains("Windows")) {
            return "Windows device · " + browser;
        }
        if (ua.contains("Macintosh")) {
            return "Mac · " + browser;
        }
        if (ua.contains("Linux")) {
            return "Linux device · " + browser;
        }

        return "Unknown device · " + browser;
    }

    private static String browserLabel(String ua) {
        if (ua.contains("EdgiOS") || ua.contains("EdgA") || ua.contains("Edg/")) {
            return "Edge";
        }
        if (ua.contains("CriOS") || ua.contains("Chrome/")) {
            return "Chrome";
        }
        if (ua.contains("FxiOS") || ua.contains("Firefox/")) {
            return "Firefox";
        }
        if (ua.contains("OPR/") || ua.contains("Opera")) {
            return "Opera";
        }
        if (ua.contains("Safari/")) {
            return "Safari";
        }
        return "Browser";
    }

    private static String cleanClientHint(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\"", "").trim();
    }

    private static boolean isUsefulModel(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return !normalized.equals("k")
                && !normalized.equals("unknown")
                && !normalized.equals("not a brand");
    }

    private static String truncate(String value) {
        return value.length() <= 120 ? value : value.substring(0, 120);
    }
}

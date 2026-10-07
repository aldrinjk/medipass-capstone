package com.medipass.pass;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ResponderDeviceResolverTests {

    @Test
    void identifiesIphoneSafariWithoutFingerprintingExactModel() {
        String ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) "
                + "AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

        assertThat(ResponderDeviceResolver.resolve(ua, null))
                .isEqualTo("iPhone · Safari");
    }

    @Test
    void usesAndroidModelWhenBrowserExposesIt() {
        String ua = "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007) "
                + "AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36";

        assertThat(ResponderDeviceResolver.resolve(ua, null))
                .isEqualTo("SM-S918B · Chrome");
    }

    @Test
    void prefersClientHintModelWhenAvailable() {
        assertThat(ResponderDeviceResolver.resolve(
                "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
                "\"Pixel 9 Pro\""
        )).isEqualTo("Pixel 9 Pro · Chrome");
    }
}

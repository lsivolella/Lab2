package com.lucas.rentacar.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

class ImageTypeTests {

    @Test
    void detectsSupportedFormatsFromTheirFirstBytes() {
        byte[] jpeg = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0 };
        byte[] png = { (byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0 };
        byte[] webp = "RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1);

        assertThat(ImageType.detect(jpeg)).contains(ImageType.JPEG);
        assertThat(ImageType.detect(png)).contains(ImageType.PNG);
        assertThat(ImageType.detect(webp)).contains(ImageType.WEBP);
    }

    @Test
    void rejectsOtherContentEvenWithAnImageName() {
        byte[] text = "not an image".getBytes(StandardCharsets.UTF_8);
        byte[] gif = "GIF89a".getBytes(StandardCharsets.US_ASCII);
        byte[] riffNotWebp = "RIFF\0\0\0\0WAVE".getBytes(StandardCharsets.ISO_8859_1);

        assertThat(ImageType.detect(text)).isEmpty();
        assertThat(ImageType.detect(gif)).isEmpty();
        assertThat(ImageType.detect(riffNotWebp)).isEmpty();
        assertThat(ImageType.detect(new byte[0])).isEmpty();
    }
}

package com.lucas.rentacar.service;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;

/**
 * Image formats accepted for car photos. The format is detected from the
 * file's first bytes ("magic numbers"), not from the name or the content type
 * sent by the browser, which the client controls.
 */
public enum ImageType {
    JPEG("image/jpeg", "jpg"),
    PNG("image/png", "png"),
    WEBP("image/webp", "webp");

    private static final byte[] JPEG_SIGNATURE = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF };
    private static final byte[] PNG_SIGNATURE = {
            (byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n' };
    private static final byte[] RIFF = "RIFF".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] WEBP_TAG = "WEBP".getBytes(StandardCharsets.US_ASCII);

    private final String contentType;
    private final String extension;

    ImageType(String contentType, String extension) {
        this.contentType = contentType;
        this.extension = extension;
    }

    public String contentType() {
        return contentType;
    }

    public String extension() {
        return extension;
    }

    public static Optional<ImageType> detect(byte[] bytes) {
        if (startsWith(bytes, 0, JPEG_SIGNATURE)) {
            return Optional.of(JPEG);
        }

        if (startsWith(bytes, 0, PNG_SIGNATURE)) {
            return Optional.of(PNG);
        }

        // RIFF....WEBP: bytes 4-7 hold the chunk size.
        if (startsWith(bytes, 0, RIFF) && startsWith(bytes, 8, WEBP_TAG)) {
            return Optional.of(WEBP);
        }

        return Optional.empty();
    }

    private static boolean startsWith(byte[] bytes, int offset, byte[] prefix) {
        return bytes.length >= offset + prefix.length
                && Arrays.equals(bytes, offset, offset + prefix.length, prefix, 0, prefix.length);
    }
}

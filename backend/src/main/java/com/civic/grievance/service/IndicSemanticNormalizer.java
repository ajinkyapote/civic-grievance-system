package com.civic.grievance.service;

import org.springframework.stereotype.Service;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class IndicSemanticNormalizer {

    private static final Map<String, String> INDIC_TO_ENGLISH = new LinkedHashMap<>();

    static {
        // Marathi & Hindi Civic Vocabulary
        INDIC_TO_ENGLISH.put("खड्डा", "pothole road crater");
        INDIC_TO_ENGLISH.put("खड्डे", "potholes road damage");
        INDIC_TO_ENGLISH.put("गड्ढा", "pothole road crater");
        INDIC_TO_ENGLISH.put("गड्ढे", "potholes road damage");
        INDIC_TO_ENGLISH.put("रस्ता", "road street asphalt");
        INDIC_TO_ENGLISH.put("सड़क", "road street asphalt");
        INDIC_TO_ENGLISH.put("पाणी", "water pipeline leak supply");
        INDIC_TO_ENGLISH.put("पानी", "water pipeline leak supply");
        INDIC_TO_ENGLISH.put("गळती", "leakage burst pipe");
        INDIC_TO_ENGLISH.put("रिसाव", "leakage burst pipe");
        INDIC_TO_ENGLISH.put("कचरा", "garbage waste trash dump");
        INDIC_TO_ENGLISH.put("गंदगी", "garbage filth sanitation");
        INDIC_TO_ENGLISH.put("गटार", "drainage sewer overflow");
        INDIC_TO_ENGLISH.put("नाला", "drain sewer overflow");
        INDIC_TO_ENGLISH.put("दिवा", "streetlight lamp light");
        INDIC_TO_ENGLISH.put("बत्ती", "streetlight lamp light");
        INDIC_TO_ENGLISH.put("वीज", "electricity power outage wire");
        INDIC_TO_ENGLISH.put("बिजली", "electricity power outage wire");
        INDIC_TO_ENGLISH.put("तार", "live wire cable hazard");
        // Gujarati, Kannada, Tamil, Telugu, Bengali Core Terms
        INDIC_TO_ENGLISH.put("ખાડો", "pothole road crater");
        INDIC_TO_ENGLISH.put("પાણી", "water pipeline leak");
        INDIC_TO_ENGLISH.put("કચરો", "garbage waste trash");
        INDIC_TO_ENGLISH.put("ಗುಂಡಿ", "pothole road crater");
        INDIC_TO_ENGLISH.put("ನೀರು", "water pipeline leak");
        INDIC_TO_ENGLISH.put("ಕಸ", "garbage waste trash");
        INDIC_TO_ENGLISH.put("குழி", "pothole road crater");
        INDIC_TO_ENGLISH.put("தண்ணீர்", "water pipeline leak");
        INDIC_TO_ENGLISH.put("குப்பை", "garbage waste trash");
        INDIC_TO_ENGLISH.put("గుంత", "pothole road crater");
        INDIC_TO_ENGLISH.put("నీరు", "water pipeline leak");
        INDIC_TO_ENGLISH.put("చెత్త", "garbage waste trash");
        INDIC_TO_ENGLISH.put("গর্ত", "pothole road crater");
        INDIC_TO_ENGLISH.put("জল", "water pipeline leak");
        INDIC_TO_ENGLISH.put("আবর্জনা", "garbage waste trash");
    }

    public String normalizeToCanonicalEnglish(String rawText) {
        if (rawText == null || rawText.isBlank()) return "";
        String enriched = rawText;
        for (Map.Entry<String, String> entry : INDIC_TO_ENGLISH.entrySet()) {
            if (enriched.contains(entry.getKey())) {
                enriched = enriched + " " + entry.getValue();
            }
        }
        return enriched;
    }
}

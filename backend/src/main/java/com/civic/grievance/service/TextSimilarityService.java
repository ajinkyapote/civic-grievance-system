package com.civic.grievance.service;

import org.apache.commons.text.similarity.CosineSimilarity;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TextSimilarityService {

    private static final Set<String> STOP_WORDS = Set.of(
        "a", "an", "the", "is", "are", "was", "were", "in", "on", "at", "to", "for",
        "of", "with", "and", "or", "but", "near", "by", "from", "there", "this", "that",
        "very", "huge", "big", "small", "please", "fix", "issue", "problem", "complaint"
    );

    private final CosineSimilarity cosineSimilarity = new CosineSimilarity();

    public double computeCosineSimilarity(String text1, String text2) {
        Map<CharSequence, Integer> vec1 = buildTermVector(text1);
        Map<CharSequence, Integer> vec2 = buildTermVector(text2);
        if (vec1.isEmpty() || vec2.isEmpty()) {
            return 0.0;
        }
        Double score = cosineSimilarity.cosineSimilarity(vec1, vec2);
        return score != null ? score : 0.0;
    }

    public List<String> getMatchedKeywords(String text1, String text2) {
        Set<CharSequence> tokens1 = buildTermVector(text1).keySet();
        Set<CharSequence> tokens2 = buildTermVector(text2).keySet();
        return tokens1.stream()
            .filter(tokens2::contains)
            .map(CharSequence::toString)
            .sorted()
            .toList();
    }

    private Map<CharSequence, Integer> buildTermVector(String text) {
        Map<CharSequence, Integer> freq = new HashMap<>();
        if (text == null || text.isBlank()) {
            return freq;
        }
        String[] tokens = text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+");
        for (String token : tokens) {
            if (token.length() > 2 && !STOP_WORDS.contains(token)) {
                freq.merge(token, 1, Integer::sum);
            }
        }
        return freq;
    }
}

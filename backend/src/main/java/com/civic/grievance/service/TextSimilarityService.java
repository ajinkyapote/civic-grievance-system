package com.civic.grievance.service;

import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.repository.MasterIssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class TextSimilarityService {

    private final MasterIssueRepository masterIssueRepository;

    private static final Set<String> STOP_WORDS = Set.of(
        "a", "an", "the", "is", "are", "was", "were", "in", "on", "at", "to", "for",
        "of", "with", "and", "or", "but", "near", "by", "from", "there", "this", "that",
        "very", "huge", "big", "small", "please", "fix", "issue", "problem", "complaint",
        "causing", "outside", "main", "area", "side"
    );

    private static final Map<String, String> DOMAIN_SYNONYMS = Map.ofEntries(
        Map.entry("crater", "pothole"),
        Map.entry("pit", "pothole"),
        Map.entry("ditch", "pothole"),
        Map.entry("cavity", "pothole"),
        Map.entry("trash", "garbage"),
        Map.entry("rubbish", "garbage"),
        Map.entry("waste", "garbage"),
        Map.entry("dump", "garbage"),
        Map.entry("heap", "garbage"),
        Map.entry("burst", "leakage"),
        Map.entry("gushing", "leakage"),
        Map.entry("leaking", "leakage"),
        Map.entry("pipe", "pipeline"),
        Map.entry("wires", "wire"),
        Map.entry("cable", "wire"),
        Map.entry("sparking", "livewire"),
        Map.entry("exposed", "livewire"),
        Map.entry("streetlight", "light"),
        Map.entry("lamp", "light")
    );

    public double computeCosineSimilarity(String text1, String text2) {
        List<MasterIssue> corpus = masterIssueRepository.findAll();
        Map<String, Double> vec1 = buildTfIdfVector(text1, corpus);
        Map<String, Double> vec2 = buildTfIdfVector(text2, corpus);

        if (vec1.isEmpty() || vec2.isEmpty()) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (double v : vec1.values()) norm1 += v * v;
        for (double v : vec2.values()) norm2 += v * v;

        for (Map.Entry<String, Double> entry : vec1.entrySet()) {
            Double otherVal = vec2.get(entry.getKey());
            if (otherVal != null) {
                dotProduct += entry.getValue() * otherVal;
            }
        }

        if (norm1 == 0.0 || norm2 == 0.0) return 0.0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    public List<String> getMatchedKeywords(String text1, String text2) {
        Set<String> tokens1 = tokenizeCanonical(text1).keySet();
        Set<String> tokens2 = tokenizeCanonical(text2).keySet();
        return tokens1.stream()
            .filter(tokens2::contains)
            .sorted()
            .toList();
    }

    private Map<String, Double> buildTfIdfVector(String text, List<MasterIssue> corpus) {
        Map<String, Integer> tf = tokenizeCanonical(text);
        Map<String, Double> tfidf = new HashMap<>();
        int totalDocs = Math.max(1, corpus.size() + 1);

        for (Map.Entry<String, Integer> entry : tf.entrySet()) {
            String term = entry.getKey();
            long docFreq = 1; // Laplace smoothing
            for (MasterIssue doc : corpus) {
                String combined = (doc.getTitle() + " " + doc.getDescription()).toLowerCase();
                if (combined.contains(term)) {
                    docFreq++;
                }
            }
            double idf = 1.0 + Math.log((double) totalDocs / docFreq);
            tfidf.put(term, entry.getValue() * idf);
        }
        return tfidf;
    }

    private Map<String, Integer> tokenizeCanonical(String text) {
        Map<String, Integer> freq = new HashMap<>();
        if (text == null || text.isBlank()) return freq;

        String[] rawTokens = text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+");
        for (String raw : rawTokens) {
            if (raw.length() <= 2 || STOP_WORDS.contains(raw)) continue;
            String canonical = DOMAIN_SYNONYMS.getOrDefault(raw, raw);
            freq.merge(canonical, 1, Integer::sum);
        }
        return freq;
    }
}

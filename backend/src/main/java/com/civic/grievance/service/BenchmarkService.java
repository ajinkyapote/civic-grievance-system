package com.civic.grievance.service;

import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.util.GeoUtils;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class BenchmarkService {

    private final TextSimilarityService textSimilarityService;

    @Data
    @Builder
    public static class ThresholdExperimentResult {
        private double radiusMeters;
        private double similarityThreshold;
        private int totalSimulatedComplaints;
        private int groundTruthClusters;
        private int predictedClusters;
        private double ticketReductionPercent;
        private double precision;
        private double recall;
        private double f1Score;
        private long executionTimeMs;
    }

    private record SyntheticComplaint(
        int groundTruthClusterId,
        MasterIssue.Category category,
        String text,
        double lat,
        double lng
    ) {}

    /**
     * Runs a grid search across radius limits (25m, 50m, 100m) and similarity thresholds (0.40, 0.65, 0.80)
     * on 500 synthetic urban complaints (200 unique + 300 paraphrased duplicates with GPS drift).
     */
    public List<ThresholdExperimentResult> runGridSearchBenchmark() {
        List<SyntheticComplaint> dataset = generateSyntheticDataset(200, 300);

        double[] radii = {25.0, 50.0, 100.0};
        double[] thresholds = {0.40, 0.65, 0.80};

        List<ThresholdExperimentResult> results = new ArrayList<>();
        for (double radius : radii) {
            for (double threshold : thresholds) {
                results.add(evaluateConfiguration(dataset, radius, threshold));
            }
        }
        return results;
    }

    private ThresholdExperimentResult evaluateConfiguration(
            List<SyntheticComplaint> dataset, double radiusLimit, double simThreshold) {

        long startTime = System.currentTimeMillis();
        List<SyntheticComplaint> clusterHeads = new ArrayList<>();
        List<Integer> predictedClusterAssignment = new ArrayList<>();

        for (SyntheticComplaint incoming : dataset) {
            int matchedClusterIdx = -1;
            double bestSim = 0.0;

            for (int i = 0; i < clusterHeads.size(); i++) {
                SyntheticComplaint head = clusterHeads.get(i);
                if (head.category() != incoming.category()) continue;

                double dist = GeoUtils.calculateHaversineDistance(
                    incoming.lat(), incoming.lng(), head.lat(), head.lng()
                );

                if (dist <= radiusLimit) {
                    double sim = textSimilarityService.computeCosineSimilarity(incoming.text(), head.text());
                    if (sim >= simThreshold && sim > bestSim) {
                        bestSim = sim;
                        matchedClusterIdx = i;
                    }
                }
            }

            if (matchedClusterIdx != -1) {
                predictedClusterAssignment.add(matchedClusterIdx);
            } else {
                clusterHeads.add(incoming);
                predictedClusterAssignment.add(clusterHeads.size() - 1);
            }
        }

        // Pairwise Precision, Recall & F1 across all N*(N-1)/2 complaint pairs
        long tp = 0, fp = 0, fn = 0;
        int n = dataset.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                boolean sameGroundTruth = dataset.get(i).groundTruthClusterId() == dataset.get(j).groundTruthClusterId();
                boolean samePredicted = Objects.equals(predictedClusterAssignment.get(i), predictedClusterAssignment.get(j));

                if (sameGroundTruth && samePredicted) tp++;
                else if (!sameGroundTruth && samePredicted) fp++;
                else if (sameGroundTruth && !samePredicted) fn++;
            }
        }

        double precision = (tp + fp) > 0 ? (double) tp / (tp + fp) : 0.0;
        double recall = (tp + fn) > 0 ? (double) tp / (tp + fn) : 0.0;
        double f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0.0;
        double reduction = ((n - clusterHeads.size()) * 100.0) / n;
        long elapsed = System.currentTimeMillis() - startTime;

        return ThresholdExperimentResult.builder()
            .radiusMeters(radiusLimit)
            .similarityThreshold(simThreshold)
            .totalSimulatedComplaints(n)
            .groundTruthClusters(200)
            .predictedClusters(clusterHeads.size())
            .ticketReductionPercent(round(reduction))
            .precision(round(precision * 100))
            .recall(round(recall * 100))
            .f1Score(round(f1 * 100))
            .executionTimeMs(elapsed)
            .build();
    }

    private List<SyntheticComplaint> generateSyntheticDataset(int uniqueCount, int duplicateCount) {
        Random rand = new Random(42); // Fixed seed for reproducible research paper metrics
        List<SyntheticComplaint> list = new ArrayList<>();

        String[][] templates = {
            {"ROADS", "Deep pothole near main road causing traffic jam", "Large dangerous pothole on main road blocking traffic"},
            {"WATER", "Burst water pipeline leaking clean drinking water on street", "Broken water supply pipe overflowing on road"},
            {"ELECTRICITY", "Streetlight pole sparking and electric wires hanging low", "Dangerous hanging electrical cables and broken street lamp"},
            {"SANITATION", "Overflowing garbage bin emitting foul smell near market", "Uncollected trash pile rotting outside market road"},
            {"ROADS", "Broken manhole cover open on footpath hazard", "Missing drainage lid open hole on pedestrian walkway"}
        };

        // 1. Generate 200 distinct urban issues spaced across grid (~120m apart so distinct issues don't overlap)
        double baseLat = 19.0178;
        double baseLng = 73.0991;

        for (int c = 0; c < uniqueCount; c++) {
            String[] tpl = templates[c % templates.length];
            MasterIssue.Category cat = MasterIssue.Category.valueOf(tpl[0]);
            double lat = baseLat + (c / 15) * 0.0012;
            double lng = baseLng + (c % 15) * 0.0012;
            list.add(new SyntheticComplaint(c, cat, tpl[1] + " sector " + c, lat, lng));
        }

        // 2. Generate 300 paraphrased duplicates with 5m-40m GPS drift
        for (int d = 0; d < duplicateCount; d++) {
            int targetCluster = d % uniqueCount;
            SyntheticComplaint origin = list.get(targetCluster);
            String[] tpl = templates[targetCluster % templates.length];

            // ~0.00018 deg is roughly 20 meters
            double latJitter = (rand.nextDouble() - 0.5) * 0.00035;
            double lngJitter = (rand.nextDouble() - 0.5) * 0.00035;

            list.add(new SyntheticComplaint(
                targetCluster,
                origin.category(),
                tpl[2] + " sector " + targetCluster,
                origin.lat() + latJitter,
                origin.lng() + lngJitter
            ));
        }

        Collections.shuffle(list, rand);
        return list;
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
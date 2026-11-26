package com.civic.grievance;

import com.civic.grievance.repository.MasterIssueRepository;
import com.civic.grievance.service.TextSimilarityService;
import com.civic.grievance.util.GeoUtils;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DeduplicationEngineTest {

    @Test
    void testHaversineSpatialGateAccuracy() {
        // Two points ~18 meters apart near Station Road
        double distClose = GeoUtils.calculateHaversineDistance(19.0178, 73.0991, 19.01792, 73.09921);
        assertTrue(distClose < 50.0, "Expected distance under 50m spatial gate, got: " + distClose);

        // Two points ~250 meters apart
        double distFar = GeoUtils.calculateHaversineDistance(19.0178, 73.0991, 19.0200, 73.0991);
        assertTrue(distFar > 50.0, "Expected distance over 50m spatial gate, got: " + distFar);
    }

    @Test
    void testDomainSynonymAndTfIdfCosineSimilarity() {
        MasterIssueRepository mockRepo = Mockito.mock(MasterIssueRepository.class);
        Mockito.when(mockRepo.findAll()).thenReturn(List.of());

        TextSimilarityService service = new TextSimilarityService(mockRepo);
        double similarity = service.computeCosineSimilarity(
            "Deep pothole on Station Road damaging vehicles",
            "Huge crater on Station Road blocking traffic"
        );

        assertTrue(similarity >= 0.65, "Synonym canonicalization (crater -> pothole) should exceed 0.65 threshold, got: " + similarity);
    }
}

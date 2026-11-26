package com.civic.grievance.controller;

import com.civic.grievance.service.AuditChainService;
import com.civic.grievance.service.IndicSemanticNormalizer;
import com.civic.grievance.service.MultimodalTriageService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class LiveStreamController {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final AuditChainService auditChainService;
    private final IndicSemanticNormalizer indicNormalizer;
    private final MultimodalTriageService triageService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event()
                .name("CONNECTED")
                .data(Map.of("status", "LIVE_ICCC_STREAM_ACTIVE", "timestamp", Instant.now().toString())));
        } catch (IOException ignored) {}
        return emitter;
    }

    public void broadcast(String eventType, Object payload) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventType).data(payload));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    @GetMapping("/audit-ledger")
    public ResponseEntity<?> getAuditLedger() {
        return ResponseEntity.ok(Map.of(
            "chainValid", auditChainService.verifyChainIntegrity(),
            "blocks", auditChainService.getRecentBlocks(25)
        ));
    }

    @Data
    public static class WhatsAppWebhookPayload {
        private String senderPhone;
        private String messageText;
        private Double latitude;
        private Double longitude;
    }

    @PostMapping("/webhooks/messaging")
    public ResponseEntity<?> ingestMessagingBot(@RequestBody WhatsAppWebhookPayload payload) {
        String normalized = indicNormalizer.normalizeToCanonicalEnglish(payload.getMessageText());
        var triage = triageService.analyzeSubmission(payload.getMessageText(), normalized, "AUTO", null);
        var block = auditChainService.recordEvent("BOT-" + System.currentTimeMillis() % 10000,
            "WHATSAPP_INTAKE_" + triage.getInferredCategory(), payload.getSenderPhone());
        broadcast("BOT_INTAKE", Map.of(
            "sender", payload.getSenderPhone(),
            "category", triage.getInferredCategory(),
            "hazard", triage.isCriticalSafetyHazard(),
            "hash", block.getCurrentHash().substring(0, 12)
        ));
        return ResponseEntity.ok(Map.of(
            "status", "ACCEPTED",
            "normalizedEnglish", normalized,
            "triage", triage,
            "auditBlockHash", block.getCurrentHash()
        ));
    }
}

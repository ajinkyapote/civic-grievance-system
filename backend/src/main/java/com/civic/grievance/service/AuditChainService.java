package com.civic.grievance.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class AuditChainService {

    @Data
    @Builder
    @AllArgsConstructor
    public static class AuditBlock {
        private long index;
        private String timestamp;
        private String ticketCode;
        private String action;
        private String actor;
        private String previousHash;
        private String currentHash;
    }

    private final List<AuditBlock> chain = new CopyOnWriteArrayList<>();

    public AuditChainService() {
        recordEvent("GENESIS", "SYSTEM_BOOT", "ICCC_KERNEL", "00000000000000000000000000000000");
    }

    public synchronized AuditBlock recordEvent(String ticketCode, String action, String actor) {
        String prevHash = chain.isEmpty()
            ? "00000000000000000000000000000000"
            : chain.get(chain.size() - 1).getCurrentHash();
        return recordEvent(ticketCode, action, actor, prevHash);
    }

    private AuditBlock recordEvent(String ticketCode, String action, String actor, String prevHash) {
        long idx = chain.size();
        String ts = Instant.now().toString();
        String payload = idx + "|" + ts + "|" + ticketCode + "|" + action + "|" + actor + "|" + prevHash;
        String hash = sha256(payload);
        AuditBlock block = AuditBlock.builder()
            .index(idx)
            .timestamp(ts)
            .ticketCode(ticketCode)
            .action(action)
            .actor(actor)
            .previousHash(prevHash)
            .currentHash(hash)
            .build();
        chain.add(block);
        return block;
    }

    public List<AuditBlock> getRecentBlocks(int limit) {
        List<AuditBlock> copy = new ArrayList<>(chain);
        Collections.reverse(copy);
        return copy.subList(0, Math.min(limit, copy.size()));
    }

    public boolean verifyChainIntegrity() {
        for (int i = 1; i < chain.size(); i++) {
            AuditBlock prev = chain.get(i - 1);
            AuditBlock curr = chain.get(i);
            if (!curr.getPreviousHash().equals(prev.getCurrentHash())) {
                return false;
            }
            String expected = sha256(curr.getIndex() + "|" + curr.getTimestamp() + "|" + curr.getTicketCode()
                + "|" + curr.getAction() + "|" + curr.getActor() + "|" + curr.getPreviousHash());
            if (!expected.equals(curr.getCurrentHash())) {
                return false;
            }
        }
        return true;
    }

    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return "HASH_ERROR";
        }
    }
}

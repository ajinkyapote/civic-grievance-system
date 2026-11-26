package com.civic.grievance.controller;

import com.civic.grievance.dto.AnalyticsResponse;
import com.civic.grievance.dto.IssueReportRequest;
import com.civic.grievance.dto.IssueReportResponse;
import com.civic.grievance.entity.IssueLog;
import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.entity.User;
import com.civic.grievance.repository.ComplaintReportRepository;
import com.civic.grievance.repository.IssueLogRepository;
import com.civic.grievance.repository.MasterIssueRepository;
import com.civic.grievance.repository.UserRepository;
import com.civic.grievance.repository.WardRepository;
import com.civic.grievance.service.BenchmarkService;
import com.civic.grievance.service.DeduplicationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final MasterIssueRepository masterIssueRepository;
    private final ComplaintReportRepository complaintReportRepository;
    private final IssueLogRepository issueLogRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final PasswordEncoder passwordEncoder;
    private final BenchmarkService benchmarkService;
    private final DeduplicationService deduplicationService;

    @Data
    public static class CreateStaffRequest {
        private String name;
        private String email;
        private String password;
        private User.Role role;
        private User.Department department;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createStaffAccount(@RequestBody CreateStaffRequest req) {
        User staff = User.builder()
            .name(req.getName())
            .email(req.getEmail())
            .passwordHash(passwordEncoder.encode(req.getPassword()))
            .role(req.getRole())
            .department(req.getDepartment())
            .active(true)
            .build();
        return ResponseEntity.ok(userRepository.save(staff));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<String> exportComplianceCsv() {
        List<MasterIssue> all = masterIssueRepository.findAllByOrderBySeverityScoreDesc();
        StringBuilder sb = new StringBuilder();
        sb.append("TicketCode,Ward,Category,Title,Status,Escalation,Duplicates,SeverityScore,AssignedEngineer,SLADeadline\n");
        for (MasterIssue m : all) {
            sb.append(String.format("%s,\"%s\",%s,\"%s\",%s,%s,%d,%.2f,\"%s\",%s\n",
                m.getTicketCode(),
                m.getWard() != null ? m.getWard().getWardName() : "Central",
                m.getCategory(),
                m.getTitle().replace("\"", "'"),
                m.getStatus(),
                m.getEscalationLevel(),
                m.getDuplicateCount(),
                m.getSeverityScore(),
                m.getAssignedTo() != null ? m.getAssignedTo().getName() : "Unassigned",
                m.getSlaDeadline()
            ));
        }
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=civic-grievance-rti-audit.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(sb.toString());
    }

    @GetMapping("/ward-scorecards")
    public ResponseEntity<?> getWardScorecards() {
        var allIssues = masterIssueRepository.findAll();
        var now = LocalDateTime.now();

        var scorecards = wardRepository.findAll().stream().map(w -> {
            var wardIssues = allIssues.stream()
                .filter(i -> i.getWard() != null && i.getWard().getId().equals(w.getId()))
                .toList();

            long total = wardIssues.size();
            long resolved = wardIssues.stream()
                .filter(i -> i.getStatus() == MasterIssue.Status.RESOLVED || i.getStatus() == MasterIssue.Status.CLOSED)
                .count();
            long slaBreached = wardIssues.stream()
                .filter(i -> i.getStatus() != MasterIssue.Status.RESOLVED
                          && i.getStatus() != MasterIssue.Status.CLOSED
                          && i.getSlaDeadline() != null
                          && now.isAfter(i.getSlaDeadline()))
                .count();
            double avgRating = wardIssues.stream()
                .filter(i -> i.getCitizenRating() != null)
                .mapToInt(MasterIssue::getCitizenRating)
                .average()
                .orElse(0.0);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("wardCode", w.getWardCode());
            row.put("wardName", w.getWardName());
            row.put("zoneName", w.getZoneName());
            row.put("totalTickets", total);
            row.put("resolvedTickets", resolved);
            row.put("slaBreached", slaBreached);
            row.put("resolutionRate", total > 0 ? Math.round((resolved * 1000.0) / total) / 10.0 : 100.0);
            row.put("avgCitizenRating", Math.round(avgRating * 10.0) / 10.0);
            return row;
        }).toList();

        return ResponseEntity.ok(scorecards);
    }

    @GetMapping("/predictive-insights")
    public ResponseEntity<?> getPredictiveInsights() {
        var allIssues = masterIssueRepository.findAll();
        var insights = new java.util.ArrayList<>();

        for (var ward : wardRepository.findAll()) {
            var wardIssues = allIssues.stream()
                .filter(i -> i.getWard() != null && i.getWard().getId().equals(ward.getId()))
                .toList();

            if (wardIssues.isEmpty()) continue;

            var topCategoryEntry = wardIssues.stream()
                .collect(Collectors.groupingBy(m -> m.getCategory().name(), Collectors.summingInt(MasterIssue::getDuplicateCount)))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

            if (topCategoryEntry != null) {
                String dept = topCategoryEntry.getKey();
                int volume = topCategoryEntry.getValue();
                String riskLevel = volume >= 4 ? "HIGH_INFRASTRUCTURE_STRESS" : volume >= 2 ? "MODERATE_RECURRING" : "STABLE";
                String recommendation = switch (dept) {
                    case "ROADS" -> "Schedule preventive asphalt resurfacing & drainage inspection in " + ward.getWardName();
                    case "WATER" -> "Conduct ultrasonic pipeline pressure audit & valve replacement in " + ward.getWardName();
                    case "ELECTRICITY" -> "Deploy underground cabling & transformer load-balance check in " + ward.getWardName();
                    case "SANITATION" -> "Increase daily compactor frequency & install high-capacity smart bins in " + ward.getWardName();
                    default -> "Allocate routine ward inspection crew in " + ward.getWardName();
                };

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("wardCode", ward.getWardCode());
                item.put("wardName", ward.getWardName());
                item.put("primaryStressDept", dept);
                item.put("citizenImpactVolume", volume);
                item.put("riskLevel", riskLevel);
                item.put("recommendedAction", recommendation);
                insights.add(item);
            }
        }

        return ResponseEntity.ok(insights);
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getResearchAnalytics() {
        long rawCount = complaintReportRepository.count();
        List<MasterIssue> allMasters = masterIssueRepository.findAll();
        long uniqueCount = allMasters.size();
        long duplicatesEliminated = Math.max(0, rawCount - uniqueCount);
        double dedupRate = rawCount > 0 ? Math.round((duplicatesEliminated * 10000.0) / rawCount) / 100.0 : 0.0;

        Map<String, Long> byCategory = allMasters.stream()
            .collect(Collectors.groupingBy(m -> m.getCategory().name(), Collectors.counting()));

        Map<String, Long> byStatus = allMasters.stream()
            .collect(Collectors.groupingBy(m -> m.getStatus().name(), Collectors.counting()));

        return ResponseEntity.ok(AnalyticsResponse.builder()
            .totalRawComplaints(rawCount)
            .uniqueMasterIssues(uniqueCount)
            .duplicatesEliminated(duplicatesEliminated)
            .deduplicationRatePercent(dedupRate)
            .issuesByCategory(byCategory)
            .issuesByStatus(byStatus)
            .build());
    }

    @GetMapping("/benchmark")
    public ResponseEntity<List<BenchmarkService.ThresholdExperimentResult>> runResearchBenchmark() {
        return ResponseEntity.ok(benchmarkService.runGridSearchBenchmark());
    }

    @PostMapping("/auto-dispatch")
    public ResponseEntity<?> autoDispatchOpenTickets(@AuthenticationPrincipal User admin) {
        List<MasterIssue> openTickets = masterIssueRepository.findByStatusInOrderBySeverityScoreDesc(
            List.of(MasterIssue.Status.OPEN, MasterIssue.Status.REOPENED)
        );
        List<User> allUsers = userRepository.findAll();
        int dispatched = 0;

        for (MasterIssue ticket : openTickets) {
            if (ticket.getCategory() == MasterIssue.Category.OTHER) continue;
            User.Department dept = User.Department.valueOf(ticket.getCategory().name());

            List<User> engineers = allUsers.stream()
                .filter(u -> Boolean.TRUE.equals(u.getActive()) && u.getRole() == User.Role.FIELD_ENGINEER && u.getDepartment() == dept)
                .toList();

            if (engineers.isEmpty()) continue;

            User leastLoaded = engineers.stream()
                .min(Comparator.comparingInt(eng ->
                    masterIssueRepository.findByAssignedToIdOrderBySeverityScoreDesc(eng.getId()).size()
                ))
                .orElse(engineers.get(0));

            MasterIssue.Status oldStatus = ticket.getStatus();
            ticket.setAssignedTo(leastLoaded);
            ticket.setStatus(MasterIssue.Status.ASSIGNED);
            masterIssueRepository.save(ticket);

            User actor = admin != null ? admin : leastLoaded;
            issueLogRepository.save(IssueLog.builder()
                .masterIssue(ticket)
                .actor(actor)
                .oldStatus(oldStatus)
                .newStatus(MasterIssue.Status.ASSIGNED)
                .remarks("Auto-dispatched to " + leastLoaded.getName() + " via Load-Balanced AI Scheduler")
                .build());

            dispatched++;
        }

        return ResponseEntity.ok(Map.of("dispatchedCount", dispatched));
    }

    @PostMapping("/seed-demo")
    public ResponseEntity<?> seedDemoData() {
        String[][] samples = {
            {"ROADS", "Deep pothole near Station Road", "Large dangerous pothole on main road outside railway station", "19.0178", "73.0991"},
            {"ROADS", "Big pit outside railway station", "Dangerous pothole blocking traffic near station road", "19.0179", "73.0992"},
            {"ROADS", "Huge crater on Station Road", "Deep pothole damaging vehicles near station entrance", "19.0177", "73.0990"},
            {"WATER", "Burst water pipe near Sector 4 Market", "Clean drinking water gushing out from broken main pipeline", "19.0195", "73.1010"},
            {"WATER", "Water pipeline leakage at Sector 4", "Broken water pipe flooding Sector 4 market road", "19.0196", "73.1011"},
            {"ELECTRICITY", "Exposed live wire on Bus Depot pole", "Dangerous sparking electrical wires hanging low near bus depot", "19.0160", "73.0975"},
            {"SANITATION", "Overflowing garbage dump near School Gate", "Uncollected rotting trash pile creating health hazard near school", "19.0210", "73.0980"},
            {"SANITATION", "Garbage bin overflowing outside school", "Foul smelling trash heap blocking footpath at school gate", "19.0211", "73.0981"}
        };

        int created = 0;
        int merged = 0;
        for (String[] s : samples) {
            IssueReportRequest req = new IssueReportRequest();
            req.setCategory(MasterIssue.Category.valueOf(s[0]));
            req.setTitle(s[1]);
            req.setDescription(s[2]);
            req.setLatitude(Double.parseDouble(s[3]));
            req.setLongitude(Double.parseDouble(s[4]));
            IssueReportResponse res = deduplicationService.processComplaint(req);
            if ("MERGED".equals(res.getAction())) {
                merged++;
            } else {
                created++;
            }
        }
        return ResponseEntity.ok(Map.of("createdMasterTickets", created, "mergedDuplicates", merged));
    }
}

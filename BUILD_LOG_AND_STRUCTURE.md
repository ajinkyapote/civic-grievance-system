civic-grievance-system/
├── BUILD_LOG_AND_STRUCTURE.md
├── SYSTEM_ARCHITECTURE.md
├── PROJECT_TRACKER.md
│
├── backend/                                      # Java 21 + Spring Boot + MySQL
│   ├── pom.xml                                   # Maven config (+ commons-text, jjwt)
│   └── src/main/
│       ├── java/com/civic/grievance/
│       │   ├── GrievanceBackendApplication.java
│       │   ├── config/
│       │   │   ├── SecurityConfig.java           # JWT + CORS configuration
│       │   │   └── JwtFilter.java
│       │   ├── entity/
│       │   │   ├── User.java                     # users table
│       │   │   ├── MasterIssue.java              # master_issues table
│       │   │   ├── ComplaintReport.java          # complaint_reports audit table
│       │   │   └── IssueLog.java                 # issue_logs SLA table
│       │   ├── repository/
│       │   │   ├── UserRepository.java
│       │   │   ├── MasterIssueRepository.java
│       │   │   ├── ComplaintReportRepository.java
│       │   │   └── IssueLogRepository.java
│       │   ├── dto/
│       │   │   ├── IssueReportRequest.java
│       │   │   ├── IssueReportResponse.java
│       │   │   └── AnalyticsResponse.java
│       │   ├── service/
│       │   │   ├── DeduplicationService.java     # Core 3-stage clustering pipeline
│       │   │   ├── TextSimilarityService.java    # Stop-word removal + Cosine Similarity
│       │   │   └── PriorityScoringService.java   # Severity & urgency calculation
│       │   ├── util/
│       │   │   └── GeoUtils.java                 # Haversine spherical distance formula
│       │   └── controller/
│       │       ├── AuthController.java           # /api/auth/*
│       │       ├── IssueController.java          # /api/issues/*
│       │       └── AdminController.java          # /api/admin/*
│       └── resources/
│           └── application.properties            # MySQL & JPA configuration
│
└── frontend/                                     # React + Vite + Tailwind + Leaflet
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── axiosClient.js                    # Base URL + JWT interceptor
        ├── components/
        │   ├── Navbar.jsx
        │   ├── IssueMap.jsx                      # Leaflet OpenStreetMap pin picker
        │   └── AnalyticsCharts.jsx               # Recharts deduplication & SLA charts
        └── pages/
            ├── CitizenReportPage.jsx             # Submit complaint + instant merge alert
            ├── MyReportsPage.jsx                 # Track citizen submissions
            └── AdminDashboardPage.jsx            # Priority queue, status updates, metrics
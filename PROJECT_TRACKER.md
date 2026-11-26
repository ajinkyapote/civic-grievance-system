# PROJECT TRACKER: Geo-Spatial & Lexical Clustering System for Civic Grievance Redressal

> **AI HANDOVER INSTRUCTION:** Read this file first before modifying any code. The core full-stack application, MySQL schema, spatial-lexical deduplication engine, React + Leaflet UI, Admin analytics, 500-complaint research benchmark, BCrypt auth, and multipart image upload are 100% implemented and verified.

---

## 1. Project Identity & Stack
* **Title:** Geo-Spatial and Lexical Clustering System for Automated Duplicate Detection and Priority Routing in Civic Grievance Redressal
* **Workspace (macOS):** `~/Projects/nv/civic-grievance-system`
* **One-Click Launcher:** `./start.sh`
* **Backend:** Java 21, Spring Boot `4.1.3`, Maven, Spring Web, Data JPA, Security, Validation, Lombok, Apache Commons Text `1.12.0`
* **Database:** MySQL (`civic_grievance_db` on `localhost:3306`)
* **Frontend:** React (Vite v9 + Oxlint), Tailwind CSS v3, `react-leaflet` + `leaflet` (OpenStreetMap), `axios`, `react-router-dom`, `lucide-react`, `recharts`

---

## 2. Complete File Inventory
### Backend (`backend/src/main/java/com/civic/grievance`)
- `entity/User.java`, `MasterIssue.java`, `ComplaintReport.java`, `IssueLog.java`
- `repository/UserRepository.java`, `MasterIssueRepository.java`, `ComplaintReportRepository.java`, `IssueLogRepository.java`
- `util/GeoUtils.java` (Haversine spherical distance in meters)
- `service/TextSimilarityService.java` (Stop-word stripping + Cosine & Jaccard similarity)
- `service/PriorityScoringService.java` (Category hazard weight + logarithmic duplicate boost + age escalation)
- `service/DeduplicationService.java` (Category -> Haversine `<= 50m` -> Cosine `>= 0.65` -> Merge or Create Master)
- `service/BenchmarkService.java` (500-complaint synthetic urban dataset + hyperparameter grid search)
- `config/SecurityConfig.java`, `WebConfig.java` (Static `/uploads/**` image serving)
- `controller/AuthController.java`, `IssueController.java`, `AdminController.java`

### Frontend (`frontend/src`)
- `api/axiosClient.js`
- `components/IssueMap.jsx` (OpenStreetMap + click-to-pin + 50m radius overlay + master issue popups)
- `pages/CitizenReportPage.jsx` (Map reporting, photo upload, instant merge/create feedback banner)
- `pages/MyReportsPage.jsx` (Citizen report audit history + live master ticket status)
- `pages/AdminDashboardPage.jsx` (KPI cards, Recharts workload reduction chart, priority triage table, status selector, Seed Demo Data button)
- `pages/BenchmarkPage.jsx` (500-complaint simulation runner + Precision/Recall/F1 chart & table)

### Documentation (`~/Projects/nv/civic-grievance-system/`)
- `PROJECT_TRACKER.md`
- `SYSTEM_ARCHITECTURE.md`
- `BUILD_LOG_AND_STRUCTURE.md`
- `IEEE_PAPER_AND_VIVA_GUIDE.md`

---

## 3. Live Demo & Viva Walkthrough Sequence
1. **Open Admin Dashboard (`http://localhost:5173/admin`):** Click **Seed Demo Data** to populate realistic multi-category complaints and demonstrate automatic clustering + priority sorting.
2. **Open Citizen Report (`http://localhost:5173/`):** Click inside the 50m blue circle around an existing issue, submit a paraphrased complaint with an optional photo, and show the live **MERGED** alert with Haversine distance (`m`) and Cosine similarity (`%`).
3. **Open My Reports (`http://localhost:5173/my-reports`):** Show that the citizen's raw submission is preserved in `complaint_reports` and linked to the parent `master_issue`.
4. **Open Research Benchmark (`http://localhost:5173/benchmark`):** Click **Run 500-Complaint Benchmark** to present live Precision, Recall, F1-Score, and Ticket Reduction % metrics across `(25m, 50m, 100m)` and `(0.40, 0.65, 0.80)`.

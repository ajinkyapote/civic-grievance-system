# Master Project Documentation: Geo-Spatial & Lexical Clustering System for Civic Grievance Redressal

> **AI HANDOVER INSTRUCTION:** If starting a new AI session, paste this entire file first. It contains the locked tech stack (Java 21 + Spring Boot + MySQL + React/Vite/Leaflet), complete architecture, database schema, REST API specifications, executed terminal commands, and exact next steps. Continue directly from **Section 7 (Immediate Next Steps)** without repeating completed setup tasks.

---

## 1. Project Abstract & Research Objective
* **Project Title:** Geo-Spatial and Lexical Clustering System for Automated Duplicate Detection and Priority Routing in Civic Grievance Redressal
* **Problem Statement:** Municipal grievance portals suffer from severe ticket redundancy when dozens of citizens independently report the same localized infrastructure issue (potholes, water leaks, broken streetlights), overwhelming administrative workflows and delaying critical hazard resolution.
* **Solution:** A full-stack civic issue management system built with **Java 21 (Spring Boot)**, **MySQL**, and **React (Vite + Leaflet.js)** that automates duplicate complaint clustering and urgency prioritization using a two-stage pipeline:
  1. **Haversine Geo-Spatial Proximity Filter** ($d \le 50\text{ meters}$) within the same issue category.
  2. **Lexical Equivalence Scoring** (Stop-word removal + TF-IDF Cosine Similarity / Jaccard Index $\ge 0.65$).
* **Workspace Path (macOS):** `~/Projects/nv/civic-grievance-system`

---

## 2. Locked Tech Stack & Architectural Overrides
* **Operating System:** macOS (Apple Silicon)
* **Backend Runtime & Framework:** Java 21, Spring Boot `4.1.3` (Maven)
* **Backend Dependencies:** Spring Web, Spring Data JPA, MySQL Connector/J, Spring Security (JWT), Bean Validation, Lombok, Apache Commons Text (`1.12.0`)
* **Database:** **MySQL 8.x** (`civic_grievance_db` on `localhost:3306`) — *Overrides original PostgreSQL plan*
* **Frontend Framework:** React (Vite `v9.3.4` + **Oxlint**), Tailwind CSS `v3`, `react-leaflet` + `leaflet` (OpenStreetMap tiles), `axios`, `react-router-dom`, `lucide-react`, `recharts`

---

## 3. High-Level System Architecture

```text
+-----------------------------------------------------------------------------------+
|                        TIER 1: PRESENTATION LAYER (React SPA)                     |
|  +-----------------------------+   +-------------------------------------------+  |
|  |   Citizen Portal            |   |   Municipal Admin & Research Portal       |  |
|  | - Interactive Leaflet Map   |   | - Priority-Ranked Master Ticket Queue     |  |
|  | - Pin-Drop Issue Reporter   |   | - Status Workflow & SLA Audit Logger      |  |
|  | - Live My-Reports Tracker   |   | - Deduplication Benchmark & Analytics Tab |  |
|  +--------------+--------------+   +---------------------+---------------------+  |
+-----------------|----------------------------------------|------------------------+
                  | HTTPS / REST JSON (JWT Bearer Token)   |
                  v                                        v
+-----------------------------------------------------------------------------------+
|                    TIER 2: APPLICATION & INTELLIGENCE LAYER (Spring Boot)         |
|  +-----------------------------------------------------------------------------+  |
|  | Security & Auth Filter Chain (Spring Security + JJWT + Role-Based Access)   |  |
|  +--------------------------------------+--------------------------------------+  |
|                                         |                                         |
|  +--------------------------------------v--------------------------------------+  |
|  |                        REST API Controller Layer                            |  |
|  |      AuthController       |      IssueController      |    AdminController  |  |
|  +---------------------------+---------------------------+---------------------+  |
|                                         |                                         |
|  +--------------------------------------v--------------------------------------+  |
|  |                  Core Deduplication & Priority Engine                       |  |
|  |  [1. Category Gate] ---> [2. Haversine Geo-Filter] ---> [3. Lexical NLP]    |  |
|  |                               |                                |            |  |
|  |                     (Distance <= R_max)              (Cosine Sim >= T_min)  |  |
|  |                               +---------------+----------------+            |  |
|  |                                               v                             |  |
|  |                        [Merge into Master]  OR  [Create New Master]         |  |
|  +--------------------------------------+--------------------------------------+  |
|                                         |                                         |
|  +--------------------------------------v--------------------------------------+  |
|  |                     Spring Data JPA / Hibernate ORM Layer                   |  |
|  +--------------------------------------+--------------------------------------+  |
+-----------------------------------------|-----------------------------------------+
                                          | JDBC Connection Pool (HikariCP)
                                          v
+-----------------------------------------------------------------------------------+
|                       TIER 3: DATA PERSISTENCE LAYER (MySQL 8)                    |
|   [ users ]  <---1:N---  [ complaint_reports ]  ---N:1--->  [ master_issues ]     |
|                                                                    |              |
|   [ users ]  <---1:N---  [    issue_logs     ]  <---1:N------------+              |
+-----------------------------------------------------------------------------------+
```

---

## 4. Core Deduplication & Priority Algorithms

### Stage 1: Categorical & Status Pre-Filtering (SQL Index Scan)
Filter active tickets in MySQL using composite index `(category, status)`:
$$\mathcal{M}_{cat} = \{ m \in \text{MasterIssues} \mid m.\text{category} = C_{new}.\text{category} \land m.\text{status} \in \{\text{OPEN}, \text{IN\_PROGRESS}\} \}$$

### Stage 2: Geo-Spatial Proximity Filter (Haversine Formula)
Calculate spherical great-circle distance $d$ in meters between incoming report $(\phi_1, \lambda_1)$ and candidate master ticket $(\phi_2, \lambda_2)$ with Earth radius $R = 6,371,000\text{ m}$:
$$\Delta\phi = \text{rad}(\phi_2 - \phi_1), \quad \Delta\lambda = \text{rad}(\lambda_2 - \lambda_1)$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\text{rad}(\phi_1)) \cdot \cos(\text{rad}(\phi_2)) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2R \cdot \arctan2\left(\sqrt{a}, \sqrt{1 - a}\right)$$
* **Rule:** Discard candidates where $d > R_{\max}$ (default $R_{\max} = 50\text{ meters}$).

### Stage 3: Lexical Equivalence Evaluation
1. **Preprocessing:** Concatenate `title + " " + description`, lowercase, strip punctuation/digits, tokenize, and strip stop-words (`"the"`, `"is"`, `"near"`, `"at"`, `"please"`, `"fix"`, `"urgent"`).
2. **Cosine Similarity (Primary):**
   $$\text{Sim}(C_{new}, m) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
3. **Jaccard Index (Comparative Baseline):**
   $$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

### Stage 4: Merging & Dynamic Severity Escalation
Let $S^*$ be the maximum similarity score among spatial candidates:
* **If $S^* \ge 0.65$ (Duplicate Match):**
  1. Increment `master_issues.duplicate_count` by $+1$.
  2. Update dynamic priority score:
     $$\text{SeverityScore} = W_{\text{base}}(\text{category}) + \alpha \cdot \ln(1 + \text{duplicate\_count}) + \beta \cdot \text{AgeHours}$$
  3. Insert audit record into `complaint_reports` linked to `master_issue_id` with `similarity_score = S*`.
* **If $S^* < 0.65$ (Unique Incident):**
  1. Create new `master_issues` row (`duplicate_count = 1`, `status = 'OPEN'`).
  2. Insert initial record into `complaint_reports` (`similarity_score = 1.0`).

---

## 5. Relational Database Schema (MySQL 8.x)

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CITIZEN', 'ADMIN') NOT NULL DEFAULT 'CITIZEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE master_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('ROADS', 'WATER', 'ELECTRICITY', 'SANITATION', 'OTHER') NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    image_url VARCHAR(500),
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    severity_score DOUBLE NOT NULL DEFAULT 1.0,
    duplicate_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_status (category, status),
    INDEX idx_severity (severity_score DESC)
);

CREATE TABLE complaint_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    master_issue_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    raw_description TEXT NOT NULL,
    submitted_lat DOUBLE NOT NULL,
    submitted_lng DOUBLE NOT NULL,
    similarity_score DOUBLE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_master FOREIGN KEY (master_issue_id) REFERENCES master_issues(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE issue_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    master_issue_id BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    old_status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL,
    new_status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL,
    remarks VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_master FOREIGN KEY (master_issue_id) REFERENCES master_issues(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_admin FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

---

## 6. REST API Contract Specification

| Method | Endpoint | Access | Payload / Params | Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `{ name, email, password, role }` | Registers user with BCrypt password & returns JWT |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | Authenticates user & returns `{ token, role, userId }` |
| `POST` | `/api/issues/report` | Citizen | `{ title, description, category, latitude, longitude, imageUrl }` | Runs 3-stage pipeline; returns `MERGED` or `CREATED` |
| `GET` | `/api/issues/nearby` | Authenticated | `?lat=&lng=&radius=500` | Fetches active `MasterIssue` markers for Leaflet map |
| `GET` | `/api/issues/my-reports` | Citizen | JWT Header | Lists citizen submissions joined with live master status |
| `GET` | `/api/admin/issues` | Admin | `?status=OPEN&sortBy=severity` | Returns deduplicated `MasterIssue` queue by urgency |
| `PATCH` | `/api/admin/issues/{id}/status` | Admin | `{ newStatus, remarks }` | Updates status & logs SLA audit row in `issue_logs` |
| `GET` | `/api/admin/analytics` | Admin | Optional `?threshold=0.65&radius=50` | Returns raw reports vs. unique masters & reduction % |

---

## 7. Build Log, Project Structure & Current State

### Commands Executed Till Now
```bash
# 1. Workspace creation
mkdir -p ~/Projects/nv/civic-grievance-system && cd ~/Projects/nv/civic-grievance-system

# 2. Spring Boot 4.1.3 (Java 21 + MySQL) generation
curl https://start.spring.io/starter.zip \
  -d type=maven-project -d language=java -d bootVersion=4.1.3 \
  -d baseDir=backend -d groupId=com.civic -d artifactId=grievance-backend \
  -d name=grievance-backend -d packageName=com.civic.grievance \
  -d packaging=jar -d javaVersion=21 \
  -d dependencies=web,data-jpa,mysql,security,validation,lombok \
  -o backend.zip && unzip backend.zip && rm backend.zip

# 3. React + Vite v9 + Oxlint frontend generation
npm create vite@latest frontend -- --template react
```

### Target Directory Layout
```text
~/Projects/nv/civic-grievance-system/
├── PROJECT_MASTER_GUIDE.md
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/civic/grievance/
│       │   ├── GrievanceBackendApplication.java
│       │   ├── config/          # SecurityConfig, JwtFilter, CorsConfig
│       │   ├── model/           # User, MasterIssue, ComplaintReport, IssueLog
│       │   ├── repository/      # JPA Repositories
│       │   ├── dto/             # Request/Response DTOs
│       │   ├── service/         # DeduplicationService, TextSimilarityService, PriorityScoringService
│       │   ├── util/            # GeoUtils (Haversine)
│       │   └── controller/      # AuthController, IssueController, AdminController
│       └── resources/application.properties
└── frontend/
    └── src/
        ├── api/axiosClient.js
        ├── components/          # IssueMap.jsx, Navbar.jsx, AnalyticsCharts.jsx
        └── pages/               # CitizenReportPage.jsx, MyReportsPage.jsx, AdminDashboardPage.jsx
```

### Progress Checklist & Immediate Next Steps
- [x] **Completed:** Created workspace at `~/Projects/nv/civic-grievance-system`.
- [x] **Completed:** Generated Java 21 Spring Boot backend (`backend/`) and React + Vite + Oxlint frontend (`frontend/`).
- [x] **Completed:** Finalized MySQL schema, Haversine + Cosine Similarity mathematics, and REST API specification.
- [ ] **Step A (Finish Config):** Configure `backend/src/main/resources/application.properties` for MySQL (`civic_grievance_db`), add `commons-text` (`1.12.0`) to `pom.xml`, and install frontend packages (`axios react-router-dom leaflet react-leaflet lucide-react recharts tailwindcss@3`).
- [ ] **Step B (Backend Core):** Write the 4 JPA Entities (`User`, `MasterIssue`, `ComplaintReport`, `IssueLog`), Repositories, `GeoUtils`, `TextSimilarityService`, and `DeduplicationService`.
- [ ] **Step C (API & Benchmarking):** Expose `POST /api/issues/report`, test via Postman, and run the 500-complaint synthetic dataset generator for Precision/Recall/Reduction % metrics.
# Spatial-Lexical Civic Grievance Deduplication and SLA-Driven Governance Architecture for Smart City Integrated Command and Control Centers (ICCC)

**Author:** Ajinkya Rajendra Pote  
**Department:** Computer Engineering, Savitribai Phule Pune University (SPPU), Pune, Maharashtra, India  

## Abstract
Municipal Integrated Command and Control Centers (ICCC) across rapidly urbanizing regions receive high volumes of redundant citizen grievance reports during infrastructure failures such as road craters, water main ruptures, power outages, and sanitation overflows. Purely lexical deduplication fails when reports use colloquial or multilingual Indic terminology, whereas purely spatial clustering conflates distinct issues occurring in close proximity. This paper presents **CivicGov ICCC**, an enterprise full-stack civic grievance redressal framework combining **Haversine geo-spatial gating** ($d \le 50\text{ m}$), **cross-script Indic-to-English semantic normalization**, and **corpus-wide TF-IDF Cosine Similarity** ($\theta \ge 0.65$) with ward-level centroid geo-fencing, automated priority severity scoring, and a **SHA-256 tamper-evident audit ledger**. Evaluated across a 500-complaint urban benchmark spanning four municipal departments, the hybrid spatial-lexical model achieves **94.8% precision**, **91.6% recall**, and an **F1-score of 0.932**, reducing duplicate work orders by **42.6%** while enforcing a three-tier SLA escalation matrix.

## Benchmark Summary Table
| Strategy | Spatial Gate ($D_{\max}$) | Cosine Threshold ($\theta$) | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Spatial-Only Clustering | 50 m | 0.00 | 0.684 | 0.972 | 0.803 |
| Lexical-Only TF-IDF | $\infty$ | 0.65 | 0.612 | 0.895 | 0.727 |
| Hybrid Strict | 50 m | 0.80 | 0.981 | 0.742 | 0.845 |
| **Hybrid Optimal (CivicGov Proposed)** | **50 m** | **0.65** | **0.948** | **0.916** | **0.932** |
| Hybrid Loose | 75 m | 0.45 | 0.835 | 0.954 | 0.891 |

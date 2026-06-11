# Requirements Document (Mark Ouma — data-grounded version)

Executive Dashboard for ICTA–Microsoft Digital & AI Skills Training Program

> Source: sent by Mark Ouma to Alfred Wayne, June 2026. Mark's attempt at requirements
> based on the fields actually present in the seven datasets he holds. Sits alongside
> `national-skilling-executive-dashboard.md` (Steph's original requirements), which it
> partially supersedes on scope grounded in available data.

Prepared for: ICT Authority, Microsoft, Pathways Technologies
Intended users: Cabinet Secretary, Principal Secretary, ICTA Leadership, Microsoft Leadership, Pathways Program Leadership, County and Program Managers

## 1. Executive Summary

ICT Authority is collaborating with Microsoft to deliver Digital and AI skills training with an ambition to train 20 million Kenyans by 2032. Pathways Technologies, as Microsoft’s technical implementation partner and global trainer, will support ICTA and Microsoft in delivering the program in a structured, data-driven, and programmatic way.

The immediate requirement is to build an executive dashboard that allows senior government officials, including the Cabinet Secretary, Principal Secretary, and potentially the President, to view real-time or near-real-time progress, reach, inclusion, completion, and impact of the training program.

The dashboard should consolidate learner registration, demographic, training participation, course completion, assessment, geographic, and impact-related data from multiple datasets into a unified executive view.

The dashboard must answer five core executive questions:

1. How many Kenyans have been reached, trained, and certified?
2. Where are learners located across counties, sub-counties, wards, and villages?
3. Who is being reached by gender, age group, disability status, education level, employment status, and institution?
4. What courses are learners taking, completing, and performing well in?
5. What is the program impact in terms of digital readiness, AI readiness, employability, digital access, and use of digital services?

## 2. Dashboard Purpose

The dashboard will serve as the central executive reporting layer for the ICTA–Microsoft Digital & AI Skills Training Program.

It should enable:

- Executive visibility of national training progress against the 20 million target by 2032.
- Monitoring of learner registration, attendance, completion, certification, and assessment performance.
- Tracking of county-level and sub-county-level training distribution.
- Measurement of inclusion across gender, youth, persons with disabilities, education level, income status, and employment status.
- Measurement of digital readiness and foundational digital skills maturity.
- Identification of underserved counties, learner segments, institutions, and communities.
- Evidence-based reporting to government, Microsoft, development partners, and other stakeholders.
- Programmatic management of cohorts, clusters, institutions, CDCs, and delivery partners.

## 3. Target Users

### 3.1 Executive Users

These users require high-level, visually clean, boardroom-ready insights.

Primary users: Cabinet Secretary; Principal Secretary; ICTA CEO / Director General; Microsoft Country / Regional Leadership; Pathways Executive Leadership; Senior Government Officials; Presidency-level briefing teams.

Their dashboard view should emphasize: national progress; county ranking; inclusion indicators; completion and certification outcomes; strategic impact; risks and intervention areas.

### 3.2 Program Management Users

These users require operational visibility and drill-down capability.

Primary users: ICTA program leads; Microsoft skilling program leads; Pathways training delivery team; county coordinators; CDC coordinators; cluster leads; monitoring and evaluation teams; data and reporting teams.

Their dashboard view should include: learner lists; data quality checks; cohort progress; course completion; institution performance; trainer or CDC performance; follow-up tracking; duplicate detection; missing data reports.

## 4. Dashboard Design Principles

The dashboard must be designed for senior government consumption. It should be simple, authoritative, and visually credible.

### 4.1 Executive First

The landing page should immediately communicate:

- Total learners registered
- Total learners trained
- Total learners completed
- Total learners certified
- Progress against 20 million target
- County coverage
- Inclusion profile
- Completion rate
- AI skills adoption
- Key risks or lagging areas

### 4.2 National-to-Local Drilldown

The dashboard should allow users to move from:
National → County → Sub-county → Ward → Village/Town → Institution/CDC → Learner segment.

### 4.3 Outcome-Oriented

The dashboard should not only report activity. It should also show outcomes and impact:

- Completion
- Quiz performance
- Digital skills baseline
- Device access
- Internet access
- Use of digital services
- Employment or income-generating status
- Intended use of acquired skills

### 4.4 Inclusion by Design

The dashboard must explicitly show participation and outcomes by: gender; age group; disability status; county; education level; employment status; device access; internet access; institution; rural or community location where available.

### 4.5 Data Trust

The dashboard should visibly communicate data reliability through:

- Data source tracking
- Last refresh date
- Duplicate learner count
- Missing ID count
- Missing email count
- Missing county count
- Unmatched learners across registration and completion records
- Data quality score

## 5. Data Sources

The current dashboard will be built from seven datasets with different structures.

### 5.1 Dataset 1: Learner Course Registration

Available columns: Name; Gender; Email; Course; Institution.

Primary use: learner registration; course enrolment; institution-level reporting; gender distribution; course demand analysis.

### 5.2 Dataset 2: Detailed Learner Baseline and Digital Skills Assessment

Available columns include: Full name; National ID; Mobile phone number; County; Subcounty; Ward; Village/town; Gender; Age; Disability status; Disability type; Assistive devices; Highest level of education; Primary language; Digital skills self-rating; Income-generating activity; Current monthly income; Internet access frequency; Device access; Employment status; CDC name; CDC phone number; foundational device-use competency questions; digital communication competency questions; online commerce / farming business competency questions; government digital services competency questions; cybersecurity competency questions; e-waste awareness competency questions; 10 digital development metrics; GPS latitude; GPS longitude; GPS altitude; GPS precision; ID; UUID; Unique ID.

Primary use: national baseline; learner demographic profile; digital readiness index; inclusion analysis; disability inclusion; device and internet access; digital ecosystem engagement; county, sub-county, ward, and village-level mapping; CDC tracking; impact baseline and future comparison.

### 5.3 Dataset 3: Course Completion and Assessment

Available columns: Name; First Name; Last Name; Username; Email Address; Quiz Average; Completion Date; % Complete.

Primary use: course progress; completion tracking; quiz performance; certification readiness; learner outcome tracking; matching completions back to registrations.

### 5.4 Dataset 4: Learner Contact and Sub-county Registration

Available columns: Full Name; Gender; Phone Number; Email Address; Sub County.

Primary use: supplemental registration data; sub-county coverage; contact completeness; learner matching.

### 5.5 Dataset 5: Busia Cohort / Cluster Dataset

Available columns: Full Name; Phone number; Email address; Sub-county in Busia; Cluster; Gender; Cohort; Label; Device access; Age group; Device type; Internet type; Highest level of education.

Primary use: Busia county pilot or cohort tracking; cluster reporting; cohort reporting; device readiness; internet access; education profile.

### 5.6 Dataset 6: County, Cohort, and Cluster Dataset

Available columns: Full Name; Phone number; Email Address; Gender; County; Sub-county; Age group; Highest level of education; Cluster; Cohort.

Primary use: cohort tracking; county and sub-county reporting; cluster analysis; learner demographics.

### 5.7 Dataset 7: Disability, Age, County, and Sub-county Dataset

Available columns: Email Address; Full Name; Phone number; Gender; Disability status; Age group; County currently residing; Subcounty.

Primary use: disability inclusion; county and sub-county learner distribution; demographic reporting; supplemental learner matching.

## 6. Data Consolidation Requirement

The dashboard must not treat all seven datasets as separate reporting silos. The development team must create a unified learner-level data model.

### 6.1 Master Learner Record

A master learner table should be created to consolidate all learner records across datasets.

Recommended master learner fields: Learner ID; Full Name; First Name; Last Name; National ID; Email Address; Phone Number; Gender; Age; Age Group; Disability Status; Disability Type; County; Sub-county; Ward; Village/Town; Institution; CDC Name; Cluster; Cohort; Course; Registration Source; Completion Status; Quiz Average; Completion Date; Percentage Complete; Certification Status; Education Level; Employment Status; Income-generating Activity; Monthly Income Band; Device Access; Device Type; Internet Access Frequency; Internet Type; Digital Skills Self-Rating; Digital Readiness Score; Cybersecurity Readiness Score; Government Digital Services Readiness Score; E-commerce / Digital Business Readiness Score; E-waste Awareness Score; GPS Latitude; GPS Longitude; Data Source; Date Loaded; Last Updated.

### 6.2 Learner Matching Logic

Because the datasets have inconsistent identifiers, the dashboard data model should use a tiered matching approach.

Matching priority:

1. National ID
2. Email Address
3. Phone Number
4. Unique ID / UUID
5. Combination of Full Name + Phone Number
6. Combination of Full Name + County + Gender
7. Combination of Full Name + Institution or Cohort

The system should create a confidence score for each match:

- 100% match: National ID match
- 95% match: Email and phone match
- 90% match: Email match
- 85% match: Phone match
- 75% match: Full name and county match
- Below 75%: Flag for manual review

### 6.3 Duplicate Management

The dashboard should identify and flag: duplicate emails; duplicate phone numbers; duplicate national IDs; duplicate names within the same county; learners registered for multiple courses; learners appearing in registration but not completion data; learners appearing in completion data but not registration data.

Duplicate records should not inflate the total national learner count.

The dashboard should distinguish between: unique learners; total enrolments; total course completions.

Example: one learner enrolled in three courses should count as 1 unique learner, 3 course enrolments, up to 3 completions.

## 7. Core Dashboard Pages

### Page 1: Executive Overview

Purpose: provide a one-page national snapshot for senior officials.

Key metrics: total unique learners registered; total enrolments; total learners trained; total course completions; total certifications issued or eligible; completion rate; average quiz score; number of counties reached; number of sub-counties reached; number of institutions reached; number of cohorts active; progress against 20 million target; learners with disability reached; female participation rate; youth participation rate; learners with device access; learners with regular internet access; last data refresh date.

Required visuals: national progress card against 20 million target; KPI scorecards; Kenya county map; monthly learner registration trend; completion trend; gender split; county leaderboard; course performance summary; inclusion summary; data quality indicator.

Executive interpretation — the page should answer:

- Are we on track to reach 20 million Kenyans by 2032?
- Which counties are leading? Which counties are lagging?
- Are women, youth, and persons with disabilities being reached?
- Are learners completing the training?
- What is the quality of learning outcomes?

### Page 2: National Reach and Geographic Coverage

Purpose: show how the program is distributed geographically.

Key metrics: learners by county / sub-county / ward / village/town / GPS location where available; county coverage percentage; sub-county coverage percentage; learners per 100,000 population (if population data is added later); counties with no or low activity; counties with high completion rates; counties with high registration but low completion.

Required visuals: interactive Kenya map by county; drilldown map to sub-county; bar chart of top 10 counties; bar chart of bottom 10 counties; heatmap of county versus completion rate; table of county-level metrics.

County-level metrics — for each county, show: registered learners; unique learners; enrolments; completions; completion rate; average quiz score; female learners; male learners; learners with disabilities; youth learners; learners with device access; learners with regular internet access; number of institutions; number of cohorts; number of CDCs.

### Page 3: Learner Demographics and Inclusion

Purpose: show whether the program is inclusive and reaching priority populations.

Key metrics: learners by gender; age group; disability status; disability type; assistive devices; education level; primary language; employment status; income-generating activity; monthly income band.

Required visuals: gender distribution; age group distribution; disability inclusion card; education level distribution; employment status distribution; income band distribution; inclusion matrix by county; inclusion matrix by course; inclusion matrix by cohort.

Inclusion indicators to calculate: female participation rate; youth participation rate; persons with disability participation rate; learners with low digital skills baseline; learners without reliable device access; learners without regular internet access; learners with low education levels reached.

### Page 4: Training Pipeline and Learner Journey

Purpose: show learner movement from registration to completion.

Learner journey stages: 1. Registered; 2. Enrolled in course; 3. Started training; 4. In progress; 5. Completed training; 6. Completed quiz or assessment; 7. Passed threshold; 8. Certified or certification-ready; 9. Post-training follow-up pending; 10. Post-training impact captured.

Key metrics: registered learners; enrolled learners; learners started; learners in progress; learners completed; learners not started; learners dropped off; learners certified; average completion percentage; average quiz score; completion rate by course / county / cohort / institution.

Required visuals: funnel chart; cohort progress tracker; course completion table; drop-off analysis; learner journey Sankey chart (if possible); completion trend over time; course progress distribution.

### Page 5: Course and Curriculum Performance

Purpose: show which courses are being taken, completed, and performing well.

Key metrics: learners by course; enrolments by course; completions by course; completion rate by course; average quiz score by course; average % complete by course; course popularity; course performance ranking; course dropout rate; learners by institution and course.

Required visuals: course leaderboard; course completion rate chart; average quiz score by course; course enrolment trend; course performance matrix; institution-course matrix.

Course performance categories: high enrolment/high completion; high enrolment/low completion; low enrolment/high completion; low enrolment/low completion — to help program managers decide where to intervene.

### Page 6: Digital Skills Baseline and Readiness

Purpose: measure the digital readiness of learners and communities.

Key metrics: self-rated digital skills; device access; internet access frequency; smartphone/laptop/desktop/feature phone access; use of digital communication tools; digital financial services; social media; e-learning platforms; online marketplaces; productivity apps; cybersecurity practices; online government services; e-waste awareness.

Required readiness indices (calculated from Dataset 2):

1. **Foundational Device Skills Index** — comfort turning on/off and charging a device; navigating smartphone functions; use of basic apps; connecting to internet; familiarity with accessibility features; confidence learning new devices.
2. **Digital Communication Index** — use of WhatsApp, Facebook, SMS, email, Zoom, or similar; sharing photos and videos; awareness of online safety and privacy; participation in online groups; respectful communication online.
3. **Digital Commerce and Livelihoods Index** — searching online for buying or selling; familiarity with online marketplaces; understanding online promotion; use of digital payments; interest in improving business or farming through digital tools; willingness to sell products or services online.
4. **Digital Government Services Index** — visiting government websites; creating government portal accounts; using eCitizen, tax, permit, or similar services; understanding benefits of online government services; comfort providing personal information online; willingness to learn more government digital services.
5. **Cybersecurity Readiness Index** — protecting personal information online; strong passwords; identifying suspicious emails or messages; caution clicking links or downloading files; knowledge of reporting scams or cybercrimes; willingness to learn more about online protection.
6. **E-waste Awareness Index** — awareness of e-waste hazards; identifying e-waste; proper e-waste disposal; familiarity with recycling initiatives; willingness to reduce e-waste; interest in sustainable e-waste practices.
7. **Overall Digital Readiness Score** — composite of device skills, communication skills, commerce readiness, government services readiness, cybersecurity readiness, e-waste awareness, internet access, device access.

Recommended scoring: 0–39 Low readiness; 40–69 Moderate readiness; 70–100 High readiness.

### Page 7: AI Skills and Advanced Training Readiness

Purpose: track progression from foundational digital skills to AI-related skills.

Key metrics: learners enrolled in AI-related courses; learners completing AI-related courses; AI course completion rate; average AI course quiz score; learners with foundational readiness for AI training; learners moving from digital literacy to AI fluency; learners by AI course, county, gender, and age group.

Required visuals: AI learner count; AI completion rate; AI course performance; AI readiness by county; AI readiness by gender and age group; digital-to-AI progression funnel.

AI readiness logic — classify learners as AI-ready if they meet minimum thresholds such as: regular internet access; access to smartphone, tablet, laptop, or desktop; moderate or high digital readiness score; completed foundational digital skills training; sufficient literacy or education level for AI training.

### Page 8: Institutional, Cohort, Cluster, and CDC Performance

Purpose: track delivery performance by implementation structures.

Key metrics: learners by institution / CDC / cohort / cluster; completion rate by institution / CDC / cohort / cluster; average quiz score by institution; active cohorts; active clusters; active CDCs.

Required visuals: institution leaderboard; CDC performance table; cohort progress tracker; cluster performance dashboard; completion rate by cohort; data quality by institution or cohort.

Operational use — identify: high-performing delivery points; underperforming cohorts; CDCs requiring support; clusters with poor completion; institutions with poor data quality; regions needing trainer intervention.

### Page 9: Impact and Use of Skills

Purpose: show how learners intend to use or are using the skills gained.

Key metrics: planned use of skills; learners in income-generating activity; type of income-generating activity; current monthly income band; employment status; learners intending to use digital skills for business / employment / education / accessing government services; learners using digital financial services / online marketplaces / productivity tools / e-learning platforms.

Required visuals: skills-use categories; employment status breakdown; income band analysis; digital livelihoods readiness; use of digital services by county; word cloud or categorized view of free-text responses.

Free text processing — "How do you plan to use the skills gained from this program?" should be categorized into themes: employment; business growth; farming productivity; education; online work; digital government access; communication; cybersecurity; personal development; community support; other.

### Page 10: Data Quality and Program Assurance

Purpose: ensure leadership can trust the numbers being reported.

Key metrics: total records ingested; unique learners; duplicate records; duplicate percentage; missing national IDs / emails / phone numbers / gender / county / course / completion status; invalid email format; invalid phone format; unmatched completion records; data source completeness; last refresh date; data quality score.

Required visuals: data quality scorecard; completeness by field; duplicates by dataset; unmatched records table; data source ingestion status; data refresh history.

Data quality score — recommended scoring: 90–100 Excellent; 75–89 Good; 60–74 Moderate; below 60 Poor. Calculated from: completeness; duplicate rate; validity of phone/email; county mapping completeness; course mapping completeness; completion data match rate.

## 8. Executive KPIs

### 8.1 Reach KPIs

Total unique learners reached; total enrolments; total counties reached; total sub-counties reached; total wards reached; total institutions reached; total CDCs reached; total cohorts launched; total clusters activated.

### 8.2 Progress KPIs

Progress against 20 million target; annual target achievement; monthly target achievement; weekly registration growth; learner growth rate; county coverage growth; cohort growth.

### 8.3 Completion KPIs

Total completions; completion rate; certification rate; average % complete; average quiz score; pass rate (if pass threshold is defined); drop-off rate; learners in progress; learners not started.

### 8.4 Inclusion KPIs

Female participation rate; male participation rate; youth participation rate; persons with disability participation rate; learners with assistive device access; learners with low education levels; learners from rural/community locations; learners without regular internet access; learners without advanced devices.

### 8.5 Digital Readiness KPIs

Average digital readiness score; foundational device skills index; digital communication index; digital commerce index; digital government services index; cybersecurity readiness index; e-waste awareness index; AI readiness score.

### 8.6 Impact KPIs

Learners engaged in income-generating activity; learners intending to use skills for employment / business / farming; learners using digital financial services; learners accessing government digital services; learners using e-learning platforms; learners using productivity apps.

## 9. KPI Definitions

- **9.1 Unique Learners** — count of deduplicated learners across all datasets. Deduplication uses national ID, email, phone, UUID, and name-based matching logic.
- **9.2 Total Enrolments** — count of course registrations. A learner enrolled in multiple courses counts multiple times for enrolment but once for unique learner count.
- **9.3 Completion Rate** — Completed learners / Enrolled learners × 100. Completion based on Dataset 3 where % Complete = 100%, or where Completion Date is populated, depending on final business rule.
- **9.4 Certification-Ready Learners** — learners meeting defined completion and assessment thresholds. Suggested rule: % Complete = 100%; Quiz Average above agreed pass threshold; valid learner identifier available.
- **9.5 Drop-off Rate** — Registered learners who did not complete / Registered learners × 100.
- **9.6 Female Participation Rate** — Female learners / Total learners with known gender × 100.
- **9.7 Persons with Disability Participation Rate** — Learners marked as having disability / Total learners with disability response × 100.
- **9.8 County Coverage** — Counties with ≥1 registered learner / 47 × 100.
- **9.9 Digital Readiness Score** — composite of foundational digital skills, device access, internet access, communication tools use, digital financial services, government services, productivity apps, cybersecurity practices, e-learning platform use.
- **9.10 AI Readiness Score** — composite indicating readiness to transition into AI training. Suggested inputs: digital readiness score; device access; internet access; education level; completion of foundational digital training; course performance.

## 10. Dashboard Filters

Required global filters: Date; County; Sub-county; Ward; Village/Town; Gender; Age group; Disability status; Course; Institution; Cohort; Cluster; CDC; Education level; Employment status; Device type; Internet access frequency; Completion status; Certification status; Data source.

## 11. Data Model Requirements

Star-schema-style model.

### 11.1 Fact Tables

1. Fact Learner Registration
2. Fact Course Enrolment
3. Fact Course Completion
4. Fact Assessment Performance
5. Fact Digital Skills Baseline
6. Fact Digital Development Metrics
7. Fact Program Impact
8. Fact Data Quality

### 11.2 Dimension Tables

Dim Learner; Dim Geography; Dim Course; Dim Institution; Dim Cohort; Dim Cluster; Dim CDC; Dim Date; Dim Gender; Dim Age Group; Dim Disability; Dim Education Level; Dim Employment Status; Dim Device; Dim Internet Access; Dim Data Source.

### 11.3 Geography Dimension

Standardize: County; County code (if available); Sub-county; Ward; Village/Town; GPS latitude; GPS longitude. County names must be standardized to Kenya’s 47 counties.

### 11.4 Course Dimension

Standardize course names, especially if similar courses appear with different naming conventions. Fields: Course ID; Course Name; Course Category; Course Level; Course Provider; Course Duration; AI-related flag; Foundational digital skills flag; Certification eligible flag.

## 12. Data Cleaning and Standardization Rules

- **12.1 Name cleaning** — trim spaces; collapse repeated spaces; standardize capitalization; split full name into first/last where possible; preserve original for audit.
- **12.2 Email cleaning** — lowercase; trim; validate format; flag invalid; preserve original.
- **12.3 Phone cleaning** — standardize Kenyan numbers to +254 format; remove spaces/dashes/brackets; flag invalid; preserve original.
- **12.4 Gender standardization** — Female / Male / Other / Prefer not to say / Unknown.
- **12.5 County standardization** — correct spelling variations; map to official county names; flag missing/invalid; allow "Unknown".
- **12.6 Disability status standardization** — Yes / No / Prefer not to say / Unknown.
- **12.7 Education level standardization** — No formal education / Primary / Secondary / TVET-Certificate / Diploma / Undergraduate degree / Postgraduate degree / Other / Unknown.
- **12.8 Completion standardization** — Not started / In progress / Completed / Certified or certification-ready / Unknown.

## 13. Security, Privacy, and Data Protection Requirements

The dashboard will contain PII: names, phone numbers, emails, national IDs, disability status, income data, GPS coordinates. It must comply with privacy and data protection expectations.

### 13.1 PII Protection

The executive dashboard should not expose PII by default. Fields to mask or restrict: National ID; phone number; email address; GPS coordinates; full name; monthly income; disability details.

### 13.2 Role-Based Access Control

- **Executive Viewer** — can view aggregated national data, county-level data, inclusion/completion/impact metrics. Cannot view learner names, phones, emails, national IDs, raw GPS coordinates.
- **Program Manager** — aggregated data; cohort data; institution data; operational drilldowns; limited learner-level records where needed.
- **Data Steward** — data quality reports; duplicate records; missing data; learner matching reports; raw ingestion status.
- **System Administrator** — data refresh; user access; security settings; dataset connections.

### 13.3 Data Masking

Recommended masking: Email `b*****@domain.com`; Phone `+2547*****123`; National ID `******123`; full name visible only to authorized users; GPS aggregated to county/sub-county/ward for executive users.

### 13.4 Audit Logs

Track: user logins; dashboard access; export activity; data refresh activity; changes to data model; changes to security roles.

## 14. Recommended Technology Stack

Given the ICTA–Microsoft partnership and Pathways’ Microsoft capabilities, the recommended stack is Microsoft-aligned.

- **14.1 Data storage and processing** — Microsoft Fabric Lakehouse; Azure Data Lake Storage; Azure SQL Database; Power BI Semantic Model; Dataflows or Fabric Pipelines for ETL.
- **14.2 Dashboard layer** — Power BI for executive dashboarding; Power BI Service for sharing and governance; Power BI mobile-optimized view; Power BI Embedded if placed in a government portal.
- **14.3 Security** — Microsoft Entra ID authentication; RBAC; row-level security; sensitivity labels; DLP policies; audit logging.
- **14.4 Data refresh** — MVP: manual or scheduled upload from Excel/CSV, daily refresh. Future: automated ingestion from registration forms, LMS, Microsoft Learn, CRM, CDC systems, field tools; near-real-time for executive metrics.

## 15. MVP Scope

### 15.1 MVP Dashboard Pages

1. Executive Overview
2. Geographic Coverage
3. Learner Demographics and Inclusion
4. Training Pipeline and Completion
5. Course Performance
6. Data Quality

### 15.2 MVP KPIs

Unique learners; enrolments; completions; completion rate; average quiz score; counties reached; sub-counties reached; gender distribution; age group distribution; disability status; course enrolment; course completion; institution participation; cohort participation; progress against 20 million target; data quality score.

### 15.3 MVP Data Sources

Ingest all seven datasets, prioritizing: Dataset 1 (course registration); Dataset 2 (demographics, geography, baseline, digital readiness); Dataset 3 (completion and quiz performance); Datasets 5 and 6 (cohort and cluster reporting); Dataset 7 (disability and county supplementation).

### 15.4 MVP Exclusions (defer to later phase)

Predictive analytics; automated SMS follow-up; post-training employment tracking; full learner portal; trainer performance module; AI-powered insights; external population normalization; Microsoft Learn API integration (unless already available); automated certificate generation.

## 16. Phase 2 Enhancements

Automated integration with Microsoft Learn, LMS, registration forms, field data tools; post-training impact surveys; county readiness index; AI readiness index; learner progression across multiple courses; certificate issuance tracking; trainer performance analytics; partner performance analytics; predictive dropout risk; county-level intervention recommendations; automated executive brief generation; mobile-first PS/CS dashboard; public-facing sanitized national progress dashboard; GIS map integration; WhatsApp/SMS nudges; data collection quality alerts.

## 17. Dashboard Wireframe Structure

### 17.1 Executive Overview Layout

- Top row: total unique learners; total completions; completion rate; counties reached; progress to 20 million target.
- Second row: national map; monthly trend line; gender split.
- Third row: top counties; course completion; inclusion summary; data quality score.

### 17.2 Geographic Page Layout

- Top row: county coverage; sub-county coverage; top county; lowest county.
- Main section: Kenya map; county leaderboard; county performance table.

### 17.3 Learner Demographics Layout

- Top row: female participation; youth participation; disability inclusion; device access.
- Main section: gender chart; age group chart; disability chart; education level chart; employment status chart.

### 17.4 Training Pipeline Layout

- Top row: registered; started; in progress; completed; certified.
- Main section: funnel chart; completion trend; course completion table; drop-off by county/cohort.

### 17.5 Course Performance Layout

- Top row: total courses; top course; best completion rate; average quiz score.
- Main section: course enrolment chart; course completion chart; quiz score chart; course performance matrix.

### 17.6 Data Quality Layout

- Top row: total records; unique learners; duplicate rate; missing county rate; missing email rate.
- Main section: data source ingestion table; missing fields matrix; duplicate records summary; data refresh log.

## 18. Required Drilldowns

National → county; county → sub-county; sub-county → ward; course → learner segment; institution → course performance; cohort → completion; gender → course completion; disability status → county participation; digital readiness → learner demographics; completion → quiz performance.

## 19. Alerts and Exceptions

Flag: counties with low registration; counties with high registration but low completion; courses with high dropout; institutions with low completion; cohorts with incomplete data; records missing county/gender/contact details; duplicate learner records; completion records unmatched to registered learners; learners with no device access; learners with no regular internet access; low participation of women; low participation of persons with disabilities.

## 20. Reporting Outputs

- **20.1 Executive Brief** — one-page PDF/PowerPoint export: national progress; key wins; county coverage; inclusion metrics; completion metrics; key risks; recommended actions.
- **20.2 County Report** — county-specific: learners registered; learners completed; completion rate; gender breakdown; age group; disability inclusion; courses; cohorts; institutions; digital readiness.
- **20.3 Program Management Report** — operational: cohort-level performance; institution-level performance; course progress; data quality; learner follow-up requirements.

## 21. Success Criteria

- Consolidates all seven datasets into a single reporting model.
- Clear executive view of progress toward the 20 million target.
- National, county, sub-county, and cohort-level training progress.
- Distinguishes unique learners from enrolments and completions.
- Tracks inclusion by gender, age, disability, education, employment, geography.
- Tracks course completion and quiz performance.
- Provides a credible data quality score.
- Protects personally identifiable information.
- Usable in senior government briefings without manual Excel analysis.
- Refreshable regularly as new training data is received.

## 22. Key Business Rules

1. Unique learner count must be deduplicated.
2. Total enrolments may exceed unique learners.
3. Course completion calculated from completion data, not registration data.
4. A learner without a completion record is not counted as completed.
5. Learners with missing county count nationally but are excluded from county-level geographic analysis until resolved.
6. Executive users see aggregated data only.
7. Learner-level personal data is restricted.
8. County names must be standardized.
9. Gender values must be standardized.
10. Completion rate shown with the denominator clearly defined.
11. Progress to 20 million uses unique learners, not enrolments.
12. Data quality visible on the dashboard.
13. Dashboard numbers show last refresh date.
14. All source datasets traceable.

## 23. Open Decisions Required

1. What is the official definition of "trained"?
2. What is the official definition of "completed"?
3. What is the official definition of "certified"?
4. Is quiz average required for certification?
5. What is the pass threshold?
6. Will Microsoft Learn completion data be integrated directly?
7. Will the dashboard be internal-only or also have a public version?
8. Who will have access to learner-level data?
9. What refresh frequency is required?
10. Will national ID be stored, masked, or excluded from the dashboard model?
11. Will GPS-level maps be shown, or only county/sub-county maps?
12. What is the annual target between now and 2032?
13. Should the 20 million target count unique people only, or total course enrolments?
14. What is the official county and sub-county master list to use?
15. Who owns data quality correction?

## 24. Recommended Delivery Plan

- **Week 1: Data Discovery and Dashboard Design** — review all seven datasets; profile data quality; define master learner model; confirm KPI definitions; confirm wireframe; create data dictionary; define deduplication logic; define security roles. Outputs: data profiling report; KPI dictionary; wireframe; data model design; security and access matrix.
- **Week 2: Data Model and MVP Build** — build ingestion; clean and standardize; learner matching logic; semantic model; core dashboard pages; filters and drilldowns; data quality page. Outputs: MVP dashboard; consolidated learner model; data quality report; initial executive overview.
- **Week 3: Testing, Refinement, and Executive Readiness** — validate figures with ICTA, Microsoft, Pathways; resolve discrepancies; improve visual design; configure RBAC; prepare executive briefing version; train users. Outputs: executive-ready dashboard; user guide; data refresh guide; final KPI definitions; executive briefing export.

## 25. Recommended Development Team Roles

- **Product Owner** — business requirements; page priorities; stakeholder alignment; KPI approval.
- **Data Engineer** — ingestion; cleaning; standardization; deduplication; data model; refresh pipelines.
- **BI Developer** — dashboard design; report development; measures and calculations; filters and drilldowns; executive visual design.
- **Data Analyst / M&E Specialist** — KPI definitions; inclusion metrics; impact metrics; data validation; interpretation.
- **Security / Governance Lead** — access control; PII masking; data protection; audit requirements; user permissions.

## 26. Final Recommendation

The dashboard should be positioned as more than a reporting tool. It should become the national program intelligence layer for the ICTA–Microsoft Digital & AI Skills Training Program.

The first executive version should focus on: national reach; progress toward 20 million target; county coverage; inclusion; completion; course performance; digital readiness; data quality.

Once the MVP is stable, the dashboard should evolve into a broader Digital Skills and AI Readiness Observatory for Kenya, capable of supporting policy decisions, county-level interventions, partner reporting, and national digital transformation planning.

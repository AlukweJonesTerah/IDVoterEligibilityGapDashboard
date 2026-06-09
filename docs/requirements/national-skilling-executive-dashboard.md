# National Skilling Executive Dashboard

## Requirements & Data Points

**ICTA × Pathways Technologies × Microsoft Elevate (Smart Academy)**

**Strategic goal:** track progress to the 20 million digital-skills target by 2032 and turn skilling + infrastructure data into leadership decisions.

## 1. Purpose of the Dashboard

This is a decision-support tool for leadership (CS / PS level, the State Department for ICT & the Digital Economy / ICDE, Education leadership, and Microsoft Elevate leadership) — not just a reporting screen.

Every figure must answer one of four leadership questions:

1. How far are we toward 20 million? Total unique people skilled vs target, over time, by region and segment.
2. Who is doing the work and where? Which partners, programs, courses, counties and wards.
3. Where are the gaps? Areas with demand but no hubs, no connectivity, no partner activity, or no completions.
4. Where should the next investment, partner or hub go? Surfaced automatically from the data.

## 2. Dashboard Requirements

What the dashboard must do.

### 2.1 Views / Screens

The dashboard must provide the following views, each defaulting to the relevant leadership persona:

| View | What it shows |
| --- | --- |
| Executive Overview | Headline numbers, progress to 20M, national map, trajectory chart. |
| Geographic / Map view | Drill County → Constituency → Ward; layers for learners, sites, connectivity, partner activity, gaps. |
| Partners view | Partner list and type, region focus, contribution, concentration heat map. |
| Programs & Courses view | By program (Microsoft Elevate, Smart Academy, etc.); course categories; completion & certification. |
| Infrastructure view | Training centres, machines, connectivity, trainers / TOTs, capacity over time. |
| Beneficiaries view | Segments (government workers, TVET, students…), gender, disability, level of education. |
| Gap analysis / Priority view | Where to invest next and why (see 2.3). |

### 2.2 Filters & Interactivity

Global filters apply across all views:

- Time period (this month / quarter / year / cumulative to date).
- Geography: county, constituency, ward.
- Program, partner, course category, beneficiary segment, gender, disability status, level of education, site type.

Interaction requirements:

- Click a region on the map → all charts re-filter to that region.
- Click any chart element → drill down to the detail behind it.
- Export each view to PDF / CSV for leadership briefings.
- Mobile / tablet responsive (leadership will view on phones).

### 2.3 Decision-Support Outputs

These computed views are required, not optional — they convert the data into strategy:

- Connectivity-vs-skilling gap. For each ward, combine connectivity status, training activity and demand to flag: connectivity present but no training (deploy a partner); no connectivity but interest present (invest in connectivity); no connectivity and no skills (infrastructure-first priority).
- Hub / infrastructure coverage gap. Map of wards and constituencies with no ICT hub or training centre — the white spaces the strategy must fill.
- Partner concentration / equity. Where partners cluster vs where they are absent, so leadership can see why one region is well served and another is neglected.
- Priority-investment ranking. A ranked list / map of the next areas to invest in, combining demand, connectivity readiness, hub presence, reach gap vs target, and partner absence — with the reason shown for each.
- Target trajectory. Actual cumulative learners vs the planned curve to 20M by 2032 — on track or behind, nationally and per region / program.

## 3. Data Points

What the dashboard must capture.

Grouped into the data domains the dashboard is built on. Each group is a cluster of related data points to be collected and stored.

### 3.1 Partners — Who Is Involved and Where They Come From

- Partner name, short code / acronym.
- Partner type: ICTA (authority), funder (Microsoft), implementing partner (Pathways), training provider, TVET institution, NGO, county government, private sector, academic.
- Origin / where they come from: country / HQ, local vs international, public vs private.
- Role in this engagement: funder / implementer / delivery / host venue.
- Focus area(s): ICT foundational skills, data, AI, cybersecurity, cloud, digital literacy, entrepreneurship / work readiness.
- Parent partner (so sub-partners roll up) and active status with start / end dates.
- Metrics needed: total number of partners; partners by type; partners by region.

### 3.2 Beneficiaries / Learners — Who Is Being Trained

The people counted toward the 20M. The most important domain for accuracy.

- Unique learner identifier (critical — see note below).
- Demographics for equity: gender, age band, disability / PWD status.
- Beneficiary segment: student, youth (out of school), TVET trainee, government worker / civil servant, teacher / trainer, MSME owner / entrepreneur, jobseeker, general public, person with disability.
- Level of education at intake: none, primary, secondary, TVET / certificate, diploma, undergraduate, postgraduate.
- Employment status at intake (employed / unemployed / self-employed / student).
- Home location (county → constituency → ward) — so reach maps to where people live, not only where they trained.
- Consent flag for data use.

Avoiding double-counting toward 20M: the target must be unique people, but the same person may train under several partners, courses and sites. Without a stable unique key (e.g. a hashed National ID or phone number), totals inflate. Capture a deduplication key once per learner so the dashboard can show both seats / enrolments (gross activity) and unique learners (the official number).

### 3.3 Programs & Courses — What Is Being Taught

- Program (umbrella initiative): name (Microsoft Elevate, Smart Academy, county programs…), funder(s), objective, target number, timeframe.
- Course: title, code, category, level, duration, delivery mode (in-person / online / blended), language, certification offered (and certifying body, e.g. Microsoft), capacity per cohort.
- Course category (“ICT / data or ICT skilling”): digital literacy / foundational ICT, data & analytics, AI, cloud, cybersecurity, software / coding, networking, digital entrepreneurship / work-readiness, productivity tools.
- Course level: foundational / intermediate / advanced.
- Which partner owns / delivers which course, and which program a course belongs to.

### 3.4 Training Delivery — Sessions / Cohorts

The activity.

- Cohort / session identifier.
- Course delivered + program + delivering partner.
- Training site / location (links to 3.5).
- Start date, end date, status (planned / ongoing / completed / cancelled).
- Enrolled, attended / active, completed and certified counts — disaggregated by segment, gender, disability and education level.
- Trainer(s) assigned and funding source for the cohort.

### 3.5 Locations & Geography — Where

- Administrative hierarchy (Kenya): Country → County (47) → Constituency (290) → Ward (1,450). Every metric must roll up / drill down at each level and render on a map (each level needs coordinates / boundaries).
- Training site / centre: name; type (ICTA ICT training centre / Jitume lab / digital innovation hub / TVET / school / county centre / partner venue / online); ward + constituency + county + GPS; owner / operator; operational status; seat capacity.

### 3.6 Infrastructure & Capacity — Training Reach

Per site, the physical readiness to deliver — this drives the connectivity / gap decisions.

- Number of machines / computers: total, working, broken / needing repair.
- Connectivity: present yes/no, type (fibre / 4G / satellite / none), bandwidth, reliability / uptime, provider.
- Power: grid / solar / backup / unreliable.
- Physical seats / lab capacity and equipment condition (with last-assessment date).
- Trainers / TOTs (Trainers of Trainers): number of certified trainers per site and region; specialisations; the TOT pipeline (how many trainers have been trained to train others).
- Capacity snapshot date: store dated snapshots, not just current values, so the dashboard can show “connectivity installed → training started”.

### 3.7 Targets & Funding — The Goalposts

- Targets: the 20M national target broken down by year (trajectory to 2032), by region (county targets), by segment and per program (e.g. Microsoft Elevate’s own number) — so actual vs target is computed, not hard-coded.
- Funding / investment: amount committed and spent by funder, program and region — so leadership can compare where money went vs where reach happened.

## 4. Key Metrics / KPIs to Display

With the dimensions each should be sliced by.

| KPI | Definition | Slice by |
| --- | --- | --- |
| Unique learners skilled | Distinct learners with ≥1 completed course (the official 20M figure) | Region, segment, gender, disability, education, program, partner, time |
| Progress to 20M | Unique learners ÷ 20,000,000 | National + per region / program target |
| Enrolments (gross) | Count of enrolment records (not deduped) | Same as above |
| Completion rate | Completed ÷ enrolled | Course, partner, site, region |
| Certification rate | Certified ÷ completed | Program (esp. Microsoft Elevate) |
| Reach by region | Unique learners per county / constituency / ward | Map |
| Reach per capita | Learners ÷ population of area | Exposes under-served areas |
| Active training sites | Sites with ≥1 cohort in the period | Type, region |
| Machines available / working | Sum per site / region | Region |
| Connectivity coverage | % of sites with working connectivity | Region |
| Trainer / TOT coverage | Trainers per site / per 1,000 learners | Region |
| Partner concentration | Share of activity by top partners per region | Exposes over / under-served areas |
| Spend vs reach | Funding ÷ unique learners | Program, region |

## Lock the Controlled Lists Before Build

Agree fixed lookup lists for partner types, beneficiary segments, education levels, course categories, course levels, site types and connectivity types so reporting stays consistent across all partners.

Confirm the geography source (all 47 counties / 290 constituencies / 1,450 wards) and the learner deduplication key — the single most important decision for a credible 20M number.

# Lohverse: AI-Powered Recruitment & Online Assessment Platform

Lohverse is a highly scalable, HackerRank-style recruitment and online assessment platform. It enables candidates to update profiles, upload resumes, and solve MCQ or Monaco-editor coding assessments, while providing recruiters with robust problem banks, job posting dashboards, advanced candidate ranking systems driven by AI resume cosine matching and skill-gap set intersections, and real-time Recharts analytics pipelines.

---

## 🚀 Key Features

### 1. Security & Role-Based Access Control (RBAC)
- State-of-the-art authentication using **Flask-JWT-Extended** stateless tokens.
- Secure candidate profiles and recruiter profiles.
- Automatic routing guards for React frontends (`lohverse-portal` for candidates and `lohverse-recruiter` for administrators).

### 2. HackerRank-style Online Assessment Engine
- **Split-Screen Monaco Code Editor**: Interactive split view of questions, difficulties, problem requirements, input/output specifications, constraints, and custom test input runners.
- **Judge0 cloud integration**: Synchronous evaluation of Java, C++, Python, and Node.js code through remote APIs.
- **Safe local compilation sandboxes**: High-speed, secure local `subprocess` compilers with 3-second timeout boundaries to block infinite loops, serving as a reliable offline fallback runner.
- **MCQ test taker**: Dynamic question navigation boards, score calculations, auto-save state handlers, and auto-submit timers.

### 3. AI-Powered Candidate Screening & Ranking
- **pypdf text extraction**: Server-side parsing of uploaded PDF resume text on upload, caching parsed outputs in the database for high performance.
- **Pure Python TF-IDF Cosine Similarity**: Bag-of-words vector space matching between resume text and recruiter job descriptions with zero complex NumPy/Scikit-learn dependencies.
- **Skill Gap set analyzer**: Set intersection and differences comparison between candidate skills and job required skills, outputting matched elements, missing gaps, and match percentage.
- **Pre-calculated candidate scoring**: Algorithmic rankings calculated instantly upon application or test completion based on a weighted formula:
  $$\text{Weighted Score} = (0.3 \times \text{Resume Match}) + (0.4 \times \text{Assessment Score}) + (0.2 \times \text{Skill Match}) + (0.1 \times \text{Profile Completeness})$$

### 4. Interactive Recruiter Analytics Dashboard
- Dynamic sortable candidate ranking board filtered per job.
- Funnel and trend charts powered by **Recharts**:
  - **Weekly Trend (Area Chart)**: Candidate application counts over the last 7 days.
  - **Recruitment Funnel (Bar Chart)**: Process stage funnels (Applied $\rightarrow$ Shortlisted $\rightarrow$ Rejected).
  - **Performance Score (Bar Chart)**: Average test scores per assessment bank.
  - **Grade Distribution (Pie Chart)**: Excellent ($\ge90\%$), Good ($75-89\%$), Average ($50-74\%$), and Below Average ($<50\%$) distributions.

---

## 🛠️ Technology Stack

- **Frontend Core**: React.js (Vite), React Router DOM (v7), Axios (JWT Interceptors)
- **Frontend Assets**: Custom Premium Glassmorphic Vanilla CSS, Monaco Code Editor (`@monaco-editor/react`), Recharts Visualizations
- **Backend Core**: Flask (v3), Flask-SQLAlchemy ORM, Flask-JWT-Extended, Flask-CORS, PyMySQL, pypdf, requests
- **Database Engine**: MySQL (compatible with local or cloud databases)

---

## 📂 Folder Structure

```
c:\Lohit-files\cluade code\
├── lohverse-portal/                   # Candidate Frontend (Vite)
│   ├── src/
│   │   ├── api/axios.js               # Axios client with JWT headers
│   │   ├── context/AuthContext.jsx    # Candidate context state
│   │   ├── components/                # Route guards
│   │   ├── pages/
│   │   │   ├── student/
│   │   │   │   ├── Profile.jsx        # Candidate profile manager
│   │   │   │   ├── Resume.jsx         # PDF resume parsed skill gap view
│   │   │   │   ├── Jobs.jsx           # Apply for published jobs
│   │   │   │   ├── Assessments.jsx    # Available tests
│   │   │   │   ├── TakeAssessment.jsx # Split Screen Monaco editor test taker
│   │   │   │   └── Results.jsx        # Assessment scores and history
│   │   │   ├── StudentDashboard.jsx   # Layout shell with sidebar
│   │   │   ├── SignIn.jsx             # Login
│   │   │   ├── Register.jsx           # Sign up with PDF upload
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── App.jsx                    # Routing configuration
│   │   └── main.jsx
│   └── package.json
│
├── lohverse-recruiter/                # Recruiter Frontend (Vite)
│   ├── src/
│   │   ├── api/axios.js               # Axios client with JWT
│   │   ├── context/AuthContext.jsx    # Recruiter state
│   │   ├── pages/
│   │   │   ├── recruiter/
│   │   │   │   ├── Overview.jsx       # Recharts dashboards, top candidates
│   │   │   │   ├── Jobs.jsx           # Job board CRUD list
│   │   │   │   ├── CreateJob.jsx      # Create/Edit job posting
│   │   │   │   ├── Assessments.jsx    # Assessments list
│   │   │   │   ├── QuestionBank.jsx   # Dual MCQ / Coding Challenge Monaco builder
│   │   │   │   └── Candidates.jsx     # AI ranking selection board, skill gaps
│   │   │   ├── RecruiterDashboard.jsx # Recruiter layout shell
│   │   │   ├── RecruiterLogin.jsx
│   │   │   └── RecruiterRegister.jsx
│   │   ├── App.jsx                    # Routing mapping
│   │   └── main.jsx
│   └── package.json
│
└── lohverse-portal/backend/           # Unified Flask REST Backend
    ├── app/
    │   ├── __init__.py                # App context, auto-migrations
    │   ├── config.py                  # Dotenv configurations
    │   ├── extensions.py              # Db, Bcrypt, JWT, Cors
    │   ├── models.py                  # 12 Database schema relationships
    │   ├── utils/
    │   │   ├── ai_utils.py            # Cosine matching, pypdf text extraction
    │   │   └── code_executor.py       # Judge0 synchronizer & local subprocess runner
    │   └── routes/
    │       ├── auth.py                # Forgot/reset password & logins
    │       ├── recruiter.py           # Dashboard analytics & AI rankings APIs
    │       ├── student.py             # Resume uploads & score history APIs
    │       ├── jobs.py                # CRUD jobs & applicant management
    │       └── assessments.py         # MCQ & Monaco code run / secret evaluations
    ├── requirements.txt
    └── run.py
```

---

## 🗄️ Database Schemas (MySQL)

Lohverse automatically creates and verified tables on startup. The relational architecture comprises:
1. **`users`**: Auth details, cached `resume_text` (parsed output), phone, college, degree, cgpa, and roles (`student` | `recruiter` | `admin`).
2. **`recruiter_profiles`**: Linked company information (company name, designation, website).
3. **`jobs`**: Job details, description, experience level, salary range, status (`draft` | `published` | `closed`), and `required_skills` (comma-separated).
4. **`job_applications`**: Status trackers (`applied` | `shortlisted` | `rejected`).
5. **`assessments`**: Title, time limit, passing criteria, total score, and `assessment_type` (`mcq` | `coding` | `combined`).
6. **`questions`**: MCQ questions (four option columns and `correct_answer`).
7. **`coding_questions`**: Title, description, formats, templates (Python, JS, Java, C++), award marks, and stringified JSON array of test cases.
8. **`coding_submissions`**: Tracks candidate runs, passes, memory outputs, and status.
9. **`assessment_attempts`**: Started/completed dates, subscores (`mcq_score`, `coding_score`), overall score, pass criteria, and global rank.
10. **`candidate_rankings`**: Pre-calculated caches of match metrics (`resume_match_pct`, `skill_match_pct`, `assessment_score_pct`, `profile_completeness_pct`, `overall_score`).
11. **`password_reset_tokens`**: Time-boxed one-time tokens forforgot password resets.

---

## 💿 Installation & Developer Setup

Follow these steps to spin up the entire full-stack platform:

### 1. Backend Server Setup
Navigate into the backend directory:
```bash
cd lohverse-portal/backend
```

Create a virtual environment and activate it:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file in `lohverse-portal/backend/` and configure your credentials:
```ini
FLASK_DEBUG=true
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=lohverse_db
JWT_SECRET_KEY=lohverse-jwt-secret-key-change-me
SECRET_KEY=lohverse-flask-secret-key-change-me
FRONTEND_URL=http://localhost:5173
```

Start the Flask server:
```bash
python run.py
```
*Note: Flask automatically executes database tables validation and runs auto-schema migrations, Altering tables dynamically if necessary.*

---

### 2. Candidate Portal Setup (`lohverse-portal`)
Navigate to the portal directory and install packages:
```bash
cd lohverse-portal
npm install
```

Start the Vite candidate development server:
```bash
npm run dev
```
The portal runs on **`http://localhost:5173`**.

---

### 3. Recruiter Dashboard Setup (`lohverse-recruiter`)
Navigate to the recruiter directory and install packages:
```bash
cd lohverse-recruiter
npm install
```

Start the Vite recruiter development server:
```bash
npm run dev
```
The administrator dashboard runs on **`http://localhost:5174`** (or next available port).

---

## 🧪 Quick Test Flow (HackerRank & AI Pipeline)

1. **Recruiter Flow**:
   - Register a recruiter account on **`http://localhost:5174/register`**.
   - Create a Job Opening, adding required skills (e.g. `Python, React, SQL`).
   - Create a **Combined** or **Coding** Assessment, navigating to `Question Bank`.
   - Add a Coding Question:
     - Type inputs/outputs, starter environment Python templates.
     - Add public/secret test cases.
   - Publish the Job Posting.
2. **Candidate Flow**:
   - Register a candidate account on **`http://localhost:5173/register`** and upload a **PDF Resume**.
   - Navigate to `Profile` $\rightarrow$ complete any missing info (this builds profile completeness).
   - Go to `Jobs` $\rightarrow$ apply for the published opening. (The backend instantly extracts PDF text, performs TF-IDF similarity, intersection match percentages, and registers candidate in Candidate Rankings).
   - Go to `Assessments` $\rightarrow$ start the linked test.
   - Interact with the Monaco editor screen: run inputs $\rightarrow$ click **Submit Code Challenge**.
3. **Screening Check**:
   - The recruiter logs back in, navigates to `Candidates` $\rightarrow$ selects the job.
   - Observe the applicants ranked dynamically by **AI Overall Score** with detailed skill gap missing arrays and shortlist tags!

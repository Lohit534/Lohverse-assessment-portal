import json
from datetime import datetime
from app.extensions import db, bcrypt


class User(db.Model):
    """Student / candidate user"""
    __tablename__ = 'users'

    id           = db.Column(db.Integer, primary_key=True)
    full_name    = db.Column(db.String(120), nullable=False)
    roll_number  = db.Column(db.String(50),  nullable=False)
    phone        = db.Column(db.String(15),  nullable=False)
    address      = db.Column(db.Text,        nullable=False)

    # Academic
    college      = db.Column(db.String(200), nullable=True)
    course       = db.Column(db.String(100), nullable=True)
    branch       = db.Column(db.String(100), nullable=True)
    year         = db.Column(db.String(10),  nullable=True)
    degree       = db.Column(db.String(100), nullable=True)
    cgpa         = db.Column(db.String(10),  nullable=True)

    # Extended profile
    skills          = db.Column(db.Text, nullable=True)   # comma-separated
    certifications  = db.Column(db.Text, nullable=True)   # comma-separated
    projects        = db.Column(db.Text, nullable=True)   # JSON string
    linkedin_url    = db.Column(db.String(255), nullable=True)
    github_url      = db.Column(db.String(255), nullable=True)

    # Account
    email        = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    resume_filename = db.Column(db.String(255), nullable=True)
    resume_text     = db.Column(db.Text, nullable=True)

    # Role: 'student' | 'recruiter' | 'admin'
    role         = db.Column(db.String(20), nullable=False, default='student')
    is_active    = db.Column(db.Boolean, nullable=False, default=True)

    created_at   = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at   = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                             onupdate=datetime.utcnow)

    # ── Relationships ──
    assessments = db.relationship('AssessmentResult', backref='user', lazy=True)

    # ── Helpers ──
    def set_password(self, plain_text: str):
        self.password_hash = bcrypt.generate_password_hash(plain_text).decode('utf-8')

    def check_password(self, plain_text: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, plain_text)

    def to_dict(self):
        return {
            'id':             self.id,
            'fullName':       self.full_name,
            'rollNumber':     self.roll_number,
            'phone':          self.phone,
            'email':          self.email,
            'address':        self.address,
            'college':        self.college,
            'course':         self.course,
            'branch':         self.branch,
            'year':           self.year,
            'degree':         self.degree,
            'cgpa':           self.cgpa,
            'skills':         self.skills or '',
            'certifications': self.certifications or '',
            'projects':       self.projects or '[]',
            'linkedinUrl':    self.linkedin_url,
            'githubUrl':      self.github_url,
            'role':           self.role,
            'hasResume':      bool(self.resume_filename),
            'resumeFilename': self.resume_filename,
            'createdAt':      self.created_at.isoformat(),
        }

    def __repr__(self):
        return f'<User {self.email}>'


class AssessmentResult(db.Model):
    """Stores test results per user"""
    __tablename__ = 'assessment_results'

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    test_title    = db.Column(db.String(200), nullable=False)
    score         = db.Column(db.Integer,  nullable=True)
    total_marks   = db.Column(db.Integer,  nullable=True)
    status        = db.Column(db.String(30), nullable=False, default='pending')
    # pending | in_progress | completed
    started_at    = db.Column(db.DateTime, nullable=True)
    completed_at  = db.Column(db.DateTime, nullable=True)
    created_at    = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':          self.id,
            'testTitle':   self.test_title,
            'score':       self.score,
            'totalMarks':  self.total_marks,
            'status':      self.status,
            'startedAt':   self.started_at.isoformat() if self.started_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
        }


class RecruiterProfile(db.Model):
    """Extra profile data for recruiter users"""
    __tablename__ = 'recruiter_profiles'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    company_name = db.Column(db.String(200), nullable=False)
    designation  = db.Column(db.String(100), nullable=True)
    company_url  = db.Column(db.String(255), nullable=True)
    created_at   = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('recruiter_profile', uselist=False))

    def to_dict(self):
        return {
            'id':          self.id,
            'companyName': self.company_name,
            'designation': self.designation,
            'companyUrl':  self.company_url,
        }


# ─────────────────────────────────────────────────────────────
# NEW MODELS — Phase 1 Platform
# ─────────────────────────────────────────────────────────────

class Job(db.Model):
    """Job posting created by a recruiter"""
    __tablename__ = 'jobs'

    id               = db.Column(db.Integer, primary_key=True)
    recruiter_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title            = db.Column(db.String(200), nullable=False)
    company_name     = db.Column(db.String(200), nullable=False)
    description      = db.Column(db.Text, nullable=True)
    required_skills  = db.Column(db.Text, nullable=True)   # comma-separated
    experience       = db.Column(db.String(100), nullable=True)
    salary_range     = db.Column(db.String(100), nullable=True)
    deadline         = db.Column(db.DateTime, nullable=True)
    # status: draft | published | closed
    status           = db.Column(db.String(20), nullable=False, default='draft')
    created_at       = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                                 onupdate=datetime.utcnow)

    recruiter    = db.relationship('User', backref='jobs')
    applications = db.relationship('Application', backref='job', lazy=True, cascade='all, delete-orphan')
    assessments  = db.relationship('Assessment', backref='job', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':             self.id,
            'recruiterId':    self.recruiter_id,
            'title':          self.title,
            'companyName':    self.company_name,
            'description':    self.description,
            'requiredSkills': self.required_skills or '',
            'experience':     self.experience,
            'salaryRange':    self.salary_range,
            'deadline':       self.deadline.isoformat() if self.deadline else None,
            'status':         self.status,
            'createdAt':      self.created_at.isoformat(),
        }


class Course(db.Model):
    """Learning Course containing modules/syllabus and optional assessment links"""
    __tablename__ = 'courses'

    id           = db.Column(db.Integer, primary_key=True)
    title        = db.Column(db.String(200), nullable=False)
    description  = db.Column(db.Text, nullable=True)
    difficulty   = db.Column(db.String(30), nullable=False, default='beginner')   # beginner | intermediate | advanced
    duration     = db.Column(db.String(50), nullable=True)   # e.g. "6 hours", "4 weeks"
    instructor   = db.Column(db.String(100), nullable=True)
    image_url    = db.Column(db.String(255), nullable=True)
    syllabus     = db.Column(db.Text, nullable=True)   # JSON string of chapters
    created_at   = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    assessments  = db.relationship('Assessment', backref='course', lazy=True)

    def to_dict(self):
        try:
            syllabus_data = json.loads(self.syllabus) if self.syllabus else []
        except Exception:
            syllabus_data = []
        return {
            'id':          self.id,
            'title':       self.title,
            'description': self.description,
            'difficulty':  self.difficulty,
            'duration':    self.duration,
            'instructor':  self.instructor,
            'imageUrl':    self.image_url,
            'syllabus':    syllabus_data,
            'createdAt':   self.created_at.isoformat()
        }


class Assessment(db.Model):
    """Assessment (test) linked optionally to a job"""
    __tablename__ = 'assessments'

    id             = db.Column(db.Integer, primary_key=True)
    created_by     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_id         = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=True)
    course_id      = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True)
    title          = db.Column(db.String(200), nullable=False)
    description    = db.Column(db.Text, nullable=True)
    duration_mins  = db.Column(db.Integer, nullable=False, default=60)
    passing_marks  = db.Column(db.Integer, nullable=False, default=40)
    total_marks    = db.Column(db.Integer, nullable=False, default=100)
    assessment_type = db.Column(db.String(30), nullable=False, default='mcq') # 'mcq' | 'coding' | 'combined'
    created_at     = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at     = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                               onupdate=datetime.utcnow)

    creator   = db.relationship('User', backref='created_assessments')
    questions = db.relationship('Question', backref='assessment', lazy=True,
                                cascade='all, delete-orphan')
    coding_questions = db.relationship('CodingQuestion', backref='assessment', lazy=True,
                                       cascade='all, delete-orphan')
    attempts  = db.relationship('AssessmentAttempt', backref='assessment', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':           self.id,
            'createdBy':    self.created_by,
            'jobId':        self.job_id,
            'courseId':     self.course_id,
            'title':        self.title,
            'description':  self.description,
            'durationMins': self.duration_mins,
            'passingMarks': self.passing_marks,
            'totalMarks':   self.total_marks,
            'assessmentType': self.assessment_type,
            'questionCount': len(self.questions) + len(self.coding_questions),
            'mcqCount': len(self.questions),
            'codingCount': len(self.coding_questions),
            'createdAt':    self.created_at.isoformat(),
        }


class Question(db.Model):
    """MCQ question in an assessment"""
    __tablename__ = 'questions'

    id             = db.Column(db.Integer, primary_key=True)
    assessment_id  = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    question_text  = db.Column(db.Text, nullable=False)
    option_a       = db.Column(db.Text, nullable=False)
    option_b       = db.Column(db.Text, nullable=False)
    option_c       = db.Column(db.Text, nullable=False)
    option_d       = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False)   # 'a' | 'b' | 'c' | 'd'
    marks          = db.Column(db.Integer, nullable=False, default=1)
    created_at     = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self, include_answer=False):
        d = {
            'id':           self.id,
            'assessmentId': self.assessment_id,
            'questionText': self.question_text,
            'optionA':      self.option_a,
            'optionB':      self.option_b,
            'optionC':      self.option_c,
            'optionD':      self.option_d,
            'marks':        self.marks,
        }
        if include_answer:
            d['correctAnswer'] = self.correct_answer
        return d


class Application(db.Model):
    """Student application for a job"""
    __tablename__ = 'applications'

    id          = db.Column(db.Integer, primary_key=True)
    student_id  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_id      = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    # status: applied | shortlisted | rejected
    status      = db.Column(db.String(20), nullable=False, default='applied')
    applied_at  = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                            onupdate=datetime.utcnow)

    student = db.relationship('User', backref='applications')

    def to_dict(self):
        return {
            'id':        self.id,
            'studentId': self.student_id,
            'jobId':     self.job_id,
            'status':    self.status,
            'appliedAt': self.applied_at.isoformat(),
        }


class AssessmentAttempt(db.Model):
    """A student's attempt at an assessment"""
    __tablename__ = 'assessment_attempts'

    id            = db.Column(db.Integer, primary_key=True)
    student_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    answers       = db.Column(db.Text, nullable=True)    # JSON: {questionId: 'a'|'b'|'c'|'d'}
    score         = db.Column(db.Integer, nullable=True)
    coding_score  = db.Column(db.Integer, nullable=True, default=0)
    mcq_score     = db.Column(db.Integer, nullable=True, default=0)
    percentage    = db.Column(db.Float, nullable=True)
    correct_count = db.Column(db.Integer, nullable=True)
    wrong_count   = db.Column(db.Integer, nullable=True)
    rank          = db.Column(db.Integer, nullable=True)
    passed        = db.Column(db.Boolean, nullable=True)
    # status: in_progress | completed
    status        = db.Column(db.String(20), nullable=False, default='in_progress')
    started_at    = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    completed_at  = db.Column(db.DateTime, nullable=True)

    student = db.relationship('User', backref='attempts')
    coding_submissions = db.relationship('CodingSubmission', backref='attempt', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':           self.id,
            'studentId':    self.student_id,
            'assessmentId': self.assessment_id,
            'score':        self.score,
            'codingScore':  self.coding_score,
            'mcqScore':     self.mcq_score,
            'percentage':   self.percentage,
            'correctCount': self.correct_count,
            'wrongCount':   self.wrong_count,
            'rank':         self.rank,
            'passed':       self.passed,
            'status':       self.status,
            'startedAt':    self.started_at.isoformat(),
            'completedAt':  self.completed_at.isoformat() if self.completed_at else None,
        }


class PasswordResetToken(db.Model):
    """One-time password reset token"""
    __tablename__ = 'password_reset_tokens'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token      = db.Column(db.String(100), nullable=False, unique=True, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used       = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship('User', backref='reset_tokens')


class CodingQuestion(db.Model):
    """HackerRank-style coding question inside an assessment"""
    __tablename__ = 'coding_questions'

    id                  = db.Column(db.Integer, primary_key=True)
    assessment_id       = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    title               = db.Column(db.String(200), nullable=False)
    description         = db.Column(db.Text, nullable=False)
    difficulty          = db.Column(db.String(30), nullable=False, default='Medium') # Easy | Medium | Hard
    input_format        = db.Column(db.Text, nullable=True)
    output_format       = db.Column(db.Text, nullable=True)
    constraints         = db.Column(db.Text, nullable=True)
    sample_input        = db.Column(db.Text, nullable=True)
    sample_output       = db.Column(db.Text, nullable=True)
    test_cases          = db.Column(db.Text, nullable=False) # JSON: [{'input': '...', 'output': '...', 'is_hidden': bool}]
    template_python     = db.Column(db.Text, nullable=True)
    template_java       = db.Column(db.Text, nullable=True)
    template_cpp        = db.Column(db.Text, nullable=True)
    template_javascript = db.Column(db.Text, nullable=True)
    marks               = db.Column(db.Integer, nullable=False, default=10)
    created_at          = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    submissions = db.relationship('CodingSubmission', backref='coding_question', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_test_cases=False):
        d = {
            'id':                 self.id,
            'assessmentId':       self.assessment_id,
            'title':              self.title,
            'description':        self.description,
            'difficulty':         self.difficulty,
            'inputFormat':        self.input_format,
            'outputFormat':       self.output_format,
            'constraints':        self.constraints,
            'sampleInput':        self.sample_input,
            'sampleOutput':       self.sample_output,
            'templatePython':     self.template_python,
            'templateJava':       self.template_java,
            'templateCpp':        self.template_cpp,
            'templateJavascript': self.template_javascript,
            'marks':              self.marks,
            'createdAt':          self.created_at.isoformat(),
        }
        if include_test_cases:
            d['testCases'] = self.test_cases
        return d


class CodingSubmission(db.Model):
    """Tracks a student's compilation and runs of coding tasks"""
    __tablename__ = 'coding_submissions'

    id                 = db.Column(db.Integer, primary_key=True)
    attempt_id         = db.Column(db.Integer, db.ForeignKey('assessment_attempts.id'), nullable=False)
    coding_question_id = db.Column(db.Integer, db.ForeignKey('coding_questions.id'), nullable=False)
    code               = db.Column(db.Text, nullable=False)
    language           = db.Column(db.String(50), nullable=False) # python | javascript | cpp | java
    status             = db.Column(db.String(50), nullable=False, default='Pending') # Accepted | Wrong Answer | Compile Error | Runtime Error
    passed_cases       = db.Column(db.Integer, nullable=False, default=0)
    total_cases        = db.Column(db.Integer, nullable=False, default=0)
    score              = db.Column(db.Integer, nullable=False, default=0)
    runtime_ms         = db.Column(db.Integer, nullable=True)
    created_at         = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':               self.id,
            'attemptId':        self.attempt_id,
            'codingQuestionId': self.coding_question_id,
            'code':             self.code,
            'language':         self.language,
            'status':           self.status,
            'passedCases':      self.passed_cases,
            'totalCases':       self.total_cases,
            'score':            self.score,
            'runtimeMs':        self.runtime_ms,
            'createdAt':        self.created_at.isoformat(),
        }


class CandidateRanking(db.Model):
    """Pre-calculated AI recruiter ranking system per job posting"""
    __tablename__ = 'candidate_rankings'

    id                       = db.Column(db.Integer, primary_key=True)
    job_id                   = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    student_id               = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    resume_match_pct         = db.Column(db.Float, nullable=False, default=0.0)
    assessment_score_pct     = db.Column(db.Float, nullable=False, default=0.0)
    skill_match_pct          = db.Column(db.Float, nullable=False, default=0.0)
    profile_completeness_pct = db.Column(db.Float, nullable=False, default=0.0)
    overall_score            = db.Column(db.Float, nullable=False, default=0.0)
    updated_at               = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    job     = db.relationship('Job', backref=db.backref('rankings', cascade='all, delete-orphan'))
    student = db.relationship('User', backref=db.backref('rankings', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id':                     self.id,
            'jobId':                  self.job_id,
            'studentId':              self.student_id,
            'resumeMatchPct':         self.resume_match_pct,
            'assessmentScorePct':     self.assessment_score_pct,
            'skillMatchPct':          self.skill_match_pct,
            'profileCompletenessPct': self.profile_completeness_pct,
            'overallScore':           self.overall_score,
            'updatedAt':              self.updated_at.isoformat(),
        }


class JitsiInterview(db.Model):
    __tablename__ = 'interviews'

    id             = db.Column(db.Integer, primary_key=True)
    recruiter_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    candidate_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    room_id        = db.Column(db.String(100), unique=True, nullable=False)
    meeting_link   = db.Column(db.String(250), nullable=False)
    scheduled_date = db.Column(db.String(30), nullable=False)  # 'YYYY-MM-DD'
    scheduled_time = db.Column(db.String(30), nullable=False)  # 'HH:MM'
    status         = db.Column(db.String(30), nullable=False, default='scheduled') # scheduled | completed | cancelled
    created_at     = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    recruiter = db.relationship('User', foreign_keys=[recruiter_id], backref='recruiter_interviews')
    candidate = db.relationship('User', foreign_keys=[candidate_id], backref='candidate_interviews')

    def to_dict(self):
        return {
            'id':            self.id,
            'recruiterId':   self.recruiter_id,
            'candidateId':   self.candidate_id,
            'roomId':        self.room_id,
            'meetingLink':   self.meeting_link,
            'scheduledDate': self.scheduled_date,
            'scheduledTime': self.scheduled_time,
            'status':        self.status,
            'createdAt':     self.created_at.isoformat(),
        }


class AIInterview(db.Model):
    __tablename__ = 'ai_interviews'

    id           = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_role     = db.Column(db.String(100), nullable=False)
    skills       = db.Column(db.String(200), nullable=False)
    difficulty   = db.Column(db.String(20), nullable=False, default='Medium')
    status       = db.Column(db.String(30), nullable=False, default='pending') # pending | completed
    created_at   = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    candidate = db.relationship('User', backref='ai_interviews')

    def to_dict(self):
        return {
            'id':          self.id,
            'candidateId': self.candidate_id,
            'jobRole':     self.job_role,
            'skills':      self.skills,
            'difficulty':  self.difficulty,
            'status':      self.status,
            'createdAt':   self.created_at.isoformat(),
        }


class AIQuestion(db.Model):
    __tablename__ = 'ai_questions'

    id              = db.Column(db.Integer, primary_key=True)
    ai_interview_id = db.Column(db.Integer, db.ForeignKey('ai_interviews.id'), nullable=False)
    question_text   = db.Column(db.Text, nullable=False)
    category        = db.Column(db.String(50), nullable=False)  # technical | behavioral | hr
    expected_keywords = db.Column(db.Text, nullable=True)

    interview = db.relationship('AIInterview', backref=db.backref('questions', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id':            self.id,
            'aiInterviewId': self.ai_interview_id,
            'questionText':  self.question_text,
            'category':      self.category,
            'expectedKeywords': self.expected_keywords,
        }


class AIAnswer(db.Model):
    __tablename__ = 'ai_answers'

    id              = db.Column(db.Integer, primary_key=True)
    ai_interview_id = db.Column(db.Integer, db.ForeignKey('ai_interviews.id'), nullable=False)
    ai_question_id  = db.Column(db.Integer, db.ForeignKey('ai_questions.id'), nullable=False)
    transcript      = db.Column(db.Text, nullable=False)
    audio_duration_secs = db.Column(db.Integer, default=0)
    created_at      = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    interview = db.relationship('AIInterview', backref=db.backref('answers', cascade='all, delete-orphan'))
    question  = db.relationship('AIQuestion')

    def to_dict(self):
        return {
            'id':            self.id,
            'aiInterviewId': self.ai_interview_id,
            'aiQuestionId':  self.ai_question_id,
            'transcript':    self.transcript,
            'audioDurationSecs': self.audio_duration_secs,
            'createdAt':     self.created_at.isoformat(),
        }


class AIResult(db.Model):
    __tablename__ = 'ai_results'

    id              = db.Column(db.Integer, primary_key=True)
    ai_interview_id = db.Column(db.Integer, db.ForeignKey('ai_interviews.id'), nullable=False, unique=True)
    technical_score     = db.Column(db.Integer, nullable=False)
    communication_score = db.Column(db.Integer, nullable=False)
    confidence_score    = db.Column(db.Integer, nullable=False)
    final_recommendation = db.Column(db.String(50), nullable=False) # Strong Hire | Hire | Borderline | No Hire
    feedback_report     = db.Column(db.Text, nullable=False)
    graded_at           = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    interview = db.relationship('AIInterview', backref=db.backref('result', uselist=False, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id':                 self.id,
            'aiInterviewId':      self.ai_interview_id,
            'technicalScore':     self.technical_score,
            'communicationScore': self.communication_score,
            'confidenceScore':    self.confidence_score,
            'finalRecommendation': self.final_recommendation,
            'feedbackReport':     self.feedback_report,
            'gradedAt':           self.graded_at.isoformat(),
        }


class LiveFeedback(db.Model):
    __tablename__ = 'live_feedbacks'

    id           = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False, unique=True)
    rating       = db.Column(db.Integer, nullable=False)
    notes        = db.Column(db.Text, nullable=True)
    created_at   = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    interview = db.relationship('JitsiInterview', backref=db.backref('feedback', uselist=False, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id':          self.id,
            'interviewId': self.interview_id,
            'rating':      self.rating,
            'notes':       self.notes,
            'createdAt':   self.created_at.isoformat(),
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title      = db.Column(db.String(150), nullable=False)
    message    = db.Column(db.Text, nullable=False)
    is_read    = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notifications', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id':        self.id,
            'userId':    self.user_id,
            'title':     self.title,
            'message':   self.message,
            'isRead':    self.is_read,
            'createdAt': self.created_at.isoformat(),
        }




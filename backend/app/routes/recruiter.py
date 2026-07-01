from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, AssessmentResult, RecruiterProfile, Job, Application, Assessment, AssessmentAttempt, CandidateRanking
from app.utils.ai_utils import recalculate_candidate_ranking, calculate_skill_match

recruiter_bp = Blueprint('recruiter', __name__, url_prefix='/api/recruiter')


def require_recruiter(fn):
    """Decorator: ensures the current user has role='recruiter'"""
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user    = User.query.get(user_id)
        if not user or user.role != 'recruiter':
            return jsonify({'error': 'Recruiter access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ── GET /api/recruiter/dashboard ─────────────────────────────────────────────
@recruiter_bp.route('/dashboard', methods=['GET'])
@require_recruiter
def dashboard():
    """Summary stats for the recruiter dashboard"""
    total_students   = User.query.filter_by(role='student').count()
    total_results    = AssessmentResult.query.count()
    completed        = AssessmentResult.query.filter_by(status='completed').count()
    pending          = AssessmentResult.query.filter_by(status='pending').count()

    return jsonify({
        'totalStudents':      total_students,
        'totalAssessments':   total_results,
        'completedTests':     completed,
        'pendingTests':       pending,
    }), 200


# ── GET /api/recruiter/candidates ─────────────────────────────────────────────
@recruiter_bp.route('/candidates', methods=['GET'])
@require_recruiter
def candidates():
    """List all student candidates with optional search"""
    search = request.args.get('q', '').strip()
    query  = User.query.filter_by(role='student')

    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(
                User.full_name.like(like),
                User.email.like(like),
                User.college.like(like),
                User.branch.like(like),
            )
        )

    students = query.order_by(User.created_at.desc()).all()
    return jsonify({'candidates': [s.to_dict() for s in students]}), 200


# ── GET /api/recruiter/candidates/<id> ────────────────────────────────────────
@recruiter_bp.route('/candidates/<int:student_id>', methods=['GET'])
@require_recruiter
def candidate_detail(student_id):
    student = User.query.filter_by(id=student_id, role='student').first()
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    from app.models import AssessmentAttempt
    attempts = AssessmentAttempt.query.filter_by(student_id=student.id, status='completed').all()
    results = []
    for att in attempts:
        d = att.to_dict()
        d['testTitle'] = att.assessment.title if att.assessment else 'Assessment'
        d['totalMarks'] = att.assessment.total_marks if att.assessment else 100
        results.append(d)
        
    data    = student.to_dict()
    data['assessments'] = results
    
    # Query AI Interview results explicitly
    from app.models import AIInterview
    ai_list = []
    completed_ai = AIInterview.query.filter_by(candidate_id=student.id, status='completed').all()
    for ai_i in completed_ai:
        ai_d = ai_i.to_dict()
        ai_d['result'] = ai_i.result.to_dict() if ai_i.result else None
        ai_list.append(ai_d)
    data['aiInterviews'] = ai_list
    
    return jsonify({'candidate': data}), 200


# ── POST /api/recruiter/register ──────────────────────────────────────────────
@recruiter_bp.route('/register', methods=['POST'])
def register_recruiter():
    """Register a recruiter account"""
    body = request.get_json(silent=True) or {}
    required = ['fullName', 'email', 'password', 'companyName']
    missing  = [f for f in required if not body.get(f)]
    if missing:
        return jsonify({'error': f'Missing: {", ".join(missing)}'}), 400

    if User.query.filter_by(email=body['email'].lower().strip()).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        full_name   = body['fullName'].strip(),
        roll_number = 'RECRUITER',
        phone       = body.get('phone', ''),
        address     = body.get('address', ''),
        email       = body['email'].lower().strip(),
        role        = 'recruiter',
    )
    user.set_password(body['password'])
    db.session.add(user)
    db.session.flush()   # get user.id before commit

    profile = RecruiterProfile(
        user_id      = user.id,
        company_name = body['companyName'].strip(),
        designation  = body.get('designation', ''),
        company_url  = body.get('companyUrl', ''),
    )
    db.session.add(profile)
    db.session.commit()

    from flask_jwt_extended import create_access_token, create_refresh_token
    return jsonify({
        'message':      'Recruiter registered',
        'user':         user.to_dict(),
        'accessToken':  create_access_token(identity=str(user.id)),
        'refreshToken': create_refresh_token(identity=str(user.id)),
    }), 201


# ── GET /api/recruiter/jobs/<id>/rankings ─────────────────────
@recruiter_bp.route('/jobs/<int:job_id>/rankings', methods=['GET'])
@require_recruiter
def job_rankings(job_id):
    """List and rank candidates for a job using the AI scoring algorithm"""
    job = Job.query.get_or_404(job_id)
    applications = Application.query.filter_by(job_id=job_id).all()

    # Recalculate ranking for each applicant dynamically to capture profile or test score updates
    for app in applications:
        try:
            recalculate_candidate_ranking(app.student_id, job_id)
        except Exception as e:
            print(f"Error recalculating ranking for student {app.student_id}: {e}")

    # Query sorted rankings
    rankings = CandidateRanking.query.filter_by(job_id=job_id).order_by(CandidateRanking.overall_score.desc()).all()
    
    result = []
    for r in rankings:
        student = r.student
        if not student:
            continue
            
        d = r.to_dict()
        d['student'] = student.to_dict()
        
        # Calculate detailed skill gaps
        matched, missing, coverage = calculate_skill_match(job.required_skills, student.skills or "")
        d['skillsGap'] = {
            'matchedSkills': matched,
            'missingSkills': missing,
            'skillCoveragePct': coverage
        }
        
        # Add application details (e.g. status)
        app = Application.query.filter_by(job_id=job_id, student_id=student.id).first()
        d['applicationStatus'] = app.status if app else 'applied'
        
        result.append(d)
        
    return jsonify({'rankings': result, 'job': job.to_dict()}), 200


# ── GET /api/recruiter/dashboard/analytics ────────────────────
@recruiter_bp.route('/dashboard/analytics', methods=['GET'])
@require_recruiter
def recruiter_analytics():
    """Returns rich data structures for Recharts visualization in the recruiter portal"""
    from datetime import datetime, timedelta
    
    # 1. High-level metric counts
    total_candidates = User.query.filter_by(role='student').count()
    total_jobs       = Job.query.count()
    total_apps       = Application.query.count()
    total_assessments= Assessment.query.count()
    
    # 2. Hiring Funnel
    applied_count     = Application.query.filter_by(status='applied').count()
    shortlisted_count = Application.query.filter_by(status='shortlisted').count()
    rejected_count    = Application.query.filter_by(status='rejected').count()
    
    funnel_data = [
        {'stage': 'Applied', 'count': applied_count + shortlisted_count + rejected_count},
        {'stage': 'Shortlisted', 'count': shortlisted_count},
        {'stage': 'Rejected', 'count': rejected_count}
    ]
    
    # 3. Assessment Performance Analytics
    assessments = Assessment.query.all()
    assessments_chart = []
    for a in assessments:
        attempts = AssessmentAttempt.query.filter_by(assessment_id=a.id, status='completed').all()
        avg_score = 0
        if attempts:
            scores = [at.percentage for at in attempts if at.percentage is not None]
            avg_score = round(sum(scores) / len(scores), 2) if scores else 0
            
        assessments_chart.append({
            'name': a.title,
            'avgScore': avg_score,
            'attempts': len(attempts)
        })
        
    # 4. Score distribution (Pie Chart)
    all_attempts = AssessmentAttempt.query.filter_by(status='completed').all()
    dist = {'Excellent (>=90%)': 0, 'Good (75-89%)': 0, 'Average (50-74%)': 0, 'Below Average (<50%)': 0}
    for at in all_attempts:
        pct = at.percentage or 0.0
        if pct >= 90:
            dist['Excellent (>=90%)'] += 1
        elif pct >= 75:
            dist['Good (75-89%)'] += 1
        elif pct >= 50:
            dist['Average (50-74%)'] += 1
        else:
            dist['Below Average (<50%)'] += 1
            
    distribution_data = [{'name': k, 'value': v} for k, v in dist.items() if v > 0]
    if not distribution_data:
        distribution_data = [{'name': 'No Data', 'value': 0}]
        
    # 5. Top 5 Ranked Candidates
    top_rankings = CandidateRanking.query.order_by(CandidateRanking.overall_score.desc()).limit(5).all()
    top_candidates = []
    for r in top_rankings:
        if r.student:
            top_candidates.append({
                'name': r.student.full_name,
                'score': r.overall_score,
                'college': r.student.college or 'Unknown'
            })
            
    # 6. Weekly Applications Trend (Line Chart)
    today = datetime.utcnow().date()
    trends = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime('%a') # Mon, Tue, etc.
        cnt = Application.query.filter(
            db.func.date(Application.applied_at) == day
        ).count()
        trends.append({'day': day_str, 'applications': cnt})
        
    return jsonify({
        'counts': {
            'totalCandidates': total_candidates,
            'totalJobs': total_jobs,
            'totalApplications': total_apps,
            'totalAssessments': total_assessments
        },
        'funnel': funnel_data,
        'assessments': assessments_chart,
        'distribution': distribution_data,
        'topCandidates': top_candidates,
        'trends': trends
    }), 200


# ── GET /api/recruiter/interviews ───────────────────────────────
@recruiter_bp.route('/interviews', methods=['GET'])
@require_recruiter
def list_interviews():
    from app.models import JitsiInterview, Application, Job
    user_id = int(get_jwt_identity())
    interviews = JitsiInterview.query.filter_by(recruiter_id=user_id).order_by(JitsiInterview.scheduled_date.desc(), JitsiInterview.scheduled_time.desc()).all()
    
    result = []
    for i in interviews:
        d = i.to_dict()
        d['candidateName'] = i.candidate.full_name if i.candidate else 'Candidate'
        d['candidateEmail'] = i.candidate.email if i.candidate else ''
        d['feedback'] = i.feedback.to_dict() if i.feedback else None
        
        # Find applications for this candidate that belong to this recruiter's jobs
        apps = Application.query.join(Job).filter(
            Application.student_id == i.candidate_id,
            Job.recruiter_id == user_id
        ).all()
        d['applications'] = [{
            'id': app.id,
            'jobId': app.job_id,
            'jobTitle': app.job.title if app.job else 'Job',
            'status': app.status
        } for app in apps]
        
        result.append(d)
        
    return jsonify({'interviews': result}), 200


# ── POST /api/recruiter/interviews ──────────────────────────────
@recruiter_bp.route('/interviews', methods=['POST'])
@require_recruiter
def schedule_interview():
    import uuid
    from app.models import JitsiInterview, Notification
    user_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}
    
    required = ['candidateId', 'scheduledDate', 'scheduledTime']
    missing  = [f for f in required if not body.get(f)]
    if missing:
        return jsonify({'error': f'Missing: {", ".join(missing)}'}), 400
        
    candidate_id = int(body['candidateId'])
    candidate = User.query.filter_by(id=candidate_id, role='student').first()
    if not candidate:
        return jsonify({'error': 'Candidate not found'}), 404
        
    room_id = f"lohverse-meeting-{uuid.uuid4().hex[:12]}"
    meeting_link = f"https://meet.jit.si/{room_id}"
    
    interview = JitsiInterview(
        recruiter_id   = user_id,
        candidate_id   = candidate_id,
        room_id        = room_id,
        meeting_link   = meeting_link,
        scheduled_date = body['scheduledDate'],
        scheduled_time = body['scheduledTime'],
        status         = 'scheduled'
    )
    db.session.add(interview)
    
    # Add candidate notification
    notification = Notification(
        user_id = candidate_id,
        title = "New Video Interview Scheduled",
        message = f"You have been scheduled for a one-to-one video interview round on {body['scheduledDate']} at {body['scheduledTime']}."
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'message': 'Interview scheduled successfully', 'interview': interview.to_dict()}), 201


# ── PUT /api/recruiter/interviews/<int:interview_id>/feedback ────
@recruiter_bp.route('/interviews/<int:interview_id>/feedback', methods=['PUT'])
@require_recruiter
def submit_interview_feedback(interview_id):
    from app.models import JitsiInterview, LiveFeedback
    body = request.get_json(silent=True) or {}
    rating = body.get('rating')
    notes = body.get('notes', '')
    
    if rating is None:
        return jsonify({'error': 'rating is required'}), 400
        
    interview = JitsiInterview.query.get_or_404(interview_id)
    interview.status = 'completed'
    
    fb = LiveFeedback.query.filter_by(interview_id=interview_id).first()
    if not fb:
        fb = LiveFeedback(interview_id=interview_id, rating=int(rating), notes=notes)
        db.session.add(fb)
    else:
        fb.rating = int(rating)
        fb.notes = notes
        
    db.session.commit()
    return jsonify({'message': 'Feedback submitted successfully', 'feedback': fb.to_dict()}), 200


# ── DELETE /api/recruiter/interviews/<int:interview_id> ───────────
@recruiter_bp.route('/interviews/<int:interview_id>', methods=['DELETE'])
@require_recruiter
def delete_interview(interview_id):
    from app.models import JitsiInterview
    user_id = int(get_jwt_identity())
    interview = JitsiInterview.query.filter_by(id=interview_id, recruiter_id=user_id).first_or_404()
    
    db.session.delete(interview)
    db.session.commit()
    return jsonify({'message': 'Scheduled interview deleted successfully'}), 200



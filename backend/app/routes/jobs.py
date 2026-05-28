from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.models import User, Job, Application, Assessment, AssessmentAttempt
from app.utils.ai_utils import recalculate_candidate_ranking

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')


def _require_recruiter():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user or user.role != 'recruiter':
        return None, (jsonify({'error': 'Recruiter access required'}), 403)
    return user, None


# ── GET /api/jobs/ — public: list published jobs ──────────────
@jobs_bp.route('/', methods=['GET'])
@jwt_required(optional=True)
def list_jobs():
    q      = request.args.get('q', '').strip()
    status = request.args.get('status', 'published')

    query = Job.query.filter_by(status=status)
    if q:
        like = f'%{q}%'
        query = query.filter(
            db.or_(
                Job.title.like(like),
                Job.company_name.like(like),
                Job.required_skills.like(like),
            )
        )

    jobs = query.order_by(Job.created_at.desc()).all()
    result = []
    for job in jobs:
        d = job.to_dict()
        d['applicationCount'] = len(job.applications)
        result.append(d)

    return jsonify({'jobs': result}), 200


# ── GET /api/jobs/<id> ────────────────────────────────────────
@jobs_bp.route('/<int:job_id>', methods=['GET'])
@jwt_required(optional=True)
def get_job(job_id):
    job = Job.query.get_or_404(job_id)
    d   = job.to_dict()
    d['applicationCount'] = len(job.applications)
    d['assessments']      = [a.to_dict() for a in job.assessments]
    return jsonify({'job': d}), 200


# ── POST /api/jobs/ — recruiter creates a job ─────────────────
@jobs_bp.route('/', methods=['POST'])
@jwt_required()
def create_job():
    user, err = _require_recruiter()
    if err:
        return err

    body     = request.get_json(silent=True) or {}
    required = ['title', 'companyName']
    missing  = [f for f in required if not body.get(f)]
    if missing:
        return jsonify({'error': f'Missing: {", ".join(missing)}'}), 400

    deadline = None
    if body.get('deadline'):
        try:
            deadline = datetime.fromisoformat(body['deadline'])
        except ValueError:
            return jsonify({'error': 'Invalid deadline format (use ISO 8601)'}), 400

    job = Job(
        recruiter_id    = user.id,
        title           = body['title'].strip(),
        company_name    = body['companyName'].strip(),
        description     = body.get('description', '').strip(),
        required_skills = body.get('requiredSkills', '').strip(),
        experience      = body.get('experience', '').strip(),
        salary_range    = body.get('salaryRange', '').strip(),
        deadline        = deadline,
        status          = body.get('status', 'draft'),
    )
    db.session.add(job)
    db.session.commit()
    return jsonify({'message': 'Job created', 'job': job.to_dict()}), 201


# ── PUT /api/jobs/<id> — recruiter edits a job ───────────────
@jobs_bp.route('/<int:job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    user, err = _require_recruiter()
    if err:
        return err

    job = Job.query.filter_by(id=job_id, recruiter_id=user.id).first()
    if not job:
        return jsonify({'error': 'Job not found or access denied'}), 404

    body = request.get_json(silent=True) or {}
    updatable_map = {
        'title':          'title',
        'companyName':    'company_name',
        'description':    'description',
        'requiredSkills': 'required_skills',
        'experience':     'experience',
        'salaryRange':    'salary_range',
        'status':         'status',
    }

    for key, attr in updatable_map.items():
        if key in body:
            setattr(job, attr, body[key])

    if 'deadline' in body:
        try:
            job.deadline = datetime.fromisoformat(body['deadline']) if body['deadline'] else None
        except ValueError:
            return jsonify({'error': 'Invalid deadline format'}), 400

    db.session.commit()
    return jsonify({'message': 'Job updated', 'job': job.to_dict()}), 200


# ── DELETE /api/jobs/<id> ─────────────────────────────────────
@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    user, err = _require_recruiter()
    if err:
        return err

    job = Job.query.filter_by(id=job_id, recruiter_id=user.id).first()
    if not job:
        return jsonify({'error': 'Job not found or access denied'}), 404

    db.session.delete(job)
    db.session.commit()
    return jsonify({'message': 'Job deleted'}), 200


# ── POST /api/jobs/<id>/apply — student applies ───────────────
@jobs_bp.route('/<int:job_id>/apply', methods=['POST'])
@jwt_required()
def apply_job(job_id):
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user or user.role != 'student':
        return jsonify({'error': 'Student access required'}), 403

    job = Job.query.filter_by(id=job_id, status='published').first()
    if not job:
        return jsonify({'error': 'Job not found or not available'}), 404

    existing = Application.query.filter_by(student_id=user_id, job_id=job_id).first()
    if existing:
        return jsonify({'error': 'Already applied to this job'}), 409

    application = Application(student_id=user_id, job_id=job_id)
    db.session.add(application)
    db.session.commit()

    # Precompute and cache candidate overall ranking score
    try:
        recalculate_candidate_ranking(user_id, job_id)
    except Exception as e:
        print(f"Error calculating candidate ranking: {e}")

    return jsonify({'message': 'Applied successfully', 'application': application.to_dict()}), 201


# ── GET /api/jobs/<id>/applicants — recruiter views ───────────
@jobs_bp.route('/<int:job_id>/applicants', methods=['GET'])
@jwt_required()
def job_applicants(job_id):
    user, err = _require_recruiter()
    if err:
        return err

    job = Job.query.filter_by(id=job_id, recruiter_id=user.id).first()
    if not job:
        return jsonify({'error': 'Job not found or access denied'}), 404

    result = []
    for app in job.applications:
        d        = app.to_dict()
        d['student'] = app.student.to_dict() if app.student else None
        result.append(d)

    return jsonify({'applicants': result, 'job': job.to_dict()}), 200


# ── PUT /api/jobs/<id>/applicants/<student_id> — shortlist/reject
@jobs_bp.route('/<int:job_id>/applicants/<int:student_id>', methods=['PUT'])
@jwt_required()
def update_applicant_status(job_id, student_id):
    user, err = _require_recruiter()
    if err:
        return err

    job = Job.query.filter_by(id=job_id, recruiter_id=user.id).first()
    if not job:
        return jsonify({'error': 'Job not found or access denied'}), 404

    body   = request.get_json(silent=True) or {}
    status = body.get('status', '').lower()
    if status not in ('applied', 'shortlisted', 'rejected'):
        return jsonify({'error': 'status must be applied|shortlisted|rejected'}), 400

    app = Application.query.filter_by(student_id=student_id, job_id=job_id).first()
    if not app:
        return jsonify({'error': 'Application not found'}), 404

    app.status = status
    db.session.commit()
    return jsonify({'message': f'Candidate {status}', 'application': app.to_dict()}), 200


# ── GET /api/jobs/recruiter/all — recruiter sees own jobs ─────
@jobs_bp.route('/recruiter/all', methods=['GET'])
@jwt_required()
def recruiter_jobs():
    user, err = _require_recruiter()
    if err:
        return err


    jobs = Job.query.filter_by(recruiter_id=user.id).order_by(Job.created_at.desc()).all()
    result = []
    for job in jobs:
        d = job.to_dict()
        d['applicationCount'] = len(job.applications)
        result.append(d)

    return jsonify({'jobs': result}), 200


# ── POST /api/jobs/<id>/bulk-import — import candidates by email list ──
@jobs_bp.route('/<int:job_id>/bulk-import', methods=['POST'])
@jwt_required()
def bulk_import_candidates(job_id):
    """Recruiter uploads a list of candidate emails to auto-create applications for a job"""
    user, err = _require_recruiter()
    if err:
        return err

    job = Job.query.filter_by(id=job_id, recruiter_id=user.id).first()
    if not job:
        return jsonify({'error': 'Job not found or access denied'}), 404

    body = request.get_json(silent=True) or {}
    emails = body.get('emails', [])  # list of email strings

    if not emails or not isinstance(emails, list):
        return jsonify({'error': 'emails must be a non-empty list of strings'}), 400

    imported = []
    skipped  = []
    not_found = []

    for raw_email in emails:
        email = str(raw_email).strip().lower()
        if not email:
            continue

        student = User.query.filter_by(email=email, role='student').first()
        if not student:
            not_found.append(email)
            continue

        existing = Application.query.filter_by(student_id=student.id, job_id=job_id).first()
        if existing:
            skipped.append(email)
            continue

        application = Application(student_id=student.id, job_id=job_id, status='applied')
        db.session.add(application)
        imported.append(email)

        # Trigger ranking computation
        try:
            recalculate_candidate_ranking(student.id, job_id)
        except Exception:
            pass

        # Send notification
        try:
            from app.models import Notification
            n = Notification(
                user_id = student.id,
                title   = f"You have been invited to apply for {job.title}",
                message = f"{job.company_name} has added you as a candidate for '{job.title}'. Please login to complete your application and assessment."
            )
            db.session.add(n)
        except Exception:
            pass

    db.session.commit()

    return jsonify({
        'message':  f'{len(imported)} candidates imported successfully',
        'imported': imported,
        'skipped':  skipped,
        'notFound': not_found,
    }), 200


# ── GET /api/jobs/<id>/applicants-detailed — full per-job applicant list ──
@jobs_bp.route('/<int:job_id>/applicants-detailed', methods=['GET'])
@jwt_required()
def job_applicants_detailed(job_id):
    """Returns applicants with their assessment attempt status for a job"""
    user, err = _require_recruiter()
    if err:
        return err

    job = Job.query.filter_by(id=job_id, recruiter_id=user.id).first()
    if not job:
        return jsonify({'error': 'Job not found or access denied'}), 404

    # Get assessments linked to this job
    assessments = Assessment.query.filter_by(job_id=job_id).all()

    result = []
    for app in job.applications:
        student = app.student
        if not student:
            continue

        d = app.to_dict()
        d['student'] = student.to_dict()

        # Compute assessment status for each student
        assessment_data = []
        for a in assessments:
            attempt = AssessmentAttempt.query.filter_by(
                student_id=student.id,
                assessment_id=a.id
            ).order_by(AssessmentAttempt.started_at.desc()).first()

            assessment_data.append({
                'assessmentId':    a.id,
                'assessmentTitle': a.title,
                'durationMins':    a.duration_mins,
                'passingMarks':    a.passing_marks,
                'totalMarks':      a.total_marks,
                'attemptStatus':   attempt.status if attempt else 'not_started',
                'score':           attempt.score if attempt else None,
                'percentage':      attempt.percentage if attempt else None,
                'passed':          attempt.passed if attempt else None,
                'completedAt':     attempt.completed_at.isoformat() if (attempt and attempt.completed_at) else None,
                'scheduledAt':     a.scheduled_at.isoformat() if (hasattr(a, 'scheduled_at') and a.scheduled_at) else None,
            })

        d['assessments'] = assessment_data
        d['hasAssessment'] = len(assessments) > 0
        d['assessmentPassed'] = any(ad['passed'] for ad in assessment_data if ad['passed'])
        result.append(d)

    return jsonify({
        'applicants': result,
        'job': job.to_dict(),
        'assessmentCount': len(assessments)
    }), 200

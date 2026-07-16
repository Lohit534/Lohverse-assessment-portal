import os
import json
from flask import Blueprint, request, jsonify, redirect, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import User, Application, AssessmentAttempt, Assessment, Job, CandidateRanking
from app.utils.ai_utils import extract_text_from_pdf, recalculate_candidate_ranking, calculate_skill_match
import cloudinary.uploader
import tempfile

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

ALLOWED_EXTS    = {'pdf'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTS


def _current_student():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user or user.role != 'student':
        return None, jsonify({'error': 'Student access required'}), 403
    return user, None, None


# ── GET /api/student/profile ─────────────────────────────────
@student_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


# ── PUT /api/student/profile ─────────────────────────────────
@student_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    body = request.get_json(silent=True) or {}
    updatable = [
        'fullName', 'phone', 'address', 'college', 'course',
        'branch', 'year', 'degree', 'cgpa',
        'skills', 'certifications', 'projects',
        'linkedinUrl', 'githubUrl'
    ]
    field_map = {
        'fullName':       'full_name',
        'phone':          'phone',
        'address':        'address',
        'college':        'college',
        'course':         'course',
        'branch':         'branch',
        'year':           'year',
        'degree':         'degree',
        'cgpa':           'cgpa',
        'skills':         'skills',
        'certifications': 'certifications',
        'projects':       'projects',
        'linkedinUrl':    'linkedin_url',
        'githubUrl':      'github_url',
    }

    for key in updatable:
        if key in body:
            value = body[key]
            # serialize lists/dicts for JSON columns
            if isinstance(value, (list, dict)):
                value = json.dumps(value)
            setattr(user, field_map[key], value)

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200


# ── POST /api/student/resume ─────────────────────────────────
@student_bp.route('/resume', methods=['POST'])
@jwt_required()
def upload_resume():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Verify Cloudinary configuration variables
    cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME')
    api_key    = current_app.config.get('CLOUDINARY_API_KEY')
    api_secret = current_app.config.get('CLOUDINARY_API_SECRET')
    if not cloud_name or not api_key or not api_secret:
        return jsonify({
            'error': 'Cloudinary is not configured on the server. Please set the environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
        }), 500

    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided'}), 400

    file = request.files['resume']
    if not file or not file.filename:
        return jsonify({'error': 'Empty file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    # Check file size (5MB maximum)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > 5 * 1024 * 1024:
        return jsonify({'error': 'File size exceeds maximum limit of 5MB'}), 400

    # Extract PDF text in-memory
    file.seek(0)
    extracted_text = extract_text_from_pdf(file)

    # Upload to Cloudinary
    import cloudinary.uploader
    file.seek(0)
    try:
        upload_result = cloudinary.uploader.upload(
            file,
            resource_type="auto",
            folder="lohverse/resumes",
            public_id=f"{user.email.split('@')[0]}_resume"
        )
        secure_url = upload_result.get("secure_url")
    except Exception as e:
        return jsonify({'error': f'Cloudinary upload failed: {str(e)}'}), 500

    user.resume_filename = secure_url
    user.resume_text     = extracted_text
    db.session.commit()

    return jsonify({'message': 'Resume uploaded', 'filename': secure_url}), 200


# ── GET /api/student/resume ──────────────────────────────────
@student_bp.route('/resume', methods=['GET'])
@jwt_required()
def download_resume():
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    if current_user.role == 'recruiter':
        target_id = request.args.get('userId')
        if not target_id:
            return jsonify({'error': 'userId parameter is required for recruiters'}), 400
        user = User.query.filter_by(id=int(target_id), role='student').first()
        if not user:
            return jsonify({'error': 'Candidate student not found'}), 404
    else:
        user = current_user

    if not user or not user.resume_filename:
        return jsonify({'error': 'No resume found'}), 404

    # Stream the PDF file from Cloudinary directly to bypass CORS redirect issues with Authorization headers
    import requests
    from flask import Response

    try:
        r = requests.get(user.resume_filename, stream=True)
        r.raise_for_status()

        def generate():
            for chunk in r.iter_content(chunk_size=4096):
                yield chunk

        headers = {
            'Content-Type': 'application/pdf',
            'Content-Disposition': f'attachment; filename="{user.full_name}_Resume.pdf"'
        }
        return Response(generate(), headers=headers)
    except Exception as e:
        # Fall back to redirect if streaming fails
        return redirect(user.resume_filename)


# ── GET /api/student/resume/view ─────────────────────────────
@student_bp.route('/resume/view', methods=['GET'])
@jwt_required()
def view_resume():
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    if current_user.role == 'recruiter':
        target_id = request.args.get('userId')
        if not target_id:
            return jsonify({'error': 'userId parameter is required for recruiters'}), 400
        user = User.query.filter_by(id=int(target_id), role='student').first()
        if not user:
            return jsonify({'error': 'Candidate student not found'}), 404
    else:
        user = current_user

    if not user or not user.resume_filename:
        return jsonify({'error': 'No resume found'}), 404

    # Stream the PDF file from Cloudinary inline directly
    import requests
    from flask import Response

    try:
        r = requests.get(user.resume_filename, stream=True)
        r.raise_for_status()

        def generate():
            for chunk in r.iter_content(chunk_size=4096):
                yield chunk

        headers = {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline'
        }
        return Response(generate(), headers=headers)
    except Exception as e:
        # Fall back to redirect if streaming fails
        return redirect(user.resume_filename)


# ── GET /api/student/applications ────────────────────────────
@student_bp.route('/applications', methods=['GET'])
@jwt_required()
def my_applications():
    from app.models import Assessment, AssessmentAttempt
    user_id = int(get_jwt_identity())
    apps    = Application.query.filter_by(student_id=user_id).all()

    result = []
    for app in apps:
        d = app.to_dict()
        d['job'] = app.job.to_dict() if app.job else None
        
        # Check if there are assessments associated with this job
        assessments = Assessment.query.filter_by(job_id=app.job_id).all()
        has_assessment = len(assessments) > 0
        passed_assessment = False
        
        if has_assessment:
            # Check if student completed and passed at least one assessment for this job
            for a in assessments:
                attempt = AssessmentAttempt.query.filter_by(
                    student_id=user_id,
                    assessment_id=a.id,
                    status='completed',
                    passed=True
                ).first()
                if attempt:
                    passed_assessment = True
                    break
        
        d['hasAssessment'] = has_assessment
        d['assessmentPassed'] = passed_assessment
        result.append(d)

    return jsonify({'applications': result}), 200


# ── GET /api/student/results ──────────────────────────────────
@student_bp.route('/results', methods=['GET'])
@jwt_required()
def my_results():
    user_id  = int(get_jwt_identity())
    attempts = AssessmentAttempt.query.filter_by(
        student_id=user_id, status='completed'
    ).order_by(AssessmentAttempt.completed_at.desc()).all()

    result = []
    for attempt in attempts:
        d = attempt.to_dict()
        if attempt.assessment:
            d['assessment'] = attempt.assessment.to_dict()
            if attempt.assessment.job:
                d['assessment']['job'] = attempt.assessment.job.to_dict()
        result.append(d)

    return jsonify({'results': result}), 200


# ── GET /api/student/ai-ranking/<job_id> ─────────────────────
@student_bp.route('/ai-ranking/<int:job_id>', methods=['GET'])
@jwt_required()
def my_ai_ranking(job_id):
    """Return AI ranking data for the current student against a specific job."""
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user or user.role != 'student':
        return jsonify({'error': 'Student access required'}), 403

    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    # Check student applied to this job
    app = Application.query.filter_by(student_id=user_id, job_id=job_id).first()
    if not app:
        return jsonify({'error': 'You have not applied to this job'}), 403

    # Trigger AI recalculation
    try:
        rank_entry = recalculate_candidate_ranking(user_id, job_id)
    except Exception as e:
        return jsonify({'error': f'AI analysis failed: {str(e)}'}), 500

    if not rank_entry:
        return jsonify({'error': 'Could not generate ranking'}), 500

    # Build skill gap details
    matched, missing, coverage = calculate_skill_match(
        job.required_skills or '', user.skills or ''
    )

    return jsonify({
        'overallScore':            rank_entry.overall_score,
        'resumeMatchPct':          rank_entry.resume_match_pct,
        'assessmentScorePct':      rank_entry.assessment_score_pct,
        'skillMatchPct':           rank_entry.skill_match_pct,
        'profileCompletenessPct':  rank_entry.profile_completeness_pct,
        'skillsGap': {
            'matchedSkills':    matched,
            'missingSkills':    missing,
            'skillCoveragePct': coverage,
        },
        'job': job.to_dict(),
    }), 200


# ── GET /api/student/interviews ───────────────────────────────
@student_bp.route('/interviews', methods=['GET'])
@jwt_required()
def list_interviews():
    from app.models import JitsiInterview
    user_id = int(get_jwt_identity())
    interviews = JitsiInterview.query.filter_by(candidate_id=user_id).order_by(JitsiInterview.scheduled_date.asc(), JitsiInterview.scheduled_time.asc()).all()
    
    result = []
    for i in interviews:
        d = i.to_dict()
        d['recruiterName'] = i.recruiter.full_name if i.recruiter else 'Recruiter'
        d['companyName'] = i.recruiter.recruiter_profile.company_name if (i.recruiter and i.recruiter.recruiter_profile) else 'Lohverse Partner'
        d['feedback'] = i.feedback.to_dict() if i.feedback else None
        result.append(d)
        
    return jsonify({'interviews': result}), 200


# ── GET /api/student/notifications ───────────────────────────
@student_bp.route('/notifications', methods=['GET'])
@jwt_required()
def list_notifications():
    from app.models import Notification
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify({'notifications': [n.to_dict() for n in notifs]}), 200


# ── PUT /api/student/notifications/read ──────────────────────
@student_bp.route('/notifications/read', methods=['PUT'])
@jwt_required()
def read_notifications():
    from app.models import db, Notification
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({Notification.is_read: True})
    db.session.commit()
    return jsonify({'message': 'Notifications marked as read'}), 200


# ── POST /api/student/ai-interview/start ────────────────────────
@student_bp.route('/ai-interview/start', methods=['POST'])
@jwt_required()
def start_ai_interview_session():
    from app.models import AIInterview, AIQuestion
    from app.utils.ai_interview_grading import generate_ai_interview_questions
    user_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}
    
    job_role = body.get('jobRole', 'Software Engineer').strip()
    skills = body.get('skills', 'Java, Python, Javascript').strip()
    difficulty = body.get('difficulty', 'Medium').strip()
    
    interview = AIInterview(
        candidate_id = user_id,
        job_role     = job_role,
        skills       = skills,
        difficulty   = difficulty,
        status       = 'pending'
    )
    db.session.add(interview)
    db.session.flush() # get interview.id
    
    # Generate verbal questions
    questions = generate_ai_interview_questions(job_role, skills, difficulty)
    
    saved_qs = []
    for q in questions:
        ai_q = AIQuestion(
            ai_interview_id = interview.id,
            question_text   = q['questionText'],
            category        = q['category'],
            expected_keywords = q.get('expectedKeywords', '')
        )
        db.session.add(ai_q)
        saved_qs.append(ai_q)
        
    db.session.commit()
    
    return jsonify({
        'message': 'AI Interview started successfully',
        'interview': interview.to_dict(),
        'questions': [q.to_dict() for q in saved_qs]
    }), 201


# ── POST /api/student/ai-interview/<int:interview_id>/submit-answer ──
@student_bp.route('/ai-interview/<int:interview_id>/submit-answer', methods=['POST'])
@jwt_required()
def submit_ai_answer(interview_id):
    from app.models import AIAnswer
    user_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}
    
    question_id = body.get('questionId')
    transcript = body.get('transcript', '').strip()
    duration = int(body.get('duration', 0))
    
    if not question_id or not transcript:
        return jsonify({'error': 'questionId and transcript are required'}), 400
        
    # Save answer to DB
    ans = AIAnswer.query.filter_by(ai_interview_id=interview_id, ai_question_id=question_id).first()
    if not ans:
        ans = AIAnswer(
            ai_interview_id = interview_id,
            ai_question_id  = question_id,
            transcript      = transcript,
            audio_duration_secs = duration
        )
        db.session.add(ans)
    else:
        ans.transcript = transcript
        ans.audio_duration_secs = duration
        
    db.session.commit()
    return jsonify({'message': 'Answer submitted successfully', 'answer': ans.to_dict()}), 200


# ── POST /api/student/ai-interview/<int:interview_id>/finalize ──
@student_bp.route('/ai-interview/<int:interview_id>/finalize', methods=['POST'])
@jwt_required()
def finalize_ai_interview(interview_id):
    from app.models import AIInterview, AIResult
    from app.utils.ai_interview_grading import evaluate_ai_interview
    user_id = int(get_jwt_identity())
    
    interview = AIInterview.query.filter_by(id=interview_id, candidate_id=user_id).first_or_404()
    
    # Formulate Q&A matching dict
    answers_dict = {}
    for ans in interview.answers:
        answers_dict[str(ans.ai_question_id)] = ans.transcript
        
    # Format questions list
    questions_list = [q.to_dict() for q in interview.questions]
    
    # Call Gemini evaluation
    grade = evaluate_ai_interview(questions_list, answers_dict)
    
    # Write result
    res = AIResult.query.filter_by(ai_interview_id=interview_id).first()
    if not res:
        res = AIResult(
            ai_interview_id      = interview_id,
            technical_score      = int(grade.get('technicalScore', 70)),
            communication_score  = int(grade.get('communicationScore', 70)),
            confidence_score     = int(grade.get('confidenceScore', 70)),
            final_recommendation = grade.get('finalRecommendation', 'Hire'),
            feedback_report      = grade.get('feedbackReport', '')
        )
        db.session.add(res)
    else:
        res.technical_score      = int(grade.get('technicalScore', 70))
        res.communication_score  = int(grade.get('communicationScore', 70))
        res.confidence_score     = int(grade.get('confidenceScore', 70))
        res.final_recommendation = grade.get('finalRecommendation', 'Hire')
        res.feedback_report      = grade.get('feedbackReport', '')
        
    interview.status = 'completed'
    db.session.commit()
    
    return jsonify({
        'message': 'AI Interview graded successfully',
        'result': res.to_dict()
    }), 200


# ── GET /api/student/ai-interview/history ─────────────────────
@student_bp.route('/ai-interview/history', methods=['GET'])
@jwt_required()
def list_ai_interview_history():
    from app.models import AIInterview
    user_id = int(get_jwt_identity())
    interviews = AIInterview.query.filter_by(candidate_id=user_id, status='completed').order_by(AIInterview.created_at.desc()).all()
    
    result = []
    for i in interviews:
        d = i.to_dict()
        d['result'] = i.result.to_dict() if i.result else None
        result.append(d)
        
    return jsonify({'history': result}), 200


# ── GET /api/student/ai-interview/<int:interview_id> ───────────
@student_bp.route('/ai-interview/<int:interview_id>', methods=['GET'])
@jwt_required()
def get_ai_interview_details(interview_id):
    from app.models import AIInterview, User
    user_id = int(get_jwt_identity())
    
    user = User.query.get(user_id)
    if user.role == 'recruiter':
        interview = AIInterview.query.filter_by(id=interview_id).first_or_404()
    else:
        interview = AIInterview.query.filter_by(id=interview_id, candidate_id=user_id).first_or_404()
        
    d = interview.to_dict()
    d['questions'] = [q.to_dict() for q in interview.questions]
    d['answers'] = [a.to_dict() for a in interview.answers]
    d['result'] = interview.result.to_dict() if interview.result else None
    
    return jsonify({'interview': d}), 200


# ── DELETE /api/student/ai-interview/<int:interview_id> ───────────
@student_bp.route('/ai-interview/<int:interview_id>', methods=['DELETE'])
@jwt_required()
def delete_ai_interview(interview_id):
    from app.models import AIInterview
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role == 'recruiter':
        interview = AIInterview.query.filter_by(id=interview_id).first_or_404()
    else:
        interview = AIInterview.query.filter_by(id=interview_id, candidate_id=user_id).first_or_404()
        
    db.session.delete(interview)
    db.session.commit()
    return jsonify({'message': 'AI Interview attempt record deleted successfully'}), 200




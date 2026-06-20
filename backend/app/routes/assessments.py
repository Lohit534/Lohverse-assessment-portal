import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import (
    User, Assessment, Question, AssessmentAttempt, Job, CodingQuestion, CodingSubmission
)
from app.utils.code_executor import execute_code
from app.utils.ai_utils import recalculate_candidate_ranking
from app.utils.ai_generator import generate_ai_questions

assessments_bp = Blueprint('assessments', __name__, url_prefix='/api/assessments')


def _require_recruiter():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user or user.role != 'recruiter':
        return None, (jsonify({'error': 'Recruiter access required'}), 403)
    return user, None


def _compute_rank(assessment_id: int, score: int) -> int:
    """Rank = 1 + count of completed attempts with higher score"""
    better = AssessmentAttempt.query.filter(
        AssessmentAttempt.assessment_id == assessment_id,
        AssessmentAttempt.status == 'completed',
        AssessmentAttempt.score > score,
    ).count()
    return better + 1


# ── GET /api/assessments/ ─────────────────────────────────────
@assessments_bp.route('/', methods=['GET'])
@jwt_required()
def list_assessments():
    from app.models import Application
    from datetime import datetime
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    if user.role == 'recruiter':
        assessments = Assessment.query.filter_by(created_by=user_id)\
                                      .order_by(Assessment.created_at.desc()).all()
    else:
        # Students only see assessments for jobs they applied to
        applied_job_ids = [app.job_id for app in Application.query.filter_by(student_id=user_id).all()]
        if applied_job_ids:
            assessments = Assessment.query.filter(Assessment.job_id.in_(applied_job_ids)).order_by(Assessment.created_at.desc()).all()
        else:
            assessments = []

    result = []
    for a in assessments:
        d = a.to_dict()
        if user.role == 'student':
            # Check if student already attempted
            attempt = AssessmentAttempt.query.filter_by(
                student_id=user_id, assessment_id=a.id, status='completed'
            ).first()
            d['attempted']   = bool(attempt)
            d['attemptScore'] = attempt.score if attempt else None
            
            # Check if expired
            is_expired = False
            if a.job and a.job.deadline:
                is_expired = datetime.utcnow() > a.job.deadline
            d['isExpired'] = is_expired
        result.append(d)

    return jsonify({'assessments': result}), 200


# ── GET /api/assessments/<id> ─────────────────────────────────
@assessments_bp.route('/<int:assessment_id>', methods=['GET'])
@jwt_required()
def get_assessment(assessment_id):
    a = Assessment.query.get_or_404(assessment_id)
    return jsonify({'assessment': a.to_dict()}), 200


# ── POST /api/assessments/ — recruiter creates ────────────────
@assessments_bp.route('/', methods=['POST'])
@jwt_required()
def create_assessment():
    user, err = _require_recruiter()
    if err:
        return err

    body     = request.get_json(silent=True) or {}
    required = ['title']
    missing  = [f for f in required if not body.get(f)]
    if missing:
        return jsonify({'error': f'Missing: {", ".join(missing)}'}), 400

    a = Assessment(
        created_by    = user.id,
        job_id        = body.get('jobId'),
        title         = body['title'].strip(),
        description   = body.get('description', '').strip(),
        duration_mins = int(body.get('durationMins', 60)),
        passing_marks = int(body.get('passingMarks', 40)),
        total_marks   = int(body.get('totalMarks', 100)),
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({'message': 'Assessment created', 'assessment': a.to_dict()}), 201


# ── POST /api/assessments/ai-generate ──────────────────────────
@assessments_bp.route('/ai-generate', methods=['POST'])
@jwt_required()
def ai_generate_assessment():
    user, err = _require_recruiter()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    title = body.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Title is required'}), 400

    topic = body.get('topic', '').strip() or title
    difficulty = body.get('difficulty', 'Medium').strip()
    mcq_count = int(body.get('mcqCount', 5))
    coding_count = int(body.get('codingCount', 1))
    duration_mins = int(body.get('durationMins', 60))
    passing_marks = int(body.get('passingMarks', 40))
    total_marks = int(body.get('totalMarks', 100))
    job_id = body.get('jobId')

    job_title = None
    job_description = None
    job_skills = None

    if job_id:
        job = Job.query.get(job_id)
        if job:
            job_title = job.title
            job_description = job.description
            job_skills = job.required_skills

    # Determine assessment type based on counts
    if mcq_count > 0 and coding_count > 0:
        a_type = 'combined'
    elif coding_count > 0:
        a_type = 'coding'
    else:
        a_type = 'mcq'

    # Create the assessment object
    a = Assessment(
        created_by=user.id,
        job_id=job_id if job_id else None,
        title=title,
        description=body.get('description', f"AI-Generated {a_type} assessment for {topic}").strip(),
        duration_mins=duration_mins,
        passing_marks=passing_marks,
        total_marks=total_marks,
        assessment_type=a_type
    )
    db.session.add(a)
    db.session.commit() # Save to get assessment.id

    try:
        # Generate the questions
        mcqs, codings = generate_ai_questions(
            topic, difficulty, mcq_count, coding_count,
            job_title=job_title, job_description=job_description, job_skills=job_skills
        )

        # Distribute marks
        total_q_count = len(mcqs) + len(codings)
        if total_q_count > 0:
            if a_type == 'mcq':
                mcq_mark = max(1, total_marks // len(mcqs)) if mcqs else 1
                for q in mcqs:
                    q['marks'] = mcq_mark
            elif a_type == 'coding':
                coding_mark = max(5, total_marks // len(codings)) if codings else 10
                for c in codings:
                    c['marks'] = coding_mark
            else:
                mcq_total = int(total_marks * 0.3)
                coding_total = total_marks - mcq_total
                
                mcq_mark = max(1, mcq_total // len(mcqs)) if mcqs else 0
                coding_mark = max(5, coding_total // len(codings)) if codings else 0
                
                for q in mcqs:
                    q['marks'] = mcq_mark
                for c in codings:
                    c['marks'] = coding_mark

        # Add MCQ Questions
        for qdata in mcqs:
            q = Question(
                assessment_id=a.id,
                question_text=qdata.get('questionText', 'Untitled Question'),
                option_a=qdata.get('optionA', 'Option A'),
                option_b=qdata.get('optionB', 'Option B'),
                option_c=qdata.get('optionC', 'Option C'),
                option_d=qdata.get('optionD', 'Option D'),
                correct_answer=qdata.get('correctAnswer', 'a').lower(),
                marks=int(qdata.get('marks', 2))
            )
            db.session.add(q)

        # Add Coding Questions
        for cdata in codings:
            test_cases = cdata.get('testCases', [])
            test_cases_str = json.dumps(test_cases) if not isinstance(test_cases, str) else test_cases
            
            cq = CodingQuestion(
                assessment_id=a.id,
                title=cdata.get('title', 'Coding Challenge').strip(),
                description=cdata.get('description', 'Problem description').strip(),
                difficulty=cdata.get('difficulty', difficulty).strip(),
                input_format=cdata.get('inputFormat', 'Standard Input').strip(),
                output_format=cdata.get('outputFormat', 'Standard Output').strip(),
                constraints=cdata.get('constraints', 'None').strip(),
                sample_input=cdata.get('sampleInput', '').strip(),
                sample_output=cdata.get('sampleOutput', '').strip(),
                test_cases=test_cases_str,
                template_python=cdata.get('templatePython', '').strip(),
                template_java=cdata.get('templateJava', '').strip(),
                template_cpp=cdata.get('templateCpp', '').strip(),
                template_javascript=cdata.get('templateJavascript', '').strip(),
                marks=int(cdata.get('marks', 20))
            )
            db.session.add(cq)

        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        # Clean up the assessment shell if we fail
        db.session.delete(a)
        db.session.commit()
        return jsonify({'error': f'Failed during AI generation step: {str(ex)}'}), 500

    return jsonify({
        'message': 'AI assessment generated successfully',
        'assessment': a.to_dict()
    }), 201


# ── PUT /api/assessments/<id> ─────────────────────────────────
@assessments_bp.route('/<int:assessment_id>', methods=['PUT'])
@jwt_required()
def update_assessment(assessment_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    body = request.get_json(silent=True) or {}
    if 'title'        in body: a.title         = body['title']
    if 'description'  in body: a.description   = body['description']
    if 'durationMins' in body: a.duration_mins = int(body['durationMins'])
    if 'passingMarks' in body: a.passing_marks = int(body['passingMarks'])
    if 'totalMarks'   in body: a.total_marks   = int(body['totalMarks'])
    if 'jobId'        in body: a.job_id        = body['jobId']

    db.session.commit()
    return jsonify({'message': 'Assessment updated', 'assessment': a.to_dict()}), 200


# ── DELETE /api/assessments/<id> ──────────────────────────────
@assessments_bp.route('/<int:assessment_id>', methods=['DELETE'])
@jwt_required()
def delete_assessment(assessment_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    db.session.delete(a)
    db.session.commit()
    return jsonify({'message': 'Assessment deleted'}), 200


# ── GET /api/assessments/<id>/questions ───────────────────────
@assessments_bp.route('/<int:assessment_id>/questions', methods=['GET'])
@jwt_required()
def get_questions(assessment_id):
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    a       = Assessment.query.get_or_404(assessment_id)

    include_answer = (user.role == 'recruiter')
    questions = [q.to_dict(include_answer=include_answer) for q in a.questions]
    return jsonify({'questions': questions, 'assessment': a.to_dict()}), 200


# ── POST /api/assessments/<id>/questions ──────────────────────
@assessments_bp.route('/<int:assessment_id>/questions', methods=['POST'])
@jwt_required()
def add_question(assessment_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    body     = request.get_json(silent=True) or {}
    required = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer']
    missing  = [f for f in required if not body.get(f)]
    if missing:
        return jsonify({'error': f'Missing: {", ".join(missing)}'}), 400

    ca = body['correctAnswer'].lower()
    if ca not in ('a', 'b', 'c', 'd'):
        return jsonify({'error': 'correctAnswer must be a, b, c, or d'}), 400

    q = Question(
        assessment_id  = assessment_id,
        question_text  = body['questionText'],
        option_a       = body['optionA'],
        option_b       = body['optionB'],
        option_c       = body['optionC'],
        option_d       = body['optionD'],
        correct_answer = ca,
        marks          = int(body.get('marks', 1)),
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({'message': 'Question added', 'question': q.to_dict(include_answer=True)}), 201


# ── POST /api/assessments/<id>/questions/bulk ─────────────────
@assessments_bp.route('/<int:assessment_id>/questions/bulk', methods=['POST'])
@jwt_required()
def bulk_add_questions(assessment_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    body      = request.get_json(silent=True) or {}
    questions = body.get('questions', [])
    if not isinstance(questions, list) or len(questions) == 0:
        return jsonify({'error': 'questions must be a non-empty list'}), 400

    required = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer']
    added    = []
    errors   = []

    for i, qdata in enumerate(questions):
        missing = [f for f in required if not qdata.get(f)]
        if missing:
            errors.append({'index': i, 'error': f'Missing: {", ".join(missing)}'})
            continue

        ca = qdata['correctAnswer'].lower()
        if ca not in ('a', 'b', 'c', 'd'):
            errors.append({'index': i, 'error': 'correctAnswer must be a, b, c, or d'})
            continue

        q = Question(
            assessment_id  = assessment_id,
            question_text  = qdata['questionText'],
            option_a       = qdata['optionA'],
            option_b       = qdata['optionB'],
            option_c       = qdata['optionC'],
            option_d       = qdata['optionD'],
            correct_answer = ca,
            marks          = int(qdata.get('marks', 1)),
        )
        db.session.add(q)
        added.append(q)

    db.session.commit()
    return jsonify({
        'message': f'{len(added)} questions added',
        'added':   len(added),
        'errors':  errors,
    }), 201


# ── PUT /api/assessments/<id>/questions/<qid> ─────────────────
@assessments_bp.route('/<int:assessment_id>/questions/<int:question_id>', methods=['PUT'])
@jwt_required()
def update_question(assessment_id, question_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    q = Question.query.filter_by(id=question_id, assessment_id=assessment_id).first()
    if not q:
        return jsonify({'error': 'Question not found'}), 404

    body = request.get_json(silent=True) or {}
    if 'questionText'  in body: q.question_text  = body['questionText']
    if 'optionA'       in body: q.option_a        = body['optionA']
    if 'optionB'       in body: q.option_b        = body['optionB']
    if 'optionC'       in body: q.option_c        = body['optionC']
    if 'optionD'       in body: q.option_d        = body['optionD']
    if 'marks'         in body: q.marks           = int(body['marks'])
    if 'correctAnswer' in body:
        ca = body['correctAnswer'].lower()
        if ca not in ('a', 'b', 'c', 'd'):
            return jsonify({'error': 'correctAnswer must be a, b, c, or d'}), 400
        q.correct_answer = ca

    db.session.commit()
    return jsonify({'message': 'Question updated', 'question': q.to_dict(include_answer=True)}), 200


# ── DELETE /api/assessments/<id>/questions/<qid> ──────────────
@assessments_bp.route('/<int:assessment_id>/questions/<int:question_id>', methods=['DELETE'])
@jwt_required()
def delete_question(assessment_id, question_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    q = Question.query.filter_by(id=question_id, assessment_id=assessment_id).first()
    if not q:
        return jsonify({'error': 'Question not found'}), 404

    db.session.delete(q)
    db.session.commit()
    return jsonify({'message': 'Question deleted'}), 200


# ── POST /api/assessments/<id>/start — student starts ────────
@assessments_bp.route('/<int:assessment_id>/start', methods=['POST'])
@jwt_required()
def start_assessment(assessment_id):
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user or user.role != 'student':
        return jsonify({'error': 'Student access required'}), 403

    a = Assessment.query.get_or_404(assessment_id)

    # Verify student has applied to the job posting
    from app.models import Application
    from datetime import datetime
    if a.job_id:
        applied = Application.query.filter_by(student_id=user_id, job_id=a.job_id).first()
        if not applied:
            return jsonify({'error': 'You must apply to this job posting before attempting its assessment.'}), 403

    # Verify assessment is open (scheduled within time / not expired)
    if a.job and a.job.deadline:
        if datetime.utcnow() > a.job.deadline:
            return jsonify({'error': 'This assessment deadline has passed and it is no longer open.'}), 403

    # Prevent duplicate in-progress attempts
    existing = AssessmentAttempt.query.filter_by(
        student_id=user_id, assessment_id=assessment_id, status='in_progress'
    ).first()
    if existing:
        return jsonify({'message': 'Attempt already in progress', 'attempt': existing.to_dict()}), 200

    # Prevent retaking completed assessments
    completed = AssessmentAttempt.query.filter_by(
        student_id=user_id, assessment_id=assessment_id, status='completed'
    ).first()
    if completed:
        return jsonify({'error': 'Assessment already completed', 'attempt': completed.to_dict()}), 409

    attempt = AssessmentAttempt(
        student_id    = user_id,
        assessment_id = assessment_id,
        answers       = '{}',
        status        = 'in_progress',
    )
    db.session.add(attempt)
    db.session.commit()

    questions = [q.to_dict(include_answer=False) for q in a.questions]
    return jsonify({
        'message':    'Assessment started',
        'attempt':    attempt.to_dict(),
        'assessment': a.to_dict(),
        'questions':  questions,
    }), 201


# ── PUT /api/assessments/<id>/attempt/<aid>/save ──────────────
@assessments_bp.route('/<int:assessment_id>/attempt/<int:attempt_id>/save', methods=['PUT'])
@jwt_required()
def save_answers(assessment_id, attempt_id):
    user_id = int(get_jwt_identity())
    attempt = AssessmentAttempt.query.filter_by(
        id=attempt_id, student_id=user_id, assessment_id=assessment_id, status='in_progress'
    ).first()
    if not attempt:
        return jsonify({'error': 'Active attempt not found'}), 404

    body    = request.get_json(silent=True) or {}
    answers = body.get('answers', {})
    attempt.answers = json.dumps(answers)
    db.session.commit()
    return jsonify({'message': 'Answers saved'}), 200


# ── POST /api/assessments/<id>/attempt/<aid>/submit ───────────
@assessments_bp.route('/<int:assessment_id>/attempt/<int:attempt_id>/submit', methods=['POST'])
@jwt_required()
def submit_assessment(assessment_id, attempt_id):
    user_id = int(get_jwt_identity())
    attempt = AssessmentAttempt.query.filter_by(
        id=attempt_id, student_id=user_id, assessment_id=assessment_id, status='in_progress'
    ).first()
    if not attempt:
        return jsonify({'error': 'Active attempt not found'}), 404

    a = Assessment.query.get(assessment_id)
    body    = request.get_json(silent=True) or {}
    answers = body.get('answers', json.loads(attempt.answers or '{}'))

    # Grade the attempt
    score  = 0
    correct_count = 0
    wrong_count   = 0

    for q in a.questions:
        submitted = str(answers.get(str(q.id), '')).lower()
        if submitted == q.correct_answer:
            score += q.marks
            correct_count += 1
        elif submitted:
            wrong_count += 1

    attempt.mcq_score     = score
    attempt.score         = score + (attempt.coding_score or 0)
    attempt.percentage    = round((attempt.score / a.total_marks) * 100, 2) if a.total_marks > 0 else 0
    attempt.correct_count = correct_count
    attempt.wrong_count   = wrong_count
    attempt.passed        = attempt.score >= a.passing_marks
    attempt.answers       = json.dumps(answers)
    attempt.status        = 'completed'
    attempt.completed_at  = datetime.utcnow()

    db.session.commit()

    # Calculate rank after commit
    attempt.rank = _compute_rank(assessment_id, attempt.score)
    db.session.commit()

    # Auto-reject application on failure
    if a.job_id:
        from app.models import Application, Notification
        app = Application.query.filter_by(student_id=user_id, job_id=a.job_id).first()
        if app and not attempt.passed:
            app.status = 'rejected'
            notif = Notification(
                user_id=user_id,
                title="Application Status Update - Assessment",
                message=f"Your application for the position of '{a.job.title}' at {a.job.company_name} has been rejected because you did not meet the passing criteria in the assessment."
            )
            db.session.add(notif)
            db.session.commit()

    return jsonify({
        'message':  'Assessment submitted',
        'attempt':  attempt.to_dict(),
    }), 200


# ── GET /api/assessments/<id>/results — recruiter views ───────
@assessments_bp.route('/<int:assessment_id>/results', methods=['GET'])
@jwt_required()
def assessment_results(assessment_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    attempts = AssessmentAttempt.query.filter_by(
        assessment_id=assessment_id, status='completed'
    ).order_by(AssessmentAttempt.score.desc()).all()

    result = []
    for attempt in attempts:
        d = attempt.to_dict()
        d['student'] = attempt.student.to_dict() if attempt.student else None
        result.append(d)

    return jsonify({'results': result, 'assessment': a.to_dict()}), 200


# ── GET /api/assessments/<id>/results/stats — recruiter analytics
@assessments_bp.route('/<int:assessment_id>/results/stats', methods=['GET'])
@jwt_required()
def assessment_stats(assessment_id):
    user, err = _require_recruiter()
    if err:
        return err

    attempts = AssessmentAttempt.query.filter_by(
        assessment_id=assessment_id, status='completed'
    ).all()

    if not attempts:
        return jsonify({'stats': {
            'totalAttempts': 0, 'avgScore': 0,
            'passRate': 0, 'highestScore': 0, 'lowestScore': 0
        }}), 200

    scores      = [a.score for a in attempts if a.score is not None]
    passed      = [a for a in attempts if a.passed]

    return jsonify({'stats': {
        'totalAttempts': len(attempts),
        'avgScore':      round(sum(scores) / len(scores), 2) if scores else 0,
        'passRate':      round(len(passed) / len(attempts) * 100, 2),
        'highestScore':  max(scores) if scores else 0,
        'lowestScore':   min(scores) if scores else 0,
    }}), 200


# ── GET /api/assessments/<id>/questions/coding ─────────────────
@assessments_bp.route('/<int:assessment_id>/questions/coding', methods=['GET'])
@jwt_required()
def get_coding_questions(assessment_id):
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    a       = Assessment.query.get_or_404(assessment_id)

    include_test_cases = (user.role == 'recruiter')
    
    questions = []
    for cq in a.coding_questions:
        d = cq.to_dict(include_test_cases=include_test_cases)
        # For students, only expose sample input/output and hide secret test cases
        if not include_test_cases:
            try:
                all_cases = json.loads(cq.test_cases or '[]')
                samples = [tc for tc in all_cases if not tc.get('is_hidden', False)]
                d['sampleTestCases'] = samples
            except Exception:
                d['sampleTestCases'] = []
        questions.append(d)
        
    return jsonify({'questions': questions, 'assessment': a.to_dict()}), 200


# ── POST /api/assessments/<id>/questions/coding ────────────────
@assessments_bp.route('/<int:assessment_id>/questions/coding', methods=['POST'])
@jwt_required()
def add_coding_question(assessment_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    body     = request.get_json(silent=True) or {}
    required = ['title', 'description', 'testCases']
    missing  = [f for f in required if not body.get(f)]
    if missing:
        return jsonify({'error': f'Missing: {", ".join(missing)}'}), 400

    # Ensure testCases is stringified JSON
    test_cases_str = body['testCases']
    if not isinstance(test_cases_str, str):
        test_cases_str = json.dumps(test_cases_str)

    cq = CodingQuestion(
        assessment_id       = assessment_id,
        title               = body['title'].strip(),
        description         = body['description'].strip(),
        difficulty          = body.get('difficulty', 'Medium').strip(),
        input_format        = body.get('inputFormat', '').strip(),
        output_format       = body.get('outputFormat', '').strip(),
        constraints         = body.get('constraints', '').strip(),
        sample_input        = body.get('sampleInput', '').strip(),
        sample_output       = body.get('sampleOutput', '').strip(),
        test_cases          = test_cases_str,
        template_python     = body.get('templatePython', '').strip(),
        template_java       = body.get('templateJava', '').strip(),
        template_cpp        = body.get('templateCpp', '').strip(),
        template_javascript = body.get('templateJavascript', '').strip(),
        marks               = int(body.get('marks', 10)),
    )
    db.session.add(cq)
    db.session.commit()
    
    return jsonify({'message': 'Coding question added', 'question': cq.to_dict(include_test_cases=True)}), 201


# ── PUT /api/assessments/<id>/questions/coding/<qid> ───────────
@assessments_bp.route('/<int:assessment_id>/questions/coding/<int:question_id>', methods=['PUT'])
@jwt_required()
def update_coding_question(assessment_id, question_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    cq = CodingQuestion.query.filter_by(id=question_id, assessment_id=assessment_id).first()
    if not cq:
        return jsonify({'error': 'Coding question not found'}), 404

    body = request.get_json(silent=True) or {}
    
    if 'title' in body:              cq.title               = body['title']
    if 'description' in body:        cq.description         = body['description']
    if 'difficulty' in body:         cq.difficulty          = body['difficulty']
    if 'inputFormat' in body:        cq.input_format        = body['inputFormat']
    if 'outputFormat' in body:       cq.output_format       = body['outputFormat']
    if 'constraints' in body:        cq.constraints         = body['constraints']
    if 'sampleInput' in body:        cq.sample_input        = body['sampleInput']
    if 'sampleOutput' in body:       cq.sample_output       = body['sampleOutput']
    if 'templatePython' in body:     cq.template_python     = body['templatePython']
    if 'templateJava' in body:       cq.template_java       = body['templateJava']
    if 'templateCpp' in body:        cq.template_cpp        = body['templateCpp']
    if 'templateJavascript' in body: cq.template_javascript = body['templateJavascript']
    if 'marks' in body:              cq.marks               = int(body['marks'])
    
    if 'testCases' in body:
        test_cases_str = body['testCases']
        if not isinstance(test_cases_str, str):
            test_cases_str = json.dumps(test_cases_str)
        cq.test_cases = test_cases_str

    db.session.commit()
    return jsonify({'message': 'Coding question updated', 'question': cq.to_dict(include_test_cases=True)}), 200


# ── DELETE /api/assessments/<id>/questions/coding/<qid> ────────
@assessments_bp.route('/<int:assessment_id>/questions/coding/<int:question_id>', methods=['DELETE'])
@jwt_required()
def delete_coding_question(assessment_id, question_id):
    user, err = _require_recruiter()
    if err:
        return err

    a = Assessment.query.filter_by(id=assessment_id, created_by=user.id).first()
    if not a:
        return jsonify({'error': 'Assessment not found or access denied'}), 404

    cq = CodingQuestion.query.filter_by(id=question_id, assessment_id=assessment_id).first()
    if not cq:
        return jsonify({'error': 'Coding question not found'}), 404

    db.session.delete(cq)
    db.session.commit()
    return jsonify({'message': 'Coding question deleted'}), 200


# ── POST /api/assessments/<id>/attempt/<aid>/run ───────────────
@assessments_bp.route('/<int:assessment_id>/attempt/<int:attempt_id>/run', methods=['POST'])
@jwt_required()
def run_code_custom(assessment_id, attempt_id):
    user_id = int(get_jwt_identity())
    attempt = AssessmentAttempt.query.filter_by(
        id=attempt_id, student_id=user_id, assessment_id=assessment_id, status='in_progress'
    ).first()
    if not attempt:
        return jsonify({'error': 'Active attempt not found'}), 404

    body = request.get_json(silent=True) or {}
    code = body.get('code', '')
    lang = body.get('language', '')
    custom_input = body.get('input', '')
    
    if not code or not lang:
        return jsonify({'error': 'code and language are required'}), 400

    # Run using our code executor
    result = execute_code(code, lang, custom_input)
    return jsonify(result), 200


# ── POST /api/assessments/<id>/attempt/<aid>/submit-code ───────
@assessments_bp.route('/<int:assessment_id>/attempt/<int:attempt_id>/submit-code', methods=['POST'])
@jwt_required()
def submit_code_question(assessment_id, attempt_id):
    user_id = int(get_jwt_identity())
    attempt = AssessmentAttempt.query.filter_by(
        id=attempt_id, student_id=user_id, assessment_id=assessment_id, status='in_progress'
    ).first()
    if not attempt:
        return jsonify({'error': 'Active attempt not found'}), 404

    body = request.get_json(silent=True) or {}
    question_id = body.get('questionId')
    code = body.get('code', '')
    lang = body.get('language', '')

    if not question_id or not code or not lang:
        return jsonify({'error': 'questionId, code, and language are required'}), 400

    cq = CodingQuestion.query.filter_by(id=question_id, assessment_id=assessment_id).first()
    if not cq:
        return jsonify({'error': 'Coding question not found'}), 404

    # Run test cases
    try:
        test_cases = json.loads(cq.test_cases)
    except Exception:
        return jsonify({'error': 'Question schema error: invalid test cases configuration'}), 500

    total_cases = len(test_cases)
    if total_cases == 0:
        return jsonify({'error': 'No test cases defined for this question'}), 500

    passed_count = 0
    test_case_results = []
    
    # Evaluate all test cases
    for i, tc in enumerate(test_cases):
        tc_input = tc.get('input', '')
        tc_expected = tc.get('output', '')
        is_hidden = tc.get('is_hidden', False)

        run_res = execute_code(code, lang, tc_input, tc_expected)
        
        tc_success = run_res.get('success', False)
        if tc_success:
            passed_count += 1

        # Only include input/output details for public cases, protect secret ones
        tc_report = {
            'index': i + 1,
            'isHidden': is_hidden,
            'status': run_res.get('status', 'Failed'),
            'passed': tc_success,
            'timeMs': run_res.get('time_ms', 0)
        }
        if not is_hidden:
            tc_report['input'] = tc_input
            tc_report['expected'] = tc_expected
            tc_report['stdout'] = run_res.get('stdout', '')
            tc_report['stderr'] = run_res.get('stderr', '')
            
        test_case_results.append(tc_report)

    # Calculate question score
    score = round((passed_count / total_cases) * cq.marks)
    
    # Save or update CodingSubmission
    sub = CodingSubmission.query.filter_by(attempt_id=attempt_id, coding_question_id=question_id).first()
    if not sub:
        sub = CodingSubmission(
            attempt_id = attempt_id,
            coding_question_id = question_id
        )
        db.session.add(sub)
        
    sub.code = code
    sub.language = lang
    sub.status = "Accepted" if passed_count == total_cases else "Wrong Answer"
    if passed_count == 0:
        # Check if compile error was thrown
        if any(tr['status'] == 'Compile Error' for tr in test_case_results):
            sub.status = "Compile Error"
            
    sub.passed_cases = passed_count
    sub.total_cases = total_cases
    sub.score = score
    sub.runtime_ms = int(max([tr.get('timeMs', 0) for tr in test_case_results]) if test_case_results else 0)
    db.session.commit()

    # Recalculate coding score on attempt
    all_subs = CodingSubmission.query.filter_by(attempt_id=attempt_id).all()
    attempt.coding_score = sum([s.score for s in all_subs])
    
    # Recalculate MCQ score if already graded, otherwise keep
    if attempt.mcq_score is None:
        attempt.mcq_score = 0
        
    attempt.score = attempt.mcq_score + attempt.coding_score
    a = attempt.assessment
    attempt.percentage = round((attempt.score / a.total_marks) * 100, 2) if a.total_marks > 0 else 0
    attempt.passed = attempt.score >= a.passing_marks
    db.session.commit()

    return jsonify({
        'message': 'Code evaluated successfully',
        'passedCases': passed_count,
        'totalCases': total_cases,
        'questionScore': score,
        'questionMarks': cq.marks,
        'status': sub.status,
        'testCaseResults': test_case_results
    }), 200

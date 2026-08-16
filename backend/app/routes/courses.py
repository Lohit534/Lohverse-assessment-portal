import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Course, Assessment

courses_bp = Blueprint('courses', __name__, url_prefix='/api')

def _is_recruiter():
    user_id_str = get_jwt_identity()
    if not user_id_str:
        return False
    user = User.query.get(int(user_id_str))
    return user and user.role in ['recruiter', 'admin']

# ── PUBLIC ENDPOINTS ──────────────────────────────────────────

@courses_bp.route('/courses', methods=['GET'])
def list_courses():
    if Course.query.count() == 0:
        try:
            from app import seed_default_courses
            seed_default_courses()
        except Exception:
            pass

    courses = Course.query.order_by(Course.created_at.desc()).all()
    data = []
    for c in courses:
        d = c.to_dict()
        d.pop('syllabus', None)
        data.append(d)
    return jsonify({'courses': data}), 200

@courses_bp.route('/courses/<int:course_id>', methods=['GET'])
def get_course_detail(course_id):
    course = Course.query.get_or_404(course_id)
    d = course.to_dict()

    return jsonify({'course': d}), 200

# ── RECRUITER/ADMIN ENDPOINTS ─────────────────────────────────

@courses_bp.route('/recruiter/courses', methods=['POST'])
@jwt_required()
def create_course():
    if not _is_recruiter():
        return jsonify({'error': 'Recruiter authorization required'}), 403
        
    data = request.get_json() or {}
    title = data.get('title')
    if not title:
        return jsonify({'error': 'Course title is required'}), 400
        
    syllabus_list = data.get('syllabus') or []
    
    course = Course(
        title=title,
        description=data.get('description'),
        difficulty=data.get('difficulty', 'beginner'),
        duration=data.get('duration'),
        instructor=data.get('instructor'),
        image_url=data.get('imageUrl'),
        syllabus=json.dumps(syllabus_list)
    )
    db.session.add(course)
    db.session.flush()
    

        
    db.session.commit()
    return jsonify({'message': 'Course created successfully', 'course': course.to_dict()}), 201

@courses_bp.route('/recruiter/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    if not _is_recruiter():
        return jsonify({'error': 'Recruiter authorization required'}), 403
        
    course = Course.query.get_or_404(course_id)
    data = request.get_json() or {}
    
    if 'title' in data:
        if not data['title']:
            return jsonify({'error': 'Course title cannot be empty'}), 400
        course.title = data['title']
        
    if 'description' in data:
        course.description = data['description']
    if 'difficulty' in data:
        course.difficulty = data['difficulty']
    if 'duration' in data:
        course.duration = data['duration']
    if 'instructor' in data:
        course.instructor = data['instructor']
    if 'imageUrl' in data:
        course.image_url = data['imageUrl']
    if 'syllabus' in data:
        course.syllabus = json.dumps(data['syllabus'] or [])
        

            
    db.session.commit()
    return jsonify({'message': 'Course updated successfully', 'course': course.to_dict()}), 200

@courses_bp.route('/recruiter/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    if not _is_recruiter():
        return jsonify({'error': 'Recruiter authorization required'}), 403
        
    course = Course.query.get_or_404(course_id)
    Assessment.query.filter_by(course_id=course.id).update({Assessment.course_id: None}, synchronize_session=False)
    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course deleted successfully'}), 200
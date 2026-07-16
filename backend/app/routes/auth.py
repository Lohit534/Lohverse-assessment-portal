import os
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from app.extensions import db, bcrypt
from app.models import User
from werkzeug.utils import secure_filename

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

ALLOWED_EXTENSIONS = {'pdf'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── POST /api/auth/register ──────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Accepts multipart/form-data so the resume file can be uploaded.
    Fields: fullName, rollNumber, phone, address,
            college, course, branch, year,
            email, password
    File:   resume
    """
    data = request.form

    # ── Validate required fields ──
    required = ['fullName', 'rollNumber', 'phone', 'address',
                'college', 'course', 'branch', 'year', 'email', 'password']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    # ── Check duplicate email ──
    if User.query.filter_by(email=data['email'].lower().strip()).first():
        return jsonify({'error': 'An account with this email already exists'}), 409

    # ── Handle resume upload ──
    resume_filename = None
    resume_text = ""
    if 'resume' in request.files:
        file = request.files['resume']
        if file and file.filename:
            if not allowed_file(file.filename):
                return jsonify({'error': 'Only PDF files are allowed'}), 400
            
            # Check file size (5MB maximum)
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            if file_size > 5 * 1024 * 1024:
                return jsonify({'error': 'File size exceeds maximum limit of 5MB'}), 400
            
            # Extract PDF text in-memory
            from app.utils.ai_utils import extract_text_from_pdf
            file.seek(0)
            resume_text = extract_text_from_pdf(file)
            
            # Verify Cloudinary configuration variables
            import cloudinary.uploader
            from flask import current_app
            cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME')
            api_key    = current_app.config.get('CLOUDINARY_API_KEY')
            api_secret = current_app.config.get('CLOUDINARY_API_SECRET')
            if not cloud_name or not api_key or not api_secret:
                return jsonify({
                    'error': 'Cloudinary is not configured on the server. Please set the environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
                }), 500

            file.seek(0)
            try:
                upload_result = cloudinary.uploader.upload(
                    file,
                    resource_type="auto",
                    folder="lohverse/resumes",
                    public_id=f"{data['email'].split('@')[0]}_resume"
                )
                resume_filename = upload_result.get("secure_url")
            except Exception as e:
                return jsonify({'error': f'Cloudinary upload failed: {str(e)}'}), 500

    # ── Create user ──
    user = User(
        full_name       = data['fullName'].strip(),
        roll_number     = data['rollNumber'].strip(),
        phone           = data['phone'].strip(),
        address         = data['address'].strip(),
        college         = data.get('college', '').strip(),
        course          = data.get('course', '').strip(),
        branch          = data.get('branch', '').strip(),
        year            = data.get('year', '').strip(),
        email           = data['email'].lower().strip(),
        resume_filename = resume_filename,
        resume_text     = resume_text,
        role            = 'student',
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message':      'Registration successful',
        'user':         user.to_dict(),
        'accessToken':  access_token,
        'refreshToken': refresh_token,
    }), 201


# ── POST /api/auth/login ─────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True) or {}

    email    = body.get('email', '').lower().strip()
    password = body.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Your account has been deactivated'}), 403

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message':      'Login successful',
        'user':         user.to_dict(),
        'accessToken':  access_token,
        'refreshToken': refresh_token,
    }), 200


# ── POST /api/auth/refresh ───────────────────────────────────────────────────
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity     = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({'accessToken': access_token}), 200


# ── GET /api/auth/me ─────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


# ── POST /api/auth/logout ────────────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Stateless JWT — client simply discards tokens.
    # For blacklisting, add flask-jwt-extended blocklist support later.
    return jsonify({'message': 'Logged out successfully'}), 200


# ── POST /api/auth/forgot-password ───────────────────────────────────────────
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Generates a password reset token for the given email.
    In development the token is returned in the response body.
    In production wire up Flask-Mail to send it via email.
    """
    import secrets
    from datetime import timedelta
    from app.models import PasswordResetToken

    body  = request.get_json(silent=True) or {}
    email = body.get('email', '').lower().strip()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    # Always return 200 to prevent user enumeration
    if not user:
        return jsonify({'message': 'If that email exists, a reset link has been sent.'}), 200

    # Invalidate any existing tokens
    PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})

    token      = secrets.token_urlsafe(40)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    reset_tok  = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
    db.session.add(reset_tok)
    db.session.commit()

    return jsonify({
        'message':     'Password reset token generated.',
        'resetToken':  token,   # DEV ONLY — remove in production
        'expiresAt':   expires_at.isoformat(),
    }), 200


# ── POST /api/auth/reset-password ────────────────────────────────────────────
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    from app.models import PasswordResetToken

    body     = request.get_json(silent=True) or {}
    token    = body.get('token', '').strip()
    password = body.get('password', '')

    if not token or not password:
        return jsonify({'error': 'token and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    reset_tok = PasswordResetToken.query.filter_by(token=token, used=False).first()
    if not reset_tok:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    if datetime.utcnow() > reset_tok.expires_at:
        return jsonify({'error': 'Reset token has expired'}), 400

    user = User.query.get(reset_tok.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.set_password(password)
    reset_tok.used = True
    db.session.commit()

    return jsonify({'message': 'Password reset successful. You can now log in.'}), 200


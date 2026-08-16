import logging
from flask import Flask
from app.config import Config
from app.extensions import db, bcrypt, jwt, cors, init_cloudinary

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
)
logger = logging.getLogger('lohverse')


def seed_default_courses():
    import json
    from app.models import Course
    courses_data = [
        {
            "title": "Python Basics & Machine Learning",
            "description": "Master core Python syntax and step into the world of data modeling, linear regression, and predictive AI classifiers.",
            "difficulty": "intermediate",
            "duration": "6 hours",
            "instructor": "Dr. Lohit AI",
            "imageUrl": "",
            "syllabus": [
                {"title": "Introduction to Python Basics", "description": "Learn variable declarations, basic string methods, numbers, and basic boolean comparisons.", "topics": "Variables, strings, expressions, math operators"},
                {"title": "Control Flow & Functions", "description": "Write reusable logic blocks with conditionals, for-loops, while-loops, and functional returns.", "topics": "if/else, loops, def keywords, return statements"},
                {"title": "Numerical Computing & Data Analytics", "description": "Step into multidimensional arrays with NumPy and clean structured datasets using Pandas.", "topics": "NumPy arrays, Pandas DataFrames, indexing, cleaning data"},
                {"title": "Scikit-Learn Regression & Classification", "description": "Train your first supervised Machine Learning algorithms using linear regression and decision trees.", "topics": "Train/test split, model.fit(), evaluation metrics"}
            ]
        },
        {
            "title": "Full Stack Web Development (React & Node.js)",
            "description": "Build high-performance web applications using modern UI libraries and asynchronous server engines.",
            "difficulty": "beginner",
            "duration": "12 hours",
            "instructor": "Prof. Sarah Dev",
            "imageUrl": "",
            "syllabus": [
                {"title": "Semantic HTML5 & Flexbox/Grid", "description": "Structure layouts according to modern browser accessibility guidelines and style responsive grids.", "topics": "Tags, Flexbox directions, grid definitions, media queries"},
                {"title": "Asynchronous JavaScript (ES6+)", "description": "Understand how JavaScript engines handle non-blocking events, Promises, and fetch API operations.", "topics": "Arrow functions, destructuring, promises, async/await"},
                {"title": "React Component State & Hooks", "description": "Develop dynamic client interfaces using functional components, useState, useEffect, and custom hooks.", "topics": "Components, props, state, hooks, virtual DOM"},
                {"title": "Node.js REST APIs with Express & Databases", "description": "Spin up a local backend server to process JSON payloads, map request parameters, and save to database.", "topics": "Express routers, CORS, middlewares, SQL queries"}
            ]
        },
        {
            "title": "Data Structures & Advanced Algorithms",
            "description": "Prepare for technical whiteboard interviews. Analyze space-time complexity and optimize code architectures.",
            "difficulty": "advanced",
            "duration": "8 hours",
            "instructor": "Alex Chen (M.Tech)",
            "imageUrl": "",
            "syllabus": [
                {"title": "Array Manipulations & Sliding Window", "description": "Optimize search bounds on array listings using double-pointers and dynamic resizing windows.", "topics": "Two-pointer, sliding window, prefix sums, binary search"},
                {"title": "Stacks, Queues & Linked Lists", "description": "Build custom linear collections from scratch and handle pointer adjustments cleanly in-memory.", "topics": "Singly linked list, node insertions, stack/queue push/pop"},
                {"title": "Recursion & Binary Tree Traversals", "description": "Write recursive call stacks to traverse nodes in depth-first (in-order, pre-order, post-order) layouts.", "topics": "Tree structures, recursion limits, BST operations"},
                {"title": "Dynamic Programming & Graphs", "description": "Bypass redundant computes via memoization arrays and navigate graph networks using BFS and DFS.", "topics": "Memoization, tabulation, adjacency lists, shortest path"}
            ]
        }
    ]
    for c in courses_data:
        course = Course(
            title=c["title"],
            description=c["description"],
            difficulty=c["difficulty"],
            duration=c["duration"],
            instructor=c["instructor"],
            image_url=c["imageUrl"],
            syllabus=json.dumps(c["syllabus"])
        )
        db.session.add(course)
    db.session.commit()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── Init extensions ──
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    # Initialize Cloudinary
    init_cloudinary(app)

    # Register custom JWT error handlers to return 401 instead of 422 for invalid/expired tokens
    from flask import jsonify
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({
            'error': 'Invalid token',
            'message': error_string
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token has expired',
            'message': 'The token has expired'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({
            'error': 'Authorization required',
            'message': error_string
        }), 401

    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error(f"Unhandled Exception: {e}", exc_info=True)
        return jsonify({
            'error': 'Internal Server Error',
            'message': str(e) if app.config.get("DEBUG") else "An unexpected server error occurred."
        }), 500

    # ── Initialize Cloudinary ──
    import cloudinary
    cloudinary.config(
        cloud_name = app.config['CLOUDINARY_CLOUD_NAME'],
        api_key    = app.config['CLOUDINARY_API_KEY'],
        api_secret = app.config['CLOUDINARY_API_SECRET'],
        secure     = True
    )

    # ── Dynamic CORS Configuration ──
    import os
    frontend_urls = os.getenv(
        "FRONTEND_URLS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176,https://lohverse-student-assessment.vercel.app,https://lohverse-assessment-portal.vercel.app"
    ).split(",")
    frontend_urls = [url.strip() for url in frontend_urls if url.strip()]

    cors.init_app(app, resources={
        r"/api/*": {
            "origins": "*",
            "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Origin"]
        }
    })

    # ── Register blueprints ──
    from app.routes.auth        import auth_bp
    from app.routes.recruiter   import recruiter_bp
    from app.routes.student     import student_bp
    from app.routes.jobs        import jobs_bp
    from app.routes.assessments import assessments_bp
    from app.routes.courses     import courses_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(recruiter_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(assessments_bp)
    app.register_blueprint(courses_bp)

    # ── Health check ──
    @app.route('/api/health')
    def health():
        import sqlalchemy as sa
        try:
            # Query database to verify connection and keep Neon PostgreSQL compute node awake
            db.session.execute(sa.text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            db_status = f"error: {str(e)}"
            
        return {
            'status': 'ok',
            'service': 'Lohverse API',
            'version': '1.0.0',
            'database': db_status
        }, 200

    # ── Error handlers ──
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Resource not found'}, 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return {'error': 'Method not allowed'}, 405

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f'Internal server error: {e}')
        return {'error': 'Internal server error'}, 500

    # ── Database Auto-Migration ──
    def auto_migrate(db_engine):
        import sqlalchemy as sa
        inspector = sa.inspect(db_engine)
        
        # 1. Migrate users table
        if 'users' in inspector.get_table_names():
            columns = [c['name'] for c in inspector.get_columns('users')]
            with db_engine.begin() as conn:
                if 'college' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN college VARCHAR(200) NULL"))
                if 'course' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN course VARCHAR(100) NULL"))
                if 'branch' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN branch VARCHAR(100) NULL"))
                if 'year' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN year VARCHAR(10) NULL"))
                if 'degree' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN degree VARCHAR(100) NULL"))
                if 'cgpa' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN cgpa VARCHAR(10) NULL"))
                if 'skills' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN skills TEXT NULL"))
                if 'certifications' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN certifications TEXT NULL"))
                if 'projects' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN projects TEXT NULL"))
                if 'linkedin_url' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(255) NULL"))
                if 'github_url' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN github_url VARCHAR(255) NULL"))
                if 'resume_filename' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN resume_filename VARCHAR(255) NULL"))
                if 'resume_text' not in columns:
                    conn.execute(sa.text("ALTER TABLE users ADD COLUMN resume_text TEXT NULL"))

        # 2. Migrate assessments table
        if 'assessments' in inspector.get_table_names():
            columns = [c['name'] for c in inspector.get_columns('assessments')]
            with db_engine.begin() as conn:
                if 'assessment_type' not in columns:
                    conn.execute(sa.text("ALTER TABLE assessments ADD COLUMN assessment_type VARCHAR(30) NOT NULL DEFAULT 'mcq'"))
                if 'course_id' not in columns:
                    conn.execute(sa.text("ALTER TABLE assessments ADD COLUMN course_id INT NULL"))

        # 3. Migrate assessment_attempts table
        if 'assessment_attempts' in inspector.get_table_names():
            columns = [c['name'] for c in inspector.get_columns('assessment_attempts')]
            with db_engine.begin() as conn:
                if 'coding_score' not in columns:
                    conn.execute(sa.text("ALTER TABLE assessment_attempts ADD COLUMN coding_score INT NULL"))
                if 'mcq_score' not in columns:
                    conn.execute(sa.text("ALTER TABLE assessment_attempts ADD COLUMN mcq_score INT NULL"))

    # ── Create tables on first run ──
    with app.app_context():
        try:
            db.create_all()
            auto_migrate(db.engine)
            from app.models import Course
            if Course.query.count() == 0:
                seed_default_courses()
            logger.info('Database tables created and auto-migrations executed successfully')
        except Exception as e:
            logger.error(f'Database initialization/migration error: {e}')

    return app



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
    try:
        Course.query.delete()
        db.session.commit()
    except Exception:
        db.session.rollback()

    py_ch1 = """1. Variable Declarations
In Python, variables are dynamically typed. Assign a value using '=':
   x = 10
   name = 'Lohverse'
   price = 49.99
   is_active = True

2. Data Types
   - Integer: Whole numbers (e.g. 42)
   - Float: Decimal values (e.g. 3.14)
   - String: Wrapped text (e.g. "Python")
   - Boolean: Logical True or False

3. Core Math Operations
   Use +, -, *, / for math. Use '//' for integer division, and '%' for modulo (remainder)."""

    py_ch2 = """1. Conditional Branches
Use if/elif/else to evaluate conditions:
   if score >= 90:
       print('A')
   elif score >= 80:
       print('B')
   else:
       print('Fail')

2. Loops
   - For loop: Iterate over ranges:
     for i in range(5):
         print(i) # Prints 0 to 4
   - While loop: Iterate while a statement is True.

3. Reusable Functions
Define functions using the 'def' keyword:
   def add_numbers(a, b):
       return a + b"""

    py_ch3 = """1. NumPy Arrays
NumPy offers high-performance vectors and matrices:
   import numpy as np
   arr = np.array([1, 2, 3])
   print(arr * 2) # [2, 4, 6]

2. Pandas DataFrames
Pandas represents tabular records with labeled axes:
   import pandas as pd
   data = {'Name': ['Alice', 'Bob'], 'Age': [25, 30]}
   df = pd.DataFrame(data)
   print(df.describe()) # Statistical summary"""

    py_ch4 = """1. Machine Learning Workflow
   - Step 1: Split variables into features (X) and target (y).
   - Step 2: Perform train/test split (80% train, 20% test).
   - Step 3: Instantiate model estimator and run .fit().
   - Step 4: Validate predictions on test metrics.

2. Linear Regression Code Example
   from sklearn.model_selection import train_test_split
   from sklearn.linear_model import LinearRegression

   X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
   model = LinearRegression()
   model.fit(X_train, y_train)
   accuracy = model.score(X_test, y_test)
   print(f'R2 Score: {accuracy}')"""

    web_ch1 = """1. HTML5 Semantics
Use semantic tags like <header>, <nav>, <main>, <article>, and <footer> to structure your pages for high browser readability and SEO.

2. CSS Flexbox Layouts
Set display: flex to align items dynamically:
   .container {
       display: flex;
       justify-content: space-between;
       align-items: center;
   }

3. CSS Grid
Define grid-template-columns for advanced layouts:
   .grid-container {
       display: grid;
       grid-template-columns: repeat(3, 1fr);
       gap: 1rem;
   }"""

    web_ch2 = """1. Promises
A Promise represents the eventual completion (or failure) of an asynchronous operation:
   const fetchData = () => {
       return new Promise((resolve, reject) => {
           setTimeout(() => resolve('Data loaded'), 1000);
       });
   };

2. Async/Await
Use async/await syntax to write cleaner, linear asynchronous execution code:
   async function loadData() {
       try {
           const res = await fetchData();
           console.log(res); // Prints 'Data loaded'
       } catch (err) {
           console.error(err);
       }
   }"""

    web_ch3 = """1. Component State
State allows components to retain data across renders:
   import React, { useState } from 'react';

   function Counter() {
       const [count, setCount] = useState(0);
       return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
   }

2. Effect Hook
Use useEffect to sync with external systems (like fetching database data on mount):
   useEffect(() => {
       console.log('Component mounted');
   }, []); // Empty dependency array means this runs once"""

    web_ch4 = """1. Express Server
Spin up an HTTP server that listens to port requests:
   const express = require('express');
   const app = express();
   app.use(express.json());

   app.get('/api/greeting', (req, res) => {
       res.json({ message: 'Hello from Node.js!' });
   });

   app.listen(5000, () => console.log('Server active on port 5000'));

2. Database Connect
Query SQL records inside endpoint handlers:
   db.query('SELECT * FROM users', (err, results) => {
       if (err) throw err;
       res.json(results);
   });"""

    dsa_ch1 = """1. Array Manipulations
Optimize array traversal algorithms to avoid O(N^2) brute force nested loops.

2. Two-Pointer Technique
Solve problems like checking if an array is sorted or finding pairs with a specific sum:
   def has_target_sum(arr, target):
       left = 0
       right = len(arr) - 1
       while left < right:
           current = arr[left] + arr[right]
           if current == target:
               return True
           elif current < target:
               left += 1
           else:
               right -= 1
       return False"""

    dsa_ch2 = """1. Stacks (LIFO)
Operations include push (insert element) and pop (remove last inserted element):
   stack = []
   stack.append(10) # Push
   val = stack.pop() # Pop

2. Queues (FIFO)
Operations include enqueue (insert at tail) and dequeue (remove from head):
   from collections import deque
   queue = deque()
   queue.append(20) # Enqueue
   val = queue.popleft() # Dequeue

3. Linked List Structure
Nodes pointing sequentially in-memory:
   class Node:
       def __init__(self, val):
           self.val = val
           self.next = None"""

    dsa_ch3 = """1. Recursion
A function calling itself with a base condition to prevent stack overflow:
   def factorial(n):
       if n <= 1: return 1
       return n * factorial(n - 1)

2. Binary Tree Node
Nodes branching into left and right subtrees:
   class TreeNode:
       def __init__(self, val):
           self.val = val
           self.left = None
           self.right = None

3. In-Order Traversal (Left -> Root -> Right)
   def inorder(root):
       if root:
           inorder(root.left)
           print(root.val)
           inorder(root.right)"""

    dsa_ch4 = """1. Dynamic Programming
Optimize recursions using Memoization (Top-Down cache) or Tabulation (Bottom-Up table):
   # Memoized Fibonacci
   def fib(n, memo={}):
       if n in memo: return memo[n]
       if n <= 1: return n
       memo[n] = fib(n-1, memo) + fib(n-2, memo)
       return memo[n]

2. Graph Traversals
   - BFS (Breadth-First Search): Uses a queue to explore node levels iteratively.
   - DFS (Depth-First Search): Uses recursion or a stack to explore branch depths."""

    courses_data = [
        {
            "title": "Python Basics & Machine Learning",
            "description": "Master core Python syntax and step into the world of data modeling, linear regression, and predictive AI classifiers.",
            "difficulty": "intermediate",
            "duration": "6 hours",
            "instructor": "Dr. Lohit AI",
            "imageUrl": "",
            "syllabus": [
                {"title": "Introduction to Python Basics", "description": "Learn variable declarations, basic string methods, numbers, and basic boolean comparisons.", "topics": "Variables, strings, expressions, math operators", "studyMaterial": py_ch1},
                {"title": "Control Flow & Functions", "description": "Write reusable logic blocks with conditionals, for-loops, while-loops, and functional returns.", "topics": "if/else, loops, def keywords, return statements", "studyMaterial": py_ch2},
                {"title": "Numerical Computing & Data Analytics", "description": "Step into multidimensional arrays with NumPy and clean structured datasets using Pandas.", "topics": "NumPy arrays, Pandas DataFrames, indexing, cleaning data", "studyMaterial": py_ch3},
                {"title": "Scikit-Learn Regression & Classification", "description": "Train your first supervised Machine Learning algorithms using linear regression and decision trees.", "topics": "Train/test split, model.fit(), evaluation metrics", "studyMaterial": py_ch4}
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
                {"title": "Semantic HTML5 & Flexbox/Grid", "description": "Structure layouts according to modern browser accessibility guidelines and style responsive grids.", "topics": "Tags, Flexbox directions, grid definitions, media queries", "studyMaterial": web_ch1},
                {"title": "Asynchronous JavaScript (ES6+)", "description": "Understand how JavaScript engines handle non-blocking events, Promises, and fetch API operations.", "topics": "Arrow functions, destructuring, promises, async/await", "studyMaterial": web_ch2},
                {"title": "React Component State & Hooks", "description": "Develop dynamic client interfaces using functional components, useState, useEffect, and custom hooks.", "topics": "Components, props, state, hooks, virtual DOM", "studyMaterial": web_ch3},
                {"title": "Node.js REST APIs with Express & Databases", "description": "Spin up a local backend server to process JSON payloads, map request parameters, and save to database.", "topics": "Express routers, CORS, middlewares, SQL queries", "studyMaterial": web_ch4}
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
                {"title": "Array Manipulations & Sliding Window", "description": "Optimize search bounds on array listings using double-pointers and dynamic resizing windows.", "topics": "Two-pointer, sliding window, prefix sums, binary search", "studyMaterial": dsa_ch1},
                {"title": "Stacks, Queues & Linked Lists", "description": "Build custom linear collections from scratch and handle pointer adjustments cleanly in-memory.", "topics": "Singly linked list, node insertions, stack/queue push/pop", "studyMaterial": dsa_ch2},
                {"title": "Recursion & Binary Tree Traversals", "description": "Write recursive call stacks to traverse nodes in depth-first (in-order, pre-order, post-order) layouts.", "topics": "Tree structures, recursion limits, BST operations", "studyMaterial": dsa_ch3},
                {"title": "Dynamic Programming & Graphs", "description": "Bypass redundant computes via memoization arrays and navigate graph networks using BFS and DFS.", "topics": "Memoization, tabulation, adjacency lists, shortest path", "studyMaterial": dsa_ch4}
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



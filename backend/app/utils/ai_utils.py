import re
import math
import json
from collections import Counter
from pypdf import PdfReader
from app.extensions import db
from app.models import User, Job, AssessmentAttempt, CandidateRanking

def extract_text_from_pdf(pdf_file_or_path):
    """Extract text content from a PDF file or stream using pypdf"""
    try:
        reader = PdfReader(pdf_file_or_path)
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def preprocess(text):
    """Normalize and tokenize text, removing common stopwords"""
    if not text:
        return []
    # Lowercase and keep alphanumeric characters
    text = re.sub(r'[^\w\s\-\#\+]', ' ', text.lower())
    words = text.split()
    
    # Common English stopwords + common filler words
    stopwords = {
        'a', 'an', 'the', 'and', 'or', 'in', 'of', 'to', 'for', 'with', 'is', 'at', 
        'by', 'from', 'on', 'this', 'that', 'it', 'be', 'are', 'as', 'at', 'have', 
        'has', 'had', 'do', 'does', 'did', 'but', 'not', 'your', 'my', 'we', 'they',
        'he', 'she', 'who', 'which', 'whom', 'i', 'me', 'you', 'them'
    }
    return [w for w in words if w not in stopwords and len(w) > 1]

def calculate_cosine_similarity(text1, text2):
    """Calculate the cosine similarity between two text strings using a pure Python bag-of-words implementation"""
    words1 = preprocess(text1)
    words2 = preprocess(text2)
    
    if not words1 or not words2:
        return 0.0
        
    vec1 = Counter(words1)
    vec2 = Counter(words2)
    
    # Set of unique words across both documents
    intersection = set(vec1.keys()) & set(vec2.keys())
    
    # Dot product
    dot_product = sum([vec1[word] * vec2[word] for word in intersection])
    
    # Vector magnitudes
    magnitude1 = math.sqrt(sum([val**2 for val in vec1.values()]))
    magnitude2 = math.sqrt(sum([val**2 for val in vec2.values()]))
    
    if not magnitude1 or not magnitude2:
        return 0.0
        
    similarity = dot_product / (magnitude1 * magnitude2)
    return round(similarity * 100, 2)

def calculate_skill_match(required_skills_str, candidate_skills_str):
    """
    Compares candidate skills against job required skills.
    Returns: (matched_skills, missing_skills, coverage_pct)
    """
    if not required_skills_str:
        return ([], [], 100.0)
        
    # Split skills by comma, clean whitespace, and filter empty strings
    req_skills = {s.strip().lower() for s in required_skills_str.split(',') if s.strip()}
    cand_skills = {s.strip().lower() for s in candidate_skills_str.split(',') if s.strip()}
    
    if not req_skills:
        return ([], [], 100.0)
        
    # Set intersections/differences
    matched = req_skills & cand_skills
    missing = req_skills - cand_skills
    
    coverage = (len(matched) / len(req_skills)) * 100.0
    
    # Map back to original case matching candidates (best effort)
    original_req_map = {s.strip().lower(): s.strip() for s in required_skills_str.split(',')}
    matched_orig = [original_req_map[m] for m in matched if m in original_req_map]
    missing_orig = [original_req_map[m] for m in missing if m in original_req_map]
    
    return (matched_orig, missing_orig, round(coverage, 2))

def calculate_profile_completeness(user):
    """
    Calculates candidate profile completeness score in percentage.
    Weight distribution:
    - Basic Information (fullName, email, phone, address): 25%
    - Academic Data (college, course, branch, degree, cgpa): 25%
    - Practical Profiles (linkedinUrl, githubUrl, resumeFilename): 20%
    - Professional Core (skills, certifications, projects): 30%
    """
    if not user:
        return 0.0
        
    score = 0
    
    # Basic Info (4 fields * 6.25%)
    basic_fields = [user.full_name, user.email, user.phone, user.address]
    basic_filled = sum(1 for f in basic_fields if f and f.strip())
    score += basic_filled * 6.25
    
    # Academic Data (5 fields * 5%)
    academic_fields = [user.college, user.course, user.branch, user.degree, user.cgpa]
    academic_filled = sum(1 for f in academic_fields if f and f.strip())
    score += academic_filled * 5.0
    
    # Profiles & Resume (3 fields * 6.66%)
    profile_fields = [user.linkedin_url, user.github_url, user.resume_filename]
    profile_filled = sum(1 for f in profile_fields if f and f.strip())
    score += profile_filled * 6.66
    
    # Professional Core
    if user.skills and user.skills.strip():
        score += 10.0
    if user.certifications and user.certifications.strip():
        score += 10.0
    if user.projects and user.projects.strip() and user.projects != '[]':
        score += 10.0
        
    return min(100.0, round(score, 2))

def recalculate_candidate_ranking(student_id, job_id):
    """
    Calculates all metrics and caches them in CandidateRanking table.
    Ranking algorithm weights:
    - Resume Match % : 30%
    - Assessment Score % : 40%
    - Skill Match % : 20%
    - Profile Completeness % : 10%
    """
    student = User.query.get(student_id)
    job = Job.query.get(job_id)
    
    if not student or not job:
        return None
        
    # 1. Resume Match % (TF-IDF Cosine Similarity)
    resume_match = 0.0
    if student.resume_text:
        resume_match = calculate_cosine_similarity(student.resume_text, job.description or "")
    
    # 2. Skill Match %
    _, _, skill_match = calculate_skill_match(job.required_skills, student.skills or "")
    
    # 3. Profile Completeness %
    completeness = calculate_profile_completeness(student)
    
    # 4. Assessment Score %
    # Find all assessments linked to this job
    assessment_ids = [a.id for a in job.assessments]
    assessment_score = 0.0
    
    if assessment_ids:
        # Find student's highest completed attempt score pct for these assessments
        highest_attempt = AssessmentAttempt.query.filter(
            AssessmentAttempt.student_id == student_id,
            AssessmentAttempt.assessment_id.in_(assessment_ids),
            AssessmentAttempt.status == 'completed'
        ).order_by(AssessmentAttempt.percentage.desc()).first()
        
        if highest_attempt and highest_attempt.percentage is not None:
            assessment_score = highest_attempt.percentage
            
    # Calculate weighted overall score
    overall = (resume_match * 0.3) + (assessment_score * 0.4) + (skill_match * 0.2) + (completeness * 0.1)
    overall = round(overall, 2)
    
    # Update or Create candidate ranking entry
    rank_entry = CandidateRanking.query.filter_by(job_id=job_id, student_id=student_id).first()
    if not rank_entry:
        rank_entry = CandidateRanking(
            job_id=job_id,
            student_id=student_id
        )
        db.session.add(rank_entry)
        
    rank_entry.resume_match_pct = resume_match
    rank_entry.assessment_score_pct = assessment_score
    rank_entry.skill_match_pct = skill_match
    rank_entry.profile_completeness_pct = completeness
    rank_entry.overall_score = overall
    
    db.session.commit()
    return rank_entry

import os
import json
import random
import requests

# ── LOCAL INTELLIGENT QUESTION BANK (FALLBACK ENGINE) ────────────────────────
LOCAL_MCQS = {
    "react": [
        {"questionText": "What is the primary purpose of the Virtual DOM in React?",
         "optionA": "To directly manipulate browser HTML for performance",
         "optionB": "To create a lightweight copy of the real DOM in memory for efficient diffing",
         "optionC": "To automatically secure the application from XSS attacks",
         "optionD": "To enable multi-threaded execution of React components",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "Which hook should be used to run a side-effect only once when a component mounts?",
         "optionA": "useEffect(callback, [mounted])",
         "optionB": "useEffect(callback, [])",
         "optionC": "useEffect(callback)",
         "optionD": "useMemo(callback, [])",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "What does the 'useRef' hook return in React?",
         "optionA": "A stateful value and a setter function",
         "optionB": "A mutable ref object whose .current property is initialized to the passed argument",
         "optionC": "A cached version of a callback function",
         "optionD": "An integer counter tracking render cycles",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "In React, how can you pass data down the component tree without manually passing props at every level?",
         "optionA": "By utilizing Redux actions exclusively",
         "optionB": "By using the Context API",
         "optionC": "By declaring variables on the global window object",
         "optionD": "By calling component methods directly using ref bindings",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "Why should keys be provided to lists of elements in React?",
         "optionA": "To bind event handlers automatically to individual items",
         "optionB": "To help React identify which items have changed, been added, or been removed",
         "optionC": "To enforce strict CSS style applications",
         "optionD": "To automatically sort the array elements before rendering",
         "correctAnswer": "b", "marks": 5}
    ],
    "java": [
        {"questionText": "Which of the following is true about garbage collection in Java?",
         "optionA": "Garbage collection is guaranteed to run as soon as an object is dereferenced",
         "optionB": "System.gc() guarantees immediate reclamation of unused heap memory",
         "optionC": "Garbage collection runs on a low-priority daemon thread managed by the JVM",
         "optionD": "Garbage collection automatically reclaims resources from the stack memory space",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "What is the difference between an Interface and an Abstract Class in Java 8?",
         "optionA": "Abstract classes can have default method implementations, interfaces cannot",
         "optionB": "Interfaces can support multiple inheritance; abstract classes do not",
         "optionC": "Abstract classes can only contain static final variables",
         "optionD": "Interfaces can define private constructors to limit instantiation",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "Which keyword is used to restrict a variable's visibility to only the class itself in Java?",
         "optionA": "protected",
         "optionB": "private",
         "optionC": "default",
         "optionD": "static",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "What does the 'volatile' keyword signify when applied to a variable in Java?",
         "optionA": "It marks the variable as constant and immutable",
         "optionB": "It ensures the variable is read from and written directly to main memory, bypassing CPU caches",
         "optionC": "It marks the variable as thread-safe by applying a synchronized lock",
         "optionD": "It prevents the variable from being serialized during stream transfers",
         "correctAnswer": "b", "marks": 5}
    ],
    "python": [
        {"questionText": "What is the key difference between a list and a tuple in Python?",
         "optionA": "Lists are immutable; tuples are mutable",
         "optionB": "Lists are mutable; tuples are immutable",
         "optionC": "Lists can only store strings, while tuples can store any data type",
         "optionD": "Tuples are significantly slower to access than lists",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "What is the output of the expression `[x * 2 for x in range(3)]` in Python?",
         "optionA": "[0, 2, 4]",
         "optionB": "[2, 4, 6]",
         "optionC": "[0, 1, 2]",
         "optionD": "(0, 2, 4)",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "What does the `__init__` method represent in Python classes?",
         "optionA": "A compiler directive to initialize memory registers",
         "optionB": "A constructor method called automatically when an object is instantiated",
         "optionC": "A built-in class destructor that wipes the object references",
         "optionD": "A utility method to convert class objects to string formats",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "Which module in Python is most commonly used for handling scientific arrays and matrix computations?",
         "optionA": "pandas",
         "optionB": "numpy",
         "optionC": "sklearn",
         "optionD": "matplotlib",
         "correctAnswer": "b", "marks": 5}
    ],
    "sql": [
        {"questionText": "What is the primary role of a FOREIGN KEY constraint in SQL?",
         "optionA": "To accelerate search speeds across multi-column indices",
         "optionB": "To guarantee referential integrity between tables by linking records",
         "optionC": "To automatically encrypt critical data fields upon insertion",
         "optionD": "To prevent duplicate entries from being created in a single table",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "What is the difference between an INNER JOIN and a LEFT JOIN in SQL?",
         "optionA": "INNER JOIN only returns matching records; LEFT JOIN returns all records from the left table and matches from the right",
         "optionB": "LEFT JOIN only returns records from the left table that have NO matches in the right table",
         "optionC": "INNER JOIN is twice as slow as a LEFT JOIN due to caching limitations",
         "optionD": "They perform the exact same logical operation but have different syntax",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "Which clause is used in SQL to filter the results of an aggregate query (e.g. GROUP BY)?",
         "optionA": "WHERE",
         "optionB": "HAVING",
         "optionC": "FILTER",
         "optionD": "GROUP WHERE",
         "correctAnswer": "b", "marks": 5}
    ],
    "general": [
        {"questionText": "What is the worst-case time complexity of sorting an array of size N using QuickSort?",
         "optionA": "O(N)",
         "optionB": "O(N log N)",
         "optionC": "O(N^2)",
         "optionD": "O(1)",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "Which data structure follows the Last-In-First-Out (LIFO) order of operation?",
         "optionA": "Queue",
         "optionB": "Stack",
         "optionC": "Binary Search Tree",
         "optionD": "Linked List",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "What does the 'S' in SOLID principles of object-oriented design stand for?",
         "optionA": "Single Responsibility Principle",
         "optionB": "System Scope Principle",
         "optionC": "Static Inheritance Structure",
         "optionD": "State Segregation Standard",
         "correctAnswer": "a", "marks": 5}
    ],
    "aptitude": [
        {"questionText": "If a car travels at a constant speed of 60 km/h, how long will it take to travel 150 km?",
         "optionA": "2 hours", "optionB": "2.5 hours", "optionC": "3 hours", "optionD": "1.5 hours",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "Find the missing number in the sequence: 2, 6, 12, 20, 30, ?",
         "optionA": "36", "optionB": "40", "optionC": "42", "optionD": "45",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "A train 120 meters long passes a telegraph post in 6 seconds. What is the speed of the train in km/h?",
         "optionA": "72 km/h", "optionB": "60 km/h", "optionC": "54 km/h", "optionD": "80 km/h",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "Pointing to a photograph, a man said, 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?",
         "optionA": "His own", "optionB": "His father's", "optionC": "His son's", "optionD": "His nephew's",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "If 'white' is called 'black', 'black' is called 'red', 'red' is called 'blue', and 'blue' is called 'yellow', what is the color of human blood?",
         "optionA": "Red", "optionB": "Black", "optionC": "Blue", "optionD": "Yellow",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "A father is twice as old as his son. Twenty years ago, the age of the father was 12 times the age of the son. What is the father's current age?",
         "optionA": "40 years", "optionB": "44 years", "optionC": "36 years", "optionD": "48 years",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "In a group of cows and chickens, the number of legs is 14 more than twice the number of heads. How many cows are there?",
         "optionA": "5", "optionB": "7", "optionC": "10", "optionD": "12",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "What is the angle between the hour hand and the minute hand of a clock at 3:30?",
         "optionA": "90 degrees", "optionB": "75 degrees", "optionC": "60 degrees", "optionD": "85 degrees",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "If a metal sheet measuring 10m x 8m has 1m squares cut from all four corners, and the remaining sides are folded to make an open box, what is the volume of the box?",
         "optionA": "48 cubic meters", "optionB": "80 cubic meters", "optionC": "64 cubic meters", "optionD": "52 cubic meters",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "If 5 workers can build 5 tables in 5 days, how many days will it take 10 workers to build 10 tables?",
         "optionA": "10 days", "optionB": "5 days", "optionC": "1 day", "optionD": "2.5 days",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "A sum of money doubles itself in 8 years under simple interest. What is the annual interest rate?",
         "optionA": "12.5%", "optionB": "10%", "optionC": "15%", "optionD": "8%",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "If January 1st of a certain non-leap year is a Monday, what day of the week will January 1st of the next year be?",
         "optionA": "Monday", "optionB": "Tuesday", "optionC": "Wednesday", "optionD": "Sunday",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "Find the odd one out in this group: 27, 64, 125, 144, 216.",
         "optionA": "27", "optionB": "64", "optionC": "144", "optionD": "216",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "If the word 'CODER' is encrypted as 'DPEFS', how would 'HELLO' be encrypted?",
         "optionA": "IFMMP", "optionB": "IGOMP", "optionC": "IGNMP", "optionD": "IFOMP",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "A boat goes 8 km downstream in 40 minutes and returns upstream in 1 hour. What is the speed of the boat in still water?",
         "optionA": "10 km/h", "optionB": "12 km/h", "optionC": "8 km/h", "optionD": "9 km/h",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "A basket contains 3 red, 4 blue, and 5 green marbles. If one marble is drawn at random, what is the probability that it is green?",
         "optionA": "5/12", "optionB": "1/3", "optionC": "1/4", "optionD": "5/7",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "Three partners A, B, and C invest in a business. A invests 3 times as much as B, and B invests 2/3 of what C invests. If total profit is Rs. 6600, what is B's share?",
         "optionA": "Rs. 1200", "optionB": "Rs. 1800", "optionC": "Rs. 3600", "optionD": "Rs. 1500",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "In a code, '329' means 'you are sad', '952' means 'sad but active', and '358' means 'you but happy'. Which digit represents 'happy'?",
         "optionA": "3", "optionB": "5", "optionC": "8", "optionD": "9",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "An employee's salary is increased by 10% and then decreased by 10%. What is the net change in salary?",
         "optionA": "No change", "optionB": "1% increase", "optionC": "1% decrease", "optionD": "2% decrease",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "How many times do the hands of a clock overlap in a single day (24 hours)?",
         "optionA": "24 times", "optionB": "22 times", "optionC": "12 times", "optionD": "44 times",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "If A is taller than B, B is taller than C, and D is taller than A, who is the shortest?",
         "optionA": "A", "optionB": "B", "optionC": "C", "optionD": "D",
         "correctAnswer": "c", "marks": 5},
        {"questionText": "A pump can fill a tank in 2 hours. Because of a leak, it took 2 hours and 20 minutes to fill. How long would the leak take to empty a full tank?",
         "optionA": "14 hours", "optionB": "12 hours", "optionC": "16 hours", "optionD": "10 hours",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "If A=1, B=2, C=3, and so on, what is the sum of letters in 'CAT'?",
         "optionA": "24", "optionB": "20", "optionC": "26", "optionD": "28",
         "correctAnswer": "a", "marks": 5},
        {"questionText": "A trader marks his goods 20% above cost price and allows a 10% discount. What is his profit percentage?",
         "optionA": "10%", "optionB": "8%", "optionC": "12%", "optionD": "5%",
         "correctAnswer": "b", "marks": 5},
        {"questionText": "If 6 boys or 8 girls can complete a project in 10 days, how long will it take 3 boys and 4 girls together to complete it?",
         "optionA": "10 days", "optionB": "20 days", "optionC": "5 days", "optionD": "8 days",
         "correctAnswer": "a", "marks": 5}
    ]
}

LOCAL_CODINGS = [
    {
        "title": "Reverse Words in a String",
        "description": "Given an input string `s`, reverse the order of the words. A word is defined as a sequence of non-space characters. The words in `s` will be separated by at least one space.\n\nReturn a string of the words in reverse order concatenated by a single space. Note that `s` may contain leading or trailing spaces or multiple spaces between two words. The returned string should only have a single space separating the words. Do not include any extra spaces.",
        "difficulty": "Easy",
        "inputFormat": "A single line containing the string `s`.",
        "outputFormat": "A single line containing the reversed string of words.",
        "constraints": "1 <= s.length <= 10^4\ns contains English letters, digits, and spaces.",
        "sampleInput": "  hello world  ",
        "sampleOutput": "world hello",
        "testCases": [
            {"input": "  hello world  ", "output": "world hello", "is_hidden": False},
            {"input": "a good   example", "output": "example good a", "is_hidden": False},
            {"input": "singleword", "output": "singleword", "is_hidden": True},
            {"input": "   lots    of    spaces   here  ", "output": "here spaces of lots", "is_hidden": True}
        ],
        "templatePython": "def reverseWords(s: str) -> str:\n    # Write your Python code here\n    pass",
        "templateJavascript": "function reverseWords(s) {\n    // Write your JavaScript code here\n    return '';\n}",
        "templateCpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nstring reverseWords(string s) {\n    // Write your C++ code here\n    return \"\";\n}",
        "templateJava": "public class Solution {\n    public static String reverseWords(String s) {\n        // Write your Java code here\n        return \"\";\n    }\n}",
        "marks": 20
    },
    {
        "title": "Find the Duplicate Number",
        "description": "Given an array of integers `nums` containing `n + 1` integers where each integer is in the range `[1, n]` inclusive.\n\nThere is only one repeated number in `nums`, return this repeated number.\n\nYou must solve the problem without modifying the array `nums` and uses only constant extra space.",
        "difficulty": "Medium",
        "inputFormat": "A single line containing space-separated integers representation of the array.",
        "outputFormat": "An integer representing the duplicated number.",
        "constraints": "1 <= n <= 10^5\nnums.length == n + 1\n1 <= nums[i] <= n\nAll integers in nums appear only once except for precisely one integer which appears two or more times.",
        "sampleInput": "1 3 4 2 2",
        "sampleOutput": "2",
        "testCases": [
            {"input": "1 3 4 2 2", "output": "2", "is_hidden": False},
            {"input": "3 1 3 4 2", "output": "3", "is_hidden": False},
            {"input": "1 1", "output": "1", "is_hidden": True},
            {"input": "3 3 3 3 3", "output": "3", "is_hidden": True}
        ],
        "templatePython": "from typing import List\n\ndef findDuplicate(nums: List[int]) -> int:\n    # Write your Python code here\n    pass",
        "templateJavascript": "function findDuplicate(nums) {\n    // Write your JavaScript code here\n    return 0;\n}",
        "templateCpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint findDuplicate(vector<int>& nums) {\n    // Write your C++ code here\n    return 0;\n}",
        "templateJava": "import java.util.*;\n\npublic class Solution {\n    public static int findDuplicate(int[] nums) {\n        // Write your Java code here\n        return 0;\n    }\n}",
        "marks": 30
    },
    {
        "title": "Two Sum Problem",
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order, represented as space-separated indices.",
        "difficulty": "Easy",
        "inputFormat": "First line contains target. Second line contains space-separated integers.",
        "outputFormat": "Space-separated indices of the two elements.",
        "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
        "sampleInput": "9\n2 7 11 15",
        "sampleOutput": "0 1",
        "testCases": [
            {"input": "9\n2 7 11 15", "output": "0 1", "is_hidden": False},
            {"input": "6\n3 2 4", "output": "1 2", "is_hidden": False},
            {"input": "6\n3 3", "output": "0 1", "is_hidden": True},
            {"input": "10\n1 2 3 4 6", "output": "3 4", "is_hidden": True}
        ],
        "templatePython": "from typing import List\n\ndef twoSum(nums: List[int], target: int) -> List[int]:\n    # Write your Python code here\n    pass",
        "templateJavascript": "function twoSum(nums, target) {\n    // Write your JavaScript code here\n    return [];\n}",
        "templateCpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your C++ code here\n    return {};\n}",
        "templateJava": "import java.util.*;\n\npublic class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n        return new int[]{};\n    }\n}",
        "marks": 20
    }
]


def generate_local_questions(topic, difficulty, mcq_count, coding_count):
    """Fallback generator using internal dictionary fuzzy matching with 25 aptitude questions first"""
    topic_clean = str(topic).lower()
    
    # 1. Gather MCQs
    selected_mcqs = []
    
    # Identify how many aptitude and how many technical questions are needed
    apt_count = min(mcq_count, 25)
    tech_count = max(0, mcq_count - 25)
    
    # Pull aptitude questions
    apt_pool = list(LOCAL_MCQS.get("aptitude", []))
    if len(apt_pool) < apt_count:
        apt_pool.extend(LOCAL_MCQS.get("general", []))
    selected_apt = random.sample(apt_pool, min(len(apt_pool), apt_count))
    selected_mcqs.extend([dict(q) for q in selected_apt])
    
    # Pull technical questions if needed
    if tech_count > 0:
        pool = []
        for k, questions in LOCAL_MCQS.items():
            if k != "aptitude" and k in topic_clean:
                pool.extend(questions)
        # Default to general if pool is too small
        if len(pool) < tech_count:
            pool.extend(LOCAL_MCQS.get("general", []))
        if len(pool) < tech_count:
            # Pull everything except aptitude to satisfy request
            for k, qlist in LOCAL_MCQS.items():
                if k != "aptitude":
                    for q in qlist:
                        if q not in pool:
                            pool.append(q)
        selected_tech = random.sample(pool, min(len(pool), tech_count))
        selected_mcqs.extend([dict(q) for q in selected_tech])
        
    # 2. Gather relevant Codings
    coding_pool = list(LOCAL_CODINGS)
    selected_codings = random.sample(coding_pool, min(len(coding_pool), coding_count))
    codings = [dict(c) for c in selected_codings]
    
    # Adjust difficulties
    for c in codings:
        c["difficulty"] = difficulty
        
    return selected_mcqs[:mcq_count], codings[:coding_count]


def _call_gemini(prompt, api_key):
    """Utility to post requests to Gemini API and parse JSON response"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    try:
        res = requests.post(url, json=body, headers=headers, timeout=40)
        if res.status_code == 200:
            data = res.json()
            text_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            return json.loads(text_response)
        else:
            print(f"Gemini API returned status {res.status_code}: {res.text}")
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
    return None


def generate_ai_questions(topic, difficulty, mcq_count, coding_count, job_title=None, job_description=None, job_skills=None):
    """
    Attempts to call Gemini API using a batched approach (max 25 questions per prompt)
    to handle up to 150 questions without truncations or timeouts.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found in environment. Using robust local fallback generator.")
        return generate_local_questions(topic, difficulty, mcq_count, coding_count)

    all_mcqs = []
    all_codings = []

    # 1. GENERATE APTITUDE & LOGICAL REASONING MCQS
    apt_needed = min(mcq_count, 25)
    if apt_needed > 0:
        apt_prompt = f"""
        You are an expert technical interviewer. Generate a dataset of General Aptitude and Logical Reasoning multiple-choice questions in strict JSON format.
        Difficulty Level: {difficulty}
        Questions Count: {apt_needed}
        
        The response MUST be a raw JSON object matching this schema exactly (do not wrap in markdown tags):
        {{
          "mcqs": [
            {{
              "questionText": "A clear, realistic math, logic, verbal, calendar or blood relation reasoning question...",
              "optionA": "...",
              "optionB": "...",
              "optionC": "...",
              "optionD": "...",
              "correctAnswer": "a", // must be a, b, c, or d in lowercase
              "marks": 5
            }}
          ]
        }}
        """
        res_json = _call_gemini(apt_prompt, api_key)
        if res_json and "mcqs" in res_json:
            all_mcqs.extend(res_json["mcqs"])
        else:
            print("Failed to generate Aptitude MCQs using AI. Falling back.")
            return generate_local_questions(topic, difficulty, mcq_count, coding_count)

    # 2. GENERATE JOB ROLE SPECIFIC TECHNICAL MCQS
    tech_needed = max(0, mcq_count - 25)
    already_generated_questions = []

    # Batch tech MCQs in chunks of 25
    tech_batches = []
    while tech_needed > 0:
        chunk = min(tech_needed, 25)
        tech_batches.append(chunk)
        tech_needed -= chunk

    for i, batch_size in enumerate(tech_batches):
        avoid_instr = ""
        if already_generated_questions:
            avoid_instr = f"Do NOT generate the following questions or exact variations of them to ensure variety: {json.dumps(already_generated_questions[:40])}"

        tech_prompt = f"""
        You are an expert technical interviewer. Generate a dataset of technical role-specific multiple-choice questions in strict JSON format based on:
        Topic/Keywords: {topic}
        Job Title: {job_title or 'N/A'}
        Job Description: {job_description or 'N/A'}
        Job Required Skills: {job_skills or 'N/A'}
        Difficulty Level: {difficulty}
        Questions Count: {batch_size}
        
        {avoid_instr}
        
        The questions MUST be highly tailored to the specific job role and description above. Avoid generic questions.
        
        The response MUST be a raw JSON object matching this schema exactly (do not wrap in markdown tags):
        {{
          "mcqs": [
            {{
              "questionText": "...",
              "optionA": "...",
              "optionB": "...",
              "optionC": "...",
              "optionD": "...",
              "correctAnswer": "a", // must be a, b, c, or d in lowercase
              "marks": 5
            }}
          ]
        }}
        """
        res_json = _call_gemini(tech_prompt, api_key)
        if res_json and "mcqs" in res_json:
            batch_qs = res_json["mcqs"]
            all_mcqs.extend(batch_qs)
            already_generated_questions.extend([q.get("questionText", "") for q in batch_qs])
        else:
            print(f"Failed to generate Technical MCQ batch {i+1} using AI. Falling back.")
            return generate_local_questions(topic, difficulty, mcq_count, coding_count)

    # 3. GENERATE CODING CHALLENGES
    if coding_count > 0:
        coding_prompt = f"""
        You are an expert coding challenge creator. Generate role-specific programming/coding challenges in strict JSON format based on:
        Topic/Keywords: {topic}
        Job Title: {job_title or 'N/A'}
        Job Description: {job_description or 'N/A'}
        Job Required Skills: {job_skills or 'N/A'}
        Difficulty Level: {difficulty}
        Coding Challenges Count: {coding_count}
        
        The challenges must be highly tailored to the specific job role and description above.
        
        The response MUST be a raw JSON object matching this schema exactly (do not wrap in markdown tags):
        {{
          "coding": [
            {{
              "title": "...",
              "description": "Detailed description in markdown format...",
              "difficulty": "{difficulty}", // Easy | Medium | Hard
              "inputFormat": "...",
              "outputFormat": "...",
              "constraints": "...",
              "sampleInput": "...",
              "sampleOutput": "...",
              "testCases": [ // Minimum 3 test cases. The inputs and outputs must be standard text representations.
                {{ "input": "...", "output": "...", "is_hidden": false }},
                {{ "input": "...", "output": "...", "is_hidden": true }}
              ],
              "templatePython": "def solve(x):\n    pass",
              "templateJavascript": "function solve(x) {{\n}}",
              "templateCpp": "int solve(int x) {{\n}}",
              "templateJava": "public class Solution {{\n}}",
              "marks": 20
            }}
          ]
        }}
        """
        res_json = _call_gemini(coding_prompt, api_key)
        if res_json and "coding" in res_json:
            all_codings.extend(res_json["coding"])
        else:
            print("Failed to generate Coding challenges using AI. Falling back.")
            return generate_local_questions(topic, difficulty, mcq_count, coding_count)

    # Keep counts exact
    return all_mcqs[:mcq_count], all_codings[:coding_count]

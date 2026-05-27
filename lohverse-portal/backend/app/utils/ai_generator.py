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
    """Fallback generator using internal dictionary fuzzy matching"""
    topic_clean = str(topic).lower()
    
    # 1. Gather relevant MCQs
    pool = []
    for k, questions in LOCAL_MCQS.items():
        if k in topic_clean:
            pool.extend(questions)
            
    # Default to general if pool is too small
    if len(pool) < mcq_count:
        pool.extend(LOCAL_MCQS["general"])
    if len(pool) < mcq_count:
        # Pull everything to satisfy the request
        for qlist in LOCAL_MCQS.values():
            for q in qlist:
                if q not in pool:
                    pool.append(q)
                    
    # Shuffle and pick
    selected_mcqs = random.sample(pool, min(len(pool), mcq_count))
    # Make deep copy
    mcqs = [dict(q) for q in selected_mcqs]
    
    # 2. Gather relevant Codings
    coding_pool = list(LOCAL_CODINGS)
    selected_codings = random.sample(coding_pool, min(len(coding_pool), coding_count))
    codings = [dict(c) for c in selected_codings]
    
    # Adjust difficulties
    for c in codings:
        c["difficulty"] = difficulty
        
    return mcqs, codings


def generate_ai_questions(topic, difficulty, mcq_count, coding_count):
    """
    Attempts to call Gemini API if key is present, otherwise falls back to local.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found in environment. Using robust local fallback generator.")
        return generate_local_questions(topic, difficulty, mcq_count, coding_count)
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    prompt = f"""
    You are an expert technical interviewer. Generate an assessment dataset in strict JSON format based on:
    Topic/Role: {topic}
    Difficulty: {difficulty}
    MCQ Questions Count: {mcq_count}
    Coding Challenges Count: {coding_count}
    
    The response MUST be a raw JSON object matching this schema exactly (do not wrap in ```json markers, return only the raw string):
    {{
      "mcqs": [
        {{
          "questionText": "...",
          "optionA": "...",
          "optionB": "...",
          "optionC": "...",
          "optionD": "...",
          "correctAnswer": "a", // must be a, b, c, or d
          "marks": 5
        }}
      ],
      "coding": [
        {{
          "title": "...",
          "description": "Detailed description in markdown format...",
          "difficulty": "Easy", // Easy | Medium | Hard
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
    
    body = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        res = requests.post(url, json=body, headers=headers, timeout=30)
        if res.status_code == 200:
            data = res.json()
            text_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            parsed = json.loads(text_response)
            
            mcqs = parsed.get("mcqs", [])
            codings = parsed.get("coding", [])
            
            # Keep counts correct
            if len(mcqs) > 0 and len(codings) > 0:
                return mcqs[:mcq_count], codings[:coding_count]
        else:
            print(f"Gemini API returned status {res.status_code}. Falling back.")
    except Exception as e:
        print(f"Error calling Gemini API: {e}. Falling back.")
        
    return generate_local_questions(topic, difficulty, mcq_count, coding_count)

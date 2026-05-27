import os
import shutil

src_dir = r"c:\Lohit-files\cluade code\lohverse-recruiter\src\pages\recruiter"
dest_dir = r"c:\Lohit-files\cluade code\lohverse-portal\src\pages\recruiter"

src_css = r"c:\Lohit-files\cluade code\lohverse-recruiter\src\pages\RecruiterDashboard.css"
dest_css = r"c:\Lohit-files\cluade code\lohverse-portal\src\pages\RecruiterDashboard.css"

# Copy directory
if os.path.exists(src_dir):
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)
    shutil.copytree(src_dir, dest_dir)
    print("Recruiter pages copied successfully!")
else:
    print(f"Source directory not found: {src_dir}")

# Copy CSS
if os.path.exists(src_css):
    shutil.copy(src_css, dest_css)
    print("Recruiter CSS copied successfully!")
else:
    print(f"Source CSS not found: {src_css}")

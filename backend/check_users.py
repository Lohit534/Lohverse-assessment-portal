from app import create_app
from app.models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    print("TOTAL USERS IN DATABASE:", len(users))
    for u in users:
        print(f"ID: {u.id} | Email: {u.email} | Role: {u.role} | Full Name: {u.full_name} | Branch: {u.branch}")

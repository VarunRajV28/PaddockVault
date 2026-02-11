from app import app, db, User

def show_hashes():
    """
    Script to display usernames and their stored hashed passwords.
    This demonstrates that passwords are not stored in plain text.
    """
    with app.app_context():
        users = User.query.all()
        
        print("\n=== USER PASSWORD HASHES IN DATABASE ===\n")
        print(f"{'Username':<20} | {'Stored Hashed Password'}")
        print("-" * 90)
        
        for user in users:
            print(f"{user.username:<20} | {user.password}")
            
        print("\n" + "-" * 90)
        print("Note: These values are generated using PBKDF2 with SHA256 (via Werkzeug).")
        print("They cannot be reversed to find the original password.")

if __name__ == "__main__":
    show_hashes()

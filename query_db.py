import sqlite3


# Path to your SQLite database
DB_PATH = "users.db"


def fetch_all_users():
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Query to fetch all users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()

    # Get column names from the cursor
    column_names = [description[0] for description in cursor.description]

    # Print results
    print(f"{' | '.join(column_names)}")
    print("-" * 80)
    for user in users:
        print(" | ".join(str(field) for field in user))

    # Clean up
    cursor.close()
    conn.close()


if __name__ == "__main__":
    fetch_all_users()

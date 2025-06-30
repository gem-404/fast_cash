import sqlite3

# Connect to the database
conn = sqlite3.connect('users.db')
cursor = conn.cursor()

# Step 1: Clear all existing entries from the loans table
cursor.execute("DELETE FROM loans")
print("All previous entries in the loans table have been deleted.")

# Step 2: Insert 3 new active loan entries
# Assumes user_id=1 exists — change it if needed
new_loans = [
    (1, 15000, 12, 'active'),
    (1, 8000, 6, 'active'),
    (1, 5000, 3, 'active')
]

for loan in new_loans:
    cursor.execute("""
        INSERT INTO loans (user_id, amount, term, status)
        VALUES (?, ?, ?, ?)
    """, loan)

# Finalize changes
conn.commit()
conn.close()

print("3 active loan records successfully inserted.")

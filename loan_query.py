import sqlite3


# Connect to the SQLite database file
conn = sqlite3.connect('users.db')

# Create a cursor object to execute SQL queries
cursor = conn.cursor()

# SQL query to fetch all rows from the loans table
query = "SELECT * FROM loans;"

try:
    cursor.execute(query)
    rows = cursor.fetchall()

    # Check if there are any rows
    if rows:
        print("Loans Table Data:\n")
        for row in rows:
            print(row)
    else:
        print("No loan records found in the table.")

except sqlite3.Error as e:
    print(f"An error occurred while querying the database: {e}")


# Close the connection
conn.close()

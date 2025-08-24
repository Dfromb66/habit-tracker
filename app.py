from flask import Flask, render_template, request, jsonify, send_file
import sqlite3
import csv
import io
from datetime import datetime, date
import os

app = Flask(__name__)

# Database initialization
def init_db():
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT DEFAULT '#007bff',
            created_date DATE DEFAULT CURRENT_DATE
        )
    ''')
    
    # Add color column if it doesn't exist (for existing databases)
    try:
        cursor.execute('ALTER TABLE habits ADD COLUMN color TEXT DEFAULT "#007bff"')
    except sqlite3.OperationalError:
        # Column already exists
        pass
    
    # Create habit_entries table with unique constraint
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS habit_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            habit_id INTEGER,
            entry_date DATE NOT NULL,
            value TEXT DEFAULT '',
            FOREIGN KEY (habit_id) REFERENCES habits (id),
            UNIQUE(habit_id, entry_date)
        )
    ''')
    
    # Clean up existing duplicates before adding unique constraint
    cleanup_existing_duplicates(cursor)
    
    # Try to add unique constraint to existing table (will fail if already exists)
    try:
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_date_unique ON habit_entries(habit_id, entry_date)')
    except sqlite3.OperationalError:
        # Index already exists
        pass
    
    conn.commit()
    conn.close()

def cleanup_existing_duplicates(cursor):
    """Remove duplicate entries for the same habit and date, keeping the most recent one"""
    # First, find all duplicate combinations
    cursor.execute('''
        SELECT habit_id, entry_date, COUNT(*) as count
        FROM habit_entries 
        GROUP BY habit_id, entry_date 
        HAVING COUNT(*) > 1
    ''')
    
    duplicates = cursor.fetchall()
    
    for habit_id, entry_date, count in duplicates:
        # For each duplicate combination, keep the entry with the highest ID (most recent)
        cursor.execute('''
            DELETE FROM habit_entries 
            WHERE habit_id = ? AND entry_date = ? 
            AND id NOT IN (
                SELECT MAX(id) 
                FROM habit_entries 
                WHERE habit_id = ? AND entry_date = ?
            )
        ''', (habit_id, entry_date, habit_id, entry_date))

# Initialize database on startup
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/habits', methods=['GET'])
def get_habits():
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, icon, color FROM habits ORDER BY id')
    habits = [{'id': row[0], 'name': row[1], 'icon': row[2], 'color': row[3]} for row in cursor.fetchall()]
    conn.close()
    return jsonify(habits)

@app.route('/api/habits', methods=['POST'])
def create_habit():
    data = request.json
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO habits (name, icon, color) VALUES (?, ?, ?)', 
                   (data['name'], data['icon'], data.get('color', '#007bff')))
    habit_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'id': habit_id, 'name': data['name'], 'icon': data['icon'], 'color': data.get('color', '#007bff')})

@app.route('/api/habits/<int:habit_id>', methods=['PUT'])
def update_habit(habit_id):
    data = request.json
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE habits SET name = ?, icon = ?, color = ? WHERE id = ?', 
                   (data['name'], data['icon'], data.get('color', '#007bff'), habit_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/habits/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM habit_entries WHERE habit_id = ?', (habit_id,))
    cursor.execute('DELETE FROM habits WHERE id = ?', (habit_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/entries/<date>', methods=['GET'])
def get_entries(date):
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT h.id, h.name, h.icon, h.color, he.value 
        FROM habits h 
        LEFT JOIN habit_entries he ON h.id = he.habit_id AND he.entry_date = ?
        ORDER BY h.id
    ''', (date,))
    entries = []
    for row in cursor.fetchall():
        entries.append({
            'habit_id': row[0],
            'name': row[1],
            'icon': row[2],
            'color': row[3],
            'value': row[4] if row[4] else ''
        })
    conn.close()
    return jsonify(entries)

@app.route('/api/entries/month/<year>/<month>', methods=['GET'])
def get_month_entries(year, month):
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    
    # Get all entries for the specified month
    start_date = f"{year}-{month:0>2}-01"
    if month == 12:
        end_date = f"{int(year)+1}-01-01"
    else:
        end_date = f"{year}-{int(month)+1:0>2}-01"
    
    # First get all habits
    cursor.execute('SELECT id FROM habits ORDER BY id')
    habit_ids = [row[0] for row in cursor.fetchall()]
    
    # Then get all entries for the month
    cursor.execute('''
        SELECT habit_id, entry_date, value 
        FROM habit_entries 
        WHERE entry_date >= ? AND entry_date < ?
        ORDER BY habit_id, entry_date
    ''', (start_date, end_date))
    
    entries = {}
    for habit_id in habit_ids:
        entries[habit_id] = {}
    
    for row in cursor.fetchall():
        habit_id = row[0]
        entry_date = row[1]
        value = row[2]
        
        if habit_id in entries:
            entries[habit_id][entry_date] = value
    
    conn.close()
    return jsonify(entries)

@app.route('/api/entries', methods=['POST'])
def create_entry():
    data = request.json
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    
    try:
        # Use INSERT OR REPLACE since we now have a unique constraint
        cursor.execute('''
            INSERT OR REPLACE INTO habit_entries (habit_id, entry_date, value) 
            VALUES (?, ?, ?)
        ''', (data['habit_id'], data['date'], data['value']))
        
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Duplicate entry prevented'}), 400

@app.route('/api/entries/<int:habit_id>/<date>', methods=['DELETE'])
def delete_entry(habit_id, date):
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM habit_entries WHERE habit_id = ? AND entry_date = ?', 
                   (habit_id, date))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/export')
def export_csv():
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT h.name, h.icon, he.entry_date, he.value
        FROM habits h
        LEFT JOIN habit_entries he ON h.id = he.habit_id
        ORDER BY h.name, he.entry_date
    ''')
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Habit Name', 'Icon', 'Date', 'Value'])
    
    for row in cursor.fetchall():
        # Handle the checkmark symbol properly
        habit_name, icon, entry_date, value = row
        if value == '✓':
            value = 'COMPLETED'  # Replace checkmark with readable text
        elif value is None:
            value = ''  # Handle NULL values
        writer.writerow([habit_name, icon, entry_date, value])
    
    conn.close()
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),  # Use UTF-8 with BOM for better Excel compatibility
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'habits_export_{date.today()}.csv'
    )

@app.route('/api/import', methods=['POST'])
def import_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        # Read CSV file
        content = file.read().decode('utf-8')
        csv_data = csv.reader(io.StringIO(content))
        next(csv_data)  # Skip header row
        
        conn = sqlite3.connect('habits.db')
        cursor = conn.cursor()
        
        # Clear existing data
        cursor.execute('DELETE FROM habit_entries')
        cursor.execute('DELETE FROM habits')
        
        # Import new data
        for row in csv_data:
            if len(row) >= 4:
                habit_name, icon, entry_date, value = row[:4]
                
                # Insert habit if not exists
                cursor.execute('INSERT INTO habits (name, icon) VALUES (?, ?)', (habit_name, icon))
                habit_id = cursor.lastrowid
                
                # Insert entry if date is provided
                if entry_date and entry_date.strip():
                    cursor.execute('INSERT INTO habit_entries (habit_id, entry_date, value) VALUES (?, ?, ?)',
                                 (habit_id, entry_date, value))
        
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/cleanup-duplicates', methods=['POST'])
def cleanup_duplicates():
    """Remove duplicate entries for the same habit and date"""
    conn = sqlite3.connect('habits.db')
    cursor = conn.cursor()
    
    # Find and remove duplicates, keeping only the first entry for each habit/date combination
    cursor.execute('''
        DELETE FROM habit_entries 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM habit_entries 
            GROUP BY habit_id, entry_date
        )
    ''')
    
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'deleted_count': deleted_count})

if __name__ == '__main__':
    app.run(debug=True) 
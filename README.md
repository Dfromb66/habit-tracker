# Habit Tracker

[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, interactive web application for tracking daily habits and tasks. Built with Flask, SQLite, and a responsive frontend.

## 🚀 Live Demo

[Try the live demo here](https://DFromb66.pythonanywhere.com) 🎯

## ✨ Features

- 📅 **Monthly Calendar View**: See all your habits organized in a weekly grid format
- 🎨 **Custom Icons**: Choose from 36 different Font Awesome icons for each habit
- ✅ **Interactive Tracking**: Click on any day to mark habits as completed
- 📊 **Value Tracking**: Add specific values to habits (e.g., number of protein shakes, workout duration)
- ✏️ **Edit & Delete**: Hover over habits or entries to edit or delete them
- 🔄 **Drag & Drop**: Reorder habits by dragging the handlebars
- ⬅️➡️ **Month Navigation**: Navigate between months with arrow buttons
- 📤📥 **Import/Export**: Backup and restore your data using CSV files
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🎯 **Today Highlighting**: Current date is automatically highlighted

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Dfromb66/habit-tracker.git
   cd habit-tracker
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:5000
   ```

## 📖 How to Use

### Adding Habits
1. Click the "Add Habit" button
2. Enter a habit name (e.g., "Go to bed at 10:30 PM", "Biceps workout", "Protein shake")
3. Select an icon from the grid
4. Click "Save"

### Tracking Habits
- **Mark as completed**: Click on any day cell to mark a habit as completed
- **Add values**: Hover over a completed habit and click the yellow "e" button to add specific values
- **Delete entries**: Hover over any cell and click the red "×" button to delete that day's entry

### Managing Habits
- **Edit habit**: Hover over the habit name and click the yellow "e" button
- **Delete habit**: Hover over the habit name and click the red "×" button
- **Reorder habits**: Drag the handlebar (⋮⋮) next to habit names to reorder them

### Navigation
- Use the left/right arrow buttons to navigate between months
- The current date is automatically highlighted in blue
- Today's date is displayed at the top of the page

### Data Management
- **Export**: Click "Export" to download your data as a CSV file
- **Import**: Click "Import" to upload a previously exported CSV file

## 📁 File Structure

```
habit-tracker/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── README.md          # This file
├── DEPLOYMENT.md      # Deployment guide
├── .gitignore         # Git ignore file
├── habits.db          # SQLite database (created automatically)
├── templates/
│   └── index.html     # Main HTML template
└── static/
    ├── style.css      # CSS styles
    └── script.js      # JavaScript functionality
```

## 🗄️ Database Schema

The application uses SQLite with two main tables:

### Habits Table
- `id`: Primary key
- `name`: Habit name
- `icon`: Font Awesome icon class
- `color`: Habit color (default: #007bff)
- `created_date`: When the habit was created

### Habit Entries Table
- `id`: Primary key
- `habit_id`: Foreign key to habits table
- `entry_date`: Date of the entry
- `value`: Optional value for the entry (e.g., "2 shakes", "30 minutes")

## 🎨 Available Icons

The application includes 36 different icons covering various categories:
- **Health & Fitness**: bed, dumbbell, running, swimming, yoga
- **Food & Drink**: coffee, utensils, apple, water, glass-whiskey
- **Activities**: walking, bicycle, music, paint-brush, camera
- **Work & Study**: briefcase, graduation-cap, laptop, book
- **Wellness**: meditation, heart, smile, sun, moon
- **And many more...**

## 🔧 Customization

### Adding New Icons
To add more icons, edit the `availableIcons` array in `static/script.js` and add new Font Awesome icon classes.

### Styling
Modify `static/style.css` to customize colors, fonts, and layout.

### Features
Extend `app.py` to add new API endpoints or modify the database schema.

## 🚀 Deployment

For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `app.py`:
   ```python
   app.run(debug=True, port=5001)
   ```

2. **Database errors**: Delete `habits.db` and restart the application to reset the database.

3. **Import fails**: Ensure your CSV file has the correct format with headers: "Habit Name", "Icon", "Date", "Value"

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests to improve the application.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⭐ Star History

If you find this project helpful, please consider giving it a star on GitHub!
# Deployment Guide

This guide covers different ways to deploy your Habit Tracker application.

## Local Development

The simplest way to run the application is locally for development:

```bash
python app.py
```

Then visit `http://localhost:5000` in your browser.

## Production Deployment

### Option 1: Heroku

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**:
   ```bash
   heroku create your-habit-tracker-app
   ```

3. **Add a Procfile** (create this file in your project root):
   ```
   web: gunicorn app:app
   ```

4. **Update requirements.txt** to include gunicorn:
   ```
   Flask==2.3.3
   Werkzeug==2.3.7
   gunicorn==21.2.0
   ```

5. **Deploy**:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

### Option 2: Python Anywhere

1. **Sign up** for a free account at [PythonAnywhere](https://www.pythonanywhere.com/)

2. **Upload your files** using the Files tab

3. **Create a new web app**:
   - Go to the Web tab
   - Click "Add a new web app"
   - Choose "Flask" and Python 3.9
   - Set the source code directory to your project folder

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure the WSGI file** to point to your app.py

### Option 3: Railway

1. **Sign up** for [Railway](https://railway.app/)

2. **Connect your GitHub repository**

3. **Railway will automatically detect** it's a Python app and deploy it

4. **Add environment variables** if needed

### Option 4: VPS (DigitalOcean, AWS, etc.)

1. **Set up a VPS** with Ubuntu/Debian

2. **Install Python and dependencies**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip nginx
   ```

3. **Clone your repository**:
   ```bash
   git clone https://github.com/yourusername/habit-tracker.git
   cd habit-tracker
   ```

4. **Install Python dependencies**:
   ```bash
   pip3 install -r requirements.txt
   ```

5. **Set up Gunicorn**:
   ```bash
   pip3 install gunicorn
   ```

6. **Create a systemd service** for your app

7. **Configure Nginx** as a reverse proxy

## Environment Variables

For production, consider setting these environment variables:

- `FLASK_ENV=production`
- `SECRET_KEY=your-secret-key-here`

## Database Considerations

- The current setup uses SQLite, which is fine for personal use
- For production with multiple users, consider PostgreSQL or MySQL
- Remember to backup your database regularly

## Security Notes

- Change the default Flask secret key
- Use HTTPS in production
- Consider adding user authentication for multi-user scenarios
- Regularly update dependencies for security patches

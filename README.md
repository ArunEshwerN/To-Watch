# To Watch - Movie Link Aggregator

A web application that helps users find movie and TV show resources across different languages and platforms.

## Features

- English and Tamil/Regional language support
- Streaming links from FMHY resources
- Torrent links with detailed instructions
- Direct download options
- Automatic updates every 60 seconds
- Mobile-responsive design

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the development server:
```bash
python server.py
```

3. Visit http://localhost:5000 in your browser

## Deployment on Render.com

1. Create a new account on [Render.com](https://render.com)

2. Click on "New +" and select "Web Service"

3. Connect your GitHub repository

4. Fill in the following details:
   - Name: to-watch (or your preferred name)
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn server:app`

5. Click "Create Web Service"

The application will be automatically deployed and available at your Render URL.

## Technology Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Python Flask
- Dependencies: See requirements.txt

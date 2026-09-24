# HRI Robot-Supported Learning Quiz

## Technology Acceptance in University Robot-Supported Quiz-Based Learning

**Verbal-Only Versus Multimodal Feedback With Sound Input**

This project is a Flask-based prototype for robot-supported quiz-based
learning. It explores a quiz experience using two feedback conditions:
**Verbal Only** and **Multimodal Feedback**, with sound input and
prototype acoustic analysis.

## Project Overview

The application presents quiz questions to students and records their
performance under different feedback modes. A quiz selects **5 questions
randomly** from a question bank of **25 questions**.

The project is designed as a prototype for studying technology
acceptance and learning interaction in a university robot-supported quiz
environment.

## Features

-   Random selection of 5 questions from a 25-question bank
-   Verbal-only feedback mode
-   Multimodal feedback mode
-   Automatic feedback-mode tracking
-   Score and percentage calculation
-   Separate performance tracking for each feedback mode
-   Sound/audio input support
-   Prototype acoustic analysis of recorded audio
-   Flask REST endpoints for quiz and audio functionality
-   Responsive web-based quiz interface

## Technologies Used

-   **Python 3.9.12**
-   **Flask**
-   **HTML5**
-   **CSS3**
-   **JavaScript**
-   **NumPy**
-   **SciPy**
-   **Librosa**
-   **SoundFile**
-   **PyAudio**
-   **SpeechRecognition**
-   **pyttsx3**
-   **Scikit-learn**

## Project Structure

``` text
HRI_Quiz/
│
├── static/
│   ├── script_v2.js
│   └── style.css
│
├── templates/
│   └── index.html
│
├── app.py
├── requirements.txt
├── .gitignore
└── Execution.mp4   (local only, not included in this repo)
```

> `Execution.mp4` is kept locally for project demonstration and is
> excluded from this GitHub repository because its size exceeds GitHub's
> 100 MB individual file limit.

## How to Run Locally

### 1. Clone the repository

``` bash
git clone https://github.com/nishalini-reddy/HRI-Robot-Supported-Learning-Quiz.git
cd HRI-Robot-Supported-Learning-Quiz
```

### 2. Create a virtual environment

On Windows:

``` powershell
python -m venv venv
```

On macOS/Linux:

``` bash
python3 -m venv venv
```

### 3. Activate the virtual environment

On Windows:

``` powershell
venv\Scripts\activate
```

On macOS/Linux:

``` bash
source venv/bin/activate
```

### 4. Install dependencies

``` bash
python -m pip install -r requirements.txt
```

### 5. Start the Flask application

``` bash
python app.py
```

Then open the local address shown by Flask in your browser.

## How the Quiz Works

1.  The application starts a new quiz session.
2.  Five questions are selected randomly from the 25-question bank.
3.  Each question is assigned a feedback condition.
4.  The user answers the question.
5.  The application verifies the answer and updates the score.
6.  Verbal-only and multimodal performance are tracked separately.
7.  The final screen displays the overall score and performance for each
    feedback condition.

## Audio Analysis

The project includes prototype audio analysis using audio features such
as:

-   Audio duration
-   RMS energy
-   Zero-crossing rate
-   Spectral centroid

The prototype uses these acoustic characteristics to classify the
recorded audio into simple energy states such as **lower-energy**,
**moderate-energy**, and **higher-energy**.

**Important:** This acoustic analysis is a prototype heuristic and is
**not a scientifically validated emotion-recognition classifier**.

## API Endpoints

The Flask application includes endpoints for:

-   `/` --- Main quiz page
-   `/start_quiz` --- Starts a quiz session
-   `/get_question/<q_id>` --- Retrieves a quiz question
-   `/verify_answer` --- Verifies an answer
-   `/health` --- Application health/status information
-   `/analyze_audio` --- Processes uploaded audio

## Future Enhancements

-   Integrate a validated acoustic emotion-recognition model
-   Add real robot interaction and speech output
-   Store participant responses and experimental results
-   Add database support
-   Improve multimodal feedback using visual, audio, and textual cues
-   Add user authentication
-   Add research-oriented analytics and visualization

## Project Purpose

This project was built to explore how feedback modality and sound-based
interaction affect technology acceptance in a university robot-supported
quiz-learning setting.

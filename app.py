from flask import Flask, render_template, request, jsonify, session
import random
import os
import tempfile

import librosa


app = Flask(__name__)

# ============================================================
# FLASK SESSION SECRET KEY
# ============================================================

app.secret_key = os.environ.get(
    "SECRET_KEY",
    "hri-quiz-local-development-key"
)


# ============================================================
# QUESTION BANK
# ============================================================

QUESTION_BANK = [

    {
        "q": "What does HRI stand for?",
        "a": "Human Robot Interaction"
    },

    {
        "q": "What is the main purpose of a social robot in a learning environment?",
        "a": "To interact with and support learners"
    },

    {
        "q": "What does technology acceptance refer to in this project?",
        "a": "User acceptance of technology"
    },

    {
        "q": "What is verbal-only feedback?",
        "a": "Feedback provided through spoken information"
    },

    {
        "q": "What is multimodal feedback?",
        "a": "Feedback using more than one modality"
    },

    {
        "q": "Which sense is directly involved when a learner hears spoken robot feedback?",
        "a": "Hearing"
    },

    {
        "q": "What does AER stand for?",
        "a": "Acoustic Emotion Recognition"
    },

    {
        "q": "What is the purpose of acoustic emotion recognition?",
        "a": "To identify emotional information from speech"
    },

    {
        "q": "What type of input is analyzed in acoustic emotion recognition?",
        "a": "Sound"
    },

    {
        "q": "What does TTS stand for?",
        "a": "Text To Speech"
    },

    {
        "q": "What technology converts text into spoken output?",
        "a": "Text To Speech"
    },

    {
        "q": "What technology can convert spoken language into text?",
        "a": "Speech Recognition"
    },

    {
        "q": "What is the role of feedback in a learning system?",
        "a": "To help learners understand and improve their performance"
    },

    {
        "q": "Why can multimodal feedback be used in robot-supported learning?",
        "a": "To provide information through multiple forms of interaction"
    },

    {
        "q": "What is a quiz used for in a learning environment?",
        "a": "To assess learning"
    },

    {
        "q": "What does AI stand for?",
        "a": "Artificial Intelligence"
    },

    {
        "q": "What does ML stand for?",
        "a": "Machine Learning"
    },

    {
        "q": "What does NLP stand for?",
        "a": "Natural Language Processing"
    },

    {
        "q": "What does UI stand for?",
        "a": "User Interface"
    },

    {
        "q": "What does UX stand for?",
        "a": "User Experience"
    },

    {
        "q": "Which programming language is used for the backend of this prototype?",
        "a": "Python"
    },

    {
        "q": "Which framework is used to build the web application?",
        "a": "Flask"
    },

    {
        "q": "What is the purpose of comparing verbal-only and multimodal feedback?",
        "a": "To study different feedback conditions"
    },

    {
        "q": "What is the role of a robot in robot-supported learning?",
        "a": "To support interaction and learning"
    },

    {
        "q": "What is the main focus of this HRI quiz prototype?",
        "a": "Robot-supported quiz-based learning"
    }

]


# ============================================================
# QUIZ SETTINGS
# ============================================================

QUIZ_SIZE = 5


# ============================================================
# CREATE NEW QUIZ
# ============================================================

def create_new_quiz():

    selected_indexes = random.sample(
        range(len(QUESTION_BANK)),
        QUIZ_SIZE
    )

    session["quiz_questions"] = selected_indexes


# ============================================================
# AUTOMATIC FEEDBACK MODE
# ============================================================

def get_feedback_mode(q_id):

    # Q1, Q3, Q5 -> Verbal Only
    # Q2, Q4 -> Multimodal

    if q_id % 2 == 0:
        return "verbal"

    return "multimodal"


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def index():

    create_new_quiz()

    return render_template("index.html")


# ============================================================
# START / RESTART QUIZ
# ============================================================

@app.route("/start_quiz")
def start_quiz():

    create_new_quiz()

    return jsonify({
        "status": "success",
        "total_questions": QUIZ_SIZE
    })


# ============================================================
# GET QUESTION
# ============================================================

@app.route("/get_question/<int:q_id>")
def get_question(q_id):

    selected_questions = session.get(
        "quiz_questions"
    )

    if not selected_questions:

        create_new_quiz()

        selected_questions = session.get(
            "quiz_questions"
        )

    if (
        q_id < 0
        or q_id >= len(selected_questions)
    ):

        return jsonify({
            "end": True
        })


    actual_question_index = selected_questions[q_id]

    question = QUESTION_BANK[
        actual_question_index
    ]


    modality = get_feedback_mode(q_id)


    if modality == "verbal":

        mode_label = "Verbal Only"

    else:

        mode_label = "Multimodal"


    return jsonify({

        "id": q_id,

        "q": question["q"],

        "number": q_id + 1,

        "total": len(selected_questions),

        "modality": modality,

        "mode_label": mode_label

    })


# ============================================================
# AUDIO ANALYSIS
# ============================================================

def analyze_audio_file(audio_file):

    """
    Extract basic acoustic features from the uploaded recording.

    IMPORTANT:
    These features are not, by themselves, a scientifically
    validated emotion classifier.
    """

    temporary_path = None

    try:

        # Create a temporary file.

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".webm"
        ) as temporary_file:

            temporary_path = temporary_file.name

            audio_file.save(
                temporary_path
            )


        # Load audio using librosa.

        audio, sample_rate = librosa.load(
            temporary_path,
            sr=None,
            mono=True
        )


        if len(audio) == 0:

            return {
                "success": False,
                "error": "No audio data detected."
            }


        # ----------------------------------------------------
        # DURATION
        # ----------------------------------------------------

        duration = float(
            librosa.get_duration(
                y=audio,
                sr=sample_rate
            )
        )


        # ----------------------------------------------------
        # RMS ENERGY
        # ----------------------------------------------------

        rms = librosa.feature.rms(
            y=audio
        )

        average_rms = float(
            rms.mean()
        )


        # ----------------------------------------------------
        # ZERO CROSSING RATE
        # ----------------------------------------------------

        zero_crossing = (
            librosa.feature.zero_crossing_rate(
                audio
            )
        )

        average_zero_crossing = float(
            zero_crossing.mean()
        )


        # ----------------------------------------------------
        # SPECTRAL CENTROID
        # ----------------------------------------------------

        spectral_centroid = (
            librosa.feature.spectral_centroid(
                y=audio,
                sr=sample_rate
            )
        )

        average_spectral_centroid = float(
            spectral_centroid.mean()
        )


        # ----------------------------------------------------
        # BASIC ACOUSTIC STATE
        # ----------------------------------------------------
        #
        # This is only a simple prototype heuristic.
        # It must NOT be described as a trained emotion model.
        #

        if average_rms > 0.05:

            acoustic_state = "higher-energy"

        elif average_rms < 0.01:

            acoustic_state = "lower-energy"

        else:

            acoustic_state = "moderate-energy"


        return {

            "success": True,

            "duration_seconds":
                round(duration, 3),

            "sample_rate":
                sample_rate,

            "average_rms":
                round(average_rms, 5),

            "average_zero_crossing_rate":
                round(
                    average_zero_crossing,
                    5
                ),

            "average_spectral_centroid":
                round(
                    average_spectral_centroid,
                    2
                ),

            "acoustic_state":
                acoustic_state

        }


    except Exception as error:

        print(
            "Audio analysis error:",
            error
        )

        return {

            "success": False,

            "error":
                str(error)

        }


    finally:

        # Delete temporary audio file.

        if (
            temporary_path
            and os.path.exists(
                temporary_path
            )
        ):

            try:

                os.remove(
                    temporary_path
                )

            except OSError:

                pass


# ============================================================
# ANALYZE AUDIO ROUTE
# ============================================================

@app.route(
    "/analyze_audio",
    methods=["POST"]
)
def analyze_audio():

    if "audio" not in request.files:

        return jsonify({

            "success": False,

            "error":
                "No audio file was uploaded."

        }), 400


    audio_file = request.files[
        "audio"
    ]


    if not audio_file.filename:

        return jsonify({

            "success": False,

            "error":
                "Audio file has no filename."

        }), 400


    result = analyze_audio_file(
        audio_file
    )


    if not result["success"]:

        return jsonify(
            result
        ), 400


    return jsonify(
        result
    )


# ============================================================
# GENERATE FEEDBACK
# ============================================================

def generate_feedback(
    is_correct,
    modality,
    acoustic_state
):

    # ========================================================
    # MULTIMODAL
    # ========================================================

    if modality == "multimodal":

        if is_correct:

            if acoustic_state == "higher-energy":

                return {

                    "speech":
                        "Correct! Your voice has a higher energy level.",

                    "color":
                        "#22c55e",

                    "gesture":
                        "Excited",

                    "mode":
                        "Multimodal"

                }


            return {

                "speech":
                    "Correct! Good job. Keep going.",

                "color":
                    "#22c55e",

                "gesture":
                    "Encouraging",

                "mode":
                    "Multimodal"

            }


        if acoustic_state == "lower-energy":

            return {

                "speech":
                    "Take your time and try the next question.",

                "color":
                    "#f59e0b",

                "gesture":
                    "Supportive",

                "mode":
                    "Multimodal"

            }


        return {

            "speech":
                "Not quite. Keep thinking and try the next question.",

            "color":
                "#ef4444",

            "gesture":
                "Shrug",

            "mode":
                "Multimodal"

        }


    # ========================================================
    # VERBAL ONLY
    # ========================================================

    if is_correct:

        return {

            "speech":
                "Correct.",

            "color":
                "#38bdf8",

            "gesture":
                "None",

            "mode":
                "Verbal Only"

        }


    return {

        "speech":
            "Incorrect.",

        "color":
            "#38bdf8",

        "gesture":
            "None",

        "mode":
            "Verbal Only"

    }


# ============================================================
# VERIFY ANSWER
# ============================================================

@app.route(
    "/verify_answer",
    methods=["POST"]
)
def verify_answer():

    data = request.get_json(
        silent=True
    ) or {}


    q_id = data.get(
        "q_id"
    )


    user_answer = str(
        data.get(
            "answer",
            ""
        )
    ).strip()


    selected_questions = session.get(
        "quiz_questions"
    )


    if not selected_questions:

        return jsonify({

            "error":
                "Quiz session not found. Please restart the quiz."

        }), 400


    if (
        not isinstance(q_id, int)
        or q_id < 0
        or q_id >= len(selected_questions)
    ):

        return jsonify({

            "error":
                "Invalid question ID"

        }), 400


    # Server determines the mode.

    modality = get_feedback_mode(
        q_id
    )


    actual_question_index = (
        selected_questions[q_id]
    )


    question = QUESTION_BANK[
        actual_question_index
    ]


    correct_answer = question[
        "a"
    ]


    is_correct = (

        user_answer.lower()
        ==
        correct_answer.lower()

    )


    # Default state if no audio was recorded.

    acoustic_state = "not-analyzed"

    audio_features = None


    # --------------------------------------------------------
    # OPTIONAL AUDIO DATA
    # --------------------------------------------------------
    #
    # Audio is currently analyzed through /analyze_audio.
    # The answer endpoint itself does not require audio.
    #

    feedback = generate_feedback(

        is_correct,

        modality,

        acoustic_state

    )


    return jsonify({

        "correct":
            is_correct,

        "correct_answer":
            correct_answer,

        "emotion":
            acoustic_state,

        "speech":
            feedback["speech"],

        "color":
            feedback["color"],

        "gesture":
            feedback["gesture"],

        "mode":
            feedback["mode"],

        "modality":
            modality,

        "audio_features":
            audio_features

    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():

    return jsonify({

        "status":
            "running",

        "question_bank_size":
            len(QUESTION_BANK),

        "quiz_size":
            QUIZ_SIZE,

        "audio_analysis":
            "enabled",

        "emotion_detection":
            "acoustic feature prototype"

    })


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )
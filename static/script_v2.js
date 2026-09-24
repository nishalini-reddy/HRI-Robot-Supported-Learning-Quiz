let currentIdx = 0;
let score = 0;
let totalQuestions = 5;

let currentModality = "";

let modeResults = {
    verbal: {
        correct: 0,
        total: 0
    },
    multimodal: {
        correct: 0,
        total: 0
    }
};


// =====================================================
// DOM ELEMENTS
// =====================================================

const questionNumber = document.getElementById("question-number");
const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer-input");
const submitButton = document.getElementById("submit-btn");

const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

const scoreValue = document.getElementById("score-value");

const feedbackBox = document.getElementById("feedback-box");
const feedbackText = document.getElementById("feedback-text");

const currentMode = document.getElementById("current-mode");
const modeResult = document.getElementById("mode-result");

const emotionDisplay = document.getElementById("emotion-display");
const gestureDisplay = document.getElementById("gesture-display");

const robotStatus = document.getElementById("robot-status");
const robotEye = document.getElementById("robot-eye");

const quizContainer = document.getElementById("quiz-container");
const resultContainer = document.getElementById("result-container");

const finalScore = document.getElementById("final-score");
const finalPercentage = document.getElementById("final-percentage");

const verbalCorrect = document.getElementById("verbal-correct");
const verbalTotal = document.getElementById("verbal-total");

const multimodalCorrect = document.getElementById("multimodal-correct");
const multimodalTotal = document.getElementById("multimodal-total");

const restartButton = document.getElementById("restart-btn");


// =====================================================
// SOUND INPUT
// =====================================================

const recordButton = document.getElementById("record-btn");
const recordingStatus = document.getElementById("recording-status");
const audioPreview = document.getElementById("audio-preview");

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let recordedAudioBlob = null;


// =====================================================
// SAFE TEXT UPDATE
// =====================================================

function setText(element, text) {
    if (element) {
        element.innerText = text;
    }
}


// =====================================================
// NORMALIZE MODALITY
// =====================================================

function normalizeModality(value) {

    if (!value) {
        return "verbal";
    }

    const modality = String(value)
        .toLowerCase()
        .trim()
        .replace(/[_-]+/g, " ");

    if (
        modality.includes("multi") ||
        modality.includes("multimodal")
    ) {
        return "multimodal";
    }

    return "verbal";
}


// =====================================================
// LOAD QUESTION
// =====================================================

async function fetchQuestion() {

    try {

        setText(robotStatus, "Loading");

        const response = await fetch(
            `/get_question/${currentIdx}`
        );

        if (!response.ok) {
            throw new Error(
                `Unable to load question. Server returned ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Question response:", data);

        // Quiz finished
        if (data.end) {
            showFinalResults();
            return;
        }

        if (!data.q) {
            throw new Error(
                "Question was not returned by the server."
            );
        }

        // Get total from backend
        if (data.total) {
            totalQuestions = Number(data.total);
        }

        // Question number
        setText(
            questionNumber,
            `Question ${currentIdx + 1} of ${totalQuestions}`
        );

        // Question text
        setText(questionText, data.q);

        // -------------------------------------------------
        // IMPORTANT: Normalize modality
        // -------------------------------------------------

        currentModality = normalizeModality(
            data.modality || data.mode_label
        );

        console.log(
            "Current modality:",
            currentModality,
            "Original:",
            data.modality,
            data.mode_label
        );

        if (currentModality === "verbal") {

            setText(
                currentMode,
                data.mode_label || "Verbal Only"
            );

        } else {

            setText(
                currentMode,
                data.mode_label || "Multimodal"
            );
        }

        // Reset answer
        if (answerInput) {
            answerInput.value = "";
            answerInput.disabled = false;
            answerInput.focus();
        }

        if (submitButton) {
            submitButton.disabled = false;
        }

        // Hide feedback
        if (feedbackBox) {
            feedbackBox.classList.add("hidden");
        }

        // Progress
        const progress =
            ((currentIdx + 1) / totalQuestions) * 100;

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        setText(
            progressText,
            `${currentIdx + 1} / ${totalQuestions}`
        );

        // Robot reset
        setText(emotionDisplay, "Neutral");
        setText(gestureDisplay, "Waiting");
        setText(robotStatus, "Ready");

        if (robotEye) {
            robotEye.classList.remove("active");
        }

        resetRecording();

    } catch (error) {

        console.error(
            "Question loading error:",
            error
        );

        setText(
            questionText,
            "Unable to load the question."
        );

        setText(
            robotStatus,
            "Connection error"
        );
    }
}


// =====================================================
// START RECORDING
// =====================================================

async function startRecording() {

    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            alert(
                "Microphone recording is not supported by this browser."
            );

            return;
        }

        audioStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        audioChunks = [];
        recordedAudioBlob = null;

        let mimeType = "";

        if (
            MediaRecorder.isTypeSupported(
                "audio/webm;codecs=opus"
            )
        ) {

            mimeType = "audio/webm;codecs=opus";

        } else if (
            MediaRecorder.isTypeSupported(
                "audio/webm"
            )
        ) {

            mimeType = "audio/webm";
        }

        if (mimeType) {

            mediaRecorder =
                new MediaRecorder(
                    audioStream,
                    {
                        mimeType: mimeType
                    }
                );

        } else {

            mediaRecorder =
                new MediaRecorder(audioStream);
        }

        mediaRecorder.ondataavailable =
            function (event) {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    audioChunks.push(event.data);
                }
            };

        mediaRecorder.onstop =
            function () {

                const recordedType =
                    mediaRecorder.mimeType ||
                    "audio/webm";

                recordedAudioBlob =
                    new Blob(
                        audioChunks,
                        {
                            type: recordedType
                        }
                    );

                const audioURL =
                    URL.createObjectURL(
                        recordedAudioBlob
                    );

                if (audioPreview) {

                    audioPreview.src = audioURL;
                    audioPreview.hidden = false;
                }

                setText(
                    recordingStatus,
                    "Recording complete. Ready for analysis."
                );

                if (recordButton) {

                    recordButton.innerText =
                        "🎤 Record Again";

                    recordButton.disabled = false;
                }

                setText(
                    robotStatus,
                    "Voice recorded"
                );

                if (robotEye) {
                    robotEye.classList.add("active");
                }

                if (audioStream) {

                    audioStream
                        .getTracks()
                        .forEach(
                            track => track.stop()
                        );

                    audioStream = null;
                }
            };

        mediaRecorder.start();

        if (recordButton) {

            recordButton.innerText =
                "⏹ Stop Recording";
        }

        setText(
            recordingStatus,
            "Recording... Speak your answer."
        );

        setText(
            robotStatus,
            "Listening"
        );

        if (robotEye) {
            robotEye.classList.add("active");
        }

    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );

        setText(
            recordingStatus,
            "Microphone access failed."
        );

        setText(
            robotStatus,
            "Microphone error"
        );

        alert(
            "Microphone permission is required to record your answer."
        );
    }
}


// =====================================================
// STOP RECORDING
// =====================================================

function stopRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        mediaRecorder.stop();

        if (recordButton) {

            recordButton.innerText =
                "Processing recording...";

            recordButton.disabled = true;
        }
    }
}


// =====================================================
// RESET RECORDING
// =====================================================

function resetRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        mediaRecorder.stop();
    }

    if (audioStream) {

        audioStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        audioStream = null;
    }

    mediaRecorder = null;
    audioChunks = [];
    recordedAudioBlob = null;

    if (audioPreview) {

        audioPreview.pause();
        audioPreview.removeAttribute("src");
        audioPreview.hidden = true;
    }

    if (recordButton) {

        recordButton.innerText =
            "🎤 Start Recording";

        recordButton.disabled = false;
    }

    setText(
        recordingStatus,
        "Microphone ready"
    );
}


// =====================================================
// ANALYZE RECORDED AUDIO
// =====================================================

async function analyzeRecordedAudio() {

    if (!recordedAudioBlob) {
        return null;
    }

    const formData = new FormData();

    formData.append(
        "audio",
        recordedAudioBlob,
        "quiz-answer.webm"
    );

    const response =
        await fetch(
            "/analyze_audio",
            {
                method: "POST",
                body: formData
            }
        );

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.error ||
            "Audio analysis failed."
        );
    }

    return data;
}


// =====================================================
// DISPLAY AUDIO ANALYSIS
// =====================================================

function displayAudioAnalysis(data) {

    if (!data) {

        setText(
            recordingStatus,
            "No voice recording was provided."
        );

        return;
    }

    if (!data.success) {

        setText(
            recordingStatus,
            "Audio analysis failed."
        );

        return;
    }

    const acousticState =
        data.acoustic_state ||
        "unknown";

    const duration =
        data.duration_seconds !== undefined
            ? Number(
                data.duration_seconds
            ).toFixed(2)
            : "N/A";

    const rms =
        data.rms_energy !== undefined
            ? Number(
                data.rms_energy
            ).toFixed(4)
            : "N/A";

    const zcr =
        data.zero_crossing_rate !== undefined
            ? Number(
                data.zero_crossing_rate
            ).toFixed(4)
            : "N/A";

    const spectralCentroid =
        data.spectral_centroid_hz !== undefined
            ? Number(
                data.spectral_centroid_hz
            ).toFixed(2)
            : "N/A";

    setText(
        emotionDisplay,
        `Acoustic state: ${formatLabel(acousticState)}`
    );

    setText(
        robotStatus,
        "Voice analyzed"
    );

    setText(
        recordingStatus,
        `Analyzed • ${duration}s • ${formatLabel(acousticState)}`
    );

    console.log(
        "Audio Analysis:",
        {
            acousticState,
            durationSeconds: duration,
            rmsEnergy: rms,
            zeroCrossingRate: zcr,
            spectralCentroidHz: spectralCentroid
        }
    );
}


// =====================================================
// FORMAT LABEL
// =====================================================

function formatLabel(value) {

    if (!value) {
        return "Unknown";
    }

    return value
        .toString()
        .replace(/-/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


// =====================================================
// UPDATE MODE RESULTS
// =====================================================

function updateModeResults() {

    setText(
        verbalCorrect,
        modeResults.verbal.correct
    );

    setText(
        verbalTotal,
        modeResults.verbal.total
    );

    setText(
        multimodalCorrect,
        modeResults.multimodal.correct
    );

    setText(
        multimodalTotal,
        modeResults.multimodal.total
    );

    console.log(
        "MODE RESULTS:",
        JSON.stringify(modeResults)
    );
}


// =====================================================
// SUBMIT ANSWER
// =====================================================

async function submitAnswer() {

    const answer =
        answerInput
            ? answerInput.value.trim()
            : "";

    if (!answer) {

        alert(
            "Please enter your answer."
        );

        return;
    }

    if (
        mediaRecorder &&
        mediaRecorder.state === "recording"
    ) {

        alert(
            "Please stop the recording before submitting your answer."
        );

        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
    }

    if (answerInput) {
        answerInput.disabled = true;
    }

    if (recordButton) {
        recordButton.disabled = true;
    }

    if (feedbackBox) {
        feedbackBox.classList.remove("hidden");
    }

    setText(
        feedbackText,
        "Processing your answer..."
    );

    setText(
        robotStatus,
        "Processing"
    );

    try {

        // ---------------------------------------------
        // AUDIO ANALYSIS
        // ---------------------------------------------

        let audioAnalysis = null;

        if (recordedAudioBlob) {

            setText(
                recordingStatus,
                "Analyzing voice input..."
            );

            audioAnalysis =
                await analyzeRecordedAudio();

            displayAudioAnalysis(
                audioAnalysis
            );

        } else {

            setText(
                recordingStatus,
                "No voice recording provided."
            );

            setText(
                emotionDisplay,
                "Acoustic state: Not analyzed"
            );
        }


        // ---------------------------------------------
        // VERIFY ANSWER
        // ---------------------------------------------

        const response =
            await fetch(
                "/verify_answer",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        q_id: currentIdx,
                        answer: answer
                    })
                }
            );

        if (!response.ok) {

            throw new Error(
                "Answer verification failed."
            );
        }

        const data =
            await response.json();

        console.log(
            "Verification response:",
            data
        );


        // ---------------------------------------------
        // UPDATE OVERALL SCORE
        // ---------------------------------------------

        if (data.correct) {

            score++;

            setText(
                scoreValue,
                score
            );
        }


        // ---------------------------------------------
        // IMPORTANT: UPDATE MODE SCORE
        // ---------------------------------------------

        const mode =
            normalizeModality(
                currentModality ||
                data.modality ||
                data.mode_label
            );

        console.log(
            "Updating mode:",
            mode
        );

        if (mode === "multimodal") {

            modeResults.multimodal.total++;

            if (data.correct) {
                modeResults.multimodal.correct++;
            }

        } else {

            modeResults.verbal.total++;

            if (data.correct) {
                modeResults.verbal.correct++;
            }
        }

        // Immediately update the visible counters
        updateModeResults();


        // ---------------------------------------------
        // FEEDBACK
        // ---------------------------------------------

        setText(
            feedbackText,
            data.speech ||
            data.feedback ||
            (
                data.correct
                    ? "Correct!"
                    : "Not quite."
            )
        );


        // ---------------------------------------------
        // ROBOT FEEDBACK
        // ---------------------------------------------

        if (
            data.emotion &&
            data.emotion !== "not-analyzed" &&
            !audioAnalysis
        ) {

            setText(
                emotionDisplay,
                formatLabel(data.emotion)
            );
        }

        if (data.gesture) {

            setText(
                gestureDisplay,
                formatLabel(data.gesture)
            );

        } else {

            setText(
                gestureDisplay,
                "None"
            );
        }

        setText(
            robotStatus,
            data.correct
                ? "Correct response"
                : "Needs improvement"
        );


        // ---------------------------------------------
        // CURRENT MODE DISPLAY
        // ---------------------------------------------

        if (modeResult) {

            if (mode === "verbal") {

                modeResult.innerText =
                    `Feedback Mode: Verbal Only — ${modeResults.verbal.correct}/${modeResults.verbal.total}`;

            } else {

                modeResult.innerText =
                    `Feedback Mode: Multimodal — ${modeResults.multimodal.correct}/${modeResults.multimodal.total}`;
            }
        }


        // ---------------------------------------------
        // TEXT TO SPEECH
        // ---------------------------------------------

        if (data.speech) {
            speakText(data.speech);
        }


        // ---------------------------------------------
        // NEXT QUESTION
        // ---------------------------------------------

        setTimeout(
            () => {

                currentIdx++;

                if (
                    currentIdx <
                    totalQuestions
                ) {

                    fetchQuestion();

                } else {

                    showFinalResults();
                }

            },
            1800
        );

    } catch (error) {

        console.error(
            "Submission error:",
            error
        );

        setText(
            feedbackText,
            error.message ||
            "Something went wrong. Please try again."
        );

        setText(
            robotStatus,
            "Error"
        );

        if (submitButton) {
            submitButton.disabled = false;
        }

        if (answerInput) {
            answerInput.disabled = false;
        }

        if (recordButton) {
            recordButton.disabled = false;
        }
    }
}


// =====================================================
// SHOW FINAL RESULTS
// =====================================================

function showFinalResults() {

    console.log(
        "FINAL MODE RESULTS:",
        JSON.stringify(modeResults)
    );

    if (quizContainer) {

        quizContainer.classList.add(
            "hidden"
        );

        quizContainer.style.display = "none";
    }

    if (resultContainer) {

        resultContainer.classList.remove(
            "hidden"
        );

        resultContainer.style.display = "block";
    }


    // ---------------------------------------------
    // FINAL SCORE
    // ---------------------------------------------

    setText(
        finalScore,
        `${score}/${totalQuestions}`
    );

    const percentage =
        totalQuestions > 0
            ? Math.round(
                (score / totalQuestions) * 100
            )
            : 0;

    setText(
        finalPercentage,
        `${percentage}%`
    );


    // ---------------------------------------------
    // FINAL VERBAL
    // ---------------------------------------------

    const finalVerbalCorrect =
        document.getElementById(
            "final-verbal-correct"
        );

    const finalVerbalTotal =
        document.getElementById(
            "final-verbal-total"
        );

    setText(
        finalVerbalCorrect,
        modeResults.verbal.correct
    );

    setText(
        finalVerbalTotal,
        modeResults.verbal.total
    );


    // ---------------------------------------------
    // FINAL MULTIMODAL
    // ---------------------------------------------

    const finalMultimodalCorrect =
        document.getElementById(
            "final-multimodal-correct"
        );

    const finalMultimodalTotal =
        document.getElementById(
            "final-multimodal-total"
        );

    setText(
        finalMultimodalCorrect,
        modeResults.multimodal.correct
    );

    setText(
        finalMultimodalTotal,
        modeResults.multimodal.total
    );


    // Also update current result elements
    updateModeResults();


    setText(
        robotStatus,
        "Quiz completed!"
    );


    // ---------------------------------------------
    // TEXT TO SPEECH
    // ---------------------------------------------

    speakText(
        `Quiz complete. Your score is ${score} out of ${totalQuestions}.`
    );
}


// =====================================================
// RESTART QUIZ
// =====================================================

async function restartQuiz() {

    try {

        const response =
            await fetch(
                "/start_quiz",
                {
                    method: "POST"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Unable to restart quiz."
            );
        }


        // Reset quiz
        currentIdx = 0;
        score = 0;
        totalQuestions = 5;

        modeResults = {
            verbal: {
                correct: 0,
                total: 0
            },

            multimodal: {
                correct: 0,
                total: 0
            }
        };

        currentModality = "";


        // Show quiz
        if (quizContainer) {

            quizContainer.classList.remove(
                "hidden"
            );

            quizContainer.style.display = "";
        }


        // Hide final results
        if (resultContainer) {

            resultContainer.classList.add(
                "hidden"
            );

            resultContainer.style.display = "none";
        }


        // Reset score
        setText(
            scoreValue,
            "0"
        );

        // Reset mode counters
        updateModeResults();


        // Reset robot
        setText(
            robotStatus,
            "New quiz started"
        );

        setText(
            emotionDisplay,
            "Neutral"
        );

        setText(
            gestureDisplay,
            "Waiting"
        );

        if (robotEye) {
            robotEye.classList.remove("active");
        }


        // Reset recording
        resetRecording();


        // Load first question
        await fetchQuestion();

    } catch (error) {

        console.error(
            "Restart error:",
            error
        );

        setText(
            robotStatus,
            "Unable to start a new quiz."
        );
    }
}


// =====================================================
// TEXT TO SPEECH
// =====================================================

function speakText(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.rate = 0.95;
    speech.pitch = 1;

    window.speechSynthesis.speak(
        speech
    );
}


// =====================================================
// ENTER KEY SUPPORT
// =====================================================

if (answerInput) {

    answerInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                submitAnswer();
            }
        }
    );
}


// =====================================================
// SUBMIT BUTTON
// =====================================================

if (submitButton) {

    submitButton.addEventListener(
        "click",
        submitAnswer
    );
}


// =====================================================
// RECORD BUTTON
// =====================================================

if (recordButton) {

    recordButton.addEventListener(
        "click",
        function () {

            if (
                mediaRecorder &&
                mediaRecorder.state === "recording"
            ) {

                stopRecording();

            } else {

                startRecording();
            }
        }
    );
}


// =====================================================
// RESTART BUTTON
// =====================================================

if (restartButton) {

    restartButton.addEventListener(
        "click",
        restartQuiz
    );
}


// =====================================================
// START APPLICATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        fetchQuestion();
    }
);
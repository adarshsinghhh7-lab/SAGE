"""
S.A.G.E. Urgency Prediction Flask API
Endpoint: POST /predict-urgency
Body: { "text": "complaint description here" }
Response: { "urgency_score": 0.0-1.0, "label": "urgent" | "normal" }
"""

import os
import joblib
from flask import Flask, request, jsonify
from train_and_evaluate import train_and_save_model

app = Flask(__name__)
MODEL_PATH = "urgency_model.joblib"

# Load model on startup (or train & save once if file doesn't exist yet)
if not os.path.exists(MODEL_PATH):
    print(f"Model file '{MODEL_PATH}' not found. Initiating first-time training...")
    model_pipeline = train_and_save_model(MODEL_PATH)
else:
    print(f"Loading persistent model from '{MODEL_PATH}'...")
    model_pipeline = joblib.load(MODEL_PATH)
    print("✓ Model successfully loaded into memory.")

@app.route('/predict-urgency', methods=['POST'])
def predict_urgency():
    # 1. Parse JSON request body
    data = request.get_json(silent=True)
    if not data or 'text' not in data:
        return jsonify({
            "error": "Invalid request. Please provide JSON body with a 'text' field.",
            "example": {"text": "Live electric wire sparking outside hostel corridor"}
        }), 400

    text = data.get('text', '').strip()
    if not text:
        return jsonify({
            "error": "The 'text' parameter cannot be empty."
        }), 400

    # 2. Predict probability score and binary classification label
    # classes_ typically contains ['normal', 'urgent']
    classes = list(model_pipeline.classes_)
    urgent_index = classes.index('urgent') if 'urgent' in classes else 1

    probabilities = model_pipeline.predict_proba([text])[0]
    urgency_score = float(probabilities[urgent_index])
    
    # 3. Determine label (0.50 decision threshold)
    label = "urgent" if urgency_score >= 0.50 else "normal"

    # 4. Return response
    return jsonify({
        "text": text,
        "urgency_score": round(urgency_score, 4),
        "label": label
    }), 200

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model_pipeline is not None,
        "classes": list(model_pipeline.classes_)
    }), 200

if __name__ == '__main__':
    # Run Flask application on port 5000 (or customized port)
    app.run(host='0.0.0.0', port=5000, debug=True)

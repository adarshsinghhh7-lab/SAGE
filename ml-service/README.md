# S.A.G.E. Machine Learning Urgency Classifier Microservice

This microservice predicts the urgency and safety-risk level of grievance descriptions using natural language processing (NLP).

## Tech Stack
- **Framework**: Python Flask
- **Classifier**: Scikit-Learn TF-IDF Vectorizer + Logistic Regression
- **Persistence**: Joblib serialization (`urgency_model.joblib`)

## Endpoint Specification

### `POST /predict-urgency`
Analyzes complaint text for safety hazards, distress, harassment, or infrastructure emergencies.

**Request Body:**
```json
{
  "text": "Live electric wires sparking near Hostel Block A entrance creating immediate fire hazard."
}
```

**Response:**
```json
{
  "text": "Live electric wires sparking near Hostel Block A entrance creating immediate fire hazard.",
  "label": "urgent",
  "urgency_score": 0.9421
}
```

## Running the Microservice
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Train and evaluate model (outputs classification report and confusion matrix):
   ```bash
   python train_and_evaluate.py
   ```
3. Start Flask API server on port 5001:
   ```bash
   python app.py
   ```

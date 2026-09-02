"""
S.A.G.E. Urgency Classifier - Dataset Generator, Training, & Evaluation Script
Uses TF-IDF + Logistic Regression with scikit-learn and joblib model persistence.
"""

import os
import random
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Seed for reproducibility
random.seed(42)
np.random.seed(42)

# Templates for synthetic complaint dataset generation (~300 examples)
URGENT_TEMPLATES = [
    "There are live electric wires sparking near {location} creating an immediate fire hazard.",
    "A student was harassed and threatened by unknown persons near {location} late last night.",
    "Water has flooded into the switchboard in {location}, electric shocks felt when touching walls.",
    "Suspicious trespassers spotted stalking students outside {location} after dark.",
    "Severe gas leak smell coming from the {location} kitchen, urgent danger of explosion.",
    "Elevator in {location} dropped abruptly and is stuck between floors with students trapped inside screaming.",
    "Physical fight and assault broke out near {location}, someone is injured and bleeding.",
    "Ceiling plaster collapsed onto a student study desk in {location}, barely missed severe head injury.",
    "Continuous stalking and verbal harassment reported near {location} corridor, students feeling unsafe.",
    "Main entrance gate of {location} broken, unauthorized outsiders entering hostel premises at night.",
    "Heavy toxic fumes and smoke emanating from electrical control room in {location}.",
    "Fire extinguisher is expired and emergency exit door is chained shut in {location}.",
    "Immediate safety risk: broken high-tension wire hanging low over walkway near {location}.",
    "Student suffering severe panic attack and medical distress in {location}, medical ambulance required.",
    "Water contamination in {location} causing multiple students severe acute food poisoning and vomiting blood.",
    "Lock on ground floor window in {location} was forced open; intruder attempted to enter room.",
    "Corridor lights all smashed and students getting harassed in pitch black darkness near {location}.",
    "Boiler pressure gauge vibrating violently in {location} with hissing scalding steam leak.",
    "Stray aggressive dogs attacked and bit a student on the pathway to {location}.",
    "Balcony railing in {location} is completely rusted through and snapped, imminent fall danger."
]

NORMAL_TEMPLATES = [
    "WiFi signal is very weak and disconnecting constantly in {location}.",
    "Ceiling fan in {location} is making a squeaking noise at speed 4.",
    "The food served in {location} dinner was cold and chapattis were too hard.",
    "Study room chair in {location} has a wobbly leg and needs tightening.",
    "Water pressure in bathroom taps in {location} is a bit low this morning.",
    "Mess menu for breakfast in {location} was changed without prior notification.",
    "Dustbin outside room in {location} was not emptied today by cleaning staff.",
    "Tube light in corridor of {location} is flickering occasionally.",
    "The laundry washing machine #3 in {location} is out of order.",
    "Air conditioner in computer lab at {location} cooling is mild.",
    "Hot water geyser in {location} takes 20 minutes to heat up.",
    "Internet speed drops below 2 Mbps during peak hours in {location}.",
    "Curtain rod in {location} room is loose.",
    "Mess counter #2 in {location} has slow serving queues during lunch.",
    "Water cooler filter in {location} needs regular monthly servicing.",
    "Table tennis ball is missing from common recreation room in {location}.",
    "Whiteboard marker is dried out in {location} seminar room.",
    "Grass on the lawn next to {location} needs trimming.",
    "Vending machine in {location} lobby ate my 20 rupee coin and didn't dispense snack.",
    "Door latch in {location} bathroom is slightly stiff to slide."
]

LOCATIONS = [
    "Hostel Block A", "Hostel Block B", "Hostel Block C",
    "Girls Hostel 1", "Girls Hostel 2", "Mess Hall #1",
    "Mess Hall #2", "Central Library Ground Floor",
    "Academic Block 3", "Sports Complex Pathway",
    "East Gate Walkway", "Hostel 4 Wing B", "Dining Hall 2",
    "Chemistry Lab Wing", "Computer Center 2nd Floor"
]

def generate_synthetic_dataset(n_samples=320):
    """Generates ~320 balanced complaint samples (160 urgent, 160 normal)."""
    texts = []
    labels = []

    # 160 urgent examples
    for _ in range(n_samples // 2):
        template = random.choice(URGENT_TEMPLATES)
        loc = random.choice(LOCATIONS)
        text = template.format(location=loc)
        # Add slight natural lexical variations
        prefixes = ["", "URGENT: ", "Emergency: ", "Please note: ", "Attention: ", "Report: "]
        suffixes = ["", " Please address immediately.", " Needs urgent attention.", " Kindly fix.", ""]
        final_text = f"{random.choice(prefixes)}{text}{random.choice(suffixes)}".strip()
        texts.append(final_text)
        labels.append("urgent")

    # 160 normal examples
    for _ in range(n_samples // 2):
        template = random.choice(NORMAL_TEMPLATES)
        loc = random.choice(LOCATIONS)
        text = template.format(location=loc)
        prefixes = ["", "Complaint: ", "Request: ", "Issue: ", "Note: "]
        suffixes = ["", " Please check when free.", " Routine maintenance needed.", " Thanks.", ""]
        final_text = f"{random.choice(prefixes)}{text}{random.choice(suffixes)}".strip()
        texts.append(final_text)
        labels.append("normal")

    # Shuffle combined dataset
    combined = list(zip(texts, labels))
    random.shuffle(combined)
    texts, labels = zip(*combined)
    return list(texts), list(labels)

def train_and_save_model(model_path="urgency_model.joblib"):
    """
    Trains a TF-IDF + LogisticRegression pipeline and serializes it to disk.
    Evaluates on a held-out test split (20%) and prints a confusion matrix.
    """
    print(f"Generating synthetic dataset of ~320 complaints...")
    texts, labels = generate_synthetic_dataset(320)

    # 80/20 train/test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.20, random_state=42, stratify=labels
    )

    print(f"Dataset split: {len(X_train)} training samples, {len(X_test)} test samples.")

    # Scikit-learn Pipeline: TF-IDF Vectorizer + Logistic Regression
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),       # Unigrams + Bigrams
            max_features=2500,
            sublinear_tf=True,
            stop_words='english'
        )),
        ('clf', LogisticRegression(
            C=1.0,
            solver='liblinear',
            random_state=42
        ))
    ])

    # Train model
    print("Training Logistic Regression model...")
    pipeline.fit(X_train, y_train)

    # Evaluate on held-out test split
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred, labels=["normal", "urgent"])

    print("\n=======================================================")
    print("           MODEL EVALUATION ON TEST SET (20%)          ")
    print("=======================================================")
    print(f"Accuracy: {accuracy * 100:.2f}%\n")
    print("Classification Report:")
    print(classification_report(y_test, y_pred, labels=["normal", "urgent"]))

    print("Confusion Matrix:")
    print("                 Predicted: Normal  |  Predicted: Urgent")
    print(f"Actual Normal  :        {cm[0][0]:<5}       |         {cm[0][1]:<5}")
    print(f"Actual Urgent  :        {cm[1][0]:<5}       |         {cm[1][1]:<5}")
    print("=======================================================\n")

    # Save model pipeline using joblib
    joblib.dump(pipeline, model_path)
    print(f"✓ Model successfully trained and saved to '{model_path}'")
    print(f"  File size: {os.path.getsize(model_path) / 1024:.2f} KB\n")

    return pipeline

if __name__ == "__main__":
    train_and_save_model()

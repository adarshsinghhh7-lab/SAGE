export interface MLUrgencyPrediction {
  urgency_score: number;
  label: 'urgent' | 'normal';
  source: 'ml_microservice' | 'nlp_fallback';
}

const URGENT_KEYWORDS = [
  'spark', 'wire', 'fire', 'harass', 'stalk', 'threat', 'danger', 'shock',
  'leak', 'gas', 'fume', 'smoke', 'trapped', 'elevator', 'lift drop',
  'assault', 'fight', 'bleed', 'injured', 'collapse', 'intruder',
  'trespass', 'lock broken', 'poison', 'ambulance', 'panic attack',
  'boiler', 'explosion', 'dog bite', 'attack', 'railing broken', 'shatter'
];

export class MLService {
  private static mlEndpoint = process.env.ML_SERVICE_URL || 'http://localhost:5001/predict-urgency';

  /**
   * Predict urgency using Python ML microservice with fallback heuristic NLP
   */
  static async predictUrgency(text: string): Promise<MLUrgencyPrediction> {
    if (!text || text.trim().length === 0) {
      return {
        urgency_score: 0.1,
        label: 'normal',
        source: 'nlp_fallback',
      };
    }

    // Try Python Flask Microservice
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(this.mlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          urgency_score: data.urgency_score ?? (data.label === 'urgent' ? 0.9 : 0.2),
          label: data.label ?? (data.urgency_score >= 0.5 ? 'urgent' : 'normal'),
          source: 'ml_microservice',
        };
      }
    } catch {
      // ML microservice not reachable, use intelligent NLP fallback
    }

    // Fallback NLP heuristic
    const lower = text.toLowerCase();
    let matches = 0;
    for (const kw of URGENT_KEYWORDS) {
      if (lower.includes(kw)) {
        matches++;
      }
    }

    const urgency_score = matches > 0 ? Math.min(0.99, 0.65 + matches * 0.15) : 0.15;
    const label = urgency_score >= 0.5 ? 'urgent' : 'normal';

    return {
      urgency_score: Math.round(urgency_score * 100) / 100,
      label,
      source: 'nlp_fallback',
    };
  }
}

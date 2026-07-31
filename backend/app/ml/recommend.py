from typing import List, Dict, Any


def generate_recommendation(mean_probability: float, confidence_score: float) -> str:
    """
    Generates confidence-aware maintenance recommendations based on a 2x2 decision matrix
    of predicted failure probability and epistemic confidence score.

    Thresholds:
      High Probability: >= 0.50
      High Confidence: >= 0.70
    """
    is_high_prob = mean_probability >= 0.50
    is_high_conf = confidence_score >= 0.70

    if is_high_prob and is_high_conf:
        return "Immediate maintenance required"
    elif is_high_prob and not is_high_conf:
        return "Schedule inspection, prediction uncertain"
    elif not is_high_prob and is_high_conf:
        return "Safe to operate"
    else:  # low failure prob & low confidence
        return "Monitor closely, re-check soon"


SAFETY_MEASURES_MAP = {
    "tool_wear": "Replace or sharpen the cutting tool immediately; tool wear has exceeded safe operating limits.",
    "torque": "Reduce feed rate and torque load; inspect for mechanical binding or excessive material resistance.",
    "rotational_speed": "Lower spindle speed to manufacturer-recommended RPM; check for spindle imbalance or bearing wear.",
    "air_temperature": "Improve ambient cooling/ventilation around the machine; check for external heat sources.",
    "process_temperature": "Inspect cooling system and lubrication; reduce continuous run time to allow heat dissipation.",
    "machine_type": "Cross-check operating parameters against this machine's rated load class (L/M/H).",
    "type": "Cross-check operating parameters against this machine's rated load class (L/M/H).",
}

BASE_SAFETY_MEASURE = "Notify the responsible technician and log this event before continued operation."


def get_safety_measures(shap_contributions: List[Dict[str, Any]], prediction: str) -> List[str]:
    """
    Returns specific, actionable safety measures for machine failure predictions based on
    the top contributing positive SHAP feature attributions.

    If prediction != 'failure', returns an empty list [].
    """
    if prediction.lower() != "failure":
        return []

    measures = []
    # Filter positive SHAP contributions (pushing toward failure risk)
    positive_contribs = []
    for item in shap_contributions:
        # Handle dict or Pydantic object
        feat = item.feature if hasattr(item, "feature") else item.get("feature", "")
        val = item.value if hasattr(item, "value") else item.get("value", 0.0)
        if val > 0:
            positive_contribs.append((feat, val))

    # Sort by SHAP value descending (highest risk drivers first)
    positive_contribs.sort(key=lambda x: x[1], reverse=True)

    # Take top 2-3 contributing features
    top_features = positive_contribs[:3]

    for feat, _ in top_features:
        # Match feature name or prefix
        measure_text = None
        if feat in SAFETY_MEASURES_MAP:
            measure_text = SAFETY_MEASURES_MAP[feat]
        elif feat.startswith("type_") or feat == "type":
            measure_text = SAFETY_MEASURES_MAP["machine_type"]

        if measure_text and measure_text not in measures:
            measures.append(measure_text)

    # Always append base safety measure for failure predictions
    measures.append(BASE_SAFETY_MEASURE)

    return measures

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

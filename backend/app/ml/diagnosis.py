import math
from typing import Dict, Any, List
from app.core.schemas import SensorInput, FailureModeDiagnosis


def diagnose_failure_mode(sensor_input: SensorInput, failure_prob: float = 0.0) -> FailureModeDiagnosis:
    """
    Diagnoses specific AI4I 2020 equipment failure mode based on mechanical,
    thermal, and electrical physics-informed criteria:

    1. Tool Wear Failure (TWF): Tool wear reaches or exceeds fatigue zone [200, 240] min.
    2. Heat Dissipation Failure (HDF): Temp diff (Process - Air) < 8.6 K and Rotational Speed < 1380 rpm.
    3. Power Failure (PWF): Mechanical power P = Torque * Speed * (2*pi/60) outside [3500 W, 9000 W].
    4. Overstrain Failure (OSF): Tool wear * Torque exceeds limit (11000 for L, 12000 for M, 13000 for H).
    5. Random Failure (RNF): Anomaly or high probability failure without specific single physical threshold.
    6. NONE: Normal nominal operation.
    """
    air_t = sensor_input.air_temperature
    proc_t = sensor_input.process_temperature
    speed = sensor_input.rotational_speed
    torque = sensor_input.torque
    wear = sensor_input.tool_wear
    m_type = sensor_input.type

    # Physics calculations
    temp_diff = proc_t - air_t
    power_w = torque * speed * (2.0 * math.pi / 60.0)
    strain = wear * torque

    osf_threshold = 11000.0 if m_type == "L" else (12000.0 if m_type == "M" else 13000.0)

    is_twf = wear >= 200.0
    is_hdf = (temp_diff < 8.6) and (speed < 1380.0)
    is_pwf = (power_w < 3500.0) or (power_w > 9000.0)
    is_osf = strain > osf_threshold

    triggered_modes = []
    indicators = []

    if is_twf:
        triggered_modes.append("TWF")
        indicators.append(f"Tool wear ({wear:.1f} min) exceeds safe fatigue limit (>= 200 min)")
    if is_hdf:
        triggered_modes.append("HDF")
        indicators.append(f"Thermal gradient insufficient: Delta T ({temp_diff:.1f} K < 8.6 K) at low spindle speed ({speed:.0f} rpm < 1380 rpm)")
    if is_pwf:
        triggered_modes.append("PWF")
        if power_w < 3500.0:
            indicators.append(f"Drive power stall: P = {power_w:.0f} W (< 3500 W lower operational limit)")
        else:
            indicators.append(f"Drive power overload: P = {power_w:.0f} W (> 9000 W upper thermal limit)")
    if is_osf:
        triggered_modes.append("OSF")
        indicators.append(f"Critical tool overstrain: Strain = {strain:.0f} min*Nm (> {osf_threshold:.0f} limit for Type-{m_type})")

    # If failure conditions triggered
    if is_osf:
        return FailureModeDiagnosis(
            code="OSF",
            name="Overstrain Failure (OSF)",
            short_name="Overstrain",
            shortName="Overstrain",
            description="The product of tool wear and applied torque exceeds the shear limit of the workpiece quality class, risking catastrophic tool breakage.",
            indicators=indicators,
        )
    elif is_pwf:
        return FailureModeDiagnosis(
            code="PWF",
            name="Power Failure (PWF)",
            short_name="Power Failure",
            shortName="Power Failure",
            description="Spindle electric drive power operates outside safe mechanical envelopes, inducing motor stalling or electrical overload trip.",
            indicators=indicators,
        )
    elif is_hdf:
        return FailureModeDiagnosis(
            code="HDF",
            name="Heat Dissipation Failure (HDF)",
            short_name="Heat Dissipation",
            shortName="Heat Dissipation",
            description="Convective heat transfer is inadequate due to reduced spindle velocity and low ambient-to-process temperature differential.",
            indicators=indicators,
        )
    elif is_twf:
        return FailureModeDiagnosis(
            code="TWF",
            name="Tool Wear Failure (TWF)",
            short_name="Tool Wear",
            shortName="Tool Wear",
            description="Cutting tool wear has reached critical micro-chipping threshold (200-240 min), requiring immediate cutter insert replacement.",
            indicators=indicators,
        )
    elif failure_prob >= 0.50:
        return FailureModeDiagnosis(
            code="RNF",
            name="Random Operational Anomaly (RNF)",
            short_name="Random Anomaly",
            shortName="Random Anomaly",
            description="Stochastic model deviation or unclassified operational perturbation detected across Bayesian inference forward passes.",
            indicators=[f"Elevated predictive failure likelihood ({failure_prob*100:.1f}%) without single isolated mechanical limit breach"],
        )
    else:
        return FailureModeDiagnosis(
            code="NONE",
            name="Nominal Operational Health",
            short_name="Nominal",
            shortName="Nominal",
            description="All telemetry parameters operate within nominal tolerances and mechanical envelopes.",
            indicators=["Thermal, power, strain, and wear metrics all within normal manufacturer specifications"],
        )


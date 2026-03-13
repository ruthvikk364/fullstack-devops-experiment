"""
PDF generation using WeasyPrint.
Creates a professional, styled fitness plan document from an HTML template.
No system dependencies — pure Python.
"""

import os

from weasyprint import HTML

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)


def _build_html(user_data: dict, bmi_data: dict, workout_plan: dict, diet_plan: dict) -> str:
    """Build a fully styled HTML document for the fitness plan."""

    name = user_data.get("name", "User")
    weight = user_data.get("weight_kg", "—")
    height = user_data.get("height_cm", "—")
    target_weight = user_data.get("target_weight_kg", "—")
    duration = user_data.get("target_duration_weeks", "—")
    diet_pref = user_data.get("diet_preference", "—")
    equipment = "Gym" if user_data.get("has_gym_access") else "Home / Bodyweight"
    daily_min = user_data.get("daily_available_minutes", "—")
    injuries = user_data.get("injuries", [])
    injury_str = ", ".join(injuries) if injuries else "None"

    bmi_val = bmi_data.get("bmi_value", "—")
    category = bmi_data.get("category", "—")
    calories = bmi_data.get("daily_calories", "—")
    protein = bmi_data.get("daily_protein_g", "—")
    carbs = bmi_data.get("daily_carbs_g", "—")
    fat = bmi_data.get("daily_fat_g", "—")
    strategy = bmi_data.get("strategy", "")

    # Build workout section
    workout_html = ""
    weekly = workout_plan.get("weekly_split", {})
    days_order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for day in days_order:
        day_data = weekly.get(day, {})
        focus = day_data.get("focus", "Rest")
        exercises = day_data.get("exercises", [])
        workout_html += f'<div class="day-card"><h3>{day.capitalize()} — {focus}</h3>'
        if exercises:
            workout_html += '<table class="exercise-table"><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Rest</th></tr>'
            for ex in exercises:
                workout_html += f'<tr><td>{ex["name"]}</td><td>{ex["sets"]}</td><td>{ex["reps"]}</td><td>{ex["rest_sec"]}s</td></tr>'
            workout_html += '</table>'
        else:
            notes = day_data.get("notes", "Active recovery: light walk, stretching, or yoga.")
            workout_html += f'<p class="rest-note">{notes}</p>'
        workout_html += '</div>'

    # Build diet section
    diet_html = ""
    if isinstance(diet_plan, dict):
        for day in days_order:
            meals = diet_plan.get(day, {})
            if not meals:
                continue
            diet_html += f'<div class="day-card"><h3>{day.capitalize()}</h3>'
            for meal_type, items in meals.items():
                label = meal_type.replace("_", " ").title()
                diet_html += f'<div class="meal"><span class="meal-label">{label}</span>'
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            food = item.get("item", "")
                            cal = item.get("calories", "")
                            prot = item.get("protein_g", "")
                            diet_html += f'<div class="food-item">{food} <span class="macro-tag">{cal} kcal · {prot}g protein</span></div>'
                diet_html += '</div>'
            diet_html += '</div>'

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Inter', 'Segoe UI', sans-serif; color: #1a1a2e; line-height: 1.6; background: #fff; }}

  .header {{
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white; padding: 40px 32px; text-align: center;
  }}
  .header h1 {{ font-size: 36px; font-weight: 700; color: #10b981; margin-bottom: 4px; letter-spacing: -1px; }}
  .header p {{ font-size: 14px; color: #94a3b8; }}
  .header .user-name {{ font-size: 20px; color: #e2e8f0; margin-top: 16px; }}

  .content {{ padding: 32px; }}

  .section {{ margin-bottom: 32px; }}
  .section-title {{
    font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px;
    padding-bottom: 8px; border-bottom: 3px solid #10b981;
    display: flex; align-items: center; gap: 8px;
  }}

  /* Profile table */
  .profile-grid {{
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }}
  .profile-item {{
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 12px 16px;
  }}
  .profile-item .label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; }}
  .profile-item .value {{ font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 2px; }}

  /* BMI card */
  .bmi-card {{
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1px solid #a7f3d0; border-radius: 12px; padding: 24px;
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;
  }}
  .bmi-stat {{ text-align: center; }}
  .bmi-stat .num {{ font-size: 28px; font-weight: 700; color: #059669; }}
  .bmi-stat .lbl {{ font-size: 12px; color: #047857; text-transform: uppercase; letter-spacing: 1px; }}
  .strategy {{ margin-top: 16px; background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 14px; color: #166534; }}

  /* Macro pills */
  .macro-row {{
    display: flex; gap: 12px; margin-top: 16px; justify-content: center;
  }}
  .macro-pill {{
    background: #fff; border: 1px solid #e2e8f0; border-radius: 20px;
    padding: 8px 20px; text-align: center;
  }}
  .macro-pill .num {{ font-size: 20px; font-weight: 700; color: #0f172a; }}
  .macro-pill .unit {{ font-size: 11px; color: #64748b; }}

  /* Day cards */
  .day-card {{
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 16px; margin-bottom: 12px;
  }}
  .day-card h3 {{ font-size: 15px; font-weight: 600; color: #10b981; margin-bottom: 8px; }}

  .exercise-table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  .exercise-table th {{
    text-align: left; padding: 6px 10px; background: #e2e8f0; color: #475569;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
  }}
  .exercise-table td {{ padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }}

  .rest-note {{ font-style: italic; color: #64748b; font-size: 13px; }}

  /* Meals */
  .meal {{ margin-bottom: 8px; }}
  .meal-label {{ font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }}
  .food-item {{ font-size: 13px; padding: 3px 0; color: #1e293b; }}
  .macro-tag {{ font-size: 11px; color: #10b981; font-weight: 500; }}

  /* Tips */
  .tip-list {{ list-style: none; }}
  .tip-list li {{
    padding: 10px 16px; margin-bottom: 8px;
    background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0;
    font-size: 14px; color: #92400e;
  }}

  /* Footer */
  .footer {{
    text-align: center; padding: 24px 32px; background: #f8fafc;
    border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;
  }}
  .footer strong {{ color: #10b981; }}

  /* Page break helper */
  .page-break {{ page-break-before: always; }}
</style>
</head>
<body>

<div class="header">
  <h1>TrainFree</h1>
  <p>AI-Powered Personal Fitness Coach</p>
  <div class="user-name">Personalized Plan for {name}</div>
</div>

<div class="content">

  <!-- Profile -->
  <div class="section">
    <div class="section-title">👤 Your Profile</div>
    <div class="profile-grid">
      <div class="profile-item"><div class="label">Current Weight</div><div class="value">{weight} kg</div></div>
      <div class="profile-item"><div class="label">Height</div><div class="value">{height} cm</div></div>
      <div class="profile-item"><div class="label">Target Weight</div><div class="value">{target_weight} kg</div></div>
      <div class="profile-item"><div class="label">Duration</div><div class="value">{duration} weeks</div></div>
      <div class="profile-item"><div class="label">Diet Preference</div><div class="value">{diet_pref}</div></div>
      <div class="profile-item"><div class="label">Equipment</div><div class="value">{equipment}</div></div>
      <div class="profile-item"><div class="label">Daily Time</div><div class="value">{daily_min} min</div></div>
      <div class="profile-item"><div class="label">Injuries</div><div class="value">{injury_str}</div></div>
    </div>
  </div>

  <!-- Health Analysis -->
  <div class="section">
    <div class="section-title">📊 Health Analysis</div>
    <div class="bmi-card">
      <div class="bmi-stat"><div class="num">{bmi_val}</div><div class="lbl">BMI</div></div>
      <div class="bmi-stat"><div class="num">{category}</div><div class="lbl">Category</div></div>
      <div class="bmi-stat"><div class="num">{calories}</div><div class="lbl">Daily kcal</div></div>
    </div>
    <div class="macro-row">
      <div class="macro-pill"><div class="num">{protein}g</div><div class="unit">Protein</div></div>
      <div class="macro-pill"><div class="num">{carbs}g</div><div class="unit">Carbs</div></div>
      <div class="macro-pill"><div class="num">{fat}g</div><div class="unit">Fat</div></div>
    </div>
    {"<div class='strategy'>" + strategy + "</div>" if strategy else ""}
  </div>

  <!-- Workout Plan -->
  <div class="section page-break">
    <div class="section-title">🏋️ Weekly Workout Plan</div>
    {workout_html}
  </div>

  <!-- Diet Plan -->
  <div class="section page-break">
    <div class="section-title">🥗 7-Day Meal Plan</div>
    {diet_html}
  </div>

  <!-- Motivation -->
  <div class="section">
    <div class="section-title">🔥 Stay Motivated</div>
    <ul class="tip-list">
      <li>Consistency beats perfection. Show up every day, even if it's just 20 minutes.</li>
      <li>Track your progress weekly — small wins compound into huge transformations.</li>
      <li>Sleep 7–8 hours. Recovery is where muscles are actually built.</li>
      <li>Drink at least 3 liters of water daily. Hydration fuels performance.</li>
      <li>Trust the process. Results take time but they WILL come. You're already ahead of 90% of people just by starting.</li>
    </ul>
  </div>

</div>

<div class="footer">
  Generated by <strong>TrainFree</strong> — AI-Powered Personal Fitness Coach<br>
  Built by <strong>BeyondScale</strong> · beyondscale.tech
</div>

</body>
</html>"""


def generate_fitness_pdf(
    user_data: dict,
    bmi_data: dict,
    workout_plan: dict,
    diet_plan: dict,
) -> str:
    """Generate a professional PDF fitness plan and return the file path."""
    os.makedirs(settings.PDF_OUTPUT_DIR, exist_ok=True)
    name = user_data.get("name", "User").replace(" ", "_")
    filename = f"TrainFree_Plan_{name}.pdf"
    filepath = os.path.join(settings.PDF_OUTPUT_DIR, filename)

    html_content = _build_html(user_data, bmi_data, workout_plan, diet_plan)

    try:
        HTML(string=html_content).write_pdf(filepath)
        log.info("PDF generated: %s", filepath)
    except Exception as e:
        log.error("WeasyPrint PDF generation failed: %s", e)
        # Fallback: save as HTML (can be printed from browser)
        html_path = filepath.replace(".pdf", ".html")
        with open(html_path, "w") as f:
            f.write(html_content)
        filepath = html_path
        log.info("Saved as HTML fallback: %s", filepath)

    return filepath

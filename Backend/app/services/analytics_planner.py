def plan_analytics(query: str):
    q = query.lower()

    chart_type = "pie"
    if "bar" in q:
        chart_type = "bar"
    elif "line" in q or "trend" in q:
        chart_type = "line"
    elif "table" in q:
        chart_type = "table"

    field_map = {
        "skill": "skills",
        "experience": "experience",
        "location": "location",
        "city": "location",
        "education": "education",
        "resume": "created_at",
    }

    field = None
    for k, v in field_map.items():
        if k in q:
            field = v
            break

    return {
        "field": field,
        "chart": chart_type
    }

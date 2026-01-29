from collections import Counter
from ..utils.db import resume_collection

def run_analytics(field: str):
    docs = resume_collection.find({}, {field: 1})
    counter = Counter()

    for d in docs:
        value = d.get(field)

        if isinstance(value, list):
            counter.update([v.strip().lower() for v in value])
        elif value:
            counter[value] += 1

    return counter

def format_output(counter, chart_type, title):
    labels = list(counter.keys())
    values = list(counter.values())

    if chart_type == "table":
        return {
            "table": {
                "columns": ["Value", "Count"],
                "rows": [
                    {"value": l, "count": v}
                    for l, v in zip(labels, values)
                ]
            }
        }

    return {
        "chart": {
            "type": chart_type,
            "title": title,
            "labels": labels,
            "values": values
        }
    }

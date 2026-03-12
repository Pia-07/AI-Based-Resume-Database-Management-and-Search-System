"""
Data Normalization Service
Deterministic cleaning and formatting of candidate names and city data.
No external dependencies — pure Python string processing.
"""
import re
from typing import List, Dict, Optional, Tuple


# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

# Lines that match these patterns are metadata / junk and should be removed
_METADATA_PATTERNS = [
    re.compile(r"^Unknown\s+Candidate$", re.IGNORECASE),
    re.compile(r"^LastUpdated", re.IGNORECASE),
    re.compile(r"^Resume_\d+", re.IGNORECASE),
]

# Phone number pattern: sequences of 7+ digits (with optional +, -, spaces, parens)
_PHONE_PATTERN = re.compile(r"[\+\(]?[\d\s\-\(\)]{7,}[\d\)]")

# Spaced-out letters: single chars separated by spaces (3+ letters), e.g. "K U N J"
_SPACED_LETTERS = re.compile(r"\b([A-Za-z](?:\s+[A-Za-z]){2,})\b")

# Invalid city values (lowercase)
_INVALID_CITY_VALUES = {
    "unknown", "null", "none", "", "n/a", "not specified", "not provided",
    "anywhere", "remote", "open to relocate", "flexible", "india",
    "not mentioned", "various", "multiple",
}

# Legitimate name prefixes that should not be stripped
_NAME_PREFIXES = {"dr", "mr", "ms", "mrs", "prince", "prof", "sir"}


# ─────────────────────────────────────────────
# INTERNAL HELPERS
# ─────────────────────────────────────────────

def _is_metadata_line(line: str) -> bool:
    """Check if a line is a metadata/junk line that should be removed."""
    stripped = line.strip()
    if not stripped:
        return True
    for pat in _METADATA_PATTERNS:
        if pat.match(stripped):
            return True
    return False


def _collapse_spaced_letters(text: str) -> str:
    """
    Collapse spaced-out single letters into a single word.
    E.g. "K U N J" → "Kunj", "S H R E Y" → "Shrey"
    """
    def _join_match(m: re.Match) -> str:
        letters = m.group(0).replace(" ", "")
        # Title case: first letter upper, rest lower
        return letters[0].upper() + letters[1:].lower() if letters else ""

    return _SPACED_LETTERS.sub(_join_match, text)


def _remove_phone_numbers(text: str) -> str:
    """Remove phone numbers from text."""
    return _PHONE_PATTERN.sub("", text).strip()


def _to_proper_case(name: str) -> str:
    """
    Convert a name to Proper Case while preserving legitimate prefixes.
    "SHREY PATEL" → "Shrey Patel"
    "dr. john smith" → "Dr. John Smith"
    """
    words = name.split()
    result = []
    for word in words:
        if word.lower().rstrip(".") in _NAME_PREFIXES:
            result.append(word.capitalize())
        else:
            result.append(word.capitalize())
    return " ".join(result)


def _clean_resume_id(text: str) -> str:
    """Remove resume IDs like Resume_205 from text."""
    return re.sub(r"Resume_\d+", "", text, flags=re.IGNORECASE).strip()


# ─────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────

def normalize_name(raw: Optional[str]) -> Optional[str]:
    """
    Clean and normalize a candidate name.

    - Removes phone numbers
    - Removes metadata lines (Unknown Candidate, LastUpdated, Resume IDs)
    - Collapses spaced-out letters (K U N J → Kunj)
    - Converts to Proper Case
    - Returns None for empty/invalid names
    """
    if not raw or not isinstance(raw, str):
        return None

    name = raw.strip()

    # Check if entire string is a metadata line
    if _is_metadata_line(name):
        return None

    # Remove phone numbers
    name = _remove_phone_numbers(name)

    # Remove resume IDs
    name = _clean_resume_id(name)

    # Collapse spaced-out letters
    name = _collapse_spaced_letters(name)

    # Normalize whitespace
    name = re.sub(r"\s+", " ", name).strip()

    # Must have at least 2 characters to be a valid name
    if len(name) < 2:
        return None

    # Convert to Proper Case
    name = _to_proper_case(name)

    return name


def normalize_city(raw: Optional[str]) -> Optional[str]:
    """
    Clean and normalize a city name.

    - Removes resume IDs
    - Filters out invalid values (unknown, null, remote, etc.)
    - Converts to Proper Case
    - Returns None for empty/invalid cities
    """
    if not raw or not isinstance(raw, str):
        return None

    city = raw.strip()

    # Remove resume IDs
    city = _clean_resume_id(city)

    # Normalize whitespace
    city = re.sub(r"\s+", " ", city).strip()

    # Check against invalid values
    if city.lower() in _INVALID_CITY_VALUES:
        return None

    # Must have at least 2 characters
    if len(city) < 2:
        return None

    # Convert to Proper Case
    city = city.title()

    return city


def build_cleaned_candidate_list(raw_names: List[str]) -> str:
    """
    Process a list of raw candidate names and return a cleaned numbered list.

    Output format:
        CLEANED CANDIDATE LIST:
        1. Name One
        2. Name Two
        ...

    Rules applied:
    - All normalization rules from normalize_name()
    - Exact duplicate removal (case-insensitive)
    - Sorted alphabetically by first name
    """
    seen: set = set()
    cleaned: List[str] = []

    for raw in raw_names:
        name = normalize_name(raw)
        if name and name.lower() not in seen:
            seen.add(name.lower())
            cleaned.append(name)

    # Sort alphabetically by first name (whole string comparison gives first-name sort)
    cleaned.sort(key=lambda n: n.lower())

    lines = ["CLEANED CANDIDATE LIST:"]
    for i, name in enumerate(cleaned, 1):
        lines.append(f"{i}. {name}")

    return "\n".join(lines)


def build_cities_summary(candidates: List[Dict[str, str]]) -> str:
    """
    Build the cities summary from a list of candidate dicts with 'name' and 'location'.

    Output format:
        CITIES SUMMARY:
        Total Cities: X

        1. City Name (Total Candidates: Y)
           - Candidate A
           - Candidate B

        2. City Name (Total Candidates: Z)
           - Candidate C

    Rules applied:
    - Normalize names and cities
    - Remove duplicates
    - Group candidates under each city
    - Sort cities alphabetically
    - Show total cities and per-city counts
    """
    # Group: city → set of candidate names (deduped, normalized)
    city_groups: Dict[str, List[str]] = {}

    for candidate in candidates:
        name = normalize_name(candidate.get("name"))
        city = normalize_city(candidate.get("location"))

        if not name or not city:
            continue

        if city not in city_groups:
            city_groups[city] = []

        # Avoid duplicate names within a city
        if name not in city_groups[city]:
            city_groups[city].append(name)

    # Sort cities alphabetically
    sorted_cities = sorted(city_groups.keys(), key=lambda c: c.lower())

    lines = [
        "CITIES SUMMARY:",
        f"Total Cities: {len(sorted_cities)}",
        "",
    ]

    for i, city in enumerate(sorted_cities, 1):
        candidates_in_city = sorted(city_groups[city], key=lambda n: n.lower())
        lines.append(f"{i}. {city} (Total Candidates: {len(candidates_in_city)})")
        for c in candidates_in_city:
            lines.append(f"   - {c}")
        lines.append("")  # blank line between cities

    return "\n".join(lines).rstrip()


def build_full_normalized_output(candidates: List[Dict[str, str]]) -> str:
    """
    Build the complete normalized output combining both the cleaned candidate list
    and the cities summary.

    Each candidate dict should have 'name' and optionally 'location'.

    Returns the exact format:
        CLEANED CANDIDATE LIST:
        <numbered names>

        CITIES SUMMARY:
        <grouped city list>
    """
    raw_names = [c.get("name", "") for c in candidates if c.get("name")]
    candidate_list = build_cleaned_candidate_list(raw_names)

    # Only build cities summary if at least some locations exist
    has_locations = any(c.get("location") for c in candidates)

    if has_locations:
        cities_summary = build_cities_summary(candidates)
        return f"{candidate_list}\n\n{cities_summary}"

    return candidate_list

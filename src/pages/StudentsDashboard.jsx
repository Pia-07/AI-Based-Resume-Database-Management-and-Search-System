import { useState, useEffect, useCallback } from "react";
import { fetchStudents } from "../services/api";

/**
 * StudentsDashboard — Premium All-Students view with filtering, sorting, and search.
 * Features:
 * - Card-based layout with glassmorphism effects
 * - Location, Experience, Certification filters
 * - Real-time search across name/skills/keywords
 * - Sort by Name (A-Z, Z-A) and Experience (Low-High, High-Low)
 * - Reset filters, result count, dark mode support
 */
const StudentsDashboard = () => {
  // Data state
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter options (from backend)
  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableCertifications, setAvailableCertifications] = useState([]);

  // Active filters
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [certificationFilters, setCertificationFilters] = useState([]);
  const [sortOption, setSortOption] = useState("");

  // UI state
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch students when filters change
  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (locationFilter) params.location = locationFilter;
      if (sortOption) params.sort = sortOption;
      if (certificationFilters.length > 0) params.certifications = certificationFilters;

      // Map experience filter to min/max
      if (experienceFilter) {
        const [min, max] = experienceFilter.split("-").map(Number);
        if (!isNaN(min)) params.experience_min = min;
        if (!isNaN(max)) params.experience_max = max;
      }

      const data = await fetchStudents(params);
      setStudents(data.students || []);
      setTotalCount(data.count || 0);
      setAvailableLocations(data.filters?.locations || []);
      setAvailableCertifications(data.filters?.certifications || []);
    } catch (err) {
      console.error("Failed to load students:", err);
      setError("Failed to load students. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, locationFilter, experienceFilter, certificationFilters, sortOption]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Toggle certification filter
  const toggleCertification = (cert) => {
    setCertificationFilters((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setExperienceFilter("");
    setCertificationFilters([]);
    setSortOption("");
  };

  const hasActiveFilters =
    searchQuery || locationFilter || experienceFilter || certificationFilters.length > 0 || sortOption;

  // Experience display helper
  const formatExperience = (years) => {
    if (years === null || years === undefined) return "N/A";
    if (years === 0) return "Fresher";
    if (years === 1) return "1 year";
    return `${years} years`;
  };

  return (
    <div style={styles.container}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>👥</span> All Students
          </h1>
          <p style={styles.subtitle}>
            Browse, filter, and search through all candidates in the system
          </p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.countBadge}>
            <span style={styles.countNumber}>{totalCount}</span>
            <span style={styles.countLabel}>
              {totalCount === 1 ? "Candidate" : "Candidates"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={styles.searchContainer}>
        <div style={styles.searchInputWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            id="student-search"
            type="text"
            placeholder="Search by name, skill, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              style={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div style={styles.filtersBar}>
        <div style={styles.filtersRow}>
          {/* Location Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>📍 Location</label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Locations</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>💼 Experience</label>
            <select
              id="experience-filter"
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Experience</option>
              <option value="0-1">0–1 years</option>
              <option value="1-3">1–3 years</option>
              <option value="3-5">3–5 years</option>
              <option value="5-100">5+ years</option>
            </select>
          </div>

          {/* Certifications Multi-Select */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>🎓 Certifications</label>
            <div style={styles.certDropdownWrapper}>
              <button
                id="cert-filter-toggle"
                style={styles.certDropdownBtn}
                onClick={() => setShowCertDropdown(!showCertDropdown)}
              >
                {certificationFilters.length > 0
                  ? `${certificationFilters.length} selected`
                  : "All Certifications"}
                <span style={styles.dropdownArrow}>
                  {showCertDropdown ? "▲" : "▼"}
                </span>
              </button>
              {showCertDropdown && (
                <div style={styles.certDropdownMenu}>
                  {availableCertifications.length === 0 ? (
                    <div style={styles.certDropdownEmpty}>No certifications found</div>
                  ) : (
                    availableCertifications.map((cert) => (
                      <label key={cert} style={styles.certOption}>
                        <input
                          type="checkbox"
                          checked={certificationFilters.includes(cert)}
                          onChange={() => toggleCertification(cert)}
                          style={styles.certCheckbox}
                        />
                        <span>{cert}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sort */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>↕️ Sort By</label>
            <select
              id="sort-filter"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">Default</option>
              <option value="name_asc">Name A → Z</option>
              <option value="name_desc">Name Z → A</option>
              <option value="exp_asc">Experience ↑</option>
              <option value="exp_desc">Experience ↓</option>
            </select>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              id="reset-filters"
              style={styles.resetBtn}
              onClick={resetFilters}
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div style={styles.activeFilters}>
            {locationFilter && (
              <span style={styles.filterChip}>
                📍 {locationFilter}
                <button
                  style={styles.chipRemove}
                  onClick={() => setLocationFilter("")}
                >
                  ×
                </button>
              </span>
            )}
            {experienceFilter && (
              <span style={styles.filterChip}>
                💼 {experienceFilter.replace("-", "–")} yrs
                <button
                  style={styles.chipRemove}
                  onClick={() => setExperienceFilter("")}
                >
                  ×
                </button>
              </span>
            )}
            {certificationFilters.map((c) => (
              <span key={c} style={styles.filterChip}>
                🎓 {c}
                <button
                  style={styles.chipRemove}
                  onClick={() => toggleCertification(c)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div style={styles.resultsArea}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading candidates...</p>
          </div>
        ) : error ? (
          <div style={styles.errorState}>
            <span style={styles.errorIcon}>⚠️</span>
            <h3 style={styles.errorTitle}>{error}</h3>
            <button style={styles.retryBtn} onClick={loadStudents}>
              🔄 Retry
            </button>
          </div>
        ) : students.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🔍</span>
            <h3 style={styles.emptyTitle}>No candidates found</h3>
            <p style={styles.emptyText}>
              Try adjusting your filters or search query.
            </p>
            {hasActiveFilters && (
              <button style={styles.emptyResetBtn} onClick={resetFilters}>
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.cardsGrid}>
            {students.map((student, idx) => (
              <StudentCard
                key={student.resume_id || student.email || idx}
                student={student}
                formatExperience={formatExperience}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * StudentCard — Individual candidate card component
 */
const StudentCard = ({ student, formatExperience }) => {
  const [isHovered, setIsHovered] = useState(false);

  const skills = student.skills || [];
  const certifications = student.certifications || [];

  return (
    <div
      style={{
        ...styles.card,
        ...(isHovered ? styles.cardHover : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div style={styles.cardHeader}>
        <div style={styles.avatarCircle}>
          {(student.name || "?").charAt(0).toUpperCase()}
        </div>
        <div style={styles.cardHeaderText}>
          <h3 style={styles.cardName}>{student.name || "Unknown"}</h3>
          {student.email && (
            <p style={styles.cardEmail}>{student.email}</p>
          )}
        </div>
      </div>

      {/* Location & Experience */}
      <div style={styles.cardMeta}>
        {student.location && (
          <span style={styles.metaBadge}>
            📍 {student.location}
          </span>
        )}
        <span style={styles.metaBadge}>
          💼 {formatExperience(student.experience_years)}
        </span>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div style={styles.cardSection}>
          <span style={styles.sectionLabel}>Skills</span>
          <div style={styles.chipRow}>
            {skills.slice(0, 6).map((skill, i) => (
              <span key={i} style={styles.skillChip}>
                {skill}
              </span>
            ))}
            {skills.length > 6 && (
              <span style={styles.moreChip}>+{skills.length - 6}</span>
            )}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div style={styles.cardSection}>
          <span style={styles.sectionLabel}>Certifications</span>
          <div style={styles.chipRow}>
            {certifications.slice(0, 3).map((cert, i) => (
              <span key={i} style={styles.certChip}>
                {cert}
              </span>
            ))}
            {certifications.length > 3 && (
              <span style={styles.moreChip}>+{certifications.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Summary preview */}
      {student.summary && (
        <p style={styles.summaryText}>
          {student.summary.length > 120
            ? student.summary.substring(0, 120) + "..."
            : student.summary}
        </p>
      )}
    </div>
  );
};

// ── Styles ──
const styles = {
  container: {
    padding: "28px 36px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minHeight: "100vh",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "var(--text-primary)",
    margin: "0 0 4px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleIcon: {
    fontSize: "32px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-tertiary)",
    margin: 0,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  countBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    borderRadius: "14px",
    boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
  },
  countNumber: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff",
    lineHeight: 1,
  },
  countLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  // Search
  searchContainer: {
    width: "100%",
  },
  searchInputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    fontSize: "18px",
    pointerEvents: "none",
    zIndex: 1,
  },
  searchInput: {
    width: "100%",
    padding: "14px 44px 14px 48px",
    fontSize: "15px",
    borderRadius: "14px",
    border: "1.5px solid var(--border-color)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    transition: "all 200ms ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "14px",
    background: "var(--bg-tertiary)",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "12px",
    color: "var(--text-tertiary)",
    padding: 0,
    boxShadow: "none",
  },

  // Filters
  filtersBar: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "18px 22px",
    background: "var(--bg-primary)",
    borderRadius: "16px",
    border: "1px solid var(--border-color)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  },
  filtersRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    alignItems: "flex-end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "160px",
    flex: "1 1 160px",
    maxWidth: "240px",
  },
  filterLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  filterSelect: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid var(--border-color)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
  },
  certDropdownWrapper: {
    position: "relative",
  },
  certDropdownBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid var(--border-color)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "none",
  },
  dropdownArrow: {
    fontSize: "10px",
    color: "var(--text-tertiary)",
  },
  certDropdownMenu: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "var(--bg-primary)",
    border: "1.5px solid var(--border-color)",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 100,
    maxHeight: "220px",
    overflowY: "auto",
    padding: "8px",
  },
  certDropdownEmpty: {
    padding: "12px",
    color: "var(--text-tertiary)",
    fontSize: "13px",
    textAlign: "center",
  },
  certOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "var(--text-primary)",
    transition: "background 150ms",
  },
  certCheckbox: {
    accentColor: "#6366f1",
    width: "16px",
    height: "16px",
  },
  resetBtn: {
    padding: "10px 18px",
    background: "var(--bg-tertiary)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "none",
    whiteSpace: "nowrap",
    alignSelf: "flex-end",
  },
  activeFilters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    paddingTop: "4px",
  },
  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 12px",
    background: "rgba(99, 102, 241, 0.1)",
    color: "#6366f1",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  chipRemove: {
    background: "none",
    border: "none",
    color: "#6366f1",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    padding: "0 0 0 2px",
    lineHeight: 1,
    boxShadow: "none",
  },

  // Results
  resultsArea: {
    flex: 1,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "18px",
  },

  // Card
  card: {
    background: "var(--bg-primary)",
    borderRadius: "16px",
    padding: "22px",
    border: "1px solid var(--border-color)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "default",
  },
  cardHover: {
    boxShadow: "0 8px 30px rgba(99, 102, 241, 0.12)",
    borderColor: "#818cf8",
    transform: "translateY(-2px)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  avatarCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "800",
    flexShrink: 0,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardEmail: {
    fontSize: "12px",
    color: "var(--text-tertiary)",
    margin: "2px 0 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  metaBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    background: "var(--bg-tertiary)",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-secondary)",
  },
  cardSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
  },
  skillChip: {
    padding: "3px 10px",
    background: "rgba(99, 102, 241, 0.08)",
    color: "#6366f1",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
  },
  certChip: {
    padding: "3px 10px",
    background: "rgba(16, 185, 129, 0.08)",
    color: "#059669",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
  },
  moreChip: {
    padding: "3px 8px",
    color: "var(--text-tertiary)",
    fontSize: "11px",
    fontWeight: "600",
  },
  summaryText: {
    fontSize: "12px",
    color: "var(--text-tertiary)",
    lineHeight: 1.5,
    margin: 0,
    borderTop: "1px solid var(--border-color)",
    paddingTop: "10px",
  },

  // States
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    gap: "16px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid var(--border-color)",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "var(--text-tertiary)",
    fontSize: "14px",
  },
  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    gap: "12px",
    textAlign: "center",
  },
  errorIcon: { fontSize: "48px" },
  errorTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
  },
  retryBtn: {
    padding: "10px 24px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    gap: "10px",
    textAlign: "center",
  },
  emptyIcon: { fontSize: "52px" },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
  },
  emptyText: {
    color: "var(--text-tertiary)",
    maxWidth: "360px",
    margin: 0,
  },
  emptyResetBtn: {
    marginTop: "8px",
    padding: "10px 24px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default StudentsDashboard;

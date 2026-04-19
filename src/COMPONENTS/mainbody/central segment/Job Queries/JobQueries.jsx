import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import styles from "./JobQueries.module.css";

export default function JobQueries() {
  const organizations = useSelector((state) => state.AllCompanyNameSlice || []);

  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortType, setSortType] = useState("az");

  const uniqueLocations = useMemo(() => {
    return [
      ...new Set(organizations.map((item) => item.location).filter(Boolean)),
    ].sort();
  }, [organizations]);

  const uniqueTypes = useMemo(() => {
    return [
      ...new Set(organizations.map((item) => item.type).filter(Boolean)),
    ].sort();
  }, [organizations]);

  const filteredOrganizations = useMemo(() => {
    let result = [...organizations];

    // search by name or short name
    result = result.filter((item) => {
      const search = searchText.toLowerCase();

      return (
        item.name.toLowerCase().includes(search) ||
        item.shortName.toLowerCase().includes(search)
      );
    });

    // location filter
    if (locationFilter !== "all") {
      result = result.filter((item) => item.location === locationFilter);
    }

    // type filter
    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    // sort
    result.sort((a, b) => {
      if (sortType === "az") {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });

    return result;
  }, [organizations, searchText, locationFilter, typeFilter, sortType]);

  const clearFilters = () => {
    setSearchText("");
    setLocationFilter("all");
    setTypeFilter("all");
    setSortType("az");
  };

  if (!organizations.length) {
    return (
      <div className={styles.emptyBox}>
        <h3>No organizations found</h3>
        <p>Company and organization list will appear here.</p>
      </div>
    );
  }

  return (
    <section className={styles.wrapper}>
      {/* Top header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Organizations & Companies</h2>
          <p className={styles.subtitle}>
            Search and explore companies, government and non-government
            organizations
          </p>
        </div>

        <div className={styles.countBadge}>
          {filteredOrganizations.length} Result
          {filteredOrganizations.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by name or short name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Locations</option>
          {uniqueLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
          className={styles.select}
        >
          <option value="az">Sort: A-Z</option>
          <option value="za">Sort: Z-A</option>
        </select>

        <button
          type="button"
          className={styles.clearBtn}
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {/* Cards */}
      {filteredOrganizations.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No matching result</h3>
          <p>Try changing your search or filters.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredOrganizations.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.logoBox}>{item.shortName}</div>

              <div className={styles.cardContent}>
                <h3 className={styles.name}>{item.name}</h3>

                <div className={styles.metaRow}>
                  {item.type && (
                    <span className={styles.metaTag}>{item.type}</span>
                  )}
                  {item.location && (
                    <span className={styles.metaTag}>{item.location}</span>
                  )}
                  {item.sector && (
                    <span className={styles.metaTag}>{item.sector}</span>
                  )}
                </div>

                {item.description && (
                  <p className={styles.description}>{item.description}</p>
                )}

                {item.website && (
                  <p className={styles.websiteText}>{item.website}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

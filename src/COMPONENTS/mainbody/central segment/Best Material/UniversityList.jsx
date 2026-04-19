import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import styles from "./UniversityList.module.css";

export default function UniversityList() {
  const universities = useSelector(
    (state) => state.AllUniversityNameSlice || [],
  );

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortType, setSortType] = useState("az");

  const uniqueTypes = useMemo(() => {
    return [
      ...new Set(universities.map((item) => item.type).filter(Boolean)),
    ].sort();
  }, [universities]);

  const uniqueCategories = useMemo(() => {
    return [
      ...new Set(universities.map((item) => item.category).filter(Boolean)),
    ].sort();
  }, [universities]);

  const uniqueCities = useMemo(() => {
    return [
      ...new Set(universities.map((item) => item.city).filter(Boolean)),
    ].sort();
  }, [universities]);

  const filteredUniversities = useMemo(() => {
    let result = [...universities];

    // search by name / shortName / city
    result = result.filter((item) => {
      const search = searchText.toLowerCase();

      return (
        item.name.toLowerCase().includes(search) ||
        item.shortName.toLowerCase().includes(search) ||
        item.city.toLowerCase().includes(search)
      );
    });

    // type filter
    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    // category filter
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.category === categoryFilter);
    }

    // city filter
    if (cityFilter !== "all") {
      result = result.filter((item) => item.city === cityFilter);
    }

    // sort
    result.sort((a, b) => {
      if (sortType === "az") {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });

    return result;
  }, [
    universities,
    searchText,
    typeFilter,
    categoryFilter,
    cityFilter,
    sortType,
  ]);

  if (!universities.length) {
    return (
      <div className={styles.emptyBox}>
        <h3>No universities found</h3>
        <p>University list will appear here.</p>
      </div>
    );
  }

  return (
    <section className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Universities</h2>
          <p className={styles.subtitle}>
            Search, filter and explore universities for curriculum materials
            later
          </p>
        </div>

        <div className={styles.countBadge}>
          {filteredUniversities.length} Result
          {filteredUniversities.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by university, short name, or city..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
        />

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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Categories</option>
          {uniqueCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Cities</option>
          {uniqueCities.map((city) => (
            <option key={city} value={city}>
              {city}
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
      </div>

      {/* Grid */}
      {filteredUniversities.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No matching university</h3>
          <p>Try a different search or change filters.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredUniversities.map((university) => (
            <article key={university.id} className={styles.card}>
              <div className={styles.logoBox}>{university.shortName}</div>

              <div className={styles.cardContent}>
                <div className={styles.topRow}>
                  <h3 className={styles.name}>{university.name}</h3>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaTag}>{university.shortName}</span>
                  <span className={styles.metaTag}>{university.city}</span>
                  <span className={styles.metaTag}>{university.type}</span>
                  <span className={styles.metaTag}>{university.category}</span>
                </div>

                <p className={styles.info}>
                  University details and curriculum materials can be added here
                  later.
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

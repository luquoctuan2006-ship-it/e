import { useState, useEffect } from "react";
import { categoriesAPI } from "../services/api";
import "../styles/EventFilter.css";

const EventFilter = ({ onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, onFilterChange]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSort(value);
    onFilterChange({ sort: value });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value) {
      onFilterChange({ category_id: value });
    } else {
      onFilterChange({ category_id: "" });
    }
  };

  return (
    <div className="event-filter">
      <h3>Bộ lọc</h3>

      <div className="filter-group">
        <label>Tìm kiếm</label>
        <input
          type="text"
          placeholder="Tìm sự kiện..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      <div className="filter-group">
        <label>Danh mục</label>
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <select onChange={handleCategoryChange} defaultValue="">
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="filter-group">
        <label>Sắp xếp theo</label>
        <select value={sort} onChange={handleSortChange}>
          <option value="date">Ngày gần nhất</option>
          <option value="price_low">Giá thấp nhất</option>
          <option value="price_high">Giá cao nhất</option>
          <option value="popularity">Phổ biến nhất</option>
        </select>
      </div>
    </div>
  );
};

export default EventFilter;

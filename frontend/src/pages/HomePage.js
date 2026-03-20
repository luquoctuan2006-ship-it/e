import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import EventCard from '../components/EventCard';
import EventFilter from '../components/EventFilter';
import '../styles/HomePage.css';

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    sort: 'date',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventsAPI.getAll(filters);
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="home-page">
      <header className="hero-banner">
        <h1>Khám Phá Các Sự Kiện Thú Vị</h1>
        <p>Tìm kiếm, đặt vé và tham dự các sự kiện yêu thích của bạn</p>
      </header>

      <div className="page-content">
        <aside className="filter-section">
          <EventFilter onFilterChange={handleFilterChange} />
        </aside>

        <main className="events-section">
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div className="loading">Đang tải sự kiện...</div>
          ) : events.length === 0 ? (
            <div className="no-events">Không tìm thấy sự kiện nào</div>
          ) : (
            <>
              <div className="events-grid">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => navigate(`/events/${event.id}`)}
                  />
                ))}
              </div>

              <div className="pagination">
                <button
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                >
                  Trang trước
                </button>
                <span>
                  Trang {filters.page} / {Math.ceil(pagination.total / filters.limit)}
                </span>
                <button
                  disabled={filters.page >= Math.ceil(pagination.total / filters.limit)}
                  onClick={() => handlePageChange(filters.page + 1)}
                >
                  Trang tiếp
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;

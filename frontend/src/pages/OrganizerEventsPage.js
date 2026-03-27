import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizerAPI } from '../services/api';
import '../styles/OrganizerEventsPage.css';

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const ticketChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const ticketChartInstance = useRef(null);
  const revenueChartInstance = useRef(null);

  const safeInt = (val) => parseInt(val, 10) || 0;
  const safeFloat = (val) => parseFloat(val) || 0;

  useEffect(() => {
    if (!user || (user.role !== 'organizer')) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const renderCharts = useCallback(() => {
    if (typeof window === 'undefined' || !window.Chart) return;

    const labels = events.map(e =>
      e.title.length > 18 ? e.title.substring(0, 18) + '…' : e.title
    );
    const soldData = events.map(e => safeInt(e.sold_tickets));
    const remainingData = events.map(e =>
      Math.max(0, safeInt(e.total_tickets) - safeInt(e.sold_tickets))
    );
    const revenueData = events.map(e => {
      const rev = safeFloat(e.total_revenue) || safeInt(e.sold_tickets) * safeFloat(e.price);
      return Math.round((rev / 1_000_000) * 10) / 10;
    });

    if (ticketChartRef.current) {
      ticketChartInstance.current?.destroy();
      ticketChartInstance.current = new window.Chart(ticketChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Đã bán',
              data: soldData,
              backgroundColor: '#3498db',
              borderRadius: 4,
            },
            {
              label: 'Còn lại',
              data: remainingData,
              backgroundColor: '#e0ecf8',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} vé`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: { autoSkip: false, maxRotation: 30, font: { size: 12 } },
              grid: { display: false },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { color: 'rgba(0,0,0,0.06)' },
            },
          },
        },
      });
    }

    if (revenueChartRef.current) {
      revenueChartInstance.current?.destroy();
      revenueChartInstance.current = new window.Chart(revenueChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Doanh thu (triệu VND)',
              data: revenueData,
              backgroundColor: '#2ecc71',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `Doanh thu: ${ctx.parsed.y.toFixed(1)} triệu VND`,
              },
            },
          },
          scales: {
            x: {
              ticks: { autoSkip: false, maxRotation: 30, font: { size: 12 } },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: { callback: v => v.toFixed(0) + 'M' },
              grid: { color: 'rgba(0,0,0,0.06)' },
            },
          },
        },
      });
    }
  }, [events]);

  useEffect(() => {
    if (events.length === 0) return;

    const destroyCharts = () => {
      ticketChartInstance.current?.destroy();
      revenueChartInstance.current?.destroy();
    };

    if (window.Chart) {
      renderCharts();
    } else {
      const existing = document.getElementById('chartjs-cdn');
      if (existing) {
        existing.addEventListener('load', renderCharts);
        return () => existing.removeEventListener('load', renderCharts);
      }
      const script = document.createElement('script');
      script.id = 'chartjs-cdn';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = () => renderCharts();
      document.head.appendChild(script);
    }

    return destroyCharts;
  }, [events, renderCharts]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getMyEvents();
      const rawEvents = response.events || [];
      console.log('Raw events from API:', rawEvents);
      setEvents(rawEvents);
    } catch (err) {
      setError('Không thể tải danh sách sự kiện');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending':  return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending':  return 'Chờ duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  const totalSold = events.reduce((sum, e) => sum + safeInt(e.sold_tickets), 0);
  const totalRevenue = events.reduce((sum, e) => {
    const rev = safeFloat(e.total_revenue) || safeInt(e.sold_tickets) * safeFloat(e.price);
    return sum + rev;
  }, 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải danh sách sự kiện...</p>
      </div>
    );
  }

  return (
    <div className="organizer-events-page">
      {/* KHÔNG còn <script> ở đây — Chart.js được load động trong useEffect */}
      <div className="container">

        <div className="page-header">
          <div className="header-content">
            <h1>Quản lý sự kiện</h1>
            <p className="subtitle">Quản lý tất cả sự kiện của bạn tại đây</p>
          </div>
          <Link to="/organizer/create-event" className="btn btn-primary create-btn">
            Tạo sự kiện mới
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>Chưa có sự kiện nào</h3>
            <p>Hãy tạo sự kiện đầu tiên của bạn để bắt đầu bán vé!</p>
            <Link to="/organizer/create-event" className="btn btn-primary">
              Tạo sự kiện đầu tiên
            </Link>
          </div>
        ) : (
          <>
            <div className="quick-stats">
              <div className="stat-card">
                <h3>{events.length}</h3>
                <p>Tổng sự kiện</p>
              </div>
              <div className="stat-card">
                <h3>{events.filter(e => e.status === 'approved').length}</h3>
                <p>Đã duyệt</p>
              </div>
              <div className="stat-card">
                <h3>{events.filter(e => e.status === 'pending').length}</h3>
                <p>Chờ duyệt</p>
              </div>
              <div className="stat-card">
                <h3>{totalSold}</h3>
                <p>Vé đã bán</p>
              </div>
              <div className="stat-card stat-card--revenue">
                <h3>{totalRevenue.toLocaleString('vi-VN')}</h3>
                <p>Tổng doanh thu (VND)</p>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h2>Theo dõi vé đã bán</h2>
                  <div className="chart-legend">
                    <span className="legend-item legend-item--sold">Đã bán</span>
                    <span className="legend-item legend-item--remaining">Còn lại</span>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <canvas ref={ticketChartRef}></canvas>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h2>Doanh thu theo sự kiện</h2>
                  <div className="chart-legend">
                    <span className="legend-item legend-item--revenue">Doanh thu (triệu VND)</span>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <canvas ref={revenueChartRef}></canvas>
                </div>
              </div>
            </div>

            <div className="events-table-container">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Ngày sự kiện</th>
                    <th>Trạng thái</th>
                    <th>Vé đã bán</th>
                    <th>Giá vé</th>
                    <th>Doanh thu</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => {
                    const sold    = safeInt(event.sold_tickets);
                    const total   = safeInt(event.total_tickets);
                    const price   = safeFloat(event.price);
                    const revenue = safeFloat(event.total_revenue) || sold * price;
                    return (
                      <tr key={event.id}>
                        <td className="event-title">
                          <strong>{event.title}</strong>
                          <small>{event.venue_name} - {event.city}</small>
                        </td>
                        <td>
                          {new Date(event.event_date).toLocaleDateString('vi-VN')}
                          <br />
                          <small>
                            {new Date(event.event_date).toLocaleTimeString('vi-VN', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </small>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusColor(event.status)}`}>
                            {getStatusText(event.status)}
                          </span>
                        </td>
                        <td>
                          {sold} / {total}
                          <br />
                          <small>{Math.max(0, total - sold)} vé còn lại</small>
                        </td>
                        <td>{price.toLocaleString('vi-VN')} VND</td>
                        <td className="revenue-cell">
                          {revenue.toLocaleString('vi-VN')} VND
                        </td>
                        <td className="actions">
                          <button
                            className="btn btn-small btn-edit"
                            onClick={() => navigate(`/organizer/edit-event/${event.id}`)}
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizerEventsPage;
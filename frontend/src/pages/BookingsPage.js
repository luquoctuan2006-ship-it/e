import { useState, useEffect } from 'react';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/BookingsPage.css';

const BookingsPage = () => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      const data = await bookingsAPI.getMyBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Bạn muốn hủy đặt vé này?')) return;

    try {
      await bookingsAPI.cancel(bookingId);
      alert('Đã hủy đặt vé');
      fetchBookings();
    } catch (err) {
      alert('Lỗi khi hủy đặt vé: ' + err.message);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'approved':
        return 'Đã chấp nhận';
      case 'pending':
        return 'Chờ xử lý';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (!isAuthenticated) {
    return <div className="error-message">Vui lòng đăng nhập</div>;
  }

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="bookings-page">
      <h1>Vé của tôi</h1>
      {bookings.length === 0 ? (
        <div className="no-bookings">Bạn chưa đặt vé nào</div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-info">
                  <h3>{booking.event_title}</h3>
                  <p className="booking-date">
                    <strong>Ngày đặt:</strong> {new Date(booking.booking_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="booking-status">
                  <span className={`status-badge ${booking.status}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">Số vé:</span>
                  <span className="detail-value">{booking.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tổng tiền:</span>
                  <span className="detail-value highlight">
                    {Number(booking.total_price).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                
                {booking.event_date && (
                  <div className="detail-row">
                    <span className="detail-label">Ngày sự kiện:</span>
                    <span className="detail-value">
                      {new Date(booking.event_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {booking.seats && (
                <div className="booking-seats">
                  <strong>Ghế của bạn:</strong>
                  <div className="seats-list">
                    {Array.isArray(booking.seats) 
                      ? booking.seats.map((seat, idx) => (
                          <span key={idx} className="seat-badge">{seat}</span>
                        ))
                      : JSON.parse(booking.seats).map((seat, idx) => (
                          <span key={idx} className="seat-badge">{seat}</span>
                        ))
                    }
                  </div>
                </div>
              )}

              {booking.ticket_details && booking.ticket_details.length > 0 && (
                <div className="ticket-details">
                  <button 
                    className="toggle-details"
                    onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                  >
                    {expandedBooking === booking.id ? '▼' : '▶'} Chi tiết loại vé ({booking.ticket_details.length})
                  </button>
                  {expandedBooking === booking.id && (
                    <div className="ticket-items">
                      {booking.ticket_details.map((detail, idx) => (
                        <div key={idx} className="ticket-item">
                          <div className="item-header">
                            <span className="item-name">{detail.ticket_type_name}</span>
                            <span className="item-price">
                              {Number(detail.price_per_ticket).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                          <div className="item-quantity">
                            Số lượng: {detail.quantity} ({Number(detail.subtotal).toLocaleString('vi-VN')} VNĐ)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="booking-actions">
                {booking.status !== 'cancelled' && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleCancel(booking.id)}
                  >
                    Hủy đặt vé
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;

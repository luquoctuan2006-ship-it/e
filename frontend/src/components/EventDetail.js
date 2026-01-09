import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchEvent = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      await axios.post('http://localhost:5000/api/bookings', {
        event_id: id,
        quantity
      });
      alert('Đặt vé thành công!');
      fetchEvent(); // Refresh available tickets
    } catch (error) {
      alert(error.response?.data?.message || 'Đặt vé thất bại');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="event-container"><div className="text-center py-10">Đang tải...</div></div>;
  }

  if (!event) {
    return <div className="event-container"><div className="text-center py-10">Không tìm thấy sự kiện</div></div>;
  }

  return (
    <div className="event-container">
      <div className="event-detail-container">
        {event.image_url && (
          <img src={event.image_url} alt={event.title} className="event-detail-image" />
        )}
        <div className="event-detail-content">
          <h1 className="event-detail-title">{event.title}</h1>
          <p className="event-detail-description">{event.description}</p>
          <div className="event-detail-info-grid">
            <div className="event-detail-info">
              <p className="event-detail-info-label">Ngày sự kiện</p>
              <p className="event-detail-info-value">{new Date(event.event_date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="event-detail-info">
              <p className="event-detail-info-label">Địa điểm</p>
              <p className="event-detail-info-value">{event.location}</p>
            </div>
            <div className="event-detail-info">
              <p className="event-detail-info-label">Giá vé</p>
              <p className="event-detail-info-value event-detail-info-price">{event.price.toLocaleString('vi-VN')} VND</p>
            </div>
            <div className="event-detail-info">
              <p className="event-detail-info-label">Vé còn lại</p>
              <p className="event-detail-info-value">{event.available_tickets}/{event.total_tickets}</p>
            </div>
          </div>
          {user && event.available_tickets > 0 && (
            <div className="booking-section">
              <h2 className="booking-title">Đặt vé</h2>
              <div className="booking-form">
                <label className="text-sm font-medium">Số lượng:</label>
                <input
                  type="number"
                  min="1"
                  max={event.available_tickets}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="quantity-input"
                />
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className="booking-btn"
                >
                  {bookingLoading ? 'Đang xử lý...' : 'Đặt vé'}
                </button>
              </div>
              <p className="total-price">
                Tổng tiền: {(event.price * quantity).toLocaleString('vi-VN')} VND
              </p>
            </div>
          )}
          {!user && (
            <div className="login-prompt">
              <p className="login-prompt-text">Vui lòng đăng nhập để đặt vé</p>
              <button
                onClick={() => navigate('/login')}
                className="login-prompt-btn"
              >
                Đăng nhập
              </button>
            </div>
          )}
          {event.available_tickets === 0 && (
            <div className="no-tickets-message">
              Vé đã hết
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
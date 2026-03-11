import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/BookingPage.css';

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchEvent = async () => {
      try {
        const data = await eventsAPI.getById(id);
        if (!data || !data.event) {
          throw new Error('Không tìm thấy sự kiện');
        }
        setEvent(data.event);
      } catch (err) {
        setError(err.message || 'Lỗi khi tải sự kiện');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user, navigate]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setError('');

    // Validate
    if (quantity < 1) {
      setError('Số lượng vé phải lớn hơn 0');
      setBookingLoading(false);
      return;
    }

    if (event.available_tickets && quantity > event.available_tickets) {
      setError(`Chỉ còn ${event.available_tickets} vé`);
      setBookingLoading(false);
      return;
    }

    try {
      await bookingsAPI.create({
        event_id: id,
        quantity,
      });

      alert(' Đặt vé thành công!');
      navigate('/bookings');
    } catch (err) {
      setError(err.message || 'Đặt vé thất bại');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error && !event) return <div className="error-message">{error}</div>;
  if (!event) return <div className="error-message">Sự kiện không tồn tại</div>;

  const eventDate = new Date(event.event_date).toLocaleDateString('vi-VN');
  const eventPrice = Number(event.price || 0);
  const totalPrice = eventPrice * quantity;
  const isPastEvent = new Date(event.event_date) < new Date();
  const isSoldOut = event.available_tickets !== undefined && event.available_tickets <= 0;

  return (
    <div className="booking-page">
      <h1>Đặt vé sự kiện</h1>

      <div className="booking-container">
        <div className="event-summary">
          <h2>{event.title}</h2>
          <p><b>Ngày:</b> {eventDate}</p>
          <p><b>Giá:</b> {eventPrice.toLocaleString('vi-VN')} VNĐ</p>
          {event.available_tickets !== undefined && (
            <p><b>Vé còn lại:</b> {event.available_tickets}</p>
          )}
        </div>

        {isPastEvent && (
          <div className="error-message">Sự kiện đã kết thúc</div>
        )}

        {isSoldOut && (
          <div className="error-message">Sự kiện đã hết vé</div>
        )}

        {!isPastEvent && !isSoldOut && (
          <form onSubmit={handleBooking}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label>Số lượng vé</label>
              <input
                type="number"
                min="1"
                max={event.available_tickets || 999}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <p><b>Tổng tiền:</b> {totalPrice.toLocaleString('vi-VN')} VNĐ</p>

            <button type="submit" disabled={bookingLoading}>
              {bookingLoading ? 'Đang đặt vé...' : 'Đặt vé ngay'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
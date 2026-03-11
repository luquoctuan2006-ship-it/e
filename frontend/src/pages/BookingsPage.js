// pages/BookingsPage.js
import React, { useState, useEffect } from 'react';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/BookingsPage.css';

const BookingsPage = () => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      alert('đã hủy đặt vé');
      fetchBookings();
    } catch (err) {
      alert('Lỗi khi hủy đặt vé: ' + err.message);
    }
  };

  if (!isAuthenticated) {
    return <div className="error-message">Vui lòng đăng nhập</div>;
  }

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="bookings-page">
      <h1>vé của tôi</h1>
      {bookings.length === 0 ? (
        <div className="no-bookings">Bạn chưa đặt vé nào</div>
      ) : (
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Sự kiện</th>
                <th>Ngày đặt</th>
                <th>Số lượng</th>
                <th>Tổng cộng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.event_title}</td>
                  <td>{new Date(booking.booking_date).toLocaleDateString('vi-VN')}</td>
                  <td>{booking.quantity}</td>
                  <td>${booking.total_price}</td>
                  <td>
                    <span className={`status ${booking.status}`}>
                      {booking.status === 'confirmed' && 'Đã xác nhận'}
                      {booking.status === 'pending' && 'Chờ xử lý'}
                      {booking.status === 'cancelled' && 'Đã hủy'}
                    </span>
                  </td>
                  <td>
                    {booking.status !== 'cancelled' && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;

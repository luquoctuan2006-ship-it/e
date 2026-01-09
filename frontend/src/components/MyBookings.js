import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bookings/my-bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Bạn có chắc muốn hủy vé này?')) {
      try {
        await axios.put(`http://localhost:5000/api/bookings/${bookingId}/cancel`);
        alert('Hủy vé thành công');
        fetchBookings();
      } catch (error) {
        alert(error.response?.data?.message || 'Hủy vé thất bại');
      }
    }
  };

  if (!user) {
    return <div className="bookings-container"><div className="text-center py-10">Vui lòng đăng nhập để xem đặt vé của bạn</div></div>;
  }

  if (loading) {
    return <div className="bookings-container"><div className="text-center py-10">Đang tải...</div></div>;
  }

  return (
    <div className="bookings-container">
      <h1 className="bookings-title">Đặt vé của tôi</h1>
      {bookings.length === 0 ? (
        <div className="no-bookings-message">
          <p>Bạn chưa đặt vé nào</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-item">
              <div className="booking-item-content">
                <div className="booking-item-info">
                  <h2 className="booking-item-title">{booking.title}</h2>
                  <p className="booking-item-text">
                    Ngày sự kiện: {new Date(booking.event_date).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="booking-item-text">Địa điểm: {booking.location}</p>
                  <p className="booking-item-text">Số lượng: {booking.quantity}</p>
                  <p className="booking-item-price">
                    Tổng tiền: {booking.total_price.toLocaleString('vi-VN')} VND
                  </p>
                  <p className="booking-item-text" style={{marginTop: '0.5rem'}}>
                    Ngày đặt: {new Date(booking.booking_date).toLocaleDateString('vi-VN')}
                  </p>
                  <p className={`booking-item-status ${
                    booking.status === 'confirmed' ? 'booking-status-confirmed' :
                    booking.status === 'cancelled' ? 'booking-status-cancelled' : 'booking-status-pending'
                  }`}>
                    Trạng thái: {
                      booking.status === 'confirmed' ? 'Đã xác nhận' :
                      booking.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'
                    }
                  </p>
                </div>
                {booking.image_url && (
                  <img src={booking.image_url} alt={booking.title} className="booking-item-image" />
                )}
              </div>
              {booking.status === 'confirmed' && (
                <div style={{marginTop: '1rem'}}>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="cancel-booking-btn"
                  >
                    Hủy vé
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { organizerAPI } from '../services/api';
import '../styles/OrganizerBookingsPage.css';

const OrganizerBookingsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingBooking, setEditingBooking] = useState(null);
  const [seatInput, setSeatInput] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  const fetchOrganizerEvents = async () => {
    setLoading(true);
    try {
      const data = await organizerAPI.getMyEvents();
      setEvents(data.events || []);
    } catch (err) {
      setError('Không thể tải sự kiện');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventBookings = async (eventId) => {
    setLoading(true);
    setError('');
    try {
      const data = await organizerAPI.getEventBookings(eventId);
      setBookings(data.bookings || []);
    } catch (err) {
      setError('Không thể tải đặt vé cho sự kiện này');
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    fetchEventBookings(event.id);
  };

  const handleApproveBooking = async (booking) => {
    setEditingBooking(booking);
    setSeatInput('');
    setNotes(booking.notes || '');
  };

  const handleSaveApproval = async (bookingId) => {
    try {
      const seatsArray = seatInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      if (seatsArray.length !== editingBooking.quantity) {
        setError(`Vui lòng nhập đúng ${editingBooking.quantity} ghế`);
        return;
      }

      await organizerAPI.approveBooking(bookingId, {
        seats: seatsArray,
        notes: notes
      });

      alert('Đã chấp nhận đặt vé và gán ghế thành công!');
      setEditingBooking(null);
      fetchEventBookings(selectedEvent.id);
    } catch (err) {
      setError(err.message || 'Lỗi khi chấp nhận đặt vé');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc muốn từ chối đặt vé này?')) return;

    try {
      await organizerAPI.rejectBooking(bookingId);
      alert('Đã từ chối đặt vé');
      fetchEventBookings(selectedEvent.id);
    } catch (err) {
      setError(err.message || 'Lỗi khi từ chối đặt vé');
    }
  };

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return <div className="error-message">Bạn không có quyền truy cập trang này</div>;
  }

  return (
    <div className="organizer-bookings-page">
      <h1>Quản Lý Đặt Vé</h1>

      <div className="bookings-container">
        <div className="events-sidebar">
          <h2>Sự kiện của tôi</h2>
          {loading && !selectedEvent && <p className="loading">Đang tải...</p>}
          {events.length === 0 && !loading && (
            <p className="no-events">Bạn chưa có sự kiện nào</p>
          )}
          <div className="events-list">
            {events.map(event => (
              <div
                key={event.id}
                className={`event-item ${selectedEvent?.id === event.id ? 'active' : ''}`}
                onClick={() => handleSelectEvent(event)}
              >
                <h4>{event.title}</h4>
                <p className="event-date">
                  {new Date(event.event_date).toLocaleDateString('vi-VN')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bookings-main">
          {!selectedEvent ? (
            <div className="placeholder">
              <p>Chọn một sự kiện để xem và quản lý đặt vé</p>
            </div>
          ) : (
            <>
              <div className="event-header">
                <h2>{selectedEvent.title}</h2>
                <p>{new Date(selectedEvent.event_date).toLocaleDateString('vi-VN')}</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              {loading ? (
                <div className="loading">Đang tải đặt vé...</div>
              ) : bookings.length === 0 ? (
                <div className="no-bookings">Không có đặt vé nào cho sự kiện này</div>
              ) : (
                <div className="bookings-list">
                  {bookings.map(booking => (
                    <div key={booking.id} className="booking-item">
                      {editingBooking?.id === booking.id ? (
                        <div className="booking-edit-form">
                          <h4>Chấp nhận đặt vé - {booking.full_name}</h4>
                          
                          <div className="form-group">
                            <label>Ghế (cách nhau bằng dấu phẩy)</label>
                            <input
                              type="text"
                              value={seatInput}
                              onChange={(e) => setSeatInput(e.target.value)}
                              placeholder="Ví dụ: A1, A2, A3"
                              className="seat-input"
                            />
                            <small>Nhập {booking.quantity} ghế</small>
                          </div>

                          <div className="form-group">
                            <label>Ghi chú (tùy chọn)</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Ghi chú thêm..."
                              rows="3"
                            />
                          </div>

                          <div className="form-actions">
                            <button
                              className="cancel-btn"
                              onClick={() => setEditingBooking(null)}
                            >
                              Hủy
                            </button>
                            <button
                              className="save-btn"
                              onClick={() => handleSaveApproval(booking.id)}
                            >
                              Lưu & Chấp nhận
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="booking-header">
                            <div className="booking-user">
                              <h4>{booking.full_name}</h4>
                              <p className="email">{booking.email}</p>
                            </div>
                            <span className={`booking-status ${booking.status}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>

                          <div className="booking-info">
                            <div className="info-row">
                              <span className="label">Số vé:</span>
                              <span className="value">{booking.quantity}</span>
                            </div>
                            <div className="info-row">
                              <span className="label">Tổng tiền:</span>
                              <span className="value highlight">
                                {Number(booking.total_price).toLocaleString('vi-VN')} VNĐ
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="label">Ngày đặt:</span>
                              <span className="value">
                                {new Date(booking.booking_date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>

                          {booking.seats && (
                            <div className="booking-seats">
                              <strong>Ghế đã gán:</strong>
                              <div className="seats-display">
                                {Array.isArray(booking.seats)
                                  ? booking.seats.map((seat, idx) => (
                                      <span key={idx} className="seat">{seat}</span>
                                    ))
                                  : JSON.parse(booking.seats).map((seat, idx) => (
                                      <span key={idx} className="seat">{seat}</span>
                                    ))
                                }
                              </div>
                            </div>
                          )}

                          {booking.notes && (
                            <div className="booking-notes">
                              <strong>Ghi chú:</strong> {booking.notes}
                            </div>
                          )}

                          <div className="booking-actions">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  className="approve-btn"
                                  onClick={() => handleApproveBooking(booking)}
                                >
                                  Chấp nhận & Gán Ghế
                                </button>
                                <button
                                  className="reject-btn"
                                  onClick={() => handleRejectBooking(booking.id)}
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'approved':
      return '✓ Đã chấp nhận';
    case 'pending':
      return '⏳ Chờ xử lý';
    case 'cancelled':
      return '✕ Đã hủy';
    case 'confirmed':
      return 'Đã xác nhận';
    default:
      return status;
  }
};

export default OrganizerBookingsPage;

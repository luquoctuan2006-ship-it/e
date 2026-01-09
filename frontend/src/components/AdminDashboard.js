import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events'),
        axios.get('http://localhost:5000/api/bookings/all')
      ]);
      setEvents(eventsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Bạn có chắc muốn xóa sự kiện này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/events/${eventId}`);
        alert('Xóa sự kiện thành công');
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || 'Xóa sự kiện thất bại');
      }
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-container"><div className="text-center py-10">Bạn không có quyền truy cập trang này</div></div>;
  }

  if (loading) {
    return <div className="admin-container"><div className="text-center py-10">Đang tải...</div></div>;
  }

  return (
    <div className="admin-container">
      <h1 className="admin-title">Quản lý Admin</h1>
      
      <div style={{marginBottom: '1.5rem'}}>
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab('events')}
            className={`tab-btn ${activeTab === 'events' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          >
            Quản lý sự kiện
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`tab-btn ${activeTab === 'bookings' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          >
            Quản lý đặt vé
          </button>
        </div>
      </div>

      {activeTab === 'events' && (
        <div>
          <h2 className="table-title">Danh sách sự kiện</h2>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr className="bg-gray-50">
                  <th>Tên sự kiện</th>
                  <th>Ngày</th>
                  <th>Địa điểm</th>
                  <th>Vé còn lại</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{new Date(event.event_date).toLocaleDateString('vi-VN')}</td>
                    <td>{event.location}</td>
                    <td>{event.available_tickets}/{event.total_tickets}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="delete-btn"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <h2 className="table-title">Danh sách đặt vé</h2>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr className="bg-gray-50">
                  <th>Người dùng</th>
                  <th>Sự kiện</th>
                  <th>Số lượng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.username}</td>
                    <td>{booking.title}</td>
                    <td>{booking.quantity}</td>
                    <td>{booking.total_price.toLocaleString('vi-VN')} VND</td>
                    <td>
                      <span className={`status-badge ${
                        booking.status === 'confirmed' ? 'status-confirmed' :
                        booking.status === 'cancelled' ? 'status-cancelled' : 'status-pending'
                      }`}>
                        {booking.status === 'confirmed' ? 'Đã xác nhận' :
                         booking.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
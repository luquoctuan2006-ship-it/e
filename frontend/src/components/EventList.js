import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="event-container"><div className="text-center py-10">Đang tải...</div></div>;
  }

  return (
    <div className="event-container">
      <h1 className="event-title">Danh sách sự kiện</h1>
      <div className="event-grid">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="event-card-image" />
            )}
            <div className="event-card-content">
              <h2 className="event-card-title">{event.title}</h2>
              <p className="event-card-description">{event.description.substring(0, 100)}...</p>
              <p className="event-card-date">
                Ngày: {new Date(event.event_date).toLocaleDateString('vi-VN')}
              </p>
              <p className="event-card-location">Địa điểm: {event.location}</p>
              <p className="event-card-price">
                Giá: {event.price.toLocaleString('vi-VN')} VND
              </p>
              <p className="event-card-tickets">
                Vé còn lại: {event.available_tickets}/{event.total_tickets}
              </p>
              <Link
                to={`/events/${event.id}`}
                className="event-detail-btn"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventList;
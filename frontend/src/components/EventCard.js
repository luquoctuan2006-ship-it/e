import '../styles/EventCard.css';

const EventCard = ({ event, onClick }) => {
  const eventDate = new Date(event.event_date).toLocaleDateString('vi-VN');
  const availableSeats = event.capacity - (event.total_bookings || 0);
  const imageUrl = event.image_url || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <div className="event-card" onClick={onClick}>
      <div className="event-card-image">
        <img src={imageUrl} alt={event.title} />
      </div>
      <div className="event-card-header">
        <span className="category-badge">{event.category_name}</span>
        <span className={`seats-badge ${availableSeats > 10 ? 'available' : 'limited'}`}>
          {availableSeats} chỗ
        </span>
      </div>
      <div className="event-card-body">
        <h3>{event.title}</h3>
        <p className="description">{event.description?.substring(0, 80)}...</p>
        <div className="event-details">
          <span> {eventDate}</span>
          <span> {event.city}</span>
        </div>
        <div className="event-venue">
          <small>Địa điểm: {event.venue_name}</small>
        </div>
      </div>
      <div className="event-card-footer">
        <span className="price">${event.price}</span>
        <button className="btn-details">Xem chi tiết</button>
      </div>
    </div>
  );
};

export default EventCard;

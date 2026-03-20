const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 204) {
    return {};
  }
  const contentType = response.headers.get('content-type');
  
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      data
    });

    const errorMessage = data.error?.message || 
                        data.message || 
                        `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
};

export const organizerAPI = {

  createEvent: (eventData) =>
    apiCall('/events/organizer/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }),
  
 
  getMyEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/events/organizer/my-events?${query}`);
  },

  getEventDetails: (id) => apiCall(`/events/organizer/details/${id}`),

  updateEvent: (id, eventData) =>
    apiCall(`/events/organizer/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    }),
 
  getVenues: () => apiCall('/events/venues/list'),
  
  getCategories: () => apiCall('/events/categories/list'),

  getEventBookings: (eventId) =>
    apiCall(`/bookings/organizer/event/${eventId}`),

  approveBooking: (bookingId, approvalData) =>
    apiCall(`/bookings/${bookingId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(approvalData),
    }),

  rejectBooking: (bookingId) =>
    apiCall(`/bookings/${bookingId}/reject`, {
      method: 'PUT',
    }),
};

export const authAPI = {
  register: (userData) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  login: (credentials) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  verifyToken: () => apiCall('/auth/verify'),
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export const eventsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/events?${query}`);
  },
  getById: (id) => apiCall(`/events/${id}`),
  create: (eventData) =>
    apiCall('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),
  update: (id, eventData) =>
    apiCall(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    }),
  delete: (id) =>
    apiCall(`/events/${id}`, {
      method: 'DELETE',
    }),
  getTicketTypes: (eventId) =>
    apiCall(`/events/${eventId}/ticket-types`),
  createTicketType: (eventId, ticketData) =>
    apiCall(`/events/${eventId}/ticket-types`, {
      method: 'POST',
      body: JSON.stringify(ticketData),
    }),
};

export const bookingsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/bookings?${query}`);
  },
  getMyBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/bookings/my-bookings?${query}`);
  },
  getById: (id) => apiCall(`/bookings/${id}`),
  create: (bookingData) =>
    apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),
  cancel: (id) =>
    apiCall(`/bookings/${id}/cancel`, {
      method: 'PUT',
    }),
};

export const venuesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/venues?${query}`);
  },
  getById: (id) => apiCall(`/venues/${id}`),
};

export const categoriesAPI = {
  getAll: () => apiCall('/categories'),
};

export const usersAPI = {
  getProfile: () => apiCall('/users/profile'),
  updateProfile: (userData) =>
    apiCall('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
};

export const contactAPI = {
  send: (data) =>
    apiCall('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMine: () => apiCall('/contacts/me'),
};

export const adminAPI = {
  getContacts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/contacts?${query}`);
  },
  respondContact: (id, response) =>
    apiCall(`/admin/contacts/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    }),
};

export const debugAPI = {

  testCreateEvent: async () => {
    const testData = {
      title: "TEST EVENT DEBUG",
      description: "This is a test event for debugging",
      event_date: "2026-03-07 19:00:00",
      venue_id: 2,
      category_id: 1,
      organizer_id: 4,
      total_tickets: 100,
      price: 500000,
      image_url: ""
    };
    
    console.log('=== TESTING API ===');
    console.log('Sending test data:', testData);
    
    try {
      const response = await organizerAPI.createEvent(testData);
      console.log('API Response:', response);
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  testGetVenues: async () => {
    try {
      const response = await organizerAPI.getVenues();
      console.log(' Venues:', response);
      return response;
    } catch (error) {
      console.error(' Get Venues Error:', error);
      return { venues: [] };
    }
  },
  

  testGetCategories: async () => {
    try {
      const response = await organizerAPI.getCategories();
      console.log('✅ Categories:', response);
      return response;
    } catch (error) {
      console.error('❌ Get Categories Error:', error);
      return { categories: [] };
    }
  }
};

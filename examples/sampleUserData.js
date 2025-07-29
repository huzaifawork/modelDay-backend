/**
 * Sample user data for testing the ContextService
 * This demonstrates the expected data structure for the ModelDay backend
 */

export const sampleUserData = {
  userProfile: {
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1-555-0123",
    displayName: "Sarah J."
  },
  
  jobs: [
    {
      id: "job1",
      clientName: "Fashion Forward Magazine",
      type: "Editorial",
      date: "2025-08-15",
      time: "09:00",
      location: "New York, NY",
      rate: 2500,
      currency: "USD",
      status: "Confirmed",
      paymentStatus: "Pending",
      notes: "Bring black heels and minimal jewelry"
    },
    {
      id: "job2",
      clientName: "Luxury Brand Co",
      type: "Commercial",
      date: "2025-07-25",
      time: "14:00",
      location: "Los Angeles, CA",
      rate: 5000,
      currency: "USD",
      status: "Completed",
      paymentStatus: "Paid",
      notes: "Product shoot for new fragrance line"
    },
    {
      id: "job3",
      clientName: "Designer Boutique",
      type: "Runway",
      date: "2025-09-10",
      time: "18:00",
      location: "Milan, Italy",
      rate: 3000,
      currency: "EUR",
      status: "Confirmed",
      paymentStatus: "Pending",
      notes: "Fashion Week show - rehearsal at 16:00"
    }
  ],

  events: [
    {
      id: "event1",
      type: "casting",
      clientName: "Elite Modeling Agency",
      date: "2025-08-05",
      startTime: "10:00",
      location: "Manhattan, NY",
      dayRate: 500,
      currency: "USD",
      notes: "Bring portfolio and comp cards"
    },
    {
      id: "event2",
      type: "fitting",
      clientName: "Designer Studio",
      date: "2025-08-12",
      startTime: "15:30",
      location: "Brooklyn, NY",
      dayRate: 300,
      currency: "USD",
      notes: "Final fitting for upcoming shoot"
    }
  ],

  aiJobs: [
    {
      id: "ai1",
      clientName: "Tech Fashion Co",
      type: "AI Model Training",
      date: "2025-08-20",
      rate: 1500,
      currency: "USD",
      status: "In Progress",
      paymentStatus: "Pending",
      location: "Remote"
    }
  ],

  agencies: [
    {
      id: "agency1",
      name: "Elite Model Management",
      city: "New York",
      country: "USA",
      commissionRate: 20
    },
    {
      id: "agency2",
      name: "IMG Models",
      city: "Los Angeles",
      country: "USA",
      commissionRate: 20
    }
  ],

  agents: [
    {
      id: "agent1",
      name: "Michael Rodriguez",
      email: "michael@elitemodels.com",
      phone: "+1-555-0456",
      city: "New York",
      country: "USA"
    },
    {
      id: "agent2",
      name: "Lisa Chen",
      email: "lisa@imgmodels.com",
      phone: "+1-555-0789",
      city: "Los Angeles",
      country: "USA"
    }
  ],

  meetings: [
    {
      id: "meeting1",
      clientName: "Fashion Brand X",
      date: "2025-08-08",
      time: "11:00",
      location: "Midtown Manhattan"
    },
    {
      id: "meeting2",
      clientName: "Photographer Studio",
      date: "2025-08-18",
      time: "14:00",
      location: "SoHo, NY"
    }
  ],

  onStays: [
    {
      id: "stay1",
      locationName: "Hotel Milano",
      checkInDate: "2025-09-09",
      checkOutDate: "2025-09-12",
      cost: 450,
      currency: "EUR"
    }
  ],

  shootings: [
    {
      id: "shooting1",
      clientName: "Beauty Brand",
      date: "2025-08-25",
      location: "Studio City, CA",
      rate: 2000,
      currency: "USD"
    },
    {
      id: "shooting2",
      clientName: "Fashion Magazine",
      date: "2025-09-05",
      location: "Paris, France",
      rate: 3500,
      currency: "EUR"
    }
  ]
};

// Example of empty user data (for testing context limitations)
export const emptyUserData = {
  userProfile: {
    name: "John Doe",
    email: "john.doe@email.com"
  },
  jobs: [],
  events: [],
  aiJobs: [],
  agencies: [],
  agents: [],
  meetings: [],
  onStays: [],
  shootings: []
};

// Example API request body for testing
export const sampleChatRequest = {
  message: "Can you analyze my upcoming bookings and give me insights about my career progress?",
  conversation: [
    {
      role: "user",
      content: "Hello, I'm a model using ModelDay"
    },
    {
      role: "assistant", 
      content: "Hello! I'm ModelDay AI, your personal assistant for managing your modeling career. How can I help you today?"
    }
  ],
  userData: sampleUserData
};

// Example API request without user data (testing limitations)
export const limitedChatRequest = {
  message: "Can you analyze my upcoming bookings?",
  conversation: [],
  userData: null // or emptyUserData
};

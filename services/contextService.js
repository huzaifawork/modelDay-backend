/**
 * Context Service for ModelDay Backend
 * Builds comprehensive user context for OpenAI similar to the Flutter version
 */

class ContextService {
  /**
   * Build comprehensive user context for OpenAI (similar to Dart version)
   * @param {Object} userData - User data object containing all user information
   * @returns {string} Formatted context string for OpenAI
   */
  static buildUserContext(userData = {}) {
    try {
      console.log('🤖 ContextService.buildUserContext() - Building comprehensive user context...');

      // Handle null or undefined userData
      const safeUserData = userData || {};

      const {
        userProfile = {},
        jobs = [],
        events = [],
        aiJobs = [],
        agencies = [],
        agents = [],
        meetings = [],
        onStays = [],
        shootings = []
      } = safeUserData;

      // Build context sections
      const userProfileSection = this._buildUserProfileSection(userProfile);
      const jobsSection = this._buildJobsSection(jobs);
      const eventsSection = this._buildEventsSection(events);
      const aiJobsSection = this._buildAiJobsSection(aiJobs);
      const agenciesSection = this._buildAgenciesSection(agencies);
      const agentsSection = this._buildAgentsSection(agents);
      const meetingsSection = this._buildMeetingsSection(meetings);
      const onStaysSection = this._buildOnStaysSection(onStays);
      const shootingsSection = this._buildShootingsSection(shootings);

      // Calculate statistics
      const statistics = this._calculateStatistics(jobs, events);
      const calendarSummary = this._getCalendarSummary(jobs, events, meetings);

      // Build comprehensive context in format similar to Dart version
      const context = `
You are an AI assistant for a modeling professional using Model Day. You have access to ONLY their data and can help analyze it and provide insights.

CURRENT USER DATA CONTEXT:
${userProfileSection}

JOBS DATA:
${jobsSection}

EVENTS DATA:
${eventsSection}

AI JOBS DATA:
${aiJobsSection}

AGENCIES DATA:
${agenciesSection}

AGENTS DATA:
${agentsSection}

MEETINGS DATA:
${meetingsSection}

ON STAYS DATA:
${onStaysSection}

SHOOTINGS DATA:
${shootingsSection}

STATISTICS:
${statistics}

UPCOMING CALENDAR (Next 10 Events):
${calendarSummary}

Current Date: ${this._formatDisplayDate(new Date())}
Current Time: ${this._formatTime(new Date())}

Provide helpful, professional responses based on the actual data. Consider:
1. Financial insights: Total earnings, booking rates, job trends
2. Calendar management: Upcoming events, schedule conflicts, busy periods
3. Career development: Patterns in castings, successful job types, agent relationships
4. Network analysis: Industry contacts, agency relationships
5. Activity trends: Monthly or seasonal patterns in bookings and events

If calculating totals or analyzing trends, show actual numbers. If asked about something not in the data, let them know politely. Maintain a friendly, professional tone.
`;

      console.log('🤖 ContextService.buildUserContext() - Comprehensive context built successfully');
      return context;
    } catch (error) {
      console.error('❌ ContextService.buildUserContext() - Error:', error);
      return 'Error gathering user data. Please try again.';
    }
  }

  /**
   * Build user profile section
   * @param {Object} userProfile - User profile data
   * @returns {string} Formatted user profile section
   */
  static _buildUserProfileSection(userProfile) {
    if (!userProfile || Object.keys(userProfile).length === 0) {
      return 'USER PROFILE: Profile not found.';
    }

    let section = 'USER PROFILE:\n';
    section += `- Name: ${userProfile.name || 'Not specified'}\n`;
    section += `- Email: ${userProfile.email || 'Not specified'}\n`;
    
    if (userProfile.phone) {
      section += `- Phone: ${userProfile.phone}\n`;
    }
    
    if (userProfile.displayName) {
      section += `- Display Name: ${userProfile.displayName}\n`;
    }
    
    section += '\n';
    return section;
  }

  /**
   * Build jobs section with comprehensive data
   * @param {Array} jobs - Array of job objects
   * @returns {string} Formatted jobs section
   */
  static _buildJobsSection(jobs) {
    if (!jobs || jobs.length === 0) {
      return 'JOBS: No jobs found.';
    }

    let section = `JOBS (${jobs.length} total):\n`;
    
    // Calculate totals
    let totalEarnings = 0;
    let upcomingJobs = 0;
    let completedJobs = 0;
    const now = new Date();

    jobs.forEach(job => {
      if (job.rate) {
        totalEarnings += parseFloat(job.rate) || 0;
      }

      try {
        if (job.date) {
          const jobDate = new Date(job.date);
          if (jobDate > now) {
            upcomingJobs++;
          } else {
            completedJobs++;
          }
        }
      } catch (e) {
        // Skip invalid dates
      }

      const dateStr = this._formatJobDate(job.date);
      section += `- ${dateStr}: ${job.clientName || 'Unknown Client'} (${job.type || 'Job'})\n`;
      section += `  Rate: ${job.rate || 'TBD'} ${job.currency || 'USD'} | Status: ${job.status || 'Unknown'} | Payment: ${job.paymentStatus || 'Unknown'}\n`;
      section += `  Location: ${job.location || 'TBD'}\n`;
      
      if (job.notes) {
        section += `  Notes: ${job.notes}\n`;
      }
      
      section += '\n';
    });

    section += 'SUMMARY:\n';
    section += `- Total Earnings: $${totalEarnings.toFixed(2)} USD\n`;
    section += `- Upcoming Jobs: ${upcomingJobs}\n`;
    section += `- Completed Jobs: ${completedJobs}\n`;

    return section;
  }

  /**
   * Build events section
   * @param {Array} events - Array of event objects
   * @returns {string} Formatted events section
   */
  static _buildEventsSection(events) {
    if (!events || events.length === 0) {
      return 'EVENTS: No events found.';
    }

    let section = `EVENTS (${events.length} total):\n`;
    
    // Limit to 20 most recent events
    const limitedEvents = events.slice(0, 20);
    
    limitedEvents.forEach(event => {
      const dateStr = this._formatJobDate(event.date);
      const timeStr = event.startTime || 'Time TBD';
      const location = event.location || 'Location TBD';
      const eventType = event.type ? event.type.toString().toUpperCase() : 'EVENT';

      section += `- ${dateStr} at ${timeStr}: ${eventType}\n`;
      section += `  Client: ${event.clientName || 'Unknown Client'}\n`;
      section += `  Location: ${location}\n`;
      
      if (event.dayRate) {
        section += `  Day Rate: ${event.dayRate} ${event.currency || 'USD'}\n`;
      }
      
      if (event.notes) {
        section += `  Notes: ${event.notes}\n`;
      }
      
      section += '\n';
    });

    return section;
  }

  /**
   * Build AI jobs section
   * @param {Array} aiJobs - Array of AI job objects
   * @returns {string} Formatted AI jobs section
   */
  static _buildAiJobsSection(aiJobs) {
    if (!aiJobs || aiJobs.length === 0) {
      return 'AI JOBS: No AI jobs found.';
    }

    let section = 'AI JOBS:\n';
    
    // Limit to 5 most recent
    const limitedJobs = aiJobs.slice(0, 5);
    
    limitedJobs.forEach(job => {
      const dateStr = this._formatJobDate(job.date);
      const rate = job.rate ? `${job.rate} ${job.currency || 'USD'}` : 'Rate TBD';
      
      section += `- ${dateStr}: ${job.clientName || 'Unknown Client'} (${job.type || 'AI Job'})\n`;
      section += `  Rate: ${rate} | Status: ${job.status || 'Unknown'} | Payment: ${job.paymentStatus || 'Unknown'}\n`;
      
      if (job.location) {
        section += `  Location: ${job.location}\n`;
      }
      
      section += '\n';
    });

    return section;
  }

  /**
   * Build agencies section
   * @param {Array} agencies - Array of agency objects
   * @returns {string} Formatted agencies section
   */
  static _buildAgenciesSection(agencies) {
    if (!agencies || agencies.length === 0) {
      return 'AGENCIES: No agencies found.';
    }

    let section = `AGENCIES (${agencies.length} total):\n`;
    
    agencies.forEach(agency => {
      section += `- ${agency.name || 'Unknown Agency'}\n`;
      
      if (agency.city) {
        section += `  Location: ${agency.city}${agency.country ? `, ${agency.country}` : ''}\n`;
      }
      
      if (agency.commissionRate && agency.commissionRate > 0) {
        section += `  Commission Rate: ${agency.commissionRate}%\n`;
      }
      
      section += '\n';
    });

    return section;
  }

  /**
   * Build agents section
   * @param {Array} agents - Array of agent objects
   * @returns {string} Formatted agents section
   */
  static _buildAgentsSection(agents) {
    if (!agents || agents.length === 0) {
      return 'AGENTS: No agents found.';
    }

    let section = `AGENTS (${agents.length} total):\n`;
    
    agents.forEach(agent => {
      section += `- ${agent.name || 'Unknown Agent'}\n`;
      
      if (agent.email) {
        section += `  Email: ${agent.email}\n`;
      }
      
      if (agent.phone) {
        section += `  Phone: ${agent.phone}\n`;
      }
      
      if (agent.city) {
        section += `  Location: ${agent.city}${agent.country ? `, ${agent.country}` : ''}\n`;
      }
      
      section += '\n';
    });

    return section;
  }

  /**
   * Build meetings section
   * @param {Array} meetings - Array of meeting objects
   * @returns {string} Formatted meetings section
   */
  static _buildMeetingsSection(meetings) {
    if (!meetings || meetings.length === 0) {
      return 'MEETINGS: No meetings found.';
    }

    let section = `MEETINGS (${meetings.length} total):\n`;

    // Limit to 10 meetings
    const limitedMeetings = meetings.slice(0, 10);

    limitedMeetings.forEach(meeting => {
      const dateStr = this._formatJobDate(meeting.date);
      section += `- ${dateStr}: ${meeting.clientName || 'Unknown Client'}\n`;

      if (meeting.time) {
        section += `  Time: ${meeting.time}\n`;
      }

      if (meeting.location) {
        section += `  Location: ${meeting.location}\n`;
      }

      section += '\n';
    });

    return section;
  }

  /**
   * Build on stays section
   * @param {Array} onStays - Array of stay objects
   * @returns {string} Formatted on stays section
   */
  static _buildOnStaysSection(onStays) {
    if (!onStays || onStays.length === 0) {
      return 'ON STAYS: No stays found.';
    }

    let section = `ON STAYS (${onStays.length} total):\n`;

    // Limit to 10 stays
    const limitedStays = onStays.slice(0, 10);

    limitedStays.forEach(stay => {
      section += `- ${stay.locationName || 'Unknown Location'}\n`;

      if (stay.checkInDate) {
        section += `  Check-in: ${this._formatDisplayDate(new Date(stay.checkInDate))}\n`;
      }

      if (stay.checkOutDate) {
        section += `  Check-out: ${this._formatDisplayDate(new Date(stay.checkOutDate))}\n`;
      }

      section += `  Cost: ${stay.cost || 'TBD'} ${stay.currency || 'USD'}\n`;
      section += '\n';
    });

    return section;
  }

  /**
   * Build shootings section
   * @param {Array} shootings - Array of shooting objects
   * @returns {string} Formatted shootings section
   */
  static _buildShootingsSection(shootings) {
    if (!shootings || shootings.length === 0) {
      return 'SHOOTINGS: No shootings found.';
    }

    let section = `SHOOTINGS (${shootings.length} total):\n`;

    // Limit to 10 shootings
    const limitedShootings = shootings.slice(0, 10);

    limitedShootings.forEach(shooting => {
      const dateStr = this._formatJobDate(shooting.date);
      section += `- ${dateStr}: ${shooting.clientName || 'Unknown Client'}\n`;

      if (shooting.location) {
        section += `  Location: ${shooting.location}\n`;
      }

      if (shooting.rate) {
        section += `  Rate: ${shooting.rate} ${shooting.currency || 'USD'}\n`;
      }

      section += '\n';
    });

    return section;
  }

  /**
   * Calculate comprehensive statistics (like Dart version)
   * @param {Array} jobs - Array of job objects
   * @param {Array} events - Array of event objects
   * @returns {string} Formatted statistics section
   */
  static _calculateStatistics(jobs = [], events = []) {
    try {
      // Calculate financial statistics
      let totalIncome = 0;
      let upcomingJobs = 0;
      let completedJobs = 0;
      const now = new Date();

      jobs.forEach(job => {
        if (job.rate) {
          totalIncome += parseFloat(job.rate) || 0;
        }

        try {
          if (job.date) {
            const jobDate = new Date(job.date);
            if (jobDate > now) {
              upcomingJobs++;
            } else {
              completedJobs++;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      });

      // Calculate events by month for trends
      const eventsByMonth = {};
      const allEvents = [...jobs, ...events];

      allEvents.forEach(event => {
        let dateStr = null;
        if (event.date) {
          dateStr = event.date;
        }

        if (dateStr) {
          try {
            const date = new Date(dateStr);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            eventsByMonth[monthKey] = (eventsByMonth[monthKey] || 0) + 1;
          } catch (e) {
            // Skip invalid dates
          }
        }
      });

      let section = 'STATISTICS:\n';
      section += `- Total Income: $${totalIncome.toFixed(2)} USD\n`;
      section += `- Total Jobs: ${jobs.length}\n`;
      section += `- Upcoming Jobs: ${upcomingJobs}\n`;
      section += `- Completed Jobs: ${completedJobs}\n`;
      section += `- Total Events: ${events.length}\n`;

      if (Object.keys(eventsByMonth).length > 0) {
        section += '- Activity by Month:\n';
        const sortedMonths = Object.keys(eventsByMonth).sort();
        // Last 6 months
        sortedMonths.slice(-6).forEach(month => {
          section += `  ${month}: ${eventsByMonth[month]} events\n`;
        });
      }

      return section;
    } catch (error) {
      console.error('❌ Error calculating statistics:', error);
      return 'STATISTICS: Error calculating statistics.';
    }
  }

  /**
   * Get calendar summary with upcoming events (like Dart version)
   * @param {Array} jobs - Array of job objects
   * @param {Array} events - Array of event objects
   * @param {Array} meetings - Array of meeting objects
   * @returns {string} Formatted calendar summary
   */
  static _getCalendarSummary(jobs = [], events = [], meetings = []) {
    try {
      const upcomingEvents = [];
      const now = new Date();

      // Add jobs
      jobs.forEach(job => {
        try {
          if (job.date) {
            const jobDate = new Date(job.date);
            if (jobDate > now) {
              upcomingEvents.push({
                type: 'job',
                title: job.clientName || 'Unknown Client',
                date: jobDate,
                time: job.time || '',
                location: job.location || ''
              });
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      });

      // Add events
      events.forEach(event => {
        try {
          if (event.date) {
            const eventDate = new Date(event.date);
            if (eventDate > now) {
              upcomingEvents.push({
                type: event.type ? event.type.toString().split('.').pop() : 'event',
                title: event.clientName || 'Event',
                date: eventDate,
                time: event.startTime || '',
                location: event.location || ''
              });
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      });

      // Add meetings
      meetings.forEach(meeting => {
        try {
          if (meeting.date) {
            const meetingDate = new Date(meeting.date);
            if (meetingDate > now) {
              upcomingEvents.push({
                type: 'meeting',
                title: meeting.clientName || 'Unknown Client',
                date: meetingDate,
                time: meeting.time || '',
                location: meeting.location || ''
              });
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      });

      // Sort by date and take top 10
      upcomingEvents.sort((a, b) => a.date - b.date);
      const topEvents = upcomingEvents.slice(0, 10);

      if (topEvents.length === 0) {
        return 'UPCOMING CALENDAR: No upcoming events scheduled.';
      }

      let section = `UPCOMING CALENDAR (Next ${topEvents.length} Events):\n`;
      topEvents.forEach(event => {
        const dateStr = this._formatDisplayDate(event.date);
        const timeStr = event.time;
        const location = event.location;

        section += `- ${dateStr}${timeStr ? ` at ${timeStr}` : ''}: ${event.type.toUpperCase()} - ${event.title}\n`;
        if (location) {
          section += `  Location: ${location}\n`;
        }
        section += '\n';
      });

      return section;
    } catch (error) {
      console.error('❌ Error getting calendar summary:', error);
      return 'UPCOMING CALENDAR: Error loading calendar data.';
    }
  }

  /**
   * Format date for display (like Dart version)
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  static _formatDisplayDate(date) {
    if (!date || !(date instanceof Date)) {
      return 'Date TBD';
    }

    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format time for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted time string
   */
  static _formatTime(date) {
    if (!date || !(date instanceof Date)) {
      return 'Time TBD';
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Format job date (handles string dates)
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date string
   */
  static _formatJobDate(date) {
    if (!date) {
      return 'Date TBD';
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return this._formatDisplayDate(dateObj);
    } catch (e) {
      return typeof date === 'string' ? date : 'Date TBD';
    }
  }
}

export default ContextService;

# Event Booking Platform 📚

<img width="4032" height="3940" alt="image" src="https://github.com/user-attachments/assets/36c834ff-0c3b-4a73-bbcc-9dd8c910ff22" />

A modern web application for managing Event events and ticket bookings, built with Node.js, Express, and SQLite.

## 🌟 Features

### User Management
- **User Authentication**: Secure login system with session management
- **Role-based Access**: Admin and visitor roles with different permissions
- **User Registration**: New user sign-up functionality

### Event Management
- **Event Creation**: Admins can create and manage Event events
- **Ticket Types**: Support for General and VIP ticket categories
- **Inventory Tracking**: Real-time availability monitoring
- **Publication Control**: Draft and published event states

### Booking System
- **Interactive Booking**: User-friendly event booking interface
- **Real-time Updates**: Live ticket availability and pricing
- **Booking History**: Track user bookings and status
- **Payment Integration**: Support for multiple payment methods

### Administrative Features
- **Admin Dashboard**: Comprehensive management interface
- **Event Analytics**: Booking statistics and reporting
- **User Management**: Admin user oversight capabilities
- **Invoice Generation**: Automated billing and invoicing

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js framework
- **Database**: SQLite3 with foreign key constraints
- **Template Engine**: EJS for server-side rendering
- **Styling**: Tailwind CSS for modern UI design
- **Session Management**: Express-session for user authentication
- **Build Tools**: PostCSS for CSS processing

## 📋 Prerequisites

- **Node.js** >= 16.0.0 - [Download here](https://nodejs.org/en/)
- **npm** >= 8.0.0 (comes with Node.js)
- **SQLite3** - [Installation guide](https://www.tutorialspoint.com/sqlite/sqlite_installation.htm)
  - Note: Latest versions of macOS and Linux come with SQLite pre-installed

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yrishe/Booking-Page-Uni-Proj.git
   cd Booking-Page-Uni-Proj
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   
   **On macOS/Linux:**
   ```bash
   npm run build-db
   ```
   
   **On Windows:**
   ```bash
   npm run build-db-win
   ```

4. **Build CSS assets**
   ```bash
   npm run build:css
   ```

5. **Start the application**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## 🎯 Usage

### Test Routes
After installation, test the app by browsing to:
- `http://localhost:3000` - Homepage with event listings
- `http://localhost:3000/users/list-users` - User management (admin)
- `http://localhost:3000/users/add-user` - Add new users (admin)
- `http://localhost:3000/products/customer-checkout/1` - Event booking page

### For Visitors
1. **Browse Events**: View available Event events on the homepage
2. **Sign Up/Login**: Create an account or sign in to book tickets
3. **Book Tickets**: Select events and book General or VIP tickets
4. **Manage Bookings**: View booking history and status

### For Administrators
1. **Admin Login**: Access admin dashboard with admin credentials
2. **Create Events**: Add new Event events with ticket allocation
3. **Manage Users**: Oversee user accounts and permissions
4. **View Analytics**: Monitor booking statistics and revenue
5. **Process Payments**: Handle payment processing and invoicing

## 📁 Project Structure

```
├── index.js                 # Main application entry point
├── package.json             # Project dependencies and scripts
├── db_schema.sql           # Database schema definition
├── routes/
│   ├── products.js         # Event and booking routes
│   └── users.js            # User authentication routes
├── views/                  # EJS templates
│   ├── home.ejs           # Homepage
│   ├── customer-checkout.ejs # Booking interface
│   ├── admin-home.ejs     # Admin dashboard
│   ├── sign-in.ejs        # Login page
│   ├── sign-up.ejs        # Registration page
│   └── error.ejs          # Error handling
├── public/                 # Static assets
│   ├── styles.css         # Main stylesheet
│   └── build/             # Compiled CSS
└── utils/
    └── paymentProcessor.js # Payment handling utilities
```

## 🗄️ Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts with role-based access (admin/visitor)
- **ticket**: Event information and ticket inventory
- **booked_tickets**: Booking records and status tracking
- **payments**: Payment processing and transaction history
- **invoices**: Billing and invoice management
- **interfaces**: UI interface definitions
- **user_interfaces**: User-interface relationship mapping

### Database Management

**Reset database (fresh start):**

*macOS/Linux:*
```bash
npm run clean-db
npm run build-db
```

*Windows:*
```bash
npm run clean-db-win
npm run build-db-win
```

## 🔧 Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload (nodemon)
- `npm run build:css` - Build CSS assets with PostCSS
- `npm run watch:css` - Watch and rebuild CSS on changes
- `npm run build-db` - Initialize database from schema (macOS/Linux)
- `npm run build-db-win` - Initialize database from schema (Windows)
- `npm run clean-db` - Remove existing database (macOS/Linux)
- `npm run clean-db-win` - Remove existing database (Windows)

### Environment Variables

- `PORT` - Server port (default: 3000)
- `SESSION_SECRET` - Session encryption key (change in production)

## 🔒 Security Features

- Session-based authentication with secure cookies
- Role-based access control (admin/visitor)
- SQL injection protection with parameterized queries
- Input validation and sanitization
- CSRF protection through session management
- Foreign key constraints for data integrity

## 🚀 Deployment

### Preparing for Submission

1. **Create a copy of your project folder**
2. **Delete the following files/folders from the copy:**
   - `node_modules/`
   - `.git/` (hidden git repository folder)
   - `database.db` (your database file)

3. **Ensure `package.json` includes all dependencies**
   - Use `--save` flag when installing packages: `npm install <package> --save`

### Production Deployment

1. Set environment variables for production
2. Use a process manager like PM2 for production deployment
3. Configure reverse proxy (nginx) for better performance
4. Set up SSL/TLS certificates for HTTPS
5. Use a production-grade database for larger deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

1. **Database not found**: Run `npm run build-db` to create the database
2. **Port already in use**: Change the port in `index.js` or set `PORT` environment variable
3. **CSS not loading**: Run `npm run build:css` to compile Tailwind CSS
4. **Session issues**: Clear browser cookies and restart the server

### Database Issues

- **All database tables should be created by modifying `db_schema.sql`**
- **Do NOT create or alter database tables through other means**
- This ensures database consistency and allows easy recreation

## 🔮 Future Enhancements

- [ ] Email notifications for bookings
- [ ] Advanced analytics dashboard
- [ ] Mobile app integration
- [ ] Multi-language support
- [ ] Calendar integration
- [ ] Automated refund processing
- [ ] Real-time notifications
- [ ] Advanced reporting features

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [EJS Template Engine](https://ejs.co/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

*Built with ❤️ for Event communities*


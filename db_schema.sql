
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL UNIQUE,
    password CHAR(7) NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'visitor'))
);

CREATE TABLE IF NOT EXISTS interfaces ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_interfaces (
    user_id INTEGER,
    interface_id INTEGER,
    PRIMARY KEY (user_id, interface_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (interface_id) REFERENCES interfaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    subtitle TEXT NOT NULL,
    count_general INTEGER NOT NULL DEFAULT 0, --track the number of available tickets
    count_VIP INTEGER NOT NULL DEFAULT 0, --track the number of available tickets
    full_price REAL NOT NULL CHECK(full_price >= 0),
    concession_price REAL NOT NULL CHECK(concession_price >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_date DATETIME,
    published_date TEXT,
    publication_status TEXT CHECK (publication_status IN ('published', 'draft')) DEFAULT 'draft',
    availability_status TEXT CHECK (availability_status IN ('available', 'unavailable')) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS booked_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Unique identifier for the booking
    ticket_id INTEGER NOT NULL, -- Foreign key referencing the ticket table
    user_id INTEGER NOT NULL, -- Foreign key referencing the users table
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the booking
    ticket_type TEXT CHECK(ticket_type IN ('general', 'VIP')) NOT NULL, -- Type of ticket booked
    quantity INTEGER NOT NULL CHECK(quantity > 0), -- Number of tickets booked
    total_price REAL NOT NULL CHECK(total_price >= 0), -- Total price of the booked tickets
    booking_status TEXT CHECK(booking_status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    payment_id INTEGER, -- Foreign key to payments table
    FOREIGN KEY (ticket_id) REFERENCES ticket (id) ON DELETE CASCADE, -- Ensures consistency with the ticket table
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE, -- Ensures consistency with the users table
    FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer')) NOT NULL,
    payment_status TEXT CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    amount REAL NOT NULL CHECK(amount >= 0),
    transaction_id TEXT UNIQUE,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    card_last_four TEXT, -- Last 4 digits of card for reference
    FOREIGN KEY (booking_id) REFERENCES booked_tickets (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    tax_amount REAL DEFAULT 0 CHECK(tax_amount >= 0),
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    invoice_status TEXT CHECK(invoice_status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    billing_address TEXT,
    notes TEXT,
    FOREIGN KEY (booking_id) REFERENCES booked_tickets (id) ON DELETE CASCADE
);


CREATE TRIGGER update_modified_date
AFTER UPDATE ON ticket
FOR EACH ROW
BEGIN
    UPDATE ticket
    SET modified_date = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER update_status_after_order
AFTER UPDATE ON ticket
FOR EACH ROW
BEGIN
    -- If the order is completed, change product status
    UPDATE ticket
    SET availability_status = 'unavailable'
    WHERE id = NEW.id AND NEW.count_general = 0 AND NEW.count_VIP = 0;
END;



-- CREATE TABLE IF NOT EXISTS email_accounts (
--     email_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     email_address TEXT NOT NULL,
--     password CHAR(7) NOT NULL,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
--     user_id  INT, --the user that the email account belongs to
--     FOREIGN KEY (user_id) REFERENCES users(user_id)
-- );

-- Insert default data (if necessary here)

-- Set up default users
INSERT INTO users ('user_name', 'password', 'role') VALUES ('admin', 'admin123', 'admin');
INSERT INTO users ('user_name', 'password', 'role') VALUES ('visitor', 'visit123', 'visitor');

-- Insert sample library events/books
INSERT INTO ticket ('title', 'subtitle', 'count_general', 'count_VIP', 'full_price', 'concession_price', 'publication_status', 'published_date') 
VALUES 
('Programming Workshop', 'Learn JavaScript fundamentals', 20, 5, 25.00, 15.00, 'published', '2024-01-15'),
('Book Club Meeting', 'Discussing "Clean Code" by Robert Martin', 15, 3, 10.00, 5.00, 'published', '2024-01-20'),
('Library Tour', 'Guided tour of our digital resources', 30, 0, 5.00, 3.00, 'published', '2024-01-25');
-- Sample data for testing
-- Additional users can be added through the admin interface 

COMMIT;


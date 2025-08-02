/**
 * Payment Processing Utilities
 * Handles payment processing and invoice generation
 */

const crypto = require('crypto');

/**
 * Generate a unique transaction ID
 */
function generateTransactionId() {
    return 'TXN_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Generate a unique invoice number
 */
function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `INV-${year}${month}${day}-${random}`;
}

/**
 * Process payment (mock implementation)
 * In production, this would integrate with actual payment gateways
 */
function processPayment(paymentData) {
    return new Promise((resolve, reject) => {
        // Simulate payment processing delay
        setTimeout(() => {
            // Mock payment validation
            const { amount, paymentMethod, cardNumber } = paymentData;
            
            // Basic validation
            if (!amount || amount <= 0) {
                return reject(new Error('Invalid payment amount'));
            }
            
            if (!paymentMethod) {
                return reject(new Error('Payment method is required'));
            }
            
            // Simulate random payment failures (5% chance)
            if (Math.random() < 0.05) {
                return reject(new Error('Payment processing failed. Please try again.'));
            }
            
            // Mock successful payment
            const result = {
                success: true,
                transactionId: generateTransactionId(),
                amount: amount,
                paymentMethod: paymentMethod,
                cardLastFour: cardNumber ? cardNumber.slice(-4) : null,
                processedAt: new Date().toISOString()
            };
            
            resolve(result);
        }, 1000); // 1 second delay to simulate processing
    });
}

/**
 * Create payment record in database
 */
function createPaymentRecord(bookingId, paymentData, transactionResult) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO payments (booking_id, payment_method, payment_status, amount, transaction_id, card_last_four)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            bookingId,
            paymentData.paymentMethod,
            'completed',
            paymentData.amount,
            transactionResult.transactionId,
            transactionResult.cardLastFour
        ];
        
        global.db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Create invoice record in database
 */
function createInvoice(bookingId, paymentAmount, billingAddress = null) {
    return new Promise((resolve, reject) => {
        const invoiceNumber = generateInvoiceNumber();
        const taxRate = 0.1; // 10% tax
        const subtotal = paymentAmount / (1 + taxRate);
        const taxAmount = paymentAmount - subtotal;
        
        const query = `
            INSERT INTO invoices (booking_id, invoice_number, subtotal, tax_amount, total_amount, invoice_status, billing_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            bookingId,
            invoiceNumber,
            subtotal.toFixed(2),
            taxAmount.toFixed(2),
            paymentAmount,
            'paid',
            billingAddress
        ];
        
        global.db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    invoiceNumber: invoiceNumber,
                    subtotal: subtotal.toFixed(2),
                    taxAmount: taxAmount.toFixed(2),
                    totalAmount: paymentAmount
                });
            }
        });
    });
}

/**
 * Update booking status after successful payment
 */
function updateBookingStatus(bookingId, paymentId) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE booked_tickets 
            SET booking_status = 'confirmed', payment_id = ?
            WHERE id = ?
        `;
        
        global.db.run(query, [paymentId, bookingId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

/**
 * Get invoice details by booking ID
 */
function getInvoiceByBookingId(bookingId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT i.*, bt.ticket_id, bt.quantity, bt.ticket_type, t.title, t.subtitle
            FROM invoices i
            JOIN booked_tickets bt ON i.booking_id = bt.id
            JOIN ticket t ON bt.ticket_id = t.id
            WHERE i.booking_id = ?
        `;
        
        global.db.get(query, [bookingId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

module.exports = {
    generateTransactionId,
    generateInvoiceNumber,
    processPayment,
    createPaymentRecord,
    createInvoice,
    updateBookingStatus,
    getInvoiceByBookingId
};
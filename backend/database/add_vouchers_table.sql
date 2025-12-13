-- Add vouchers table for expense voucher generation
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    voucher_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    region VARCHAR(100) NOT NULL,
    qr_code_data TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    expense_id INTEGER REFERENCES expenses(id),
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_number ON vouchers(voucher_number);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_by ON vouchers(created_by);
CREATE INDEX IF NOT EXISTS idx_vouchers_expense_id ON vouchers(expense_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_region ON vouchers(region);

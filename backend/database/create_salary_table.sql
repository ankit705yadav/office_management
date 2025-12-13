-- Create employee_salary_details table if it doesn't exist

-- Employee Salary Details table
CREATE TABLE IF NOT EXISTS employee_salary_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE,
    pan_number VARCHAR(10),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_ifsc_code VARCHAR(11),
    bank_branch VARCHAR(100),
    pf_account_number VARCHAR(50),
    uan_number VARCHAR(12),
    esi_number VARCHAR(17),
    basic_salary DECIMAL(10, 2) NOT NULL,
    hra_percentage DECIMAL(5, 2) DEFAULT 40.0,
    transport_allowance DECIMAL(10, 2) DEFAULT 1600,
    other_allowances DECIMAL(10, 2) DEFAULT 0,
    pf_applicable BOOLEAN DEFAULT TRUE,
    esi_applicable BOOLEAN DEFAULT FALSE,
    professional_tax DECIMAL(10, 2) DEFAULT 200,
    tax_regime VARCHAR(10) DEFAULT 'old',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for employee salary details
CREATE INDEX IF NOT EXISTS idx_employee_salary_user_id ON employee_salary_details(user_id);

-- Add trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_employee_salary_details_updated_at ON employee_salary_details;
CREATE TRIGGER update_employee_salary_details_updated_at
BEFORE UPDATE ON employee_salary_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for admin user (from original schema)
INSERT INTO employee_salary_details (
    user_id, employee_code, pan_number, bank_account_number,
    bank_name, bank_ifsc_code, bank_branch, pf_account_number,
    uan_number, basic_salary, hra_percentage, transport_allowance,
    other_allowances, pf_applicable, esi_applicable, professional_tax, tax_regime
) VALUES (
    1, -- admin user
    'EMP001',
    'ABCDE1234F',
    '1234567890123456',
    'HDFC Bank',
    'HDFC0001234',
    'Bangalore Main Branch',
    'KA/BGP/0123456/000/0001234',
    '100123456789',
    50000.00,
    40.0,
    1600.00,
    3000.00,
    TRUE,
    FALSE,
    200.00,
    'old'
) ON CONFLICT (user_id) DO NOTHING;

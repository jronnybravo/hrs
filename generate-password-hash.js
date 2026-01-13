import crypto from 'crypto';

// Generate hash for password "password123"
const password = 'password123';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
const hashedPassword = `${salt}:${hash}`;

console.log('Hashed password:', hashedPassword);
console.log('\nSQL command to insert user:');
console.log(`INSERT INTO users (email, firstName, lastName, password, createdAt, updatedAt) VALUES ('admin@example.com', 'Admin', 'User', '${hashedPassword}', NOW(), NOW());`);
console.log('\nLogin credentials:');
console.log('Email: admin@example.com');
console.log('Password: password123');

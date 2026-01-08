// users.js - User Database
// Users are managed by admin, not self-registered

const usersDatabase = {
    // Admin users
    'admin001': {
        id: 'admin001',
        password: 'Admin@12345', // Should be changed on first login
        name: 'System Administrator',
        role: 'admin',
        email: 'admin@boitshepo.co.za',
        phone: '+27820000000',
        department: 'Administration',
        avatar: 'SA',
        created: '2024-01-01',
        lastLogin: null,
        mustChangePassword: true
    },
    
    'Mmamahlodi_P': {
        id: 'Mmamahlodi_P',
        password: 'Prince@1234',
        name: 'Prince Mmamahlodi',
        role: 'admin',
        email: 'Princelegodi0@gmail.com',
        phone: '+27722242357',
        department: 'Management',
        avatar: 'PM',
        created: '2024-01-01',
        lastLogin: null,
        mustChangePassword: false
    },
    
    // Regular employees
    'emp001': {
        id: 'emp001',
        password: 'Employee@123',
        name: 'John Doe',
        role: 'employee',
        email: 'john.doe@boitshepo.co.za',
        phone: '+27821111111',
        department: 'Finance',
        avatar: 'JD',
        created: '2024-01-01',
        lastLogin: null,
        mustChangePassword: false
    },
    
    'emp002': {
        id: 'emp002',
        password: 'Employee@456',
        name: 'Jane Smith',
        role: 'employee',
        email: 'jane.smith@boitshepo.co.za',
        phone: '+27822222222',
        department: 'Operations',
        avatar: 'JS',
        created: '2024-01-01',
        lastLogin: null,
        mustChangePassword: false
    },
    
    'emp003': {
        id: 'emp003',
        password: 'Employee@789',
        name: 'Mike Johnson',
        role: 'manager',
        email: 'mike.johnson@boitshepo.co.za',
        phone: '+27823333333',
        department: 'Sales',
        avatar: 'MJ',
        created: '2024-01-01',
        lastLogin: null,
        mustChangePassword: false
    }
};

// Password requirements
const passwordRequirements = {
    minLength: 10,
    maxLength: 30,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*'
};

// User management functions
function getUserById(userId) {
    return usersDatabase[userId] || null;
}

function getAllUsers() {
    return Object.values(usersDatabase);
}

function updateUser(userId, updates) {
    if (usersDatabase[userId]) {
        usersDatabase[userId] = { ...usersDatabase[userId], ...updates };
        return true;
    }
    return false;
}

function changePassword(userId, newPassword) {
    if (usersDatabase[userId]) {
        usersDatabase[userId].password = newPassword;
        usersDatabase[userId].mustChangePassword = false;
        usersDatabase[userId].lastPasswordChange = new Date().toISOString();
        return true;
    }
    return false;
}

// Save users to localStorage for persistence
function saveUsersToStorage() {
    localStorage.setItem('boitshepo_users', JSON.stringify(usersDatabase));
}

// Load users from localStorage
function loadUsersFromStorage() {
    const savedUsers = localStorage.getItem('boitshepo_users');
    if (savedUsers) {
        Object.assign(usersDatabase, JSON.parse(savedUsers));
    }
}

// Initialize users from storage
loadUsersFromStorage();
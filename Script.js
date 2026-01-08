// Script.js - Main Application Logic
// Debug function
function debugLog(message, data = null) {
    console.log(`[DEBUG] ${message}`, data || '');
}

function saveDocument() {
    debugLog('saveDocument called');
    
    if (!selectedCompanyId) {
        alert('Please select a company first');
        return;
    }
    
    // Create document data
    const documentData = createDocumentData(currentDocumentType);
    debugLog('Document data created:', documentData);
    
    if (!documentData) {
        alert('Failed to create document data. Please check your inputs.');
        return;
    }
    
    // Always show document name modal for consistency
    pendingDocumentData = documentData;
    const isEdit = currentEditingDocument ? true : false;
    debugLog('Showing document name modal (edit:', isEdit, ')');
    showDocumentNameModal(documentData, isEdit, false);
}
function saveDocumentDirectly(documentData, docTypesToCreate = []) {
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) {
        alert('Company not found');
        return;
    }
    
    // Add folder information
    documentData.folderId = selectedFolderId;
    
    debugLog('Saving document directly:', {
        type: documentData.type,
        title: documentData.title,
        company: company.name,
        additionalTypes: docTypesToCreate
    });
    
    if (currentEditingDocument) {
        // Update existing document
        updateDocumentInCompany(company, currentEditingDocument.id, documentData);
        alert('Document updated successfully!');
    } else {
        // Add new document
        addDocumentToCompany(company, documentData);
        
        // Create and save linked documents if requested
        if (docTypesToCreate && docTypesToCreate.length > 0) {
            // Extract base name from the main document title
            const baseName = documentData.title.replace(/\s*(Invoice|Quotation|Purchase Order|Delivery Note)\s*/gi, '').trim();
            const allDocs = createLinkedDocuments(documentData, currentDocumentType, baseName, docTypesToCreate);
            
            // Save each linked document
            Object.entries(allDocs).forEach(([docType, doc]) => {
                // Skip the main document type (already saved)
                if (docType !== currentDocumentType) {
                    addDocumentToCompany(company, doc);
                }
            });
        }
    }
    
    // Save to localStorage
    saveCompaniesToStorage();
    
    // Refresh documents display
    if (selectedCompanyId) {
        loadCompanyContent(company.id);
    }
    
    // IMPORTANT: Reset invoice items for next document
    invoiceItems = [{ id: 1, description: '', qty: 1, price: 0 }];
    renderInvoiceItems();
}

function createLinkedDocuments(mainDocument, mainType, baseName, docTypesToCreate) {
    const linkedDocs = {};
    
    docTypesToCreate.forEach(docType => {
        // Clone the main document data
        const linkedDoc = JSON.parse(JSON.stringify(mainDocument));
        
        // Generate new ID
        linkedDoc.id = Date.now() + Math.floor(Math.random() * 1000);
        
        // Update type-specific information
        linkedDoc.type = docType;
        const docTypeName = docType.charAt(0).toUpperCase() + docType.slice(1);
        linkedDoc.title = `${baseName} ${docTypeName}`;
        
        // Generate appropriate document number
        const company = companies.find(c => c.id === selectedCompanyId);
        if (company) {
            let nextNum;
            let prefix;
            
            switch(docType) {
                case 'invoice':
                    nextNum = getNextDocumentNumber(company, 'invoice');
                    prefix = 'INV';
                    linkedDoc.invoiceNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;
                    break;
                case 'quotation':
                    nextNum = getNextDocumentNumber(company, 'quotation');
                    prefix = 'Q';
                    linkedDoc.quotationNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;
                    break;
                case 'purchase order':
                    nextNum = getNextDocumentNumber(company, 'purchase order');
                    prefix = 'PO';
                    linkedDoc.poNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;
                    break;
                case 'delivery note':
                    nextNum = getNextDocumentNumber(company, 'delivery note');
                    prefix = 'DN';
                    linkedDoc.deliveryNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;
                    if (mainDocument.invoiceNumber) {
                        linkedDoc.refNumber = mainDocument.invoiceNumber;
                    }
                    break;
            }
        }
        
        linkedDocs[docType] = linkedDoc;
    });
    
    return linkedDocs;
}

// Load users from storage
loadUsersFromStorage();

// Current state
let currentUser = null;
let selectedCompanyId = null;
let selectedFolderId = null;
let folderHistory = [];
let currentEditingDocument = null;
let pendingDocumentData = null;
let pendingCloseAfterSave = false;
let renamingDocumentId = null;
let movingDocumentId = null;
let editingUserId = null;
let invoiceItems = [{ id: 1, description: '', qty: 1, price: 0 }];
let currentDocumentType = 'invoice';
let linkedDocuments = {};

// Sample companies data
let companies = [
    { 
        id: 1, 
        name: "Boitshepo Consortium", 
        industry: "Construction", 
        contact: "Thabo Mbeki", 
        email: "contact@boitshepo.co.za",
        description: "Main consortium company",
        folders: [
            {
                id: "folder1",
                name: "Invoices",
                parentId: null,
                documents: []
            },
            {
                id: "folder2",
                name: "Contracts",
                parentId: null,
                documents: []
            },
            {
                id: "folder3",
                name: "Reports",
                parentId: null,
                documents: []
            }
        ],
        documents: []
    },
    { 
        id: 2, 
        name: "Afroland Consortium", 
        industry: "Trading", 
        contact: "Naledi Smith", 
        email: "info@afroland.co.za",
        description: "Trading and import/export",
        folders: [
            {
                id: "folder4",
                name: "Financial",
                parentId: null,
                documents: []
            },
            {
                id: "folder5",
                name: "Legal",
                parentId: null,
                documents: []
            }
        ],
        documents: []
    },
    { 
        id: 3, 
        name: "Elucidate Trading Enterprise", 
        industry: "Trading", 
        contact: "David Chen", 
        email: "david@elucidate.co.za",
        description: "International trading company",
        folders: [],
        documents: []
    },
    { 
        id: 4, 
        name: "Pinnacle Civbuild", 
        industry: "Construction", 
        contact: "James Wilson", 
        email: "james@pinnaclecivbuild.co.za",
        description: "Civil construction and engineering",
        folders: [],
        documents: []
    }
];

// DOM elements
const mainContent = document.getElementById('mainContent');
const logoutBtn = document.getElementById('logoutBtn');
const profileBtn = document.getElementById('profileBtn');
const userWelcome = document.getElementById('userWelcome');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const adminNavLink = document.getElementById('adminNavLink');
const companyGrid = document.getElementById('companyGrid');
const documentsGrid = document.getElementById('documentsGrid');
const foldersGrid = document.getElementById('foldersGrid');
const folderBreadcrumb = document.getElementById('folderBreadcrumb');
const documentsTitle = document.getElementById('documentsTitle');
const documentsSubtitle = document.getElementById('documentsSubtitle');
const addDocumentBtn = document.getElementById('addDocumentBtn');
const addFolderBtn = document.getElementById('addFolderBtn');
const invoiceModal = document.getElementById('invoiceModal');
const userProfileModal = document.getElementById('userProfileModal');
const userManagementModal = document.getElementById('userManagementModal');
const editUserModal = document.getElementById('editUserModal');
const heroSubtitle = document.getElementById('heroSubtitle');
const closeModals = document.querySelectorAll('.close-modal');
const invoiceItemsContainer = document.getElementById('invoiceItems');
const addUserBtn = document.getElementById('addUserBtn');
const documentTypeDropdown = document.querySelector('.document-type-dropdown');
const backToCompaniesBtn = document.getElementById('backToCompaniesBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    setupEventListeners();
    initializeInvoice();
    loadCompaniesFromStorage();
    
    // Ensure document type dropdown is initially hidden
    if (documentTypeDropdown) {
        documentTypeDropdown.style.display = 'none';
    }
});

function checkUserSession() {
    const savedUser = sessionStorage.getItem('boitshepo_current_user');
    if (!savedUser) {
        window.location.href = 'Login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(savedUser);
        showMainContent();
    } catch (e) {
        window.location.href = 'Login.html';
    }
}

function setupEventListeners() {
    // Profile button
    profileBtn.addEventListener('click', openUserProfile);
    
    // Logout
    logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('boitshepo_current_user');
        window.location.href = 'index.html';
    });
   
    // Back to companies button
    backToCompaniesBtn.addEventListener('click', function() {
        resetCompanySelection();
    });
    
    // Add document button (with dropdown)
    addDocumentBtn.addEventListener('click', function(e) {
        if (!selectedCompanyId) {
            alert('Please select a company first');
            return;
        }
        
        // Toggle dropdown visibility
        if (documentTypeDropdown.style.display === 'block') {
            documentTypeDropdown.style.display = 'none';
        } else {
            documentTypeDropdown.style.display = 'block';
        }
        
        e.stopPropagation();
    });
    
    // Add folder button
    addFolderBtn.addEventListener('click', function() {
        if (!selectedCompanyId) {
            alert('Please select a company first');
            return;
        }
        openAddFolderModal();
    });
    
    // Close modals
    closeModals.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
        
        // Close dropdown when clicking outside
        if (documentTypeDropdown && !e.target.closest('#addDocumentBtn') && !e.target.closest('.document-type-dropdown')) {
            documentTypeDropdown.style.display = 'none';
        }
    });
    
    // Admin panel navigation
    if (adminNavLink) {
        adminNavLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUser.role === 'admin') {
                openUserManagement();
            }
        });
    }
    
    // Profile change password form
    const profileChangePasswordForm = document.getElementById('profileChangePasswordForm');
    if (profileChangePasswordForm) {
        profileChangePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changeProfilePassword();
        });
    }
    
    // Add user button
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            openEditUserModal();
        });
    }
    
    // Close dropdown when clicking on document type buttons inside dropdown
    if (documentTypeDropdown) {
        documentTypeDropdown.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                this.style.display = 'none';
            }
        });
    }
}

function resetCompanySelection() {
    // Reset selection
    document.querySelectorAll('.company-card').forEach(c => c.classList.remove('active'));
    selectedCompanyId = null;
    selectedFolderId = null;
    folderHistory = [];
    
    // Show default message
    documentsTitle.textContent = 'Company Documents';
    documentsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
            <i class="fas fa-building" style="font-size: 3rem; margin-bottom: 20px; color: #ccc;"></i>
            <h3 style="margin-bottom: 10px;">Select a Company</h3>
            <p>Choose a company from the list above to view or create documents</p>
        </div>
    `;
    addDocumentBtn.style.display = 'none';
    addFolderBtn.style.display = 'none';
    foldersGrid.style.display = 'none';
    folderBreadcrumb.style.display = 'none';
    
    // Scroll to company selector
    document.getElementById('companySelector').scrollIntoView({ behavior: 'smooth' });
}

function loadCompaniesFromStorage() {
    const savedCompanies = localStorage.getItem('boitshepoCompanies');
    if (savedCompanies) {
        companies = JSON.parse(savedCompanies);
    }
}

function saveCompaniesToStorage() {
    localStorage.setItem('boitshepoCompanies', JSON.stringify(companies));
}

function showMainContent() {
    mainContent.style.display = 'block';
    
    // Update user info
    userName.textContent = `${currentUser.name} (${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})`;
    userAvatar.textContent = currentUser.avatar;
    heroSubtitle.textContent = `Welcome, ${currentUser.name}. Manage documents for all companies.`;
    
    // Show/hide admin elements
    if (currentUser.role === 'admin') {
        adminNavLink.style.display = 'flex';
    }
    
    // Load companies
    loadCompanies();
}

function openUserProfile() {
    if (!currentUser) return;
    
    // Populate profile data
    document.getElementById('profileAvatar').textContent = currentUser.avatar;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    document.getElementById('profileDepartment').textContent = currentUser.department || 'Not specified';
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profilePhone').textContent = currentUser.phone || 'Not specified';
    document.getElementById('profileEmployeeId').textContent = currentUser.id;
    
    const user = getUserById(currentUser.id);
    if (user && user.lastLogin) {
        const lastLogin = new Date(user.lastLogin);
        document.getElementById('profileLastLogin').textContent = lastLogin.toLocaleString();
    } else {
        document.getElementById('profileLastLogin').textContent = 'Never';
    }
    
    // Clear password fields
    document.getElementById('profileCurrentPassword').value = '';
    document.getElementById('profileNewPassword').value = '';
    document.getElementById('profileConfirmPassword').value = '';
    document.getElementById('profilePasswordError').style.display = 'none';
    document.getElementById('profilePasswordSuccess').style.display = 'none';
    
    userProfileModal.style.display = 'flex';
}

function changeProfilePassword() {
    const currentPassword = document.getElementById('profileCurrentPassword').value;
    const newPassword = document.getElementById('profileNewPassword').value;
    const confirmPassword = document.getElementById('profileConfirmPassword').value;
    
    const errorEl = document.getElementById('profilePasswordError');
    const successEl = document.getElementById('profilePasswordSuccess');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        errorEl.textContent = 'Please fill in all password fields';
        errorEl.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'New passwords do not match';
        errorEl.style.display = 'block';
        return;
    }
    
    // Check password requirements
    if (!checkPasswordRequirements(newPassword)) {
        errorEl.textContent = 'New password does not meet requirements';
        errorEl.style.display = 'block';
        return;
    }
    
    // Get user from database
    const user = getUserById(currentUser.id);
    if (!user) {
        errorEl.textContent = 'User not found';
        errorEl.style.display = 'block';
        return;
    }
    
    // Verify current password
    if (user.password !== currentPassword) {
        errorEl.textContent = 'Current password is incorrect';
        errorEl.style.display = 'block';
        return;
    }
    
    // Change password
    if (changePassword(currentUser.id, newPassword)) {
        saveUsersToStorage();
        
        successEl.textContent = 'Password changed successfully!';
        successEl.style.display = 'block';
        
        // Clear fields
        document.getElementById('profileCurrentPassword').value = '';
        document.getElementById('profileNewPassword').value = '';
        document.getElementById('profileConfirmPassword').value = '';
        
        // Update session
        sessionStorage.setItem('boitshepo_current_user', JSON.stringify({
            ...currentUser,
            timestamp: new Date().getTime()
        }));
    } else {
        errorEl.textContent = 'Failed to change password';
        errorEl.style.display = 'block';
    }
}

function checkPasswordRequirements(password) {
    const requirements = passwordRequirements;
    
    if (password.length < requirements.minLength || password.length > requirements.maxLength) {
        return false;
    }
    
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        return false;
    }
    
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        return false;
    }
    
    if (requirements.requireNumbers && !/[0-9]/.test(password)) {
        return false;
    }
    
    if (requirements.requireSpecialChars) {
        const specialRegex = new RegExp(`[${requirements.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
        if (!specialRegex.test(password)) {
            return false;
        }
    }
    
    return true;
}

function openUserManagement() {
    if (currentUser.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        return;
    }
    
    loadAllUsers();
    userManagementModal.style.display = 'flex';
}

function loadAllUsers() {
    const grid = document.getElementById('userManagementGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const users = getAllUsers();
    
    if (users.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">No users found</p>';
        return;
    }
    
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        
        let roleClass = '';
        switch(user.role) {
            case 'admin': roleClass = 'role-admin'; break;
            case 'manager': roleClass = 'role-manager'; break;
            default: roleClass = 'role-employee';
        }
        
        card.innerHTML = `
            <div class="user-card-header">
                <div class="user-avatar-small">${user.avatar}</div>
                <div>
                    <h4 style="margin: 0; font-size: 16px;">${user.name}</h4>
                    <span class="user-role ${roleClass}">${user.role.toUpperCase()}</span>
                </div>
            </div>
            <div style="font-size: 14px; color: #666;">
                <p style="margin: 5px 0;"><strong>ID:</strong> ${user.id}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0;"><strong>Dept:</strong> ${user.department || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Created:</strong> ${new Date(user.created).toLocaleDateString()}</p>
                ${user.lastLogin ? `<p style="margin: 5px 0;"><strong>Last Login:</strong> ${new Date(user.lastLogin).toLocaleString()}</p>` : ''}
            </div>
            <div class="user-actions">
                <button class="btn btn-warning btn-sm" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ${user.id !== currentUser.id ? `
                <button class="btn btn-secondary btn-sm" onclick="resetUserPassword('${user.id}')">
                    <i class="fas fa-key"></i> Reset Password
                </button>
                ` : ''}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function openEditUserModal(userId = null) {
    editingUserId = userId;
    const modal = document.getElementById('editUserModal');
    const title = document.getElementById('editUserModalTitle');
    const form = document.getElementById('editUserForm');
    
    if (userId) {
        // Edit existing user
        title.textContent = 'Edit User';
        const user = getUserById(userId);
        if (user) {
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUserId').readOnly = true;
            document.getElementById('editUserName').value = user.name;
            document.getElementById('editUserEmail').value = user.email;
            document.getElementById('editUserPhone').value = user.phone || '';
            document.getElementById('editUserRole').value = user.role;
            document.getElementById('editUserDepartment').value = user.department || '';
            document.getElementById('editUserPassword').required = false;
            document.getElementById('editUserPassword').placeholder = 'Leave blank to keep current';
        }
    } else {
        // Add new user
        title.textContent = 'Add New User';
        form.reset();
        document.getElementById('editUserId').readOnly = false;
        document.getElementById('editUserPassword').required = true;
        document.getElementById('editUserPassword').placeholder = 'Enter initial password';
    }
    
    document.getElementById('editUserError').style.display = 'none';
    document.getElementById('editUserSuccess').style.display = 'none';
    modal.style.display = 'flex';
}

function cancelEditUser() {
    document.getElementById('editUserModal').style.display = 'none';
    editingUserId = null;
}

function saveUser() {
    const userId = document.getElementById('editUserId').value.trim();
    const name = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const phone = document.getElementById('editUserPhone').value.trim();
    const role = document.getElementById('editUserRole').value;
    const department = document.getElementById('editUserDepartment').value.trim();
    const password = document.getElementById('editUserPassword').value;
    
    const errorEl = document.getElementById('editUserError');
    const successEl = document.getElementById('editUserSuccess');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    // Validation
    if (!userId || !name || !email || !role) {
        errorEl.textContent = 'Please fill in all required fields';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!editingUserId && !password) {
        errorEl.textContent = 'Please enter an initial password for new user';
        errorEl.style.display = 'block';
        return;
    }
    
    if (editingUserId) {
        // Update existing user
        const updates = {
            name: name,
            email: email,
            phone: phone || null,
            role: role,
            department: department || null
        };
        
        if (password) {
            if (!checkPasswordRequirements(password)) {
                errorEl.textContent = 'Password does not meet requirements';
                errorEl.style.display = 'block';
                return;
            }
            updates.password = password;
            updates.mustChangePassword = true;
        }
        
        if (updateUser(userId, updates)) {
            saveUsersToStorage();
            successEl.textContent = 'User updated successfully!';
            successEl.style.display = 'block';
            setTimeout(() => {
                cancelEditUser();
                loadAllUsers();
            }, 1500);
        } else {
            errorEl.textContent = 'Failed to update user';
            errorEl.style.display = 'block';
        }
    } else {
        // Create new user
        if (!checkPasswordRequirements(password)) {
            errorEl.textContent = 'Password does not meet requirements';
            errorEl.style.display = 'block';
            return;
        }
        
        // Check if user already exists
        if (getUserById(userId)) {
            errorEl.textContent = 'User ID already exists';
            errorEl.style.display = 'block';
            return;
        }
        
        const newUser = {
            id: userId,
            password: password,
            name: name,
            role: role,
            email: email,
            phone: phone || null,
            department: department || null,
            avatar: getInitials(name),
            created: new Date().toISOString(),
            lastLogin: null,
            mustChangePassword: true
        };
        
        usersDatabase[userId] = newUser;
        saveUsersToStorage();
        
        successEl.textContent = 'User created successfully!';
        successEl.style.display = 'block';
        setTimeout(() => {
            cancelEditUser();
            loadAllUsers();
        }, 1500);
    }
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function editUser(userId) {
    openEditUserModal(userId);
}

function deleteUser(userId) {
    if (userId === currentUser.id) {
        alert('You cannot delete your own account');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete user ${userId}? This action cannot be undone.`)) {
        return;
    }
    
    if (usersDatabase[userId]) {
        delete usersDatabase[userId];
        saveUsersToStorage();
        loadAllUsers();
        alert('User deleted successfully');
    }
}

function resetUserPassword(userId) {
    if (!confirm(`Reset password for user ${userId}? They will need to change it on next login.`)) {
        return;
    }
    
    const user = getUserById(userId);
    if (user) {
        const newPassword = generateRandomPassword();
        user.password = newPassword;
        user.mustChangePassword = true;
        saveUsersToStorage();
        
        alert(`Password reset for ${userId}. New temporary password: ${newPassword}\n\nPlease provide this to the user securely.`);
        loadAllUsers();
    }
}

function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'A'; // uppercase
    password += 'a'; // lowercase
    password += '1'; // number
    password += '!'; // special
    
    // Add random characters to meet length requirement
    for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// ==================== COMPANY AND DOCUMENT MANAGEMENT ====================

function loadCompanies() {
    companyGrid.innerHTML = '';
    
    companies.forEach(company => {
        const totalDocs = countCompanyDocuments(company);
        
        const card = document.createElement('div');
        card.className = 'company-card';
        card.dataset.companyId = company.id;
        
        card.innerHTML = `
            <div class="company-icon">
                <i class="fas fa-building"></i>
            </div>
            <div class="company-name">${company.name}</div>
            <div class="company-doc-count">${totalDocs} document(s)</div>
            <div style="font-size: 0.8rem; color: #666;">${company.industry}</div>
        `;
        
        card.addEventListener('click', function() {
            // Remove active class from all cards
            document.querySelectorAll('.company-card').forEach(c => {
                c.classList.remove('active');
            });
            
            // Add active class to clicked card
            this.classList.add('active');
            
            // Set selected company
            selectedCompanyId = company.id;
            selectedFolderId = null;
            folderHistory = [];
            
            // Load company folders and documents
            loadCompanyContent(company.id);
            
            // Update UI
            documentsTitle.textContent = `${company.name} - Documents`;
            documentsSubtitle.textContent = `Manage documents for ${company.name}`;
            addDocumentBtn.style.display = 'inline-block';
            addFolderBtn.style.display = 'inline-block';
            backToCompaniesBtn.style.display = 'none';
        });
        
        companyGrid.appendChild(card);
    });
    
    // Select first company by default
    if (companies.length > 0) {
        const firstCard = document.querySelector('.company-card');
        if (firstCard) {
            firstCard.click();
        }
    }
}

function countCompanyDocuments(company) {
    let count = company.documents ? company.documents.length : 0;
    
    if (company.folders) {
        company.folders.forEach(folder => {
            count += folder.documents ? folder.documents.length : 0;
        });
    }
    
    return count;
}

function loadCompanyContent(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    // Show folder breadcrumb
    updateBreadcrumb(company);
    
    // Show folders grid
    loadFolders(company);
    
    // Show documents for current folder
    loadDocumentsForCurrentFolder(company);
}

function updateBreadcrumb(company) {
    folderBreadcrumb.innerHTML = '';
    folderBreadcrumb.style.display = 'flex';
    
    // Always show company as first breadcrumb
    const companyCrumb = document.createElement('div');
    companyCrumb.className = 'breadcrumb-item';
    companyCrumb.innerHTML = `<i class="fas fa-building"></i> ${company.name}`;
    companyCrumb.addEventListener('click', function() {
        selectedFolderId = null;
        folderHistory = [];
        loadCompanyContent(company.id);
    });
    folderBreadcrumb.appendChild(companyCrumb);
    
    // Add folder breadcrumbs if in a folder
    if (selectedFolderId) {
        const folder = company.folders.find(f => f.id === selectedFolderId);
        if (folder) {
            const separator = document.createElement('div');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = '<i class="fas fa-chevron-right"></i>';
            folderBreadcrumb.appendChild(separator);
            
            const folderCrumb = document.createElement('div');
            folderCrumb.className = 'breadcrumb-item';
            folderCrumb.innerHTML = `<i class="fas fa-folder"></i> ${folder.name}`;
            folderCrumb.addEventListener('click', function() {
                // Already in this folder, do nothing
            });
            folderBreadcrumb.appendChild(folderCrumb);
        }
    }
}

function loadFolders(company) {
    foldersGrid.innerHTML = '';
    foldersGrid.style.display = 'grid';
    
    // Get folders at current level
    const currentFolders = company.folders.filter(folder => {
        // If we're at root level, show folders with no parent
        if (!selectedFolderId) {
            return !folder.parentId;
        }
        // If we're in a folder, show subfolders of current folder
        return folder.parentId === selectedFolderId;
    });
    
    if (currentFolders.length === 0) {
        foldersGrid.style.display = 'none';
        return;
    }
    
    currentFolders.forEach(folder => {
        const docCount = folder.documents ? folder.documents.length : 0;
        
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.dataset.folderId = folder.id;
        
        card.innerHTML = `
            <div class="folder-icon">
                <i class="fas fa-folder"></i>
            </div>
            <div class="folder-name">${folder.name}</div>
            <div class="folder-doc-count">${docCount} document(s)</div>
            <div class="folder-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteFolder('${folder.id}', ${company.id}, event)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        card.addEventListener('click', function(e) {
            // Don't navigate if clicking delete button
            if (e.target.closest('button')) {
                return;
            }
            
            // Add to folder history
            folderHistory.push(selectedFolderId);
            
            // Navigate into folder
            selectedFolderId = folder.id;
            loadCompanyContent(company.id);
        });
        
        foldersGrid.appendChild(card);
    });
}

function loadDocumentsForCurrentFolder(company) {
    documentsGrid.innerHTML = '';
    
    let documents = [];
    
    if (selectedFolderId) {
        // Get documents from current folder
        const folder = company.folders.find(f => f.id === selectedFolderId);
        if (folder && folder.documents) {
            documents = folder.documents;
        }
    } else {
        // Get documents from root level
        documents = company.documents || [];
    }
    
    if (documents.length === 0) {
        documentsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 20px; color: #ccc;"></i>
                <h3 style="margin-bottom: 10px;">No documents found</h3>
                <p>This ${selectedFolderId ? 'folder' : 'company'} doesn't have any documents yet. Create your first document!</p>
            </div>
        `;
        return;
    }
    
    // Document type icons
    const typeIcon = {
        'invoice': '🧾',
        'quotation': '📋',
        'purchase order': '📝',
        'delivery note': '🚚'
    };
    
    documents.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'document-card';
        
        let statusClass = '';
        let statusIcon = '';
        switch(doc.status) {
            case 'draft': statusClass = 'status-draft'; statusIcon = '📝'; break;
            case 'in-progress': statusClass = 'status-in-progress'; statusIcon = '🔄'; break;
            case 'review': statusClass = 'status-review'; statusIcon = '👁️'; break;
            case 'completed': statusClass = 'status-completed'; statusIcon = '✅'; break;
        }
        
        // Use document type specific styling
        const docTypeClass = `status-${doc.type.replace(/\s+/g, '-')}`;
        
        card.innerHTML = `
            <div class="document-title">${doc.title}</div>
            <div class="document-meta">
                <span>${typeIcon[doc.type] || '📄'} ${doc.type.toUpperCase()}</span>
                <span>${doc.date}</span>
            </div>
            <div class="document-status ${statusClass} ${docTypeClass}">${statusIcon} ${doc.status.toUpperCase()}</div>
            <p style="margin: 15px 0; font-size: 14px; color: #666;">${company.name}${selectedFolderId ? ' • ' + getFolderName(company, selectedFolderId) : ''}</p>
            <div style="display: flex; gap: 8px; margin-top: 15px;">
                <button class="btn btn-primary btn-sm" onclick="viewDocument(${doc.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-warning btn-sm" onclick="editDocument(${doc.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-secondary btn-sm" onclick="renameDocumentPrompt(${doc.id})">
                    <i class="fas fa-pen"></i> Rename
                </button>
                <button class="btn btn-success btn-sm" onclick="printDocument(${doc.id})">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-folder btn-sm" onclick="moveDocumentPrompt(${doc.id})">
                    <i class="fas fa-folder"></i> Move
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteDocument(${doc.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        documentsGrid.appendChild(card);
    });
}

function getFolderName(company, folderId) {
    const folder = company.folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Unknown Folder';
}

function openAddFolderModal() {
    document.getElementById('addFolderModal').style.display = 'flex';
    document.getElementById('folderNameInput').focus();
}

function cancelAddFolder() {
    document.getElementById('addFolderModal').style.display = 'none';
    document.getElementById('folderNameInput').value = '';
}

function confirmAddFolder() {
    const folderName = document.getElementById('folderNameInput').value.trim();
    
    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }
    
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;
    
    // Create new folder
    const newFolder = {
        id: 'folder' + Date.now(),
        name: folderName,
        parentId: selectedFolderId,
        documents: []
    };
    
    company.folders = company.folders || [];
    company.folders.push(newFolder);
    
    // Save to localStorage
    saveCompaniesToStorage();
    
    alert(`Folder "${folderName}" created successfully!`);
    document.getElementById('addFolderModal').style.display = 'none';
    document.getElementById('folderNameInput').value = '';
    
    // Refresh folders display
    loadCompanyContent(company.id);
}

function deleteFolder(folderId, companyId, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this folder? All documents in this folder will also be deleted.')) {
        return;
    }
    
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    // Find folder index
    const folderIndex = company.folders.findIndex(f => f.id === folderId);
    if (folderIndex === -1) return;
    
    const folderName = company.folders[folderIndex].name;
    
    // Remove folder
    company.folders.splice(folderIndex, 1);
    
    // Remove any subfolders of this folder
    company.folders = company.folders.filter(f => f.parentId !== folderId);
    
    // Save to localStorage
    saveCompaniesToStorage();
    
    alert(`Folder "${folderName}" deleted successfully!`);
    
    // Refresh display
    loadCompanyContent(company.id);
}

function moveDocumentPrompt(docId) {
    movingDocumentId = docId;
    
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;
    
    const select = document.getElementById('moveFolderSelect');
    select.innerHTML = '<option value="root">Root (Main Folder)</option>';
    
    // Add all folders as options
    company.folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name + (folder.parentId ? ' (Subfolder)' : '');
        select.appendChild(option);
    });
    
    document.getElementById('moveDocumentModal').style.display = 'flex';
}

function cancelMoveDocument() {
    document.getElementById('moveDocumentModal').style.display = 'none';
    movingDocumentId = null;
}

function confirmMoveDocument() {
    const select = document.getElementById('moveFolderSelect');
    const targetFolderId = select.value === 'root' ? null : select.value;
    
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;
    
    // Find document in current location
    let documentToMove = null;
    let sourceIsFolder = false;
    let sourceIndex = -1;
    
    if (selectedFolderId) {
        // Document is in a folder
        const folder = company.folders.find(f => f.id === selectedFolderId);
        if (folder && folder.documents) {
            sourceIndex = folder.documents.findIndex(d => d.id === movingDocumentId);
            if (sourceIndex !== -1) {
                documentToMove = folder.documents[sourceIndex];
                sourceIsFolder = true;
            }
        }
    } else {
        // Document is at root level
        sourceIndex = company.documents.findIndex(d => d.id === movingDocumentId);
        if (sourceIndex !== -1) {
            documentToMove = company.documents[sourceIndex];
        }
    }
    
    if (!documentToMove) {
        alert('Document not found');
        return;
    }
    
    // Remove from source
    if (sourceIsFolder) {
        const folder = company.folders.find(f => f.id === selectedFolderId);
        folder.documents.splice(sourceIndex, 1);
    } else {
        company.documents.splice(sourceIndex, 1);
    }
    
    // Add to target
    if (targetFolderId) {
        // Move to folder
        const targetFolder = company.folders.find(f => f.id === targetFolderId);
        if (targetFolder) {
            targetFolder.documents = targetFolder.documents || [];
            targetFolder.documents.push(documentToMove);
        }
    } else {
        // Move to root
        company.documents.push(documentToMove);
    }
    
    // Save to localStorage
    saveCompaniesToStorage();
    
    alert('Document moved successfully!');
    document.getElementById('moveDocumentModal').style.display = 'none';
    
    // Refresh display
    loadCompanyContent(company.id);
}

// ==================== DOCUMENT CREATION AND MANAGEMENT ====================
function createDocument(type) {
    if (!selectedCompanyId) {
        alert('Please select a company first');
        return;
    }
    
    // Reset any existing states
    currentEditingDocument = null;
    pendingDocumentData = null;
    currentDocumentType = type;
    
    const modalTitle = document.getElementById('invoiceModalTitle');
    
    switch(type) {
        case 'invoice':
            modalTitle.textContent = 'Create New Invoice';
            break;
        case 'quotation':
            modalTitle.textContent = 'Create New Quotation';
            break;
        case 'purchase order':
            modalTitle.textContent = 'Create New Purchase Order';
            break;
        case 'delivery note':
            modalTitle.textContent = 'Create New Delivery Note';
            break;
    }
    
    // Reset the form completely
    resetDocumentForm();
    
    // Set default document numbers
    const company = companies.find(c => c.id === selectedCompanyId);
    if (company) {
        let nextNum;
        let prefix;
        
        switch(type) {
            case 'invoice':
                nextNum = getNextDocumentNumber(company, 'invoice');
                prefix = 'INV';
                break;
            case 'quotation':
                nextNum = getNextDocumentNumber(company, 'quotation');
                prefix = 'Q';
                break;
            case 'purchase order':
                nextNum = getNextDocumentNumber(company, 'purchase order');
                prefix = 'PO';
                break;
            case 'delivery note':
                nextNum = getNextDocumentNumber(company, 'delivery note');
                prefix = 'DN';
                break;
        }
        
        document.getElementById('invoiceNumber').value = `${prefix}-${String(nextNum).padStart(3, '0')}`;
        document.getElementById('documentNumberLabel').textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} #`;
    }
    
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
    
    // Update the UI based on document type
    updateDocumentUI(type);
    
    // Load company info
    loadCompanyInfo();
    
    // Show the modal
    invoiceModal.style.display = 'flex';
    documentTypeDropdown.style.display = 'none';
    
    debugLog('Document creation modal opened for:', type);
}

function resetDocumentForm() {
    invoiceItems = [{ id: 1, description: '', qty: 1, price: 0 }];
    
    // Reset all input fields
    const inputsToReset = [
        'billToName', 'billToAddress1', 'billToAddress2', 'billToVAT',
        'invoiceNumber', 'refNumber', 'shipToAddress'
    ];
    
    inputsToReset.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    // Reset date to today
    if (document.getElementById('invoiceDate')) {
        document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
    }
    
    // Re-render the invoice items
    renderInvoiceItems();
}

function updateDocumentUI(docType) {
    const documentTypeTitle = document.getElementById('documentTypeTitle');
    const invoiceContent = document.querySelector('.invoice-content');
    const addressSectionTitle = document.getElementById('addressSectionTitle');
    
    // Remove existing custom sections
    const existingCustomSections = invoiceContent.querySelectorAll('.custom-section');
    existingCustomSections.forEach(section => section.remove());
    
    // Update main title
    switch(docType) {
        case 'invoice':
            documentTypeTitle.textContent = 'TAX INVOICE';
            setupInvoiceLayout();
            break;
        case 'quotation':
            documentTypeTitle.textContent = 'QUOTATION';
            setupQuotationLayout();
            break;
        case 'purchase order':
            documentTypeTitle.textContent = 'PURCHASE ORDER';
            setupPurchaseOrderLayout();
            break;
        case 'delivery note':
            documentTypeTitle.textContent = 'DELIVERY NOTE';
            setupDeliveryNoteLayout();
            break;
    }
    
    // Update table headers based on document type
    updateTableHeaders(docType);
    
    // Update footer section based on document type
    updateFooterSection(docType);
}

function setupInvoiceLayout() {
    // Invoice has standard layout with "BILL TO"
    const addressSection = document.querySelector('.invoice-content > div:first-child');
    if (addressSection) {
        addressSection.style.display = 'block';
        const addressSectionTitle = document.getElementById('addressSectionTitle');
        if (addressSectionTitle) {
            addressSectionTitle.textContent = 'BILL TO';
        }
    }
    
    // Show standard invoice fields
    document.getElementById('shipToSection').style.display = 'none';
    document.getElementById('refNumberSection').style.display = 'none';
}

function setupQuotationLayout() {
    const invoiceContent = document.querySelector('.invoice-content');
    const documentTypeTitle = document.getElementById('documentTypeTitle');
    const addressSection = document.querySelector('.invoice-content > div:first-child');
    const addressSectionTitle = document.getElementById('addressSectionTitle');
    
    // Show the address section but change label to "QUOTE TO"
    if (addressSection) {
        addressSection.style.display = 'block';
        if (addressSectionTitle) {
            addressSectionTitle.textContent = 'QUOTE TO'; // Changed from 'BILL TO'
        }
    }    
    document.getElementById('documentNumberLabel').textContent = 'Quotation #';
    
    // Add custom sections for quotation
    const afterTitle = document.createElement('div');
    afterTitle.className = 'custom-section';
    afterTitle.innerHTML = `
        <div style="margin-bottom: 20px;">
            <p style="font-size: 13px; margin: 5px 0;">Dear Sir/Ma'am,</p>
            <p style="font-size: 13px; margin: 5px 0;">Thank you for your valuable inquiry. We are pleased to quote as below</p>
        </div>
    `;
    
    // Insert after the document type title
    documentTypeTitle.insertAdjacentElement('afterend', afterTitle);
    
    // Hide sections not needed for quotation
    document.getElementById('shipToSection').style.display = 'none';
    document.getElementById('refNumberSection').style.display = 'none';
}

function setupPurchaseOrderLayout() {
    const addressSection = document.querySelector('.invoice-content > div:first-child');
    
    // Restore the address section with "SHIP TO" label
    if (addressSection) {
        addressSection.style.display = 'block';
        const addressSectionTitle = document.getElementById('addressSectionTitle');
        if (addressSectionTitle) {
            addressSectionTitle.textContent = 'SHIP TO'; // Purchase Order uses "SHIP TO" instead of "BILL TO"
        }
    }
    
    document.getElementById('documentNumberLabel').textContent = 'PO #';
    
    // Hide sections not needed for purchase order
    document.getElementById('shipToSection').style.display = 'none';
    document.getElementById('refNumberSection').style.display = 'none';
}

function setupDeliveryNoteLayout() {
    const addressSection = document.querySelector('.invoice-content > div:first-child');
    
    // Restore the address section with "BILL TO" label
    if (addressSection) {
        addressSection.style.display = 'block';
        const addressSectionTitle = document.getElementById('addressSectionTitle');
        if (addressSectionTitle) {
            addressSectionTitle.textContent = 'BILL TO';
        }
    }
    
    document.getElementById('documentNumberLabel').textContent = 'Delivery #';
    
    // Show reference number section
    document.getElementById('refNumberSection').style.display = 'block';
    document.getElementById('shipToSection').style.display = 'none';
}

function updateTableHeaders(docType) {
    const tableHeaders = document.querySelectorAll('.invoice-table thead th');
    
    if (tableHeaders.length >= 7) {
        switch(docType) {
            case 'invoice':
                tableHeaders[3].textContent = 'PRICE';
                tableHeaders[4].textContent = 'TAXABLE AMOUNT';
                tableHeaders[5].textContent = 'TOTAL';
                // Show all columns for invoice
                tableHeaders.forEach((th, index) => {
                    if (index >= 3 && index <= 6) th.style.display = '';
                });
                break;
            case 'quotation':
                tableHeaders[3].textContent = 'PRICE';
                tableHeaders[4].textContent = 'TAX';
                tableHeaders[5].textContent = 'TOTAL';
                // Show all columns for quotation
                tableHeaders.forEach((th, index) => {
                    if (index >= 3 && index <= 6) th.style.display = '';
                });
                break;
            case 'purchase order':
                tableHeaders[3].textContent = 'PRICE';
                tableHeaders[4].textContent = 'TAX';
                tableHeaders[5].textContent = 'TOTAL';
                // Show all columns for purchase order
                tableHeaders.forEach((th, index) => {
                    if (index >= 3 && index <= 6) th.style.display = '';
                });
                break;
            case 'delivery note':
                // Delivery note only has QTY column, hide others
                tableHeaders.forEach((th, index) => {
                    if (index >= 3 && index <= 6) th.style.display = 'none';
                });
                break;
        }
    }
}

function updateFooterSection(docType) {
    const invoiceFooter = document.querySelector('.invoice-footer-section');
    if (!invoiceFooter) return;
    
    // Clear existing custom content
    const existingCustom = invoiceFooter.querySelector('.custom-footer-content');
    if (existingCustom) {
        existingCustom.remove();
    }
    
    const customContent = document.createElement('div');
    customContent.className = 'custom-footer-content';
    
    switch(docType) {
        case 'invoice':
            // Invoice has payment instructions
            customContent.innerHTML = `
                <div style="padding-top: 12px; border-top: 1px solid #ddd; margin-top: 25px; margin-bottom: 25px;">
                    <h3 style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">Payment Instructions</h3>
                    <p style="font-size: 12px; margin: 1px 0;">Standard Bank</p>
                    <p style="font-size: 12px; margin: 1px 0;">Account holder : Boitshepo Consortium pty ltd</p>
                    <p style="font-size: 12px; margin: 1px 0;">Account Number : 030102138</p>
                    <p style="font-size: 12px; margin: 1px 0;">Branch code. : 052548</p>
                    <p style="font-size: 12px; margin: 1px 0;">Type of account. : Current account</p>
                </div>
            `;
            break;
            
        case 'quotation':
            // Quotation has payment instructions and "We hope you find our offer..." text
            customContent.innerHTML = `
                <div style="padding-top: 12px; border-top: 1px solid #ddd; margin-top: 25px; margin-bottom: 15px;">
                    <p style="font-size: 13px; margin: 10px 0;">We hope you find our offer to be in line with your requirement.</p>
                </div>
                <div style="margin-bottom: 25px;">
                    <h3 style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">Payment Instructions</h3>
                    <p style="font-size: 12px; margin: 1px 0;">Standard Bank</p>
                    <p style="font-size: 12px; margin: 1px 0;">Account holder : Boitshepo Consortium pty ltd</p>
                    <p style="font-size: 12px; margin: 1px 0;">Account Number : 030102138</p>
                    <p style="font-size: 12px; margin: 1px 0;">Branch code. : 052548</p>
                    <p style="font-size: 12px; margin: 1px 0;">Type of account. : Current account</p>
                </div>
            `;
            break;
            
        case 'purchase order':
            // Purchase order has no payment instructions
            customContent.innerHTML = `
                <div style="padding-top: 12px; border-top: 1px solid #ddd; margin-top: 25px; margin-bottom: 25px;">
                    <!-- No payment instructions for purchase order -->
                </div>
            `;
            break;
            
        case 'delivery note':
            // Delivery note has "Received By" section
            customContent.innerHTML = `
                <div style="padding-top: 12px; border-top: 1px solid #ddd; margin-top: 25px; margin-bottom: 25px;">
                    <div style="margin-bottom: 20px;">
                        <p style="font-size: 13px; margin: 5px 0;">Received By:</p>
                        <p style="font-size: 13px; margin: 5px 0;">Name: ___________________</p>
                        <p style="font-size: 13px; margin: 5px 0;">Date: ___________________</p>
                        <p style="font-size: 13px; margin: 5px 0;">Signature: ___________________</p>
                    </div>
                </div>
            `;
            break;
    }
    
    // Insert before the signature section
    const signatureSection = invoiceFooter.querySelector('div:last-child');
    if (signatureSection) {
        signatureSection.insertAdjacentElement('beforebegin', customContent);
    } else {
        invoiceFooter.appendChild(customContent);
    }
    
    // Show/hide totals section based on document type
    const totalsSection = document.querySelector('.invoice-totals');
    if (totalsSection) {
        if (docType === 'delivery note') {
            totalsSection.style.display = 'none';
        } else {
            totalsSection.style.display = 'block';
        }
    }
}

function initializeInvoice() {
    renderInvoiceItems();
    updateInvoiceTotals();
    loadCompanyInfo();
}

function renderInvoiceItems() {
    if (!invoiceItemsContainer) return;
    
    invoiceItemsContainer.innerHTML = '';
    
    invoiceItems.forEach((item, index) => {
        const rowNum = index + 1;
        const total = item.qty * item.price;
        const tax = total * 0.15;
        
        const row = document.createElement('tr');
        
        // Different layout for delivery note
        if (currentDocumentType === 'delivery note') {
            row.innerHTML = `
                <td>${rowNum}</td>
                <td>
                    <textarea 
                        oninput="updateInvoiceItem(${item.id}, 'description', this.value)" 
                        style="width: 100%; min-height: 50px; padding: 4px 2px; border: none; border-bottom: 1px solid transparent; font-size: 13px; resize: none; outline: none;"
                        onfocus="this.style.borderBottom='1px solid #4e73df'"
                        onblur="this.style.borderBottom='1px solid transparent'"
                    >${item.description}</textarea>
                </td>
                <td>
                    <input 
                        type="number" 
                        min="1" 
                        value="${item.qty}" 
                        oninput="updateInvoiceItem(${item.id}, 'qty', this.value)"
                        style="width: 100%; padding: 4px 2px; border: none; border-bottom: 1px solid transparent; font-size: 13px; outline: none;"
                        onfocus="this.style.borderBottom='1px solid #4e73df'"
                        onblur="this.style.borderBottom='1px solid transparent'"
                    >
                </td>
                <td style="display: none;"></td>
                <td style="display: none;"></td>
                <td style="display: none;"></td>
                <td>
                    <button onclick="deleteInvoiceItem(${item.id})" class="btn btn-danger" style="padding: 2px 6px; font-size: 11px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td>${rowNum}</td>
                <td>
                    <textarea 
                        oninput="updateInvoiceItem(${item.id}, 'description', this.value)" 
                        style="width: 100%; min-height: 50px; padding: 4px 2px; border: none; border-bottom: 1px solid transparent; font-size: 13px; resize: none; outline: none;"
                        onfocus="this.style.borderBottom='1px solid #4e73df'"
                        onblur="this.style.borderBottom='1px solid transparent'"
                    >${item.description}</textarea>
                </td>
                <td>
                    <input 
                        type="number" 
                        min="1" 
                        value="${item.qty}" 
                        oninput="updateInvoiceItem(${item.id}, 'qty', this.value)"
                        style="width: 100%; padding: 4px 2px; border: none; border-bottom: 1px solid transparent; font-size: 13px; outline: none;"
                        onfocus="this.style.borderBottom='1px solid #4e73df'"
                        onblur="this.style.borderBottom='1px solid transparent'"
                    >
                </td>
                <td>
                    <input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value="${item.price}" 
                        oninput="updateInvoiceItem(${item.id}, 'price', this.value)"
                        style="width: 100%; padding: 4px 2px; border: none; border-bottom: 1px solid transparent; font-size: 13px; outline: none;"
                        onfocus="this.style.borderBottom='1px solid #4e73df'"
                        onblur="this.style.borderBottom='1px solid transparent'"
                    >
                </td>
                <td>R ${total.toFixed(2)}</td>
                <td>R ${(total + tax).toFixed(2)}</td>
                <td>
                    <button onclick="deleteInvoiceItem(${item.id})" class="btn btn-danger" style="padding: 2px 6px; font-size: 11px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        }
        
        invoiceItemsContainer.appendChild(row);
    });
    
    updateInvoiceTotals();
}

function updateInvoiceItem(id, field, value) {
    const item = invoiceItems.find(i => i.id === id);
    if (item) {
        if (field === 'qty' || field === 'price') {
            item[field] = parseFloat(value) || 0;
        } else {
            item[field] = value;
        }
        
        // Only update the specific row and totals, don't re-render everything
        if (field === 'qty' || field === 'price') {
            const index = invoiceItems.findIndex(i => i.id === id);
            const row = invoiceItemsContainer.children[index];
            const total = item.qty * item.price;
            const tax = total * 0.15;
            
            // Update only the total columns (skip for delivery note)
            if (currentDocumentType !== 'delivery note' && row.children.length >= 7) {
                row.children[4].textContent = `R ${total.toFixed(2)}`;
                row.children[5].textContent = `R ${(total + tax).toFixed(2)}`;
                
                updateInvoiceTotals();
            }
        }
    }
}

function addInvoiceItem() {
    const newId = invoiceItems.length > 0 ? Math.max(...invoiceItems.map(i => i.id)) + 1 : 1;
    invoiceItems.push({
        id: newId,
        description: '',
        qty: 1,
        price: 0
    });
    renderInvoiceItems();
}

function deleteInvoiceItem(itemId) {
    if (invoiceItems.length <= 1) {
        alert("Document must have at least one item");
        return;
    }
    
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    invoiceItems = invoiceItems.filter(item => item.id !== itemId);
    renderInvoiceItems();
}

function updateInvoiceTotals() {
    // Don't show totals for delivery note
    if (currentDocumentType === 'delivery note') {
        return;
    }
    
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const tax = subtotal * 0.15;
    const grandTotal = subtotal + tax;
    
    if (document.getElementById('subTotal')) {
        document.getElementById('subTotal').textContent = `R ${subtotal.toFixed(2)}`;
    }
    if (document.getElementById('taxableAmount')) {
        document.getElementById('taxableAmount').textContent = `R ${subtotal.toFixed(2)}`;
    }
    if (document.getElementById('taxAmount')) {
        document.getElementById('taxAmount').textContent = `R ${tax.toFixed(2)}`;
    }
    if (document.getElementById('grandTotal')) {
        document.getElementById('grandTotal').textContent = `R ${grandTotal.toFixed(2)}`;
    }
}

function openDocumentEditor(docId = null) {
    if (!docId && !selectedCompanyId) {
        alert('Please select a company first');
        return;
    }
    
    if (docId) {
        // Edit existing document
        const doc = findDocumentById(docId);
        if (doc) {
            currentEditingDocument = doc;
            currentDocumentType = doc.type;
            const modalTitle = document.getElementById('invoiceModalTitle');
            modalTitle.textContent = `Edit ${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} - ${doc.title}`;
            loadDocumentData(doc);
            updateDocumentUI(doc.type);
            invoiceModal.style.display = 'flex';
        }
    }
}

function getNextDocumentNumber(company, docType) {
    let allDocs = [];
    
    // Count all documents of this type in the company
    if (company.documents) {
        allDocs = company.documents.filter(d => d.type === docType);
    }
    
    if (company.folders) {
        company.folders.forEach(folder => {
            if (folder.documents) {
                const folderDocs = folder.documents.filter(d => d.type === docType);
                allDocs = allDocs.concat(folderDocs);
            }
        });
    }
    
    return allDocs.length + 1;
}

function findDocumentById(docId) {
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return null;
    
    // Check root documents
    const rootDoc = company.documents.find(d => d.id === docId);
    if (rootDoc) return rootDoc;
    
    // Check all folders
    for (const folder of company.folders) {
        if (folder.documents) {
            const folderDoc = folder.documents.find(d => d.id === docId);
            if (folderDoc) return folderDoc;
        }
    }
    
    return null;
}

function loadDocumentData(doc) {
    // Load company info if it exists in document
    if (doc.companyInfo) {
        if (document.getElementById('companyName')) {
            document.getElementById('companyName').value = doc.companyInfo.name || 'BOITSHEPO CONSORTIUM (PTY) LTD';
        }
        if (document.getElementById('companyAddress1')) {
            document.getElementById('companyAddress1').value = doc.companyInfo.address1 || '29 Circle drive';
        }
        if (document.getElementById('companyAddress2')) {
            document.getElementById('companyAddress2').value = doc.companyInfo.address2 || 'Tzaneen Ext 04';
        }
        if (document.getElementById('companyAddress3')) {
            document.getElementById('companyAddress3').value = doc.companyInfo.address3 || 'Tzaneen, 0850';
        }
        if (document.getElementById('companyRegistration')) {
            document.getElementById('companyRegistration').value = doc.companyInfo.registration || '2012/104697/07';
        }
        if (document.getElementById('companyContact')) {
            document.getElementById('companyContact').value = doc.companyInfo.contact || '0836711199 admin@boitshepoconsortium.co.za';
        }
        if (document.getElementById('companyVAT')) {
            document.getElementById('companyVAT').value = doc.companyInfo.vat || 'VAT: 3230299879 TAX NO: 9963185153';
        }
    } else {
        // Load from localStorage
        loadCompanyInfo();
    }
    
    if (document.getElementById('billToName')) {
        document.getElementById('billToName').value = doc.clientName || '';
    }
    if (document.getElementById('billToAddress1')) {
        document.getElementById('billToAddress1').value = doc.address1 || '';
    }
    if (document.getElementById('billToAddress2')) {
        document.getElementById('billToAddress2').value = doc.address2 || '';
    }
    if (document.getElementById('billToVAT')) {
        document.getElementById('billToVAT').value = doc.vat || '';
    }
    
    // Set appropriate number field based on document type
    if (document.getElementById('invoiceNumber')) {
        switch(doc.type) {
            case 'invoice':
                document.getElementById('invoiceNumber').value = doc.invoiceNumber || '';
                break;
            case 'quotation':
                document.getElementById('invoiceNumber').value = doc.quotationNumber || '';
                break;
            case 'purchase order':
                document.getElementById('invoiceNumber').value = doc.poNumber || '';
                break;
            case 'delivery note':
                document.getElementById('invoiceNumber').value = doc.deliveryNumber || '';
                break;
        }
    }
    
    if (document.getElementById('invoiceDate')) {
        document.getElementById('invoiceDate').value = doc.date || '';
    }
    if (document.getElementById('refNumber')) {
        document.getElementById('refNumber').value = doc.refNumber || '';
    }
    
    if (doc.items && doc.items.length > 0) {
        invoiceItems = doc.items;
    } else {
        invoiceItems = [{ id: 1, description: '', qty: 1, price: 0 }];
    }
    
    renderInvoiceItems();
}

function createDocumentData(docType) {
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) {
        alert('Please select a company first');
        return null;
    }
    
    const companyInfo = getCompanyInfoForDocument();
    
    const baseData = {
        id: currentEditingDocument ? currentEditingDocument.id : Date.now(),
        type: docType,
        title: `${docType.charAt(0).toUpperCase() + docType.slice(1)} ${document.getElementById('invoiceNumber').value}`,
        clientName: document.getElementById('billToName').value,
        address1: document.getElementById('billToAddress1').value,
        address2: document.getElementById('billToAddress2').value,
        vat: document.getElementById('billToVAT').value,
        date: document.getElementById('invoiceDate').value,
        items: [...invoiceItems],
        status: 'completed',
        company: company.name,
        companyId: company.id,
        folderId: selectedFolderId,
        createdBy: currentUser.name,
        createdAt: currentEditingDocument ? currentEditingDocument.createdAt : new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        // Add company information to document data
        companyInfo: companyInfo
    };
    
    // Add document-specific fields
    switch(docType) {
        case 'invoice':
            baseData.invoiceNumber = document.getElementById('invoiceNumber').value;
            break;
        case 'purchase order':
            baseData.poNumber = document.getElementById('invoiceNumber').value;
            break;
        case 'delivery note':
            baseData.deliveryNumber = document.getElementById('invoiceNumber').value;
            baseData.refNumber = document.getElementById('refNumber').value;
            break;
        case 'quotation':
            baseData.quotationNumber = document.getElementById('invoiceNumber').value;
            break;
    }
    
    return baseData;
}

function updateLinkedDocuments(baseName, updatedData) {
    const links = linkedDocuments[baseName];
    if (!links) return;
    
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;
    
    // Update each linked document
    Object.entries(links).forEach(([docType, docId]) => {
        if (docId === updatedData.id) return; // Skip the document being updated
        
        const doc = findDocumentById(docId);
        if (doc) {
            // Update common fields
            doc.clientName = updatedData.clientName;
            doc.address1 = updatedData.address1;
            doc.address2 = updatedData.address2;
            doc.vat = updatedData.vat;
            doc.date = updatedData.date;
            doc.lastModified = new Date().toISOString().split('T')[0];
            
            // Update items for all document types except delivery notes
            if (updatedData.items && doc.type !== 'delivery note') {
                doc.items = updatedData.items;
            }
            
            // Update document title to maintain naming consistency
            const docTypeName = doc.type.charAt(0).toUpperCase() + doc.type.slice(1);
            doc.title = `${baseName} ${docTypeName}`;
            
            // Update reference number for delivery notes
            if (doc.type === 'delivery note' && updatedData.invoiceNumber) {
                doc.refNumber = updatedData.invoiceNumber;
            }
            
            // Update company info
            doc.companyInfo = updatedData.companyInfo;
        }
    });
    
    saveCompaniesToStorage();
}

function addDocumentToCompany(company, document) {
    if (selectedFolderId) {
        // Add to folder
        const folder = company.folders.find(f => f.id === selectedFolderId);
        if (folder) {
            folder.documents = folder.documents || [];
            folder.documents.push(document);
        }
    } else {
        // Add to root
        company.documents = company.documents || [];
        company.documents.push(document);
    }
}

function updateDocumentInCompany(company, docId, updatedDoc) {
    // Try to find and update in root
    const rootIndex = company.documents.findIndex(d => d.id === docId);
    if (rootIndex !== -1) {
        company.documents[rootIndex] = updatedDoc;
        return true;
    }
    
    // Try to find and update in folders
    for (const folder of company.folders) {
        if (folder.documents) {
            const folderIndex = folder.documents.findIndex(d => d.id === docId);
            if (folderIndex !== -1) {
                folder.documents[folderIndex] = updatedDoc;
                return true;
            }
        }
    }
    
    return false;
}

function deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        return;
    }
    
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) {
        alert('Company not found');
        return;
    }
    
    let deletedDoc = null;
    
    // Try to delete from root
    const rootIndex = company.documents.findIndex(doc => doc.id === docId);
    if (rootIndex !== -1) {
        deletedDoc = company.documents[rootIndex];
        company.documents.splice(rootIndex, 1);
    } else {
        // Try to delete from folders
        for (const folder of company.folders) {
            if (folder.documents) {
                const folderIndex = folder.documents.findIndex(doc => doc.id === docId);
                if (folderIndex !== -1) {
                    deletedDoc = folder.documents[folderIndex];
                    folder.documents.splice(folderIndex, 1);
                    break;
                }
            }
        }
    }
    
    if (!deletedDoc) {
        alert('Document not found');
        return;
    }
    
    // Remove from linked documents if exists
    for (const [baseName, links] of Object.entries(linkedDocuments)) {
        for (const [docType, docIdInLinks] of Object.entries(links)) {
            if (docIdInLinks === docId) {
                delete links[docType];
                // If no more linked documents, remove the entry
                if (Object.keys(links).length === 0) {
                    delete linkedDocuments[baseName];
                }
                break;
            }
        }
    }
    
    // Save to localStorage
    saveCompaniesToStorage();
    
    alert(`Document "${deletedDoc.title}" has been deleted successfully.`);
    
    // Refresh the document list
    if (selectedCompanyId) {
        loadCompanyContent(selectedCompanyId);
    }
}

// ==================== COMPANY INFO FUNCTIONS ====================

function saveCompanyInfo() {
    const companyInfo = {
        name: document.getElementById('companyName').value,
        address1: document.getElementById('companyAddress1').value,
        address2: document.getElementById('companyAddress2').value,
        address3: document.getElementById('companyAddress3').value,
        registration: document.getElementById('companyRegistration').value,
        contact: document.getElementById('companyContact').value,
        vat: document.getElementById('companyVAT').value
    };
    
    // Save to localStorage
    localStorage.setItem('boitshepoCompanyInfo', JSON.stringify(companyInfo));
    
    alert('Company information saved successfully! This will apply to all new documents.');
}

function loadCompanyInfo() {
    const savedInfo = localStorage.getItem('boitshepoCompanyInfo');
    
    if (savedInfo) {
        try {
            const companyInfo = JSON.parse(savedInfo);
            
            // Update all editable fields
            if (document.getElementById('companyName')) {
                document.getElementById('companyName').value = companyInfo.name || 'BOITSHEPO CONSORTIUM (PTY) LTD';
            }
            if (document.getElementById('companyAddress1')) {
                document.getElementById('companyAddress1').value = companyInfo.address1 || '29 Circle drive';
            }
            if (document.getElementById('companyAddress2')) {
                document.getElementById('companyAddress2').value = companyInfo.address2 || 'Tzaneen Ext 04';
            }
            if (document.getElementById('companyAddress3')) {
                document.getElementById('companyAddress3').value = companyInfo.address3 || 'Tzaneen, 0850';
            }
            if (document.getElementById('companyRegistration')) {
                document.getElementById('companyRegistration').value = companyInfo.registration || '2012/104697/07';
            }
            if (document.getElementById('companyContact')) {
                document.getElementById('companyContact').value = companyInfo.contact || '0836711199 admin@boitshepoconsortium.co.za';
            }
            if (document.getElementById('companyVAT')) {
                document.getElementById('companyVAT').value = companyInfo.vat || 'VAT: 3230299879 TAX NO: 9963185153';
            }
        } catch (e) {
            console.error('Error loading company info:', e);
        }
    }
}

function getCompanyInfoForDocument() {
    return {
        name: document.getElementById('companyName') ? document.getElementById('companyName').value : 'BOITSHEPO CONSORTIUM (PTY) LTD',
        address1: document.getElementById('companyAddress1') ? document.getElementById('companyAddress1').value : '29 Circle drive',
        address2: document.getElementById('companyAddress2') ? document.getElementById('companyAddress2').value : 'Tzaneen Ext 04',
        address3: document.getElementById('companyAddress3') ? document.getElementById('companyAddress3').value : 'Tzaneen, 0850',
        registration: document.getElementById('companyRegistration') ? document.getElementById('companyRegistration').value : '2012/104697/07',
        contact: document.getElementById('companyContact') ? document.getElementById('companyContact').value : '0836711199 admin@boitshepoconsortium.co.za',
        vat: document.getElementById('companyVAT') ? document.getElementById('companyVAT').value : 'VAT: 3230299879 TAX NO: 9963185153'
    };
}

// ==================== DOCUMENT NAMING AND SAVING ====================

function saveAndCloseDocumentWithName() {
    // Create document data first
    const documentData = createDocumentData(currentDocumentType);
    
    if (currentEditingDocument) {
        // Update existing document - show name modal if title is default
        if (currentEditingDocument.title.match(/^(Invoice|Quotation|Purchase Order|Delivery Note)\s+/)) {
            pendingDocumentData = documentData;
            showDocumentNameModal(documentData, true, true);
        } else {
            saveDocumentDirectly(documentData);
            invoiceModal.style.display = 'none';
        }
    } else {
        // New document - always show name modal
        pendingDocumentData = documentData;
        showDocumentNameModal(documentData, false, true);
    }
}

function showDocumentNameModal(documentData, isEdit = false, closeAfterSave = false) {
    pendingDocumentData = documentData;
    pendingCloseAfterSave = closeAfterSave;
    
    const modal = document.getElementById('documentNameModal');
    const title = document.getElementById('documentNameModalTitle');
    const input = document.getElementById('documentNameInput');
    const modalBody = document.querySelector('#documentNameModal .modal-body');
    
    const docTypeName = currentDocumentType.charAt(0).toUpperCase() + currentDocumentType.slice(1);
    title.textContent = isEdit ? `Rename ${docTypeName}` : `Name Your ${docTypeName}`;
    
    // Extract base name if it contains document type
    let baseName = documentData.title;
    if (baseName) {
        baseName = baseName.replace(/\s*(invoice|quotation|purchase order|delivery note)\s*/gi, '').trim();
    }
    input.value = baseName || '';
    
    // Update prompt text
    let promptEl = modalBody.querySelector('p');
    if (!promptEl) {
        promptEl = document.createElement('p');
        promptEl.style.fontSize = '12px';
        promptEl.style.color = '#666';
        promptEl.style.marginTop = '5px';
        modalBody.appendChild(promptEl);
    }
    
    if (!isEdit) {
        promptEl.innerHTML = `This name will be used for all related documents.<br>
                             Example: "Benoni" will create "Benoni Invoice", "Benoni Quotation", etc.`;
        
        // Create document selection options
        let checkboxContainer = modalBody.querySelector('.checkbox-container');
        if (!checkboxContainer) {
            checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-container';
            modalBody.appendChild(checkboxContainer);
        }
        
        // Get available document types (excluding the current one)
        const availableTypes = ['invoice', 'quotation', 'purchase order', 'delivery note']
            .filter(type => type !== currentDocumentType);
        
        checkboxContainer.innerHTML = `
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                    <input type="checkbox" id="createAllDocsCheckbox" checked style="width: auto;">
                    <span>Create all related documents</span>
                </label>
            </div>
            <div id="documentSelection" style="padding-left: 20px; border-left: 2px solid #e0e0e0;">
                <p style="font-size: 13px; margin-bottom: 10px; color: #555;">Or select specific documents:</p>
                ${availableTypes.map(type => {
                    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                    return `
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                            <input type="checkbox" id="create${type.replace(/\s+/g, '')}" class="doc-type-checkbox" checked style="width: auto;">
                            <span>${typeName}</span>
                        </label>
                    `;
                }).join('')}
            </div>
        `;
        
        // Add event listener for the "Create all" checkbox
        setTimeout(() => {
            const createAllCheckbox = document.getElementById('createAllDocsCheckbox');
            const docTypeCheckboxes = document.querySelectorAll('.doc-type-checkbox');
            const documentSelection = document.getElementById('documentSelection');
            
            if (createAllCheckbox) {
                createAllCheckbox.addEventListener('change', function() {
                    const isChecked = this.checked;
                    documentSelection.style.display = isChecked ? 'none' : 'block';
                    
                    // When "Create all" is checked, disable specific checkboxes
                    docTypeCheckboxes.forEach(cb => {
                        cb.disabled = isChecked;
                        if (isChecked) cb.checked = false;
                    });
                });
                
                // Initially show/hide based on "Create all" state
                documentSelection.style.display = createAllCheckbox.checked ? 'none' : 'block';
                docTypeCheckboxes.forEach(cb => {
                    cb.disabled = createAllCheckbox.checked;
                });
            }
            
            // Add event listeners to specific document checkboxes
            docTypeCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    // If any specific document is selected, uncheck "Create all"
                    const createAllCheckbox = document.getElementById('createAllDocsCheckbox');
                    if (this.checked && createAllCheckbox.checked) {
                        createAllCheckbox.checked = false;
                        documentSelection.style.display = 'block';
                        docTypeCheckboxes.forEach(cb => cb.disabled = false);
                    }
                });
            });
        }, 100);
        
        checkboxContainer.style.display = 'block';
    } else {
        promptEl.innerHTML = 'Enter a new name for this document.';
        
        const checkboxContainer = modalBody.querySelector('.checkbox-container');
        if (checkboxContainer) {
            checkboxContainer.style.display = 'none';
        }
    }
    
    invoiceModal.style.display = 'none';
    modal.style.display = 'flex';
    input.focus();
}

function cancelDocumentNaming() {
    document.getElementById('documentNameModal').style.display = 'none';
    invoiceModal.style.display = 'flex';
    pendingDocumentData = null;
}

function getSelectedDocumentTypes() {
    const selectedTypes = [];
    
    // Check if "Create all" is selected
    const createAllCheckbox = document.getElementById('createAllDocsCheckbox');
    if (createAllCheckbox && createAllCheckbox.checked) {
        // Get all document types except the current one
        const allTypes = ['invoice', 'quotation', 'purchase order', 'delivery note'];
        return allTypes.filter(type => type !== currentDocumentType);
    } else {
        // Check individual checkboxes
        const checkboxes = document.querySelectorAll('.doc-type-checkbox:checked');
        checkboxes.forEach(cb => {
            // Extract document type from checkbox id (remove "create" prefix)
            const docType = cb.id.replace('create', '').toLowerCase();
            if (docType !== currentDocumentType) {
                selectedTypes.push(docType);
            }
        });
    }
    
    return selectedTypes;
}
function confirmDocumentName() {
    const baseName = document.getElementById('documentNameInput').value.trim();
    
    if (!baseName) {
        alert('Please enter a document name');
        return;
    }
    
    if (pendingDocumentData) {
        // Update title based on document type
        const docTypeName = currentDocumentType.charAt(0).toUpperCase() + currentDocumentType.slice(1);
        pendingDocumentData.title = `${baseName} ${docTypeName}`;
        
        // Get selected document types for creation
        const selectedDocTypes = getSelectedDocumentTypes();
        
        debugLog('Saving document with types:', {
            mainType: currentDocumentType,
            additionalTypes: selectedDocTypes,
            documentData: pendingDocumentData
        });
        
        // Save the document(s)
        saveDocumentDirectly(pendingDocumentData, selectedDocTypes);
        
        // Reset the form for next use
        if (!currentEditingDocument) {
            resetDocumentForm();
        }
        
        // Close modals
        document.getElementById('documentNameModal').style.display = 'none';
        
        // Only close invoice modal if we're not in edit mode
        if (!currentEditingDocument) {
            invoiceModal.style.display = 'none';
        }
        
        // Reset editing state if not editing
        if (!currentEditingDocument) {
            currentEditingDocument = null;
        }
        
        pendingDocumentData = null;
        
        // Show success message
        if (selectedDocTypes.length > 0) {
            alert(`Successfully created ${1 + selectedDocTypes.length} document(s)!`);
        } else {
            alert('Document saved successfully!');
        }
    }
}

function renameDocumentPrompt(docId) {
    renamingDocumentId = docId;
    
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;
    
    const doc = findDocumentById(docId);
    if (!doc) return;
    
    const input = document.getElementById('renameDocumentInput');
    
    // Extract base name
    let baseName = doc.title;
    if (baseName) {
        baseName = baseName.replace(/\s*(invoice|quotation|purchase order|delivery note)\s*/gi, '').trim();
    }
    input.value = baseName || '';
    
    renameDocumentModal.style.display = 'flex';
    input.focus();
}

function cancelRename() {
    renameDocumentModal.style.display = 'none';
    renamingDocumentId = null;
}

function confirmRename() {
    const newBaseName = document.getElementById('renameDocumentInput').value.trim();
    
    if (!newBaseName) {
        alert('Please enter a document name');
        return;
    }
    
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;
    
    const doc = findDocumentById(renamingDocumentId);
    if (doc) {
        const oldBaseName = doc.title.replace(/\s*(invoice|quotation|purchase order|delivery note)\s*/gi, '').trim();
        const docTypeName = doc.type.charAt(0).toUpperCase() + doc.type.slice(1);
        doc.title = `${newBaseName} ${docTypeName}`;
        doc.lastModified = new Date().toISOString().split('T')[0];
        
        // Update linked documents if they exist
        if (linkedDocuments[oldBaseName]) {
            // Update the linked documents entry
            linkedDocuments[newBaseName] = linkedDocuments[oldBaseName];
            delete linkedDocuments[oldBaseName];
            
            // Update all linked document titles
            updateLinkedDocuments(newBaseName, doc);
        }
        
        // Save to localStorage
        saveCompaniesToStorage();
        
        // Refresh documents display
        if (selectedCompanyId) {
            loadCompanyContent(selectedCompanyId);
        }
        
        alert('Document renamed successfully!');
    }
    
    renameDocumentModal.style.display = 'none';
    renamingDocumentId = null;
}

function printInvoice() {
    window.print();
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('invoiceLogo').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function viewDocument(docId) {
    const doc = findDocumentById(docId);
    
    if (doc) {
        openDocumentEditor(docId);
    } else {
        alert('Document not found');
    }
}

function editDocument(docId) {
    const doc = findDocumentById(docId);
    
    if (doc) {
        openDocumentEditor(docId);
    } else {
        alert('Document not found');
    }
}

function printDocument(docId) {
    const doc = findDocumentById(docId);
    
    if (doc) {
        openDocumentEditor(docId);
        setTimeout(() => {
            printInvoice();
        }, 500);
    } else {
        alert(`Document not found`);
    }
}

function saveNewCompany() {
    const name = document.getElementById('newCompanyName').value;
    const industry = document.getElementById('newCompanyIndustry').value;
    const contact = document.getElementById('newCompanyContact').value;
    const email = document.getElementById('newCompanyEmail').value;
    const description = document.getElementById('newCompanyDescription').value;
    
    if (!name || !industry || !contact || !email) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newCompany = {
        id: companies.length + 1,
        name: name,
        industry: industry,
        contact: contact,
        email: email,
        description: description,
        folders: [],
        documents: []
    };
    
    companies.push(newCompany);
    
    // Save to localStorage
    saveCompaniesToStorage();
    
    alert(`Company "${name}" added successfully!`);
    addCompanyModal.style.display = 'none';
    
    // Reset form
    document.getElementById('companyForm').reset();
    
    // Refresh companies list
    loadCompanies();
}
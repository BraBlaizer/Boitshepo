# app.py
import streamlit as st
import pandas as pd
import json
import os
import datetime
import base64
from io import BytesIO
from typing import Dict, List, Optional
import uuid

# Set page config
st.set_page_config(
    page_title="Boitshepo Consortium Document Management",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==================== DATA MODELS ====================

class User:
    def __init__(self, user_data: Dict):
        self.id = user_data['id']
        self.password = user_data['password']
        self.name = user_data['name']
        self.role = user_data['role']
        self.email = user_data['email']
        self.phone = user_data.get('phone', '')
        self.department = user_data.get('department', '')
        self.avatar = user_data.get('avatar', self.name[:2].upper())
        self.created = user_data.get('created', datetime.datetime.now().isoformat())
        self.last_login = user_data.get('last_login')
        self.must_change_password = user_data.get('must_change_password', False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'password': self.password,
            'name': self.name,
            'role': self.role,
            'email': self.email,
            'phone': self.phone,
            'department': self.department,
            'avatar': self.avatar,
            'created': self.created,
            'last_login': self.last_login,
            'must_change_password': self.must_change_password
        }

class Company:
    def __init__(self, company_data: Dict):
        self.id = company_data['id']
        self.name = company_data['name']
        self.industry = company_data['industry']
        self.contact = company_data['contact']
        self.email = company_data['email']
        self.description = company_data.get('description', '')
        self.folders = company_data.get('folders', [])
        self.documents = company_data.get('documents', [])
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'industry': self.industry,
            'contact': self.contact,
            'email': self.email,
            'description': self.description,
            'folders': self.folders,
            'documents': self.documents
        }

class Document:
    def __init__(self, document_data: Dict):
        self.id = document_data.get('id', str(uuid.uuid4()))
        self.type = document_data['type']
        self.title = document_data['title']
        self.client_name = document_data.get('client_name', '')
        self.address1 = document_data.get('address1', '')
        self.address2 = document_data.get('address2', '')
        self.vat = document_data.get('vat', '')
        self.date = document_data.get('date', datetime.datetime.now().strftime('%Y-%m-%d'))
        self.items = document_data.get('items', [])
        self.status = document_data.get('status', 'completed')
        self.company = document_data.get('company', '')
        self.company_id = document_data.get('company_id')
        self.folder_id = document_data.get('folder_id')
        self.created_by = document_data.get('created_by', '')
        self.created_at = document_data.get('created_at', datetime.datetime.now().strftime('%Y-%m-%d'))
        self.last_modified = document_data.get('last_modified', datetime.datetime.now().strftime('%Y-%m-%d'))
        self.company_info = document_data.get('company_info', {})
        
        # Document-specific fields
        self.invoice_number = document_data.get('invoice_number', '')
        self.quotation_number = document_data.get('quotation_number', '')
        self.po_number = document_data.get('po_number', '')
        self.delivery_number = document_data.get('delivery_number', '')
        self.ref_number = document_data.get('ref_number', '')
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'client_name': self.client_name,
            'address1': self.address1,
            'address2': self.address2,
            'vat': self.vat,
            'date': self.date,
            'items': self.items,
            'status': self.status,
            'company': self.company,
            'company_id': self.company_id,
            'folder_id': self.folder_id,
            'created_by': self.created_by,
            'created_at': self.created_at,
            'last_modified': self.last_modified,
            'company_info': self.company_info,
            'invoice_number': self.invoice_number,
            'quotation_number': self.quotation_number,
            'po_number': self.po_number,
            'delivery_number': self.delivery_number,
            'ref_number': self.ref_number
        }

# ==================== DATA MANAGEMENT ====================

class DataManager:
    def __init__(self):
        self.users = {}
        self.companies = []
        self.company_info = {}
        self.load_data()
    
    def load_data(self):
        """Load data from session state or initialize with defaults"""
        if 'users' not in st.session_state:
            self.initialize_users()
        else:
            self.users = st.session_state.users
        
        if 'companies' not in st.session_state:
            self.initialize_companies()
        else:
            self.companies = st.session_state.companies
        
        if 'company_info' not in st.session_state:
            self.initialize_company_info()
        else:
            self.company_info = st.session_state.company_info
    
    def save_data(self):
        """Save data to session state"""
        st.session_state.users = self.users
        st.session_state.companies = self.companies
        st.session_state.company_info = self.company_info
    
    def initialize_users(self):
        """Initialize default users"""
        default_users = [
            {
                'id': 'admin001',
                'password': 'Admin@12345',
                'name': 'System Administrator',
                'role': 'admin',
                'email': 'admin@boitshepo.co.za',
                'phone': '+27820000000',
                'department': 'Administration',
                'avatar': 'SA',
                'created': '2024-01-01',
                'last_login': None,
                'must_change_password': True
            },
            {
                'id': 'Mmamahlodi_P',
                'password': 'Prince@1234',
                'name': 'Prince Mmamahlodi',
                'role': 'admin',
                'email': 'Princelegodi0@gmail.com',
                'phone': '+27722242357',
                'department': 'Management',
                'avatar': 'PM',
                'created': '2024-01-01',
                'last_login': None,
                'must_change_password': False
            },
            {
                'id': 'emp001',
                'password': 'Employee@123',
                'name': 'John Doe',
                'role': 'employee',
                'email': 'john.doe@boitshepo.co.za',
                'phone': '+27821111111',
                'department': 'Finance',
                'avatar': 'JD',
                'created': '2024-01-01',
                'last_login': None,
                'must_change_password': False
            }
        ]
        
        for user_data in default_users:
            user = User(user_data)
            self.users[user.id] = user
        
        st.session_state.users = self.users
    
    def initialize_companies(self):
        """Initialize default companies"""
        default_companies = [
            {
                'id': 1,
                'name': "Boitshepo Consortium",
                'industry': "Construction",
                'contact': "Thabo Mbeki",
                'email': "contact@boitshepo.co.za",
                'description': "Main consortium company",
                'folders': [
                    {
                        'id': "folder1",
                        'name': "Invoices",
                        'parent_id': None,
                        'documents': []
                    },
                    {
                        'id': "folder2",
                        'name': "Contracts",
                        'parent_id': None,
                        'documents': []
                    }
                ],
                'documents': []
            },
            {
                'id': 2,
                'name': "Afroland Consortium",
                'industry': "Trading",
                'contact': "Naledi Smith",
                'email': "info@afroland.co.za",
                'description': "Trading and import/export",
                'folders': [],
                'documents': []
            }
        ]
        
        for company_data in default_companies:
            company = Company(company_data)
            self.companies.append(company)
        
        st.session_state.companies = self.companies
    
    def initialize_company_info(self):
        """Initialize default company info"""
        self.company_info = {
            'name': 'BOITSHEPO CONSORTIUM (PTY) LTD',
            'address1': '29 Circle drive',
            'address2': 'Tzaneen Ext 04',
            'address3': 'Tzaneen, 0850',
            'registration': '2012/104697/07',
            'contact': '0836711199 admin@boitshepoconsortium.co.za',
            'vat': 'VAT: 3230299879 TAX NO: 9963185153'
        }
        st.session_state.company_info = self.company_info
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)
    
    def authenticate_user(self, user_id: str, password: str) -> Optional[User]:
        user = self.get_user_by_id(user_id)
        if user and user.password == password:
            user.last_login = datetime.datetime.now().isoformat()
            self.save_data()
            return user
        return None
    
    def change_user_password(self, user_id: str, new_password: str) -> bool:
        user = self.get_user_by_id(user_id)
        if user:
            user.password = new_password
            user.must_change_password = False
            self.save_data()
            return True
        return False
    
    def get_company_by_id(self, company_id: int) -> Optional[Company]:
        for company in self.companies:
            if company.id == company_id:
                return company
        return None
    
    def add_document(self, company_id: int, document: Document, folder_id: str = None) -> bool:
        company = self.get_company_by_id(company_id)
        if not company:
            return False
        
        if folder_id:
            # Add to folder
            folder = next((f for f in company.folders if f['id'] == folder_id), None)
            if folder:
                folder['documents'].append(document.to_dict())
        else:
            # Add to root
            company.documents.append(document.to_dict())
        
        self.save_data()
        return True
    
    def update_document(self, company_id: int, document_id: str, updated_document: Document) -> bool:
        company = self.get_company_by_id(company_id)
        if not company:
            return False
        
        # Search in root documents
        for i, doc in enumerate(company.documents):
            if doc['id'] == document_id:
                company.documents[i] = updated_document.to_dict()
                self.save_data()
                return True
        
        # Search in folder documents
        for folder in company.folders:
            for i, doc in enumerate(folder['documents']):
                if doc['id'] == document_id:
                    folder['documents'][i] = updated_document.to_dict()
                    self.save_data()
                    return True
        
        return False
    
    def delete_document(self, company_id: int, document_id: str) -> bool:
        company = self.get_company_by_id(company_id)
        if not company:
            return False
        
        # Try to delete from root
        for i, doc in enumerate(company.documents):
            if doc['id'] == document_id:
                company.documents.pop(i)
                self.save_data()
                return True
        
        # Try to delete from folders
        for folder in company.folders:
            for i, doc in enumerate(folder['documents']):
                if doc['id'] == document_id:
                    folder['documents'].pop(i)
                    self.save_data()
                    return True
        
        return False
    
    def add_company(self, company_data: Dict) -> bool:
        new_id = max([c.id for c in self.companies], default=0) + 1
        company_data['id'] = new_id
        company = Company(company_data)
        self.companies.append(company)
        self.save_data()
        return True

# ==================== PASSWORD VALIDATION ====================

def validate_password(password: str) -> tuple:
    """Validate password against requirements"""
    if len(password) < 10 or len(password) > 30:
        return False, "Password must be 10-30 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    
    special_chars = '!@#$%^&*'
    if not any(c in special_chars for c in password):
        return False, f"Password must contain at least one special character ({special_chars})"
    
    return True, ""

# ==================== DOCUMENT TEMPLATES ====================

def get_document_template(doc_type: str) -> Dict:
    """Get template for different document types"""
    templates = {
        'invoice': {
            'title_prefix': 'Invoice',
            'number_prefix': 'INV',
            'document_title': 'TAX INVOICE',
            'address_label': 'BILL TO'
        },
        'quotation': {
            'title_prefix': 'Quotation',
            'number_prefix': 'Q',
            'document_title': 'QUOTATION',
            'address_label': 'QUOTE TO'
        },
        'purchase order': {
            'title_prefix': 'Purchase Order',
            'number_prefix': 'PO',
            'document_title': 'PURCHASE ORDER',
            'address_label': 'SHIP TO'
        },
        'delivery note': {
            'title_prefix': 'Delivery Note',
            'number_prefix': 'DN',
            'document_title': 'DELIVERY NOTE',
            'address_label': 'BILL TO'
        }
    }
    return templates.get(doc_type, templates['invoice'])

def calculate_totals(items: List[Dict]) -> Dict:
    """Calculate subtotal, tax, and grand total from items"""
    subtotal = sum(item.get('qty', 1) * item.get('price', 0) for item in items)
    tax = subtotal * 0.15
    grand_total = subtotal + tax
    
    return {
        'subtotal': subtotal,
        'tax': tax,
        'grand_total': grand_total
    }

# ==================== STREAMLIT PAGES ====================

def login_page(data_manager: DataManager):
    """Login page"""
    st.title("Boitshepo Consortium Document Management System")
    st.subheader("Employee Login Portal")
    
    with st.container():
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            with st.form("login_form"):
                employee_id = st.text_input("Employee ID", key="login_employee_id")
                password = st.text_input("Password", type="password", key="login_password")
                
                col_a, col_b = st.columns(2)
                with col_a:
                    login_button = st.form_submit_button("Login to System", type="primary", use_container_width=True)
                with col_b:
                    forgot_password = st.form_submit_button("Forgot Password?", use_container_width=True)
                
                if login_button:
                    if not employee_id or not password:
                        st.error("Please enter both Employee ID and Password")
                    else:
                        user = data_manager.authenticate_user(employee_id, password)
                        if user:
                            st.session_state.user = user
                            st.session_state.page = "main" if not user.must_change_password else "change_password"
                            st.rerun()
                        else:
                            st.error("Invalid Employee ID or Password")
                
                if forgot_password:
                    st.session_state.page = "forgot_password"
                    st.rerun()

def change_password_page(data_manager: DataManager):
    """Change password page (for first login)"""
    st.title("Change Password")
    st.warning("You must change your password before proceeding.")
    
    with st.form("change_password_form"):
        current_password = st.text_input("Current Password", type="password")
        new_password = st.text_input("New Password", type="password")
        confirm_password = st.text_input("Confirm New Password", type="password")
        
        st.info("Password Requirements:")
        st.markdown("""
        - 10-30 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one number
        - At least one special character (!@#$%^&*)
        """)
        
        change_button = st.form_submit_button("Change Password", type="primary")
        
        if change_button:
            if not all([current_password, new_password, confirm_password]):
                st.error("Please fill in all fields")
            elif new_password != confirm_password:
                st.error("Passwords do not match")
            else:
                is_valid, message = validate_password(new_password)
                if not is_valid:
                    st.error(message)
                else:
                    user = st.session_state.user
                    if user.password != current_password:
                        st.error("Current password is incorrect")
                    else:
                        if data_manager.change_user_password(user.id, new_password):
                            st.success("Password changed successfully! Redirecting...")
                            st.session_state.page = "main"
                            st.rerun()
                        else:
                            st.error("Failed to change password")

def forgot_password_page(data_manager: DataManager):
    """Forgot password page"""
    st.title("Password Recovery")
    
    tab1, tab2 = st.tabs(["Send Verification Code", "Verify Code"])
    
    with tab1:
        with st.form("forgot_password_form"):
            employee_id = st.text_input("Employee ID")
            send_button = st.form_submit_button("Send Verification Code", type="primary")
            
            if send_button:
                if not employee_id:
                    st.error("Please enter your Employee ID")
                else:
                    user = data_manager.get_user_by_id(employee_id)
                    if not user:
                        st.error("Employee ID not found in the system")
                    elif not user.phone:
                        st.error("No phone number registered for this account. Please contact IT support.")
                    else:
                        # Generate verification code (demo mode)
                        verification_code = str(uuid.uuid4())[:6].upper()
                        st.session_state.verification_code = verification_code
                        st.session_state.reset_employee_id = employee_id
                        
                        # Show verification code (in real app, this would be sent via SMS)
                        st.success(f"Demo Mode: Verification code sent to {user.phone[-4:]}")
                        st.info(f"Your verification code is: **{verification_code}**")
                        st.session_state.forgot_password_tab = 2
                        st.rerun()
    
    with tab2:
        if 'verification_code' not in st.session_state:
            st.info("Please request a verification code first")
        else:
            with st.form("verify_code_form"):
                entered_code = st.text_input("Enter 6-digit verification code", max_chars=6).upper()
                verify_button = st.form_submit_button("Verify Code", type="primary")
                
                if verify_button:
                    if not entered_code or len(entered_code) != 6:
                        st.error("Please enter a valid 6-digit code")
                    elif entered_code != st.session_state.verification_code:
                        st.error("Invalid verification code")
                    else:
                        user = data_manager.get_user_by_id(st.session_state.reset_employee_id)
                        if user:
                            st.success(f"Success! Your password has been sent to {user.email}")
                            st.info(f"Demo Mode: Your password is: **{user.password}**")
                            del st.session_state.verification_code
                            del st.session_state.reset_employee_id
                            st.session_state.page = "login"
                            st.rerun()

def main_page(data_manager: DataManager):
    """Main dashboard page"""
    user = st.session_state.user
    
    # Header
    col1, col2, col3 = st.columns([3, 6, 3])
    with col1:
        st.markdown(f"### {user.name}")
        st.caption(f"{user.role.capitalize()} • {user.department}")
    with col3:
        if st.button("Logout", type="secondary"):
            del st.session_state.user
            st.session_state.page = "login"
            st.rerun()
        if st.button("Profile"):
            st.session_state.page = "profile"
            st.rerun()
        if user.role == 'admin' and st.button("Admin Panel"):
            st.session_state.page = "admin"
            st.rerun()
    
    st.divider()
    
    # Hero Section
    st.title("Boitshepo Consortium Document Management")
    st.markdown(f"Welcome, {user.name}. Manage documents for all companies.")
    
    # Quick Actions
    st.subheader("Quick Actions")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        if st.button("📄 New Invoice", use_container_width=True):
            st.session_state.create_document_type = "invoice"
            st.session_state.page = "create_document"
            st.rerun()
    with col2:
        if st.button("📋 New Quotation", use_container_width=True):
            st.session_state.create_document_type = "quotation"
            st.session_state.page = "create_document"
            st.rerun()
    with col3:
        if st.button("📝 New Purchase Order", use_container_width=True):
            st.session_state.create_document_type = "purchase order"
            st.session_state.page = "create_document"
            st.rerun()
    with col4:
        if st.button("🚚 New Delivery Note", use_container_width=True):
            st.session_state.create_document_type = "delivery note"
            st.session_state.page = "create_document"
            st.rerun()
    
    st.divider()
    
    # Company Selection
    st.subheader("Select a Company")
    st.markdown("Choose a company to view or create documents")
    
    companies = data_manager.companies
    if not companies:
        st.info("No companies available. Contact admin to add companies.")
        return
    
    cols = st.columns(min(4, len(companies)))
    for idx, company in enumerate(companies):
        with cols[idx % len(cols)]:
            with st.container(border=True):
                st.markdown(f"**{company.name}**")
                st.caption(f"📊 {company.industry}")
                st.caption(f"📧 {company.email}")
                
                total_docs = len(company.documents) + sum(len(f['documents']) for f in company.folders)
                st.metric("Documents", total_docs)
                
                if st.button("View Documents", key=f"view_{company.id}", use_container_width=True):
                    st.session_state.selected_company_id = company.id
                    st.session_state.page = "company_documents"
                    st.rerun()

def profile_page(data_manager: DataManager):
    """User profile page"""
    user = st.session_state.user
    
    st.title("User Profile")
    
    col1, col2 = st.columns([1, 3])
    with col1:
        st.markdown(f"## {user.avatar}")
        st.markdown(f"### {user.name}")
        st.caption(f"**Role:** {user.role.capitalize()}")
        st.caption(f"**Department:** {user.department}")
        st.caption(f"**Email:** {user.email}")
        st.caption(f"**Phone:** {user.phone}")
        st.caption(f"**Employee ID:** {user.id}")
    
    with col2:
        st.subheader("Change Password")
        with st.form("profile_change_password"):
            current_password = st.text_input("Current Password", type="password")
            new_password = st.text_input("New Password", type="password")
            confirm_password = st.text_input("Confirm New Password", type="password")
            
            change_button = st.form_submit_button("Change Password", type="primary")
            
            if change_button:
                if not all([current_password, new_password, confirm_password]):
                    st.error("Please fill in all fields")
                elif new_password != confirm_password:
                    st.error("Passwords do not match")
                else:
                    is_valid, message = validate_password(new_password)
                    if not is_valid:
                        st.error(message)
                    else:
                        if user.password != current_password:
                            st.error("Current password is incorrect")
                        else:
                            if data_manager.change_user_password(user.id, new_password):
                                st.success("Password changed successfully!")
                                st.session_state.user = data_manager.get_user_by_id(user.id)
                            else:
                                st.error("Failed to change password")
    
    st.divider()
    
    if st.button("Back to Dashboard"):
        st.session_state.page = "main"
        st.rerun()

def admin_page(data_manager: DataManager):
    """Admin panel"""
    user = st.session_state.user
    
    if user.role != 'admin':
        st.error("Access denied. Admin privileges required.")
        st.button("Back to Dashboard", on_click=lambda: set_page("main"))
        return
    
    st.title("Admin Panel")
    
    tab1, tab2, tab3 = st.tabs(["User Management", "Company Management", "System Settings"])
    
    with tab1:
        st.subheader("User Management")
        
        col1, col2 = st.columns([3, 1])
        with col2:
            if st.button("➕ Add New User", use_container_width=True):
                st.session_state.admin_edit_user_id = None
                st.session_state.page = "admin_edit_user"
                st.rerun()
        
        # Display users
        users = list(data_manager.users.values())
        user_df = pd.DataFrame([{
            'ID': u.id,
            'Name': u.name,
            'Role': u.role,
            'Email': u.email,
            'Department': u.department,
            'Last Login': u.last_login[:10] if u.last_login else 'Never'
        } for u in users])
        
        st.dataframe(
            user_df,
            use_container_width=True,
            column_config={
                "ID": st.column_config.TextColumn("Employee ID"),
                "Name": st.column_config.TextColumn("Full Name"),
                "Role": st.column_config.SelectboxColumn(
                    "Role",
                    options=["admin", "manager", "employee"]
                ),
                "Email": st.column_config.TextColumn("Email"),
                "Department": st.column_config.TextColumn("Department"),
                "Last Login": st.column_config.TextColumn("Last Login")
            },
            hide_index=True
        )
        
        # Edit/Delete buttons
        for idx, user_row in user_df.iterrows():
            col1, col2, col3 = st.columns([4, 1, 1])
            with col2:
                if st.button("Edit", key=f"edit_{user_row['ID']}", use_container_width=True):
                    st.session_state.admin_edit_user_id = user_row['ID']
                    st.session_state.page = "admin_edit_user"
                    st.rerun()
            with col3:
                if st.button("Delete", key=f"del_{user_row['ID']}", use_container_width=True, type="secondary"):
                    if user_row['ID'] == st.session_state.user.id:
                        st.error("You cannot delete your own account")
                    else:
                        if st.session_state.get(f"confirm_delete_{user_row['ID']}", False):
                            del data_manager.users[user_row['ID']]
                            data_manager.save_data()
                            st.success(f"User {user_row['ID']} deleted")
                            st.rerun()
                        else:
                            st.session_state[f"confirm_delete_{user_row['ID']}"] = True
                            st.warning(f"Click Delete again to confirm deletion of {user_row['ID']}")
    
    with tab2:
        st.subheader("Company Management")
        
        if st.button("➕ Add New Company", type="primary"):
            st.session_state.page = "admin_add_company"
            st.rerun()
        
        # Display companies
        for company in data_manager.companies:
            with st.expander(f"{company.name} ({company.industry})"):
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.write(f"**Contact:** {company.contact}")
                    st.write(f"**Email:** {company.email}")
                    st.write(f"**Description:** {company.description}")
                with col2:
                    total_docs = len(company.documents) + sum(len(f['documents']) for f in company.folders)
                    st.metric("Total Documents", total_docs)
    
    with tab3:
        st.subheader("System Settings")
        
        st.markdown("### Company Information")
        with st.form("company_info_form"):
            company_info = data_manager.company_info
            
            name = st.text_input("Company Name", value=company_info['name'])
            address1 = st.text_input("Address Line 1", value=company_info['address1'])
            address2 = st.text_input("Address Line 2", value=company_info['address2'])
            address3 = st.text_input("Address Line 3", value=company_info['address3'])
            registration = st.text_input("Registration Number", value=company_info['registration'])
            contact = st.text_input("Contact Information", value=company_info['contact'])
            vat = st.text_input("VAT/Tax Information", value=company_info['vat'])
            
            if st.form_submit_button("Save Company Info", type="primary"):
                data_manager.company_info = {
                    'name': name,
                    'address1': address1,
                    'address2': address2,
                    'address3': address3,
                    'registration': registration,
                    'contact': contact,
                    'vat': vat
                }
                data_manager.save_data()
                st.success("Company information saved!")

def admin_edit_user_page(data_manager: DataManager):
    """Add/edit user page"""
    user = st.session_state.user
    edit_user_id = st.session_state.get('admin_edit_user_id')
    is_edit = edit_user_id is not None
    
    st.title("Edit User" if is_edit else "Add New User")
    
    if is_edit:
        existing_user = data_manager.get_user_by_id(edit_user_id)
        if not existing_user:
            st.error("User not found")
            st.button("Back", on_click=lambda: set_page("admin"))
            return
    
    with st.form("edit_user_form"):
        user_id = st.text_input(
            "Employee ID *",
            value=existing_user.id if is_edit else "",
            disabled=is_edit
        )
        name = st.text_input(
            "Full Name *",
            value=existing_user.name if is_edit else ""
        )
        email = st.text_input(
            "Email Address *",
            value=existing_user.email if is_edit else ""
        )
        phone = st.text_input(
            "Phone Number",
            value=existing_user.phone if is_edit else ""
        )
        role = st.selectbox(
            "User Role *",
            ["employee", "manager", "admin"],
            index=["employee", "manager", "admin"].index(existing_user.role) if is_edit else 0
        )
        department = st.text_input(
            "Department",
            value=existing_user.department if is_edit else ""
        )
        
        if is_edit:
            password_note = "Leave blank to keep current password"
        else:
            password_note = "Initial password (user will change on first login)"
        
        password = st.text_input(
            "Password *",
            type="password",
            help=password_note,
            placeholder="Enter password" if not is_edit else "Leave blank to keep current"
        )
        
        col1, col2 = st.columns(2)
        with col1:
            cancel_button = st.form_submit_button("Cancel", type="secondary", use_container_width=True)
        with col2:
            save_button = st.form_submit_button("Save User", type="primary", use_container_width=True)
        
        if cancel_button:
            st.session_state.page = "admin"
            st.rerun()
        
        if save_button:
            if not all([user_id, name, email, role]):
                st.error("Please fill in all required fields (*)")
            elif not is_edit and not password:
                st.error("Please enter an initial password for new user")
            else:
                if password:
                    is_valid, message = validate_password(password)
                    if not is_valid:
                        st.error(message)
                        return
                
                if is_edit:
                    updates = {
                        'name': name,
                        'email': email,
                        'phone': phone,
                        'role': role,
                        'department': department
                    }
                    if password:
                        updates['password'] = password
                        updates['must_change_password'] = True
                    
                    data_manager.update_user(edit_user_id, updates)
                    st.success("User updated successfully!")
                else:
                    if data_manager.get_user_by_id(user_id):
                        st.error("User ID already exists")
                        return
                    
                    new_user = User({
                        'id': user_id,
                        'password': password,
                        'name': name,
                        'role': role,
                        'email': email,
                        'phone': phone,
                        'department': department,
                        'avatar': name[:2].upper(),
                        'created': datetime.datetime.now().isoformat(),
                        'last_login': None,
                        'must_change_password': True
                    })
                    data_manager.users[user_id] = new_user
                    data_manager.save_data()
                    st.success("User created successfully!")
                
                st.session_state.page = "admin"
                st.rerun()

def admin_add_company_page(data_manager: DataManager):
    """Add new company page"""
    st.title("Add New Company")
    
    with st.form("add_company_form"):
        name = st.text_input("Company Name *")
        industry = st.selectbox(
            "Industry *",
            ["Construction", "Trading", "Consulting", "Technology", "Manufacturing", "Other"]
        )
        contact = st.text_input("Contact Person *")
        email = st.text_input("Contact Email *")
        description = st.text_area("Company Description")
        
        col1, col2 = st.columns(2)
        with col1:
            cancel_button = st.form_submit_button("Cancel", type="secondary", use_container_width=True)
        with col2:
            save_button = st.form_submit_button("Add Company", type="primary", use_container_width=True)
        
        if cancel_button:
            st.session_state.page = "admin"
            st.rerun()
        
        if save_button:
            if not all([name, industry, contact, email]):
                st.error("Please fill in all required fields (*)")
            else:
                data_manager.add_company({
                    'name': name,
                    'industry': industry,
                    'contact': contact,
                    'email': email,
                    'description': description,
                    'folders': [],
                    'documents': []
                })
                st.success(f"Company '{name}' added successfully!")
                st.session_state.page = "admin"
                st.rerun()

def company_documents_page(data_manager: DataManager):
    """Company documents page"""
    company_id = st.session_state.get('selected_company_id')
    if not company_id:
        st.error("No company selected")
        st.button("Back to Companies", on_click=lambda: set_page("main"))
        return
    
    company = data_manager.get_company_by_id(company_id)
    if not company:
        st.error("Company not found")
        st.button("Back to Companies", on_click=lambda: set_page("main"))
        return
    
    # Header
    col1, col2 = st.columns([3, 1])
    with col1:
        st.title(f"{company.name} - Documents")
        st.caption(f"Manage documents for {company.name}")
    with col2:
        if st.button("Back to Companies", use_container_width=True):
            st.session_state.page = "main"
            st.rerun()
        
        if st.button("➕ Add Document", type="primary", use_container_width=True):
            st.session_state.create_document_company_id = company_id
            st.session_state.page = "create_document"
            st.rerun()
    
    st.divider()
    
    # Folders
    if company.folders:
        st.subheader("Folders")
        cols = st.columns(min(4, len(company.folders)))
        for idx, folder in enumerate(company.folders):
            with cols[idx % len(cols)]:
                with st.container(border=True):
                    st.markdown(f"📁 **{folder['name']}**")
                    st.caption(f"{len(folder['documents'])} documents")
                    if st.button("Open", key=f"open_{folder['id']}", use_container_width=True):
                        st.session_state.selected_folder_id = folder['id']
                        st.session_state.page = "folder_documents"
                        st.rerun()
    
    # Documents in root
    if company.documents:
        st.subheader("Documents")
        for doc in company.documents:
            with st.container(border=True):
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.markdown(f"**{doc['title']}**")
                    st.caption(f"📄 {doc['type'].upper()} • 📅 {doc['date']} • 👤 {doc['created_by']}")
                with col2:
                    col_a, col_b, col_c = st.columns(3)
                    with col_a:
                        if st.button("👁️", key=f"view_{doc['id']}", help="View"):
                            st.session_state.view_document_id = doc['id']
                            st.session_state.view_document_company_id = company_id
                            st.session_state.page = "view_document"
                            st.rerun()
                    with col_b:
                        if st.button("✏️", key=f"edit_{doc['id']}", help="Edit"):
                            st.session_state.edit_document_id = doc['id']
                            st.session_state.edit_document_company_id = company_id
                            st.session_state.page = "edit_document"
                            st.rerun()
                    with col_c:
                        if st.button("🗑️", key=f"del_{doc['id']}", help="Delete"):
                            if data_manager.delete_document(company_id, doc['id']):
                                st.success(f"Document '{doc['title']}' deleted")
                                st.rerun()
    else:
        st.info(f"No documents found for {company.name}. Create your first document!")

def folder_documents_page(data_manager: DataManager):
    """Folder documents page"""
    company_id = st.session_state.get('selected_company_id')
    folder_id = st.session_state.get('selected_folder_id')
    
    if not company_id or not folder_id:
        st.error("No company or folder selected")
        st.button("Back", on_click=lambda: set_page("company_documents"))
        return
    
    company = data_manager.get_company_by_id(company_id)
    if not company:
        st.error("Company not found")
        st.button("Back", on_click=lambda: set_page("main"))
        return
    
    folder = next((f for f in company.folders if f['id'] == folder_id), None)
    if not folder:
        st.error("Folder not found")
        st.button("Back", on_click=lambda: set_page("company_documents"))
        return
    
    # Header
    col1, col2 = st.columns([3, 1])
    with col1:
        st.title(f"{company.name} - {folder['name']}")
        st.caption(f"Documents in {folder['name']} folder")
    with col2:
        if st.button("Back to Company", use_container_width=True):
            st.session_state.page = "company_documents"
            st.rerun()
    
    st.divider()
    
    # Documents in folder
    if folder['documents']:
        for doc in folder['documents']:
            with st.container(border=True):
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.markdown(f"**{doc['title']}**")
                    st.caption(f"📄 {doc['type'].upper()} • 📅 {doc['date']} • 👤 {doc['created_by']}")
                with col2:
                    col_a, col_b, col_c = st.columns(3)
                    with col_a:
                        if st.button("👁️", key=f"view_{doc['id']}", help="View"):
                            st.session_state.view_document_id = doc['id']
                            st.session_state.view_document_company_id = company_id
                            st.session_state.page = "view_document"
                            st.rerun()
                    with col_b:
                        if st.button("✏️", key=f"edit_{doc['id']}", help="Edit"):
                            st.session_state.edit_document_id = doc['id']
                            st.session_state.edit_document_company_id = company_id
                            st.session_state.page = "edit_document"
                            st.rerun()
                    with col_c:
                        if st.button("🗑️", key=f"del_{doc['id']}", help="Delete"):
                            if data_manager.delete_document(company_id, doc['id']):
                                st.success(f"Document '{doc['title']}' deleted")
                                st.rerun()
    else:
        st.info(f"No documents found in {folder['name']}. Add documents to this folder.")

def create_document_page(data_manager: DataManager):
    """Create new document page"""
    doc_type = st.session_state.get('create_document_type', 'invoice')
    company_id = st.session_state.get('create_document_company_id')
    
    if not company_id:
        st.error("No company selected")
        st.button("Back", on_click=lambda: set_page("main"))
        return
    
    company = data_manager.get_company_by_id(company_id)
    if not company:
        st.error("Company not found")
        st.button("Back", on_click=lambda: set_page("main"))
        return
    
    template = get_document_template(doc_type)
    
    st.title(f"Create New {template['title_prefix']}")
    
    with st.form("create_document_form"):
        # Document Info
        col1, col2 = st.columns(2)
        with col1:
            document_name = st.text_input("Document Name *", value=f"{template['title_prefix']}")
            client_name = st.text_input(f"{template['address_label']} Name *")
            address1 = st.text_input("Address Line 1")
            address2 = st.text_input("Address Line 2")
            vat = st.text_input("VAT Number")
        
        with col2:
            # Generate document number
            next_num = len(company.documents) + sum(len(f['documents']) for f in company.folders) + 1
            doc_number = st.text_input(
                f"{template['title_prefix']} #",
                value=f"{template['number_prefix']}-{next_num:03d}"
            )
            doc_date = st.date_input("Date", value=datetime.date.today())
        
        # Items Table
        st.subheader("Items")
        
        # Initialize items in session state
        if 'doc_items' not in st.session_state:
            st.session_state.doc_items = [{'id': 1, 'description': '', 'qty': 1, 'price': 0}]
        
        items = st.session_state.doc_items
        
        # Display items in an editable table
        for i, item in enumerate(items):
            col1, col2, col3, col4 = st.columns([4, 2, 2, 1])
            with col1:
                items[i]['description'] = st.text_input(
                    "Description",
                    value=item['description'],
                    key=f"desc_{i}",
                    label_visibility="collapsed"
                )
            with col2:
                items[i]['qty'] = st.number_input(
                    "Qty",
                    min_value=1,
                    value=item['qty'],
                    key=f"qty_{i}",
                    label_visibility="collapsed"
                )
            with col3:
                items[i]['price'] = st.number_input(
                    "Price",
                    min_value=0.0,
                    value=float(item['price']),
                    step=0.01,
                    key=f"price_{i}",
                    label_visibility="collapsed"
                )
            with col4:
                if len(items) > 1 and st.button("❌", key=f"del_item_{i}"):
                    items.pop(i)
                    st.rerun()
        
        if st.button("➕ Add Item"):
            items.append({'id': len(items) + 1, 'description': '', 'qty': 1, 'price': 0})
            st.rerun()
        
        # Calculate totals
        totals = calculate_totals(items)
        
        # Display totals
        st.divider()
        col1, col2 = st.columns(2)
        with col2:
            st.metric("Subtotal", f"R {totals['subtotal']:,.2f}")
            st.metric("Tax (15%)", f"R {totals['tax']:,.2f}")
            st.metric("Grand Total", f"R {totals['grand_total']:,.2f}", delta_color="off")
        
        # Save/Cancel buttons
        col1, col2 = st.columns(2)
        with col1:
            cancel_button = st.form_submit_button("Cancel", type="secondary", use_container_width=True)
        with col2:
            save_button = st.form_submit_button("Save Document", type="primary", use_container_width=True)
        
        if cancel_button:
            del st.session_state.doc_items
            st.session_state.page = "company_documents"
            st.rerun()
        
        if save_button:
            if not document_name or not client_name:
                st.error("Please fill in Document Name and Client Name")
            else:
                # Create document
                document = Document({
                    'type': doc_type,
                    'title': document_name,
                    'client_name': client_name,
                    'address1': address1,
                    'address2': address2,
                    'vat': vat,
                    'date': doc_date.strftime('%Y-%m-%d'),
                    'items': items,
                    'company': company.name,
                    'company_id': company_id,
                    'created_by': st.session_state.user.name,
                    'company_info': data_manager.company_info
                })
                
                # Set document number
                if doc_type == 'invoice':
                    document.invoice_number = doc_number
                elif doc_type == 'quotation':
                    document.quotation_number = doc_number
                elif doc_type == 'purchase order':
                    document.po_number = doc_number
                elif doc_type == 'delivery note':
                    document.delivery_number = doc_number
                
                # Save document
                folder_id = st.session_state.get('selected_folder_id')
                if data_manager.add_document(company_id, document, folder_id):
                    del st.session_state.doc_items
                    st.success(f"{template['title_prefix']} created successfully!")
                    st.session_state.page = "company_documents"
                    st.rerun()
                else:
                    st.error("Failed to save document")

def view_document_page(data_manager: DataManager):
    """View document page"""
    document_id = st.session_state.get('view_document_id')
    company_id = st.session_state.get('view_document_company_id')
    
    if not document_id or not company_id:
        st.error("Document not found")
        st.button("Back", on_click=lambda: set_page("company_documents"))
        return
    
    company = data_manager.get_company_by_id(company_id)
    if not company:
        st.error("Company not found")
        return
    
    # Find document
    document_data = None
    # Search in root
    for doc in company.documents:
        if doc['id'] == document_id:
            document_data = doc
            break
    
    # Search in folders
    if not document_data:
        for folder in company.folders:
            for doc in folder['documents']:
                if doc['id'] == document_id:
                    document_data = doc
                    break
    
    if not document_data:
        st.error("Document not found")
        st.button("Back", on_click=lambda: set_page("company_documents"))
        return
    
    document = Document(document_data)
    template = get_document_template(document.type)
    
    # Header
    col1, col2 = st.columns([3, 1])
    with col1:
        st.title(document.title)
        st.caption(f"📄 {template['title_prefix']} • 📅 {document.date} • 👤 {document.created_by}")
    with col2:
        if st.button("Back", use_container_width=True):
            st.session_state.page = "company_documents"
            st.rerun()
        if st.button("Edit", type="primary", use_container_width=True):
            st.session_state.edit_document_id = document_id
            st.session_state.edit_document_company_id = company_id
            st.session_state.page = "edit_document"
            st.rerun()
        if st.button("Print/Download", use_container_width=True):
            # Generate PDF (simplified)
            st.info("PDF generation would be implemented here")
    
    st.divider()
    
    # Document Preview
    st.subheader("Document Preview")
    
    # Company Info
    company_info = document.company_info or data_manager.company_info
    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown(f"**{company_info['name']}**")
        st.write(company_info['address1'])
        st.write(company_info['address2'])
        st.write(company_info['address3'])
        st.write(f"Reg: {company_info['registration']}")
        st.write(company_info['contact'])
        st.write(company_info['vat'])
    
    # Document Title
    st.markdown(f"## {template['document_title']}")
    
    # Client Info
    col1, col2 = st.columns(2)
    with col1:
        st.markdown(f"**{template['address_label']}**")
        st.write(document.client_name)
        st.write(document.address1)
        st.write(document.address2)
        if document.vat:
            st.write(f"VAT: {document.vat}")
    
    with col2:
        # Document Number
        doc_number = ""
        if document.type == 'invoice':
            doc_number = document.invoice_number
        elif document.type == 'quotation':
            doc_number = document.quotation_number
        elif document.type == 'purchase order':
            doc_number = document.po_number
        elif document.type == 'delivery note':
            doc_number = document.delivery_number
        
        st.write(f"**{template['title_prefix']} #:** {doc_number}")
        st.write(f"**Date:** {document.date}")
        
        if document.type == 'delivery note' and document.ref_number:
            st.write(f"**Reference #:** {document.ref_number}")
    
    # Items Table
    st.divider()
    if document.items:
        # Create DataFrame for display
        items_df = pd.DataFrame(document.items)
        items_df['Total'] = items_df['qty'] * items_df['price']
        items_df['Taxable Amount'] = items_df['Total']
        items_df['Total with Tax'] = items_df['Total'] * 1.15
        
        # Display table
        if document.type == 'delivery note':
            display_df = items_df[['description', 'qty']]
        else:
            display_df = items_df[['description', 'qty', 'price', 'Taxable Amount', 'Total with Tax']]
        
        st.dataframe(display_df, use_container_width=True, hide_index=True)
        
        # Totals
        if document.type != 'delivery note':
            totals = calculate_totals(document.items)
            col1, col2 = st.columns(2)
            with col2:
                st.metric("Subtotal", f"R {totals['subtotal']:,.2f}")
                st.metric("Tax (15%)", f"R {totals['tax']:,.2f}")
                st.metric("Grand Total", f"R {totals['grand_total']:,.2f}")

def edit_document_page(data_manager: DataManager):
    """Edit document page"""
    document_id = st.session_state.get('edit_document_id')
    company_id = st.session_state.get('edit_document_company_id')
    
    if not document_id or not company_id:
        st.error("Document not found")
        st.button("Back", on_click=lambda: set_page("company_documents"))
        return
    
    company = data_manager.get_company_by_id(company_id)
    if not company:
        st.error("Company not found")
        return
    
    # Find document
    document_data = None
    doc_location = None  # 'root' or folder_id
    
    # Search in root
    for doc in company.documents:
        if doc['id'] == document_id:
            document_data = doc
            doc_location = 'root'
            break
    
    # Search in folders
    if not document_data:
        for folder in company.folders:
            for doc in folder['documents']:
                if doc['id'] == document_id:
                    document_data = doc
                    doc_location = folder['id']
                    break
    
    if not document_data:
        st.error("Document not found")
        st.button("Back", on_click=lambda: set_page("company_documents"))
        return
    
    document = Document(document_data)
    template = get_document_template(document.type)
    
    st.title(f"Edit {template['title_prefix']}")
    
    with st.form("edit_document_form"):
        # Document Info
        col1, col2 = st.columns(2)
        with col1:
            document_name = st.text_input("Document Name *", value=document.title)
            client_name = st.text_input(f"{template['address_label']} Name *", value=document.client_name)
            address1 = st.text_input("Address Line 1", value=document.address1)
            address2 = st.text_input("Address Line 2", value=document.address2)
            vat = st.text_input("VAT Number", value=document.vat)
        
        with col2:
            # Document number
            doc_number = ""
            if document.type == 'invoice':
                doc_number = document.invoice_number
            elif document.type == 'quotation':
                doc_number = document.quotation_number
            elif document.type == 'purchase order':
                doc_number = document.po_number
            elif document.type == 'delivery note':
                doc_number = document.delivery_number
            
            doc_number_input = st.text_input(f"{template['title_prefix']} #", value=doc_number)
            doc_date = st.date_input("Date", value=datetime.datetime.strptime(document.date, '%Y-%m-%d').date())
            
            if document.type == 'delivery note':
                ref_number = st.text_input("Reference Number", value=document.ref_number)
        
        # Items Table
        st.subheader("Items")
        
        # Initialize items in session state if not already
        if 'edit_doc_items' not in st.session_state:
            st.session_state.edit_doc_items = document.items.copy()
        
        items = st.session_state.edit_doc_items
        
        # Display items in an editable table
        for i, item in enumerate(items):
            col1, col2, col3, col4 = st.columns([4, 2, 2, 1])
            with col1:
                items[i]['description'] = st.text_input(
                    "Description",
                    value=item['description'],
                    key=f"edit_desc_{i}",
                    label_visibility="collapsed"
                )
            with col2:
                items[i]['qty'] = st.number_input(
                    "Qty",
                    min_value=1,
                    value=item['qty'],
                    key=f"edit_qty_{i}",
                    label_visibility="collapsed"
                )
            with col3:
                items[i]['price'] = st.number_input(
                    "Price",
                    min_value=0.0,
                    value=float(item['price']),
                    step=0.01,
                    key=f"edit_price_{i}",
                    label_visibility="collapsed"
                )
            with col4:
                if len(items) > 1 and st.button("❌", key=f"edit_del_item_{i}"):
                    items.pop(i)
                    st.rerun()
        
        if st.button("➕ Add Item", key="edit_add_item"):
            items.append({'id': len(items) + 1, 'description': '', 'qty': 1, 'price': 0})
            st.rerun()
        
        # Calculate totals
        totals = calculate_totals(items)
        
        # Display totals
        st.divider()
        col1, col2 = st.columns(2)
        with col2:
            st.metric("Subtotal", f"R {totals['subtotal']:,.2f}")
            st.metric("Tax (15%)", f"R {totals['tax']:,.2f}")
            st.metric("Grand Total", f"R {totals['grand_total']:,.2f}", delta_color="off")
        
        # Save/Cancel buttons
        col1, col2 = st.columns(2)
        with col1:
            cancel_button = st.form_submit_button("Cancel", type="secondary", use_container_width=True)
        with col2:
            save_button = st.form_submit_button("Save Changes", type="primary", use_container_width=True)
        
        if cancel_button:
            del st.session_state.edit_doc_items
            st.session_state.page = "company_documents"
            st.rerun()
        
        if save_button:
            if not document_name or not client_name:
                st.error("Please fill in Document Name and Client Name")
            else:
                # Update document
                document.title = document_name
                document.client_name = client_name
                document.address1 = address1
                document.address2 = address2
                document.vat = vat
                document.date = doc_date.strftime('%Y-%m-%d')
                document.items = items
                document.last_modified = datetime.datetime.now().strftime('%Y-%m-%d')
                
                # Update document number
                if document.type == 'invoice':
                    document.invoice_number = doc_number_input
                elif document.type == 'quotation':
                    document.quotation_number = doc_number_input
                elif document.type == 'purchase order':
                    document.po_number = doc_number_input
                elif document.type == 'delivery note':
                    document.delivery_number = doc_number_input
                    document.ref_number = ref_number
                
                # Save changes
                if data_manager.update_document(company_id, document_id, document):
                    del st.session_state.edit_doc_items
                    st.success(f"{template['title_prefix']} updated successfully!")
                    st.session_state.page = "company_documents"
                    st.rerun()
                else:
                    st.error("Failed to update document")

def set_page(page_name: str):
    """Helper function to change pages"""
    st.session_state.page = page_name

# ==================== MAIN APP ====================

def main():
    """Main application"""
    
    # Initialize session state
    if 'page' not in st.session_state:
        st.session_state.page = "login"
    
    if 'data_manager' not in st.session_state:
        st.session_state.data_manager = DataManager()
    
    data_manager = st.session_state.data_manager
    
    # Page routing
    pages = {
        "login": lambda: login_page(data_manager),
        "change_password": lambda: change_password_page(data_manager),
        "forgot_password": lambda: forgot_password_page(data_manager),
        "main": lambda: main_page(data_manager),
        "profile": lambda: profile_page(data_manager),
        "admin": lambda: admin_page(data_manager),
        "admin_edit_user": lambda: admin_edit_user_page(data_manager),
        "admin_add_company": lambda: admin_add_company_page(data_manager),
        "company_documents": lambda: company_documents_page(data_manager),
        "folder_documents": lambda: folder_documents_page(data_manager),
        "create_document": lambda: create_document_page(data_manager),
        "view_document": lambda: view_document_page(data_manager),
        "edit_document": lambda: edit_document_page(data_manager)
    }
    
    # Get current page function
    current_page = pages.get(st.session_state.page, lambda: st.error("Page not found"))
    
    # Run current page
    current_page()

if __name__ == "__main__":
    main()
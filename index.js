// Authentication state
let isAuthenticated = false;
let userInfo = null;

// Show login page
function showLoginPage() {
    // Don't show login if already authenticated
    if (isAuthenticated) {
        return;
    }

    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';

    // Initialize Google Sign-In when login page is shown
    initializeGoogleSignIn();
}

// Google OAuth Client ID Configuration
const GOOGLE_CLIENT_ID = '322558746257-igg40vt5u5hfmn1gk293tipe6s75kg5q.apps.googleusercontent.com'; // Replace with your actual OAuth client ID

// Initialize Google Sign-In with OAuth Client ID
function initializeGoogleSignIn() {
    // Wait for Google Identity Services to load
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Render the Google Sign-In button
        google.accounts.id.renderButton(
            document.getElementById('googleSignIn'), {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'continue_with',
                shape: 'rectangular'
            }
        );
    } else {
        // Fallback: Show error message if Google services fail to load
        const googleBtn = document.getElementById('googleSignIn');
        googleBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google (Demo Mode)
        `;
        googleBtn.onclick = () => {
            // Demo mode authentication
            handleDemoGoogleSignIn();
        };
    }
}

// Handle Google Sign-In callback
function handleGoogleSignIn(response) {
    try {
        // Decode the JWT token to get user information
        const payload = JSON.parse(atob(response.credential.split('.')[1]));

        // Validate the token
        if (!validateGoogleToken(payload)) {
            throw new Error('Invalid token');
        }

        // Extract user information
        userInfo = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            isGuest: false,
            googleId: payload.sub,
            verified: payload.email_verified
        };

        // Save authentication state securely
        localStorage.setItem('userAuth', JSON.stringify(userInfo));
        localStorage.setItem('authToken', response.credential);
        isAuthenticated = true;

        // Show main content
        showMainContent();

        // Show success message
        showNotification('Successfully signed in with Google!', 'success');

    } catch (error) {
        console.error('Google Sign-In Error:', error);
        showNotification('Authentication failed. Please try again.', 'error');
    }
}

// Demo mode for development/testing
function handleDemoGoogleSignIn() {
    // Simulate Google authentication for demo purposes
    const mockUserData = {
        name: 'Demo Google User',
        email: 'demo@gmail.com',
        picture: 'https://via.placeholder.com/40/4285F4/ffffff?text=G',
        isGuest: false,
        googleId: 'demo_google_id',
        verified: true
    };

    userInfo = mockUserData;
    localStorage.setItem('userAuth', JSON.stringify(userInfo));
    localStorage.setItem('authToken', 'demo_token_' + Date.now());
    isAuthenticated = true;

    showMainContent();
    showNotification('Demo mode: Successfully signed in!', 'success');
}

// Alternative: Direct Google API authentication
async function authenticateWithGoogleAPI() {
    try {
        // This would be used for server-side authentication
        const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${GOOGLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            return userData;
        } else {
            throw new Error('API authentication failed');
        }
    } catch (error) {
        console.error('Google API authentication error:', error);
        throw error;
    }
}

// Validate Google token
function validateGoogleToken(payload) {
    // Basic validation checks
    if (!payload || !payload.sub || !payload.email) {
        return false;
    }

    // Check token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
        return false;
    }

    // Check token issuer
    if (payload.iss !== 'https://accounts.google.com') {
        return false;
    }

    return true;
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;

    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f59e0b';
            break;
        default:
            notification.style.backgroundColor = '#6b7280';
    }

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Guest login function
function loginAsGuest() {
    userInfo = {
        name: 'Guest User',
        email: 'guest@example.com',
        picture: 'https://via.placeholder.com/40/764ba2/ffffff?text=G',
        isGuest: true
    };

    // Save authentication state
    localStorage.setItem('userAuth', JSON.stringify(userInfo));
    isAuthenticated = true;

    // Show main content immediately
    showMainContent();
}

// Show main content after authentication
function showMainContent() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('demoVideoPage').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    // Update header with user info
    updateHeaderWithUserInfo();
}

// Show demo video page
function showDemoVideoPage() {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('demoVideoPage').style.display = 'block';
}

// Update header with user information
function updateHeaderWithUserInfo() {
    if (userInfo) {
        const loginBtn = document.querySelector('.login-btn');

        if (userInfo.isGuest) {
            // For guest users, show just the name in login button
            loginBtn.textContent = userInfo.name.split(' ')[0];
        } else if (userInfo.picture) {
            // For Google users, show picture and name
            loginBtn.innerHTML = `
                <img src="${userInfo.picture}" alt="${userInfo.name}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
                <span>${userInfo.name.split(' ')[0]}</span>
            `;
        } else {
            // Show just the name
            loginBtn.textContent = userInfo.name.split(' ')[0];
        }

        loginBtn.onclick = logout;
    }
}

// Logout function
function logout() {
    // Sign out from Google if user was authenticated with Google
    if (userInfo && !userInfo.isGuest && typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
        google.accounts.id.revoke(userInfo.email, () => {
            console.log('Google account access revoked');
        });
    }

    // Clear authentication state
    isAuthenticated = false;
    userInfo = null;
    localStorage.removeItem('userAuth');
    localStorage.removeItem('authToken');

    // Show login page
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';

    // Reset header
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.textContent = 'Login';
    loginBtn.onclick = () => showLoginPage();

    // Show logout notification
    showNotification('Successfully logged out', 'info');
}


function openModal() {
    if (!isAuthenticated) {
        // Redirect to login page instead of showing alert
        showLoginPage();
        return;
    }

    // For both guest and Google users, open the modal
    document.getElementById('newsletterModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('newsletterModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

function toggleTag(element) {
    const selectedTags = document.querySelectorAll('.topic-tag.selected');

    if (element.classList.contains('selected')) {
        // If clicking on selected tag, deselect it
        element.classList.remove('selected');
    } else {
        // If trying to select new tag, check if we already have 2 selected
        if (selectedTags.length >= 2) {
            alert('You can select a maximum of 2 topics.');
            return;
        }
        // Select the tag
        element.classList.add('selected');
    }
}

async function subscribe() {
    const email = document.querySelector('.email-input').value;
    const scheduleDate = document.querySelector('input[type="date"]').value;
    const scheduleTime = document.querySelector('input[type="time"]').value;

    // Get selected topics
    const selectedTopics = [];
    document.querySelectorAll('.topic-tag.selected').forEach(tag => {
        selectedTopics.push(tag.textContent);
    });

    if (email && email.includes('@')) {
        try {
            // Show loading state
            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '⏳';
            submitBtn.disabled = true;

            // Prepare data to send to n8n webhook
            const webhookData = {
                email: email,
                topics: selectedTopics,
                schedule_date: scheduleDate,
                schedule_time: scheduleTime,
                timestamp: new Date().toISOString()
            };

            // Send data to n8n webhook
            const response = await fetch('https://raul60.app.n8n.cloud/webhook/36907a3f-19e3-4a97-947b-2fb8eee2dbb6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookData)
            });

            if (response.ok) {
                alert('Thank you for subscribing! We\'ll send you personalized newsletters.');
                closeModal();

                // Reset form
                document.querySelector('.email-input').value = '';
                document.querySelector('input[type="date"]').value = '';
                document.querySelector('input[type="time"]').value = '00:00';
                document.querySelectorAll('.topic-tag').forEach(tag => {
                    tag.classList.remove('selected');
                });
                // Reset Technical Trends as default selected
                document.querySelector('.topic-tag:nth-child(2)').classList.add('selected');

            } else {
                alert('Something went wrong. Please try again.');
            }

        } catch (error) {
            console.error('Webhook error:', error);
            alert('Connection error. Please check your internet connection and try again.');
        } finally {
            // Reset button state
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    } else {
        alert('Please enter a valid email address.');
    }
}

// Close modal when clicking outside
document.getElementById('newsletterModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Mobile menu functionality
function toggleMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    mobileMenuBtn.classList.toggle('active');
    nav.classList.toggle('active');

    // Prevent body scroll when menu is open
    if (nav.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        const nav = document.querySelector('.nav');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

        if (nav.classList.contains('active')) {
            nav.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const nav = document.querySelector('.nav');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const headerContent = document.querySelector('.header-content');

    if (nav.classList.contains('active') && !headerContent.contains(e.target)) {
        nav.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            const headerHeight = document.querySelector('.main-header').offsetHeight;
            const targetPosition = targetSection.offsetTop - headerHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            const nav = document.querySelector('.nav');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }
    });
});

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.main-header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'white';
        header.style.backdropFilter = 'none';
    }
});

// Session validation
function validateSession() {
    const savedAuth = localStorage.getItem('userAuth');
    const authToken = localStorage.getItem('authToken');

    if (!savedAuth) {
        return false;
    }

    try {
        const userData = JSON.parse(savedAuth);

        // Check if it's a demo token
        if (authToken && authToken.startsWith('demo_token_')) {
            return true; // Demo tokens don't expire
        }

        // For real Google tokens, validate expiration
        if (authToken && !authToken.startsWith('demo_token_')) {
            const payload = JSON.parse(atob(authToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp < currentTime) {
                // Token expired, clear session
                localStorage.removeItem('userAuth');
                localStorage.removeItem('authToken');
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Session validation error:', error);
        // Clear invalid session data
        localStorage.removeItem('userAuth');
        localStorage.removeItem('authToken');
        return false;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Validate existing session
    if (validateSession()) {
        const savedAuth = localStorage.getItem('userAuth');
        userInfo = JSON.parse(savedAuth);
        isAuthenticated = true;
        updateHeaderWithUserInfo();
    }

    // Initialize header login button
    const loginBtn = document.querySelector('.login-btn');
    if (!isAuthenticated) {
        loginBtn.onclick = () => showLoginPage();
    }


    // Add security headers
    addSecurityHeaders();
});

// Add security headers and measures
function addSecurityHeaders() {
    // Set security-related meta tags
    const securityMeta = [{
            name: 'Content-Security-Policy',
            content: "default-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com; script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://raul60.app.n8n.cloud;"
        },
        {
            name: 'X-Content-Type-Options',
            content: 'nosniff'
        },
        {
            name: 'X-Frame-Options',
            content: 'DENY'
        },
        {
            name: 'X-XSS-Protection',
            content: '1; mode=block'
        }
    ];

    securityMeta.forEach(meta => {
        let metaTag = document.querySelector(`meta[name="${meta.name}"]`);
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.name = meta.name;
            document.head.appendChild(metaTag);
        }
        metaTag.content = meta.content;
    });
}

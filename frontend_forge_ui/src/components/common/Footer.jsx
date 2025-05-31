// frontend_forge_ui/src/components/common/Footer.jsx
import React from 'react';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-bg-element-dark border-t border-border-cyber text-center p-6 mt-auto">
            <p className="text-sm text-text-secondary">
                &copy; {currentYear} Kingdom Koders. All rights reserved.
            </p>
            <div className="mt-2 space-x-4">
                {/* TODO: Add actual links */}
                <a href="#" className="text-xs text-accent-blue hover:text-accent-cyan">Privacy Policy</a>
                <a href="#" className="text-xs text-accent-blue hover:text-accent-cyan">Terms of Service</a>
                {/* Add social media icons/links if desired */}
            </div>
        </footer>
    );
}

// export default Footer;

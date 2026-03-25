import { createContext, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {

    useEffect(() => {
        const root = document.documentElement;

        // Always force light theme
        root.classList.add('light-theme');



        localStorage.removeItem('theme');
    }, []);

    const value = {
        theme: 'light',
        isDark: false
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

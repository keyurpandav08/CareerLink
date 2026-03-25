import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';

const AuthContext = createContext(null);
const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
        ...userData,
        roleName: userData.roleName || userData.role?.name || null
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let initialUser  = null;
    if (storedUser && storedUser !== "undefined") { // Adde safety check
        try {
            initialUser= normalizeUser(JSON.parse(storedUser));
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('user'); // Clean data
        }
    }
    setUser(initialUser);
    setLoading(false);
}, []);

    const login = (userData) => {
        const normalized = normalizeUser(userData);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
    };

    const logout = async () => {
        try {
            // to click logout sent the request in backend after successing a logout to remove a user cookies.
            await api.post('/logout');
        } catch (e) {
            console.error("Logout failed", e);
        }
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);

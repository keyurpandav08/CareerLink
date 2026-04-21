/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const AuthModalContext = createContext(null);

export const AuthModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');

  const openAuthModal = (nextMode = 'login', options = {}) => {
    setMode(nextMode);
    setMessage(options.message || '');
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
    setMessage('');
  };

  const switchAuthMode = (nextMode, options = {}) => {
    setMode(nextMode);
    setMessage(options.message || '');
    setIsOpen(true);
  };

  const value = useMemo(() => ({
    authMode: mode,
    authMessage: message,
    closeAuthModal,
    isAuthModalOpen: isOpen,
    openAuthModal,
    setAuthMessage: setMessage,
    switchAuthMode
  }), [isOpen, message, mode]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
};

AuthModalProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuthModal = () => useContext(AuthModalContext);

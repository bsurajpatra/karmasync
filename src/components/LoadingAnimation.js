import React from 'react';

const LoadingAnimation = ({ message = 'Loading...' }) => {
  const styles = {
    wrapper: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      zIndex: 1000
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backdropFilter: 'blur(8px)',
      borderRadius: '20px',
      background: 'transparent',
      boxShadow: 'none'
    },
    loadingRing: {
      position: 'relative',
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      animation: 'rotate 2s linear infinite'
    },
    circle: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: '4px solid transparent',
      borderTopColor: '#4a90e2',
      animation: 'rotate 1.5s linear infinite'
    },
    circle2: {
      borderTopColor: '#70a1ff',
      animationDelay: '-0.5s'
    },
    circle3: {
      borderTopColor: '#a4c8f0',
      animationDelay: '-1s'
    },
    syncIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '24px',
      color: '#000000',
      animation: 'pulse 1.5s ease-in-out infinite'
    },
    message: {
      marginTop: '1.5rem',
      color: '#000000',
      fontSize: '1.2rem',
      fontWeight: '500',
      textAlign: 'center',
      textShadow: 'none'
    }
  };

  return (
    <div style={styles.wrapper}>
      <style>
        {`
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(0.8); }
            50% { transform: translate(-50%, -50%) scale(1.2); }
            100% { transform: translate(-50%, -50%) scale(0.8); }
          }
        `}
      </style>
      <div style={styles.container}>
        <div style={styles.loadingRing}>
          <div style={styles.circle}></div>
          <div style={{ ...styles.circle, ...styles.circle2 }}></div>
          <div style={{ ...styles.circle, ...styles.circle3 }}></div>
          <div style={styles.syncIcon}>
            🔄
          </div>
        </div>
        <p style={styles.message}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingAnimation; 
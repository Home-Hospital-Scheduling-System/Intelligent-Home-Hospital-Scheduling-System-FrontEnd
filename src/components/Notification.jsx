import { useState, useEffect, createContext, useContext, useCallback } from 'react'

// Notification Context for global access
const NotificationContext = createContext()
// Confirmation Context for confirm dialogs
const ConfirmContext = createContext()

export function useNotification() {
  return useContext(NotificationContext)
}

export function useConfirm() {
  return useContext(ConfirmContext)
}

// Notification types with their styles
const NOTIFICATION_STYLES = {
  success: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
    iconColor: '#16a34a',
    icon: '✓',
    titleColor: '#166534'
  },
  error: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    iconColor: '#dc2626',
    icon: '✕',
    titleColor: '#991b1b'
  },
  warning: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    iconColor: '#d97706',
    icon: '⚠',
    titleColor: '#92400e'
  },
  info: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    iconColor: '#2563eb',
    icon: 'ℹ',
    titleColor: '#1e40af'
  },
  ai: {
    backgroundColor: '#f3e8ff',
    borderColor: '#a855f7',
    iconColor: '#9333ea',
    icon: '🤖',
    titleColor: '#6b21a8'
  }
}

// Single Notification Component
function NotificationItem({ notification, onClose }) {
  const [isExiting, setIsExiting] = useState(false)
  const style = NOTIFICATION_STYLES[notification.type] || NOTIFICATION_STYLES.info

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, notification.duration)
      return () => clearTimeout(timer)
    }
  }, [notification.duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(notification.id)
    }, 300)
  }

  return (
    <div
      style={{
        backgroundColor: style.backgroundColor,
        border: `2px solid ${style.borderColor}`,
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '0.75rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        maxWidth: '420px',
        animation: isExiting 
          ? 'slideOut 0.3s ease-in forwards' 
          : 'slideIn 0.3s ease-out',
        transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.3s ease, opacity 0.3s ease'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          color: style.iconColor,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {notification.icon || style.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ 
          margin: '0 0 0.25rem 0', 
          color: style.titleColor,
          fontSize: '1rem',
          fontWeight: '600'
        }}>
          {notification.title}
        </h4>
        {notification.message && (
          <p style={{ 
            margin: 0, 
            color: '#475569',
            fontSize: '0.9rem',
            lineHeight: '1.4',
            wordBreak: 'break-word'
          }}>
            {notification.message}
          </p>
        )}
        {notification.details && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#64748b'
          }}>
            {notification.details}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '0.25rem',
          fontSize: '1.25rem',
          lineHeight: 1,
          borderRadius: '4px',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.color = '#475569'}
        onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
      >
        ×
      </button>
    </div>
  )
}

// Notification Container Component
function NotificationContainer({ notifications, removeNotification }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  )
}

// Notification Provider Component
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification
    }
    setNotifications(prev => [...prev, newNotification])
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Confirmation dialog function
  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...options,
        onConfirm: () => {
          setConfirmDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        }
      })
    })
  }, [])

  // Convenience methods
  const notify = {
    success: (title, message, options = {}) => 
      addNotification({ type: 'success', title, message, ...options }),
    
    error: (title, message, options = {}) => 
      addNotification({ type: 'error', title, message, duration: 8000, ...options }),
    
    warning: (title, message, options = {}) => 
      addNotification({ type: 'warning', title, message, ...options }),
    
    info: (title, message, options = {}) => 
      addNotification({ type: 'info', title, message, ...options }),
    
    ai: (title, message, options = {}) => 
      addNotification({ type: 'ai', title, message, icon: '🤖', ...options }),

    // Special notification for patient assignment
    patientAssigned: (patientName, professionalName, matchScore, details) => 
      addNotification({
        type: 'success',
        title: 'Patient Assigned Successfully',
        message: `${patientName} has been assigned to ${professionalName}`,
        icon: '👨‍⚕️',
        duration: 6000,
        details: matchScore ? `Match Score: ${matchScore}%${details ? ` • ${details}` : ''}` : details
      }),

    // Special notification for reassignment
    patientReassigned: (patientName, newProfessionalName) =>
      addNotification({
        type: 'success',
        title: 'Patient Reassigned',
        message: `${patientName} has been reassigned to ${newProfessionalName}`,
        icon: '🔄',
        duration: 5000
      }),

    // Special notification for unassignment
    patientUnassigned: (patientName) =>
      addNotification({
        type: 'warning',
        title: 'Patient Unassigned',
        message: `${patientName} has been removed from assignment`,
        icon: '↩️',
        duration: 4000
      }),

    // Bulk operation notification
    bulkOperation: (successCount, failCount, operation) =>
      addNotification({
        type: successCount > 0 ? 'success' : 'error',
        title: `Bulk ${operation} Complete`,
        message: `${successCount} successful, ${failCount} failed`,
        icon: '📋',
        duration: 6000
      }),

    // Schedule notification
    scheduleUpdated: (message) =>
      addNotification({
        type: 'info',
        title: 'Schedule Updated',
        message: message,
        icon: '📅',
        duration: 4000
      }),

    // Profile notification
    profileUpdated: (message) =>
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: message || 'Your profile has been saved successfully',
        icon: '👤',
        duration: 4000
      })
  }

  // Confirm dialog presets
  const confirm = {
    // Generic confirm
    show: (title, message, options = {}) => showConfirm({ title, message, ...options }),
    
    // Bulk assign confirmation
    bulkAssign: (count) => showConfirm({
      title: '🤖 AI Bulk Assignment',
      message: `Auto-assign all ${count} unassigned patients using AI?`,
      description: 'This will match each patient to the best available professional based on skills, availability, and location.',
      confirmText: 'Start AI Assignment',
      confirmColor: '#8b5cf6',
      icon: '🤖'
    }),

    // Bulk unassign confirmation
    bulkUnassign: (count) => showConfirm({
      title: '↩️ Bulk Unassign',
      message: `Unassign ALL ${count} assigned patients?`,
      description: 'This will make all of them available for reassignment. This action is reversible.',
      confirmText: 'Unassign All',
      confirmColor: '#ef4444',
      icon: '⚠️'
    }),

    // Single unassign confirmation  
    unassignPatient: (patientName) => showConfirm({
      title: '↩️ Unassign Patient',
      message: `Are you sure you want to unassign ${patientName}?`,
      description: 'This will remove them from their assigned professional and make them available for reassignment.',
      confirmText: 'Unassign',
      confirmColor: '#ef4444',
      icon: '👤'
    }),

    // Reassign confirmation
    reassignPatient: (patientName) => showConfirm({
      title: '🔄 Reassign Patient',
      message: `Reassign ${patientName} to the selected professional?`,
      confirmText: 'Confirm Reassignment',
      confirmColor: '#10b981',
      icon: '🔄'
    }),

    // Delete confirmation
    delete: (itemName) => showConfirm({
      title: '🗑️ Delete Confirmation',
      message: `Are you sure you want to delete ${itemName}?`,
      description: 'This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: '#ef4444',
      icon: '🗑️'
    })
  }

  return (
    <NotificationContext.Provider value={notify}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <NotificationContainer 
          notifications={notifications} 
          removeNotification={removeNotification} 
        />
        {confirmDialog && (
          <ConfirmDialog 
            {...confirmDialog}
          />
        )}
      </ConfirmContext.Provider>
    </NotificationContext.Provider>
  )
}

// Confirmation Dialog Component
function ConfirmDialog({ title, message, description, confirmText = 'Confirm', cancelText = 'Cancel', confirmColor = '#10b981', icon, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* Icon */}
        {icon && (
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            fontSize: '1.75rem'
          }}>
            {icon}
          </div>
        )}

        {/* Title */}
        <h2 style={{
          margin: '0 0 0.75rem 0',
          color: '#0f172a',
          fontSize: '1.25rem',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          {title}
        </h2>

        {/* Message */}
        <p style={{
          margin: '0 0 0.5rem 0',
          color: '#334155',
          fontSize: '1rem',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* Description */}
        {description && (
          <p style={{
            margin: '0 0 1.5rem 0',
            color: '#64748b',
            fontSize: '0.875rem',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            {description}
          </p>
        )}

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.875rem 1.5rem',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.875rem 1.5rem',
              backgroundColor: confirmColor,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              boxShadow: `0 4px 12px ${confirmColor}40`
            }}
            onMouseEnter={(e) => e.target.style.filter = 'brightness(1.1)'}
            onMouseLeave={(e) => e.target.style.filter = 'brightness(1)'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationProvider

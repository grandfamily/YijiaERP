import React from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface NotificationProps {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({ 
  type, 
  title, 
  message, 
  onClose,
  autoClose = true,
  duration = 3000
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg ${getBackgroundColor()}`}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className={`font-medium ${getTextColor()}`}>{title}</h4>
          {message && (
            <p className={`mt-1 text-sm ${getTextColor()}`}>{message}</p>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className={`${getTextColor()} hover:opacity-75`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// 通知管理 Hook
export const useNotification = () => {
  const [notifications, setNotifications] = React.useState<(NotificationProps & { id: string })[]>([]);

  const showNotification = (notification: Omit<NotificationProps, 'onClose'>) => {
    const id = Date.now().toString();
    const newNotification = {
      ...notification,
      id,
      onClose: () => removeNotification(id)
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>
  );

  return {
    showNotification,
    removeNotification,
    NotificationContainer
  };
};

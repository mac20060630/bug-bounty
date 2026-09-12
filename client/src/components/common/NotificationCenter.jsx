import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Award,
  AlertTriangle,
  Bug,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ExternalLink,
  Clock,
  Shield,
} from 'lucide-react';
import * as notificationService from '../../services/notificationService';
import useSocket from '../../hooks/useSocket';

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 15 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time WebSocket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }
    setIsOpen(false);

    if (notif.data?.reportId) {
      navigate(`/reports/${notif.data.reportId}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'bounty_assigned':
        return <Award className="h-4 w-4 text-emerald-400 shrink-0" />;
      case 'report_accepted':
      case 'report_resolved':
        return <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />;
      case 'report_rejected':
        return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
      case 'duplicate_detected':
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-purple-400 shrink-0" />;
      default:
        return <Bug className="h-4 w-4 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-black ring-2 ring-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel border border-cyber-border bg-slate-950/95 shadow-2xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white">
              <Bell className="h-4 w-4 text-cyan-400" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-1">
                <Shield className="h-6 w-6 mx-auto text-slate-600 mb-1" />
                <p className="font-semibold text-slate-400">All caught up</p>
                <p className="text-[11px]">No notifications to display</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 flex items-start gap-3 hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    !notif.isRead ? 'bg-cyan-500/5' : ''
                  }`}
                >
                  <div className="pt-0.5">{getIcon(notif.type)}</div>

                  <div className="flex-1 overflow-hidden space-y-1">
                    <p className={`text-slate-200 leading-snug ${!notif.isRead ? 'font-semibold text-white' : ''}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-mono">
                        {new Date(notif.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                          title="Mark as read"
                          className="text-cyan-400 hover:text-white p-0.5"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

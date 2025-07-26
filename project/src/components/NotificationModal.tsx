import React, { useState } from 'react';
import { X, Mail, MessageSquare, Loader2, CheckCircle, Phone } from 'lucide-react';
import { AttendanceRecord } from '../types';
import { sendEmailNotification, sendSMSNotification, sendWhatsAppNotification, sendTelegramNotification } from '../utils/notifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  personName: string;
  attendanceRecords: AttendanceRecord[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  personName,
  attendanceRecords
}) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSMSSending, setIsSMSSending] = useState(false);
  const [isWhatsAppSending, setIsWhatsAppSending] = useState(false);
  const [isTelegramSending, setIsTelegramSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSMSSent] = useState(false);
  const [whatsappSent, setWhatsAppSent] = useState(false);
  const [telegramSent, setTelegramSent] = useState(false);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    if (!email) return;
    
    setIsEmailSending(true);
    try {
      await sendEmailNotification(email, personName, attendanceRecords);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please check your email client.');
    }
    setIsEmailSending(false);
  };

  const handleSendSMS = async () => {
    if (!phoneNumber) return;
    
    setIsSMSSending(true);
    try {
      await sendSMSNotification(phoneNumber, personName, attendanceRecords);
      setSMSSent(true);
      setTimeout(() => setSMSSent(false), 3000);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      alert('Failed to send SMS. Please check your SMS app.');
    }
    setIsSMSSending(false);
  };

  const handleSendWhatsApp = async () => {
    if (!phoneNumber) return;
    
    setIsWhatsAppSending(true);
    try {
      await sendWhatsAppNotification(phoneNumber, personName, attendanceRecords);
      setWhatsAppSent(true);
      setTimeout(() => setWhatsAppSent(false), 3000);
    } catch (error) {
      console.error('Failed to send WhatsApp:', error);
      alert('Failed to send WhatsApp message.');
    }
    setIsWhatsAppSending(false);
  };

  const handleSendTelegram = async () => {
    if (!telegramChatId) return;
    
    setIsTelegramSending(true);
    try {
      await sendTelegramNotification(telegramChatId, personName, attendanceRecords);
      setTelegramSent(true);
      setTimeout(() => setTelegramSent(false), 3000);
    } catch (error) {
      console.error('Failed to send Telegram:', error);
      alert('Failed to send Telegram message.');
    }
    setIsTelegramSending(false);
  };

  const lateRecords = attendanceRecords.filter(r => r.isLate).length;
  const totalRecords = attendanceRecords.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Send Notification - {personName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Attendance Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Records:</span>
                <span className="ml-2 font-medium">{totalRecords}</span>
              </div>
              <div>
                <span className="text-gray-600">Late Arrivals:</span>
                <span className="ml-2 font-medium text-red-600">{lateRecords}</span>
              </div>
            </div>
          </div>

          {/* Email Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendEmail}
                disabled={!email || isEmailSending}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEmailSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : emailSent ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </button>
            </div>
            {emailSent && (
              <p className="text-green-600 text-sm mt-2">Email client opened successfully!</p>
            )}
          </div>

          {/* Phone Number Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (with country code)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* SMS Section */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <button
                onClick={handleSendSMS}
                disabled={!phoneNumber || isSMSSending}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSMSSending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : smsSent ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Send SMS
              </button>
              
              <button
                onClick={handleSendWhatsApp}
                disabled={!phoneNumber || isWhatsAppSending}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isWhatsAppSending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : whatsappSent ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                WhatsApp
              </button>
            </div>
            {smsSent && (
              <p className="text-green-600 text-sm mt-2">SMS app opened successfully!</p>
            )}
            {whatsappSent && (
              <p className="text-green-600 text-sm mt-2">WhatsApp opened successfully!</p>
            )}
          </div>

          {/* Telegram Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telegram Chat ID (optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Enter Telegram chat ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendTelegram}
                disabled={!telegramChatId || isTelegramSending}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTelegramSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : telegramSent ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </button>
            </div>
            {telegramSent && (
              <p className="text-green-600 text-sm mt-2">Telegram opened successfully!</p>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="mb-2"><strong>How to receive notifications:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Email:</strong> Opens your default email client</li>
              <li><strong>SMS:</strong> Opens your SMS app with pre-filled message</li>
              <li><strong>WhatsApp:</strong> Opens WhatsApp with the message</li>
              <li><strong>Telegram:</strong> Opens Telegram to share the message</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              Note: For real-time notifications, integrate with services like Twilio (SMS), EmailJS (Email), or Firebase (Push notifications).
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
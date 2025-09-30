// src/pages/settings/AccountSettings.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { logoutUser } from '@/store/authSlice';

const AccountSettings = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Fjalëkalimi është i detyrueshëm');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await api.delete('/users/me', {
        data: { password }
      });

      // Show success toast
      toast({
        title: t('transaction.toast.deleteAccountSuccess'),
        description: t('transaction.toast.deleteAccountSuccessDesc'),
        variant: 'success',
        duration: 5000
      });

      // Clear localStorage
      localStorage.clear();
      
      // Dispatch logout action
      dispatch(logoutUser());
      
      // Navigate to home page
      navigate('/', { replace: true });
      
    } catch (err) {
      console.error('Delete account error:', err);
      setError(
        err.response?.data?.message || 
        'Gabim gjatë fshirjes së llogarisë. Provo përsëri.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {t('settings.account.title', 'Account Settings')}
      </h1>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            {t('settings.account.delete.title', 'Delete Account')}
          </CardTitle>
          <CardDescription>
            {t('settings.account.delete.description', 
              'Once you delete your account, there is no going back. Please be certain.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showConfirm ? (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {t('settings.account.delete.warning', 
                    'This action will permanently delete your account and all associated data. This cannot be undone.')}
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="destructive" 
                onClick={() => setShowConfirm(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('settings.account.delete.button', 'Delete My Account')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {t('settings.account.delete.confirm', 
                    'Are you absolutely sure? This action cannot be undone.')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('settings.account.delete.password', 'Enter your password to confirm')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('settings.account.delete.passwordPlaceholder', 'Your password')}
                  required
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowConfirm(false);
                    setPassword('');
                    setError('');
                  }}
                  className="flex-1"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      {t('settings.account.delete.deleting', 'Deleting...')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('settings.account.delete.confirmButton', 'Yes, Delete My Account')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings;

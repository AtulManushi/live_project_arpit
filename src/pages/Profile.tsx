import { auth } from '@/integrations/firebase/client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { User as UserIcon, DollarSign, Shield, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getUserProfile, updateUserProfile } from '@/services/firebaseApi';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [editProfile, setEditProfile] = useState<{ name: string; phone: string }>({ name: '', phone: '' });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        setEditProfile({
          name: userProfile?.name || '',
          phone: userProfile?.phone || '',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updates = {
        name: editProfile.name,
        phone: editProfile.phone,
      };
      const success = await updateUserProfile(updates);
      if (success) {
        toast.success('Profile updated successfully');
        await loadProfile();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    try {
      await import('firebase/auth').then(({ sendPasswordResetEmail }) =>
        sendPasswordResetEmail(auth, user.email!)
      );
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Desktop: 2 columns for Account Overview | Trading Statics */}
      <div className="hidden md:grid grid-cols-2 gap-6">
        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-semibold"><Label>Name</Label>: {profile?.name}</div>
            <div className="text-lg font-semibold"><Label>Email</Label>: {profile?.email}</div>
            <div className="text-lg font-semibold"><Label>Phone</Label>: {profile?.phone}</div>
            <div className="text-lg font-semibold"><Label>Member Since</Label>: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}</div>
            <div className="text-lg font-semibold"><Label>ID</Label>: {profile?.id}</div>
          </CardContent>
        </Card>
        {/* Trading Statics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Trading Statics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-semibold"><Label>Wallet Balance</Label>: ${profile?.wallet_balance?.toLocaleString()}</div>
            <div className="text-lg font-semibold"><Label>Portfolio Value</Label>: ${profile?.total_portfolio_value?.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-6">
        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-base font-semibold"><Label>Name</Label>: {profile?.name}</div>
            <div className="text-base font-semibold"><Label>Email</Label>: {profile?.email}</div>
            <div className="text-base font-semibold"><Label>Phone</Label>: {profile?.phone}</div>
            <div className="text-base font-semibold"><Label>Member Since</Label>: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}</div>
            <div className="text-base font-semibold"><Label>ID</Label>: {profile?.id}</div>
          </CardContent>
        </Card>
        {/* Trading Statics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Trading Statics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-base font-semibold"><Label>Wallet Balance</Label>: ${profile?.wallet_balance?.toLocaleString()}</div>
            <div className="text-base font-semibold"><Label>Portfolio Value</Label>: ${profile?.total_portfolio_value?.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop: 2 columns for Profile Information | Change Password */}
      <div className="hidden md:grid grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editProfile.name}
                  onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editProfile.phone}
                  onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePasswordReset} className="w-full" disabled={resetLoading}>
              {resetLoading ? 'Sending...' : 'Send Password Reset Email'}
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              A password reset email will be sent to your registered email address.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: stacked cards for Profile Info and Change Password */}
      <div className="md:hidden space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editProfile.name}
                  onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editProfile.phone}
                  onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePasswordReset} className="w-full" disabled={resetLoading}>
              {resetLoading ? 'Sending...' : 'Send Password Reset Email'}
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              A password reset email will be sent to your registered email address.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Actions (no changes) */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sign Out</h4>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import PartnerSettings from '@/components/PartnerSettings';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const { profile } = useProfile();

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6 text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <SettingsIcon className="text-gray-200" size={24} />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Profile Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <Input
              id="username"
              value={profile?.username || ''}
              readOnly
              className="bg-gray-700 border-gray-600 text-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Username cannot be changed.</p>
          </div>
        </CardContent>
      </Card>

      {/* Partner Settings Section */}
      <PartnerSettings />

      {/* App Info Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">About CoupleFinance</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 text-sm leading-relaxed">
          CoupleFinance helps couples manage money together with shared expenses,
          smart budgets, and clear financial insights — so you're always on the same page.
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
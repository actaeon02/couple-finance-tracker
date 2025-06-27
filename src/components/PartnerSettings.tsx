import React, { useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent
} from '@/components/ui/card';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const PartnerSettings = () => {
  const {
    profile,
    partnerProfile,
    linkPartner,
    unlinkPartner,
    isLinking,
    isUnlinking,
  } = useProfile();

  const [partnerUsername, setPartnerUsername] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLinkPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerUsername.trim()) return;

    linkPartner(partnerUsername.trim());
    setPartnerUsername('');
    setIsDialogOpen(false);
  };

  const isLinked = !!profile?.partner_id;

  return (
    <Card className="bg-gray-800 border-gray-700 text-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} className="text-gray-300" />
          Partner Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isLinked ? (
          <>
            <p className="text-gray-400 text-sm">
              Link with your partner to start sharing expenses and budgets.
            </p>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <UserPlus size={16} className="mr-2" />
                  Link Partner
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
                <DialogHeader>
                  <DialogTitle>Link with Partner</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleLinkPartner} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="partnerUsername" className="text-sm text-gray-300">
                      Partner’s Username
                    </Label>
                    <Input
                      id="partnerUsername"
                      placeholder="e.g. johndoe"
                      value={partnerUsername}
                      onChange={(e) => setPartnerUsername(e.target.value)}
                      required
                      className="bg-gray-700 border-gray-600 text-gray-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Your partner must have already registered and set their username.
                  </p>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLinking}
                  >
                    {isLinking ? 'Linking...' : 'Confirm Link'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
            <div className="p-4 rounded-md border border-green-600 bg-green-900/20">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <Users size={16} />
                <span>Linked with Partner</span>
              </div>
              <p className="text-green-300 mt-1 text-sm">
                Connected to: <span className="font-semibold">{partnerProfile?.username || 'Loading...'}</span>
              </p>
              <p className="text-xs text-green-400 mt-1">
                You're now sharing budgets and expenses.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <UserMinus size={16} className="mr-2" />
                  Unlink Partner
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-gray-900 border-gray-700 text-gray-100">
                <AlertDialogHeader>
                  <AlertDialogTitle>Unlink Partner</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    This will stop sharing financial data. You can re-link anytime.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-gray-300 hover:bg-gray-600">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={unlinkPartner}
                    disabled={isUnlinking}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isUnlinking ? 'Unlinking...' : 'Unlink'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerSettings;
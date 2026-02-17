import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getData, setData, STORAGE_KEYS, Doctor, User, dataChannel } from "@/lib/data";
import { syncDoctorToSupabase } from "@/lib/supabaseSync";
import { Plus, Pencil, User as UserIcon, Star, Shield, Eye, EyeOff, Lock, Wallet, Minus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CredentialDisplay = ({ user }: { user?: User }) => {
  const [show, setShow] = useState(false);

  if (!user) return (
    <div className="mb-3 p-2 bg-red-50 rounded-md border border-red-100 text-xs text-red-600">
      No login credentials linked.
    </div>
  );

  return (
    <div className="mb-3 p-2 bg-muted/50 rounded-md border text-xs">
      {show ? (
        <div onClick={() => setShow(false)} className="cursor-pointer">
          <div className="flex justify-between items-center mb-1 text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Login Details</span>
            <EyeOff className="w-3 h-3 hover:text-foreground" />
          </div>
          <div className="font-mono bg-background p-1 rounded border overflow-hidden">
            <div className="truncate"><span className="font-semibold">Email:</span> {user.email}</div>
            <div className="truncate"><span className="font-semibold">Pass:</span> {user.password}</div>
          </div>
        </div>
      ) : (
        <div onClick={() => setShow(true)} className="flex items-center justify-between cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> View Login Credentials</span>
          <Eye className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

const AdminDoctors = () => {
  // We'll use local state for now, but in a real app this would sync with Supabase
  const [doctors, setDoctors] = useState<Doctor[]>(
    getData(STORAGE_KEYS.DOCTORS, []),
  );
  const [users, setUsers] = useState<User[]>(
    getData(STORAGE_KEYS.USERS, []),
  );

  // Initial Load & Sync with Supabase Wallets
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});

  // Fetch wallet balances regarding of user type (real/mock)
  const fetchBalances = async () => {
    const newBalances: Record<string, number> = {};

    // 1. Local Defaults
    users.forEach(u => {
      if (u.role === 'doctor') {
        newBalances[u.id] = u.balance || 0;
      }
    });

    // 2. Fetch Real Wallets from Supabase
    const { data: wallets } = await supabase.from('wallets').select('user_id, balance');
    if (wallets) {
      wallets.forEach(w => {
        if (w.user_id) newBalances[w.user_id] = w.balance;
      });
    }
    setWalletBalances(newBalances);
  };

  // Load balances on mount
  // Load balances on mount and listen for updates
  useEffect(() => {
    fetchBalances();

    // Listen for cross-tab updates via BroadcastChannel
    const channel = new BroadcastChannel('medicare_data_updates');
    channel.onmessage = (event) => {
      console.log('[AdminDoctors] Received broadcast update:', event.data);
      if (event.data.type === 'update') {
        const freshUsers = getData<User[]>(STORAGE_KEYS.USERS, []);
        const freshDoctors = getData<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
        console.log('[AdminDoctors] Reloading users from storage:', freshUsers.length);
        setUsers(freshUsers);
        setDoctors(freshDoctors);
      }
    };

    // Listen for local tab updates
    const handleLocalUpdate = () => {
      const freshUsers = getData<User[]>(STORAGE_KEYS.USERS, []);
      const freshDoctors = getData<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
      setUsers(freshUsers);
      setDoctors(freshDoctors);
    };
    window.addEventListener('localDataUpdate', handleLocalUpdate);

    return () => {
      channel.close();
      window.removeEventListener('localDataUpdate', handleLocalUpdate);
    };
  }, [users]); // Re-fetch if users change

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);

  // Wallet Management State
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [selectedDoctorForWallet, setSelectedDoctorForWallet] = useState<Doctor | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletAction, setWalletAction] = useState<'add' | 'deduct'>('add');
  const [processingWallet, setProcessingWallet] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    experience: "",
    fee: "",
    image: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size too large. Please choose an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // 1. Create the Doctor Object
    const docId = editing?.id || `D${Date.now()}`;
    const doc: Doctor = {
      id: docId,
      name: form.name,
      specialization: form.specialization,
      experience: parseInt(form.experience) || 0,
      fee: parseFloat(form.fee) || 0,
      rating: editing?.rating || 4.5,
      availability: editing?.availability || ["Monday", "Wednesday", "Friday"],
      image: form.image || "/placeholder.svg",
      isActive: true,
    };

    // 2. Update Doctors State
    const updatedDoctors = editing
      ? doctors.map((d) => (d.id === doc.id ? doc : d))
      : [...doctors, doc];

    try {
      setDoctors(updatedDoctors);
      setData(STORAGE_KEYS.DOCTORS, updatedDoctors);

      // 3. Update Users State (Credentials)
      let updatedUsers = [...users];
      const existingUserIndex = users.findIndex(u => u.id === docId);

      if (existingUserIndex >= 0) {
        // Update existing user
        updatedUsers[existingUserIndex] = {
          ...updatedUsers[existingUserIndex],
          name: form.name,
          email: form.email || updatedUsers[existingUserIndex].email,
          password: form.password || updatedUsers[existingUserIndex].password,
        };
      } else {
        // Create new user
        updatedUsers.push({
          id: docId,
          email: form.email || `doctor${docId}@test.com`,
          password: form.password || 'doctor123',
          name: form.name,
          role: 'doctor',
          phone: '',
          address: ''
        });
      }

      setUsers(updatedUsers);
      setData(STORAGE_KEYS.USERS, updatedUsers);
      toast.success(editing ? "Doctor updated!" : "Doctor created!");

    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save doctor. Image might be too large.");
      return;
    }

    // 4. Supabase Sync (Silent)
    syncDoctorToSupabase(doc, docId);

    setIsOpen(false);
    setEditing(null);
  };

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const handleWalletUpdate = async () => {
    if (!selectedDoctorForWallet || !walletAmount) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setProcessingWallet(true);
    try {
      // Handle Local User (Mock)
      if (!isUUID(selectedDoctorForWallet.id)) {
        const allUsers = getData<any[]>(STORAGE_KEYS.USERS, []);
        const updatedUsers = allUsers.map(u => {
          if (u.id === selectedDoctorForWallet.id) {
            const currentBalance = u.balance || 0;
            const newBalance = walletAction === 'add'
              ? currentBalance + amount
              : Math.max(0, currentBalance - amount);
            return { ...u, balance: newBalance };
          }
          return u;
        });
        setData(STORAGE_KEYS.USERS, updatedUsers);
        setUsers(updatedUsers); // Update local state
        setWalletBalances(prev => ({
          ...prev,
          [selectedDoctorForWallet.id]: updatedUsers.find(u => u.id === selectedDoctorForWallet.id)?.balance || 0
        }));
        toast.success("Wallet updated (Local)");
        setWalletDialogOpen(false);
        return;
      }

      // Handle Real DB User
      const description = `Admin Adjustment: ${walletAction === 'add' ? 'Credit' : 'Debit'}`;
      const rpcName = walletAction === 'add' ? 'add_credits' : 'deduct_credits';
      const params: any = {
        target_user_id: selectedDoctorForWallet.id,
        txn_description: description
      };

      if (walletAction === 'add') {
        params.credit_amount = amount;
      } else {
        params.deduct_amount = amount;
        params.txn_type = 'manual_adjustment';
      }

      const { error } = await supabase.rpc(rpcName, params);

      if (error) throw error;

      toast.success("Wallet updated successfully");
      setWalletDialogOpen(false);
      fetchBalances(); // Refresh

      // Force broadcast update for other tabs (in case Realtime is slow/broken)
      dataChannel.postMessage({ type: 'update', key: 'wallet_db_update' });

    } catch (error: any) {
      console.error("Wallet update error:", error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setProcessingWallet(false);
      setWalletAmount("");
    }
  };

  const toggleActive = (id: string) => {
    const updated = doctors.map((d) =>
      d.id === id ? { ...d, isActive: !d.isActive } : d,
    );
    setDoctors(updated);
    setData(STORAGE_KEYS.DOCTORS, updated);
    const toggled = updated.find(d => d.id === id);
    if (toggled) syncDoctorToSupabase(toggled, id);
  };

  return (
    <div className="min-h-screen bg-background m-5">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Doctors</h1>
          <Button
            onClick={() => {
              setForm({
                name: "",
                email: "",
                password: "",
                specialization: "",
                experience: "",
                fee: "",
                image: "",
              });
              setEditing(null);
              setIsOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Doctor
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((d) => {
            const docUser = users.find(u => u.id === d.id);
            const balance = walletBalances[d.id] || 0;

            return (
              <Card key={d.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center overflow-hidden border">
                        {d.image && d.image !== '/placeholder.svg' ? (
                          <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-secondary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{d.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {d.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Manage Wallet"
                        onClick={() => {
                          setSelectedDoctorForWallet(d);
                          setWalletDialogOpen(true);
                        }}
                      >
                        <Wallet className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(d);
                          const u = users.find(us => us.id === d.id);
                          setForm({
                            name: d.name,
                            email: u?.email || "",
                            password: u?.password || "",
                            specialization: d.specialization,
                            experience: d.experience.toString(),
                            fee: d.fee.toString(),
                            image: d.image || "",
                          });
                          setIsOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm">{d.rating}</span>
                    <span className="text-muted-foreground text-sm">
                      • {d.experience} yrs
                    </span>
                  </div>

                  <CredentialDisplay user={docUser} />

                  <div className="flex justify-between items-center mt-3 p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Wallet Balance</p>
                      <p className="font-mono font-bold text-green-700">${balance.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={d.isActive}
                        onCheckedChange={() => toggleActive(d.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Edit Doctor Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="p-3 bg-secondary/10 rounded-md space-y-3">
                <h4 className="text-sm font-semibold text-secondary-foreground items-center flex gap-2">
                  <Shield className="w-4 h-4" /> Login Credentials
                </h4>
                <div>
                  <Label>Email (Login ID)</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Set new password"
                  />
                </div>
              </div>

              <div>
                <Label>Specialization</Label>
                <Input
                  value={form.specialization}
                  onChange={(e) =>
                    setForm({ ...form, specialization: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4 mt-2">
                  {form.image && form.image !== '/placeholder.svg' ? (
                    <img src={form.image} alt="Preview" className="w-16 h-16 rounded-full object-cover border" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center border text-muted-foreground">
                      <UserIcon className="w-8 h-8" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Experience</Label>
                  <Input
                    type="number"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fee ($)</Label>
                  <Input
                    type="number"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Wallet Management Dialog */}
        <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Manage Wallet</DialogTitle>
              <CardContent className="pt-4">
                <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Current Balance</span>
                  <span className="text-2xl font-bold font-mono">
                    ${selectedDoctorForWallet ? (walletBalances[selectedDoctorForWallet.id] || 0).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <div className="space-y-2 flex-1">
                    <Label>Adjust Balance for {selectedDoctorForWallet?.name}</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex border rounded-md overflow-hidden shrink-0">
                        <button
                          className={cn("px-3 py-2 hover:bg-muted transition-colors", walletAction === 'add' ? 'bg-primary text-primary-foreground' : 'bg-background')}
                          onClick={() => setWalletAction('add')}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          className={cn("px-3 py-2 hover:bg-muted transition-colors", walletAction === 'deduct' ? 'bg-destructive text-destructive-foreground' : 'bg-background')}
                          onClick={() => setWalletAction('deduct')}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={walletAmount}
                        onChange={e => setWalletAmount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <DialogFooter>
                <Button onClick={handleWalletUpdate} disabled={processingWallet}>
                  {processingWallet ? "Processing..." : "Update Wallet"}
                </Button>
              </DialogFooter>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDoctors;

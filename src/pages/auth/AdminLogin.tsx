import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = login(loginData.email, loginData.password);
    setIsLoading(false);
    
    if (result.success && result.user?.role === 'admin') {
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } else if (result.success && result.user?.role !== 'admin') {
      toast.error('Access denied. Admin credentials required.');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sidebar-primary rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-sidebar-foreground">MediCare Admin</h1>
          <p className="text-sidebar-foreground/70 mt-2">Administration Portal</p>
        </div>

        <Card className="border-2 border-sidebar-border bg-card">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@medicare.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Access Admin Portal'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">Demo Admin Credentials:</p>
              <div className="text-sm text-muted-foreground">
                <p><strong>Email:</strong> admin@test.com</p>
                <p><strong>Password:</strong> admin123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient/Doctor Portal Link */}
        <p className="text-center mt-6 text-sm text-sidebar-foreground/70">
          Not an admin?{' '}
          <Link to="/" className="text-sidebar-primary hover:underline font-medium">
            Go to Patient/Doctor Portal
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

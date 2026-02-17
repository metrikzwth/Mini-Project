import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Loader2, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";

const DoctorLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [loginData, setLoginData] = useState({ email: "", password: "" });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await login(loginData.email, loginData.password);

            if (result.success) {
                if (result.user?.role === 'patient') {
                    toast.error("Access Denied: This portal is for Doctors only.");
                } else if (result.user?.role === 'doctor') {
                    toast.success("Welcome back, Doctor.");
                    navigate("/doctor/dashboard");
                } else {
                    // Fallback or Admin logic
                    navigate("/doctor/dashboard");
                }
            } else {
                toast.error(result.message || "Login failed");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                <Card className="border-t-4 border-t-green-600 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Stethoscope className="w-6 h-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Doctor Portal</CardTitle>
                        <CardDescription>Secure access for medical professionals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="doctor@hospital.com"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isLoading ? "Authenticating..." : "Login to Workspace"}
                            </Button>
                        </form>

                        <div className="mt-6 flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200">
                            <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold mb-1">Restricted Access</p>
                                <p>Only verified doctors can log in here. If you are a new doctor, please contact the Hospital Administration for your credentials.</p>
                            </div>
                        </div>


                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DoctorLogin;

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, User, ShieldCheck } from "lucide-react";

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl shadow-lg mb-4">
                        <Stethoscope className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                        Welcome to MediCare
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your trusted partner in health management. Connect with doctors, manage prescriptions, and track your health journey.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-12">
                    {/* Patient Portal */}
                    <Card
                        className="hover:shadow-xl transition-all duration-300 cursor-pointer border-t-4 border-t-blue-500 group"
                        onClick={() => navigate("/login/patient")}
                    >
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <User className="w-8 h-8 text-blue-600" />
                            </div>
                            <CardTitle>Patient Portal</CardTitle>
                            <CardDescription>
                                Book appointments, order medicines, and consult with doctors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">Login as Patient</Button>
                        </CardContent>
                    </Card>

                    {/* Doctor Portal */}
                    <Card
                        className="hover:shadow-xl transition-all duration-300 cursor-pointer border-t-4 border-t-green-500 group"
                        onClick={() => navigate("/login/doctor")}
                    >
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Stethoscope className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle>Doctor Portal</CardTitle>
                            <CardDescription>
                                Manage appointments, view patient history, and provide consultations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-green-600 hover:bg-green-700">Login as Doctor</Button>
                        </CardContent>
                    </Card>

                    {/* Admin Portal */}
                    <Card
                        className="hover:shadow-xl transition-all duration-300 cursor-pointer border-t-4 border-t-slate-500 group"
                        onClick={() => navigate("/login/admin")}
                    >
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-8 h-8 text-slate-600" />
                            </div>
                            <CardTitle>Admin Portal</CardTitle>
                            <CardDescription>
                                Manage users, verify doctors, and oversee platform operations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50">Login as Admin</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center pt-8 text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} MediCare Platform. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Landing;

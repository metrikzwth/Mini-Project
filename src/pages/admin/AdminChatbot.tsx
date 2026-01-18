import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getData, STORAGE_KEYS, Medicine, chatbotKnowledge } from '@/lib/data';
import { Bot, Pill, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminChatbot = () => {
  const medicines = getData<Medicine[]>(STORAGE_KEYS.MEDICINES, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <h1 className="text-3xl font-bold text-foreground mb-2">Chatbot Knowledge Base</h1>
        <p className="text-muted-foreground mb-8">Manage medicine information that powers the AI chatbot</p>

        <Card className="border-2 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning" /> Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{chatbotKnowledge.disclaimer}</p>
          </CardContent>
        </Card>

        <Card className="border-2 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="w-5 h-5 text-info" /> General Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {chatbotKnowledge.generalTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <span className="w-6 h-6 bg-info/10 rounded-full flex items-center justify-center text-xs font-bold text-info shrink-0">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-foreground mb-4">Medicine Knowledge</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {medicines.map(m => (
            <Card key={m.id} className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Pill className="w-5 h-5 text-primary" /> {m.name}</CardTitle>
                <CardDescription>{m.category}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><strong>Timing:</strong> <Badge variant="outline">{m.instructions.timing.replace('_', ' ')}</Badge></div>
                <div><strong>Drink with:</strong> {m.instructions.drinkWith}</div>
                <div><strong>Dosage:</strong> {m.instructions.dosageTiming}</div>
                {m.instructions.foodsToAvoid.length > 0 && <div><strong>Avoid:</strong> {m.instructions.foodsToAvoid.join(', ')}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminChatbot;

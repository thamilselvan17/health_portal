import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useMedicalRecords, useCreateMedicalRecord } from "@/hooks/use-medical-records";
import { usePatients } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { FileText, Plus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export function RecordsPage() {
  const { user } = useAuth();
  const { data: records } = useMedicalRecords();
  const { data: patients } = usePatients();
  
  const createRecord = useCreateMedicalRecord();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  
  if (!user) return null;

  const isStudent = user.role === 'student';
  const myRecords = records?.filter(
    r => isStudent ? r.patientId === user.id : r.doctorId === user.id
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !diagnosis || !prescription) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    try {
      await createRecord.mutateAsync({
        patientId: selectedPatientId,
        doctorId: user.id,
        diagnosis,
        prescription,
      });
      setIsDialogOpen(false);
      setDiagnosis("");
      setPrescription("");
      toast({ title: "Success", description: "Medical record added successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDownloadPDF = (record: any, patientName: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Medical Record", 20, 20);
    
    // Separator line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 25, 190, 25);
    
    // Details Section
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Date:", 20, 40);
    doc.text("Patient:", 20, 50);
    doc.text("Doctor:", 20, 60);
    
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.text(format(new Date(record.date), "MMMM do, yyyy 'at' h:mm a"), 50, 40);
    doc.text(patientName, 50, 50);
    doc.text(patients?.find((p: any) => p.id === record.doctorId)?.name || `Dr. #${record.doctorId}`, 50, 60);
    
    // Diagnosis Section
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Diagnosis:", 20, 80);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitDiagnosis = doc.splitTextToSize(record.diagnosis || "No diagnosis provided.", 170);
    doc.text(splitDiagnosis, 20, 90);
    
    const diagnosisHeight = splitDiagnosis.length * 7;
    
    // Prescription Section
    const nextSectionY = 90 + diagnosisHeight + 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Prescription & Notes:", 20, nextSectionY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitPrescription = doc.splitTextToSize(record.prescription || "No prescription notes provided.", 170);
    doc.text(splitPrescription, 20, nextSectionY + 10);
    
    // Generate and Download
    doc.save(`Medical_Record_${patientName.replace(/\s+/g, '_')}_${format(new Date(record.date), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Medical Records</h1>
          <p className="text-muted-foreground mt-1">
            {isStudent ? "View your health history and prescriptions" : "Manage patient notes and records"}
          </p>
        </div>
        
        {!isStudent && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all h-11 px-6 gap-2">
                <Plus className="w-4 h-4" /> Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">New Medical Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddRecord} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Patient</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Choose a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Textarea 
                    placeholder="Enter medical diagnosis..."
                    className="resize-none h-24 rounded-xl"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prescription & Notes</Label>
                  <Textarea 
                    placeholder="Enter prescribed medication and treatment notes..."
                    className="resize-none h-24 rounded-xl"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base mt-4"
                  disabled={createRecord.isPending}
                >
                  Save Record
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {myRecords.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No medical records found.</p>
            </CardContent>
          </Card>
        ) : (
          myRecords.map(record => {
            const patientName = patients?.find(p => p.id === record.patientId)?.name || `Patient #${record.patientId}`;
            return (
              <Card key={record.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      {!isStudent && <CardTitle className="text-lg mb-1">{patientName}</CardTitle>}
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.date), "MMMM do, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 shrink-0 transition-colors hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleDownloadPDF(record, patientName)}
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Diagnosis</h4>
                    <p className="text-foreground leading-relaxed bg-primary/5 p-4 rounded-xl">{record.diagnosis}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">Prescription & Notes</h4>
                    <p className="text-foreground leading-relaxed bg-emerald-50 p-4 rounded-xl border border-emerald-100">{record.prescription}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

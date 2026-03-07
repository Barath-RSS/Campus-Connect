import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, CheckCircle2, Clock, Camera, Loader2,
  AlertCircle, Image as ImageIcon, ChevronRight, Eye,
  MapPin, ExternalLink, Shield, Activity, TrendingUp, User
} from 'lucide-react';
import { LocationLink } from '@/components/LocationLink';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AnimatedButton } from '@/components/AnimatedButton';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CAMPUS_LANDMARKS } from '@/constants/campusLocations';
import { UserProfile } from '@/components/UserProfile';

interface Report {
  id: string;
  created_at: string;
  category: string;
  sub_category: string;
  description: string;
  landmark: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  completion_image_url: string | null;
  official_response: string | null;
  is_anonymous: boolean;
  user_id: string;
}

export default function StaffDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [uploadingCompletion, setUploadingCompletion] = useState(false);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'investigating' | 'all'>('all');
  const [landmarkFilter, setLandmarkFilter] = useState<string>('all');
  const [showProfile, setShowProfile] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();

    // Real-time subscription for report updates
    const channel = supabase
      .channel('staff-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopCamera();
    };
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const filteredReports = reports.filter(r => {
    const statusMatch = activeFilter === 'all' ? r.status !== 'resolved' : r.status === activeFilter;
    const landmarkMatch = landmarkFilter === 'all' || r.landmark?.toLowerCase().includes(landmarkFilter.toLowerCase());
    return statusMatch && landmarkMatch;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  const startCamera = async () => {
    try {
      setCapturingPhoto(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      setCapturingPhoto(false);
      toast({ title: 'Camera Error', description: 'Could not access camera.', variant: 'destructive' });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `completion-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedImage(file);
          setCapturedPreview(canvas.toDataURL('image/jpeg'));
          stopCamera();
          setCapturingPhoto(false);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCapturingPhoto(false);
  };

  const handleMarkResolved = async () => {
    if (!selectedReport || !capturedImage) {
      toast({ title: 'Photo Required', description: 'Please capture a completion photo first.', variant: 'destructive' });
      return;
    }

    setUploadingCompletion(true);
    try {
      // Upload completion photo
      const fileName = `completion-${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('issue-images')
        .upload(fileName, capturedImage);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('issue-images').getPublicUrl(fileName);
      const completionImageUrl = urlData.publicUrl;

      // Update report: resolved + completion image + resolved_by
      const { data: currentUser } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          completion_image_url: completionImageUrl,
          official_response: selectedReport.official_response || 'Work completed by service staff.',
          resolved_by: currentUser?.user?.id || null,
        } as any)
        .eq('id', selectedReport.id);

      if (updateError) throw updateError;

      toast({ title: '✅ Report Resolved!', description: 'Completion photo uploaded. Student will be notified.' });
      setCapturedImage(null);
      setCapturedPreview(null);
      setSelectedReport(null);
      fetchReports();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update report.', variant: 'destructive' });
    } finally {
      setUploadingCompletion(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'investigating': return 'bg-primary/10 text-primary border-primary/20';
      case 'resolved': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'investigating': return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'resolved': return <CheckCircle2 className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-60 h-60 bg-success/5 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25"
            >
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Campus Connect</h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">Service Staff Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant={showProfile ? "default" : "outline"}
                size="sm"
                onClick={() => setShowProfile(!showProfile)}
                className={`rounded-xl transition-all duration-300 ${showProfile ? 'shadow-md shadow-primary/20' : 'hover:border-primary/30'}`}
              >
                <User className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </motion.div>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-300 rounded-xl">
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <AnimatePresence mode="wait">
        {showProfile ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">My Profile</h2>
              <Button variant="ghost" onClick={() => setShowProfile(false)}>
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Dashboard
              </Button>
            </div>
            <UserProfile role="staff" />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
        {/* Stats - 3D Card Effect */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Reports', value: stats.total, color: 'text-foreground', bg: 'from-muted/60 to-muted/30', icon: <Activity className="w-5 h-5 text-muted-foreground" />, border: 'border-border/50' },
            { label: 'Pending', value: stats.pending, color: 'text-warning', bg: 'from-warning/15 to-warning/5', icon: <Clock className="w-5 h-5 text-warning" />, border: 'border-warning/20' },
            { label: 'In Progress', value: stats.investigating, color: 'text-primary', bg: 'from-primary/15 to-primary/5', icon: <Loader2 className="w-5 h-5 text-primary animate-spin" />, border: 'border-primary/20' },
            { label: 'Resolved', value: stats.resolved, color: 'text-success', bg: 'from-success/15 to-success/5', icon: <CheckCircle2 className="w-5 h-5 text-success" />, border: 'border-success/20' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 150 }}
              whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
              className={`rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.bg} p-5 backdrop-blur-sm relative overflow-hidden group cursor-default`}
              style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full opacity-60" />
              <div className="flex items-start justify-between">
                <div>
                  <motion.p
                    key={stat.value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-3xl font-extrabold ${stat.color} tracking-tight`}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-2 flex-wrap"
        >
          {(['all', 'pending', 'investigating'] as const).map((f, i) => (
            <motion.div key={f} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={activeFilter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(f)}
                className={`capitalize rounded-xl transition-all duration-300 ${
                  activeFilter === f ? 'shadow-md shadow-primary/20' : 'hover:border-primary/30'
                }`}
              >
                {f === 'all' ? 'Active Reports' : f === 'investigating' ? 'In Progress' : 'Pending'}
                {f === 'pending' && stats.pending > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-warning/20 text-warning font-bold">{stats.pending}</span>
                )}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Reports list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-10 h-10 text-primary" />
            </motion.div>
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 border border-border/30 rounded-2xl bg-gradient-to-br from-success/5 to-transparent"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <CheckCircle2 className="w-20 h-20 mx-auto text-success mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-foreground">All Clear!</h3>
            <p className="text-muted-foreground mt-1">No active reports to handle. Great work! 🎉</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ delay: index * 0.04, type: 'spring', stiffness: 200 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Status accent line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                    report.status === 'pending' ? 'bg-warning' : report.status === 'investigating' ? 'bg-primary' : 'bg-success'
                  }`} />
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 pl-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground capitalize tracking-tight">
                          {report.sub_category.replace(/_/g, ' ')}
                        </span>
                        <Badge className={`${getStatusColor(report.status)} rounded-lg`}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1 capitalize text-[11px]">{report.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize mt-0.5 font-medium">{report.category.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-foreground/80 mt-2 line-clamp-2 leading-relaxed">{report.description}</p>
                      {report.landmark && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary/60" />
                          {report.landmark}
                        </p>
                      )}
                      {report.lat && report.lng && (
                        <LocationLink lat={report.lat} lng={report.lng} variant="inline" className="mt-1.5" />
                      )}
                      <p className="text-[11px] text-muted-foreground/60 mt-2 font-medium">
                        {new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-300 shadow-sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setCapturedImage(null);
                          setCapturedPreview(null);
                          setCapturingPhoto(false);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Handle
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Report Detail Sheet */}
      <Sheet open={!!selectedReport} onOpenChange={(open) => {
        if (!open) {
          setSelectedReport(null);
          setCapturedImage(null);
          setCapturedPreview(null);
          stopCamera();
        }
      }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="capitalize">
              {selectedReport?.sub_category.replace(/_/g, ' ')}
            </SheetTitle>
            <SheetDescription>
              Reported {selectedReport && new Date(selectedReport.created_at).toLocaleString()}
            </SheetDescription>
          </SheetHeader>

          {selectedReport && (
            <div className="mt-6 space-y-5">
              {/* Report photos */}
              {(selectedReport.image_url || selectedReport.image_url_2 || selectedReport.image_url_3) && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Issue Photos</Label>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {[selectedReport.image_url, selectedReport.image_url_2, selectedReport.image_url_3]
                      .filter(Boolean)
                      .map((url, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-border">
                          <img src={url!} alt={`Issue ${i + 1}`} className="w-full h-44 object-cover" />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* GPS Location */}
              {selectedReport.lat && selectedReport.lng && (
                <LocationLink lat={selectedReport.lat} lng={selectedReport.lng} variant="card" />
              )}

              {/* Description */}
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Description</Label>
                <p className="mt-1 text-foreground text-sm">{selectedReport.description}</p>
              </div>

              {/* Landmark */}
              {selectedReport.landmark && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Location</Label>
                  <p className="mt-1 text-foreground text-sm">📍 {selectedReport.landmark}</p>
                </div>
              )}

              {/* Category */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Category</Label>
                  <p className="mt-1 text-foreground text-sm capitalize">{selectedReport.category}</p>
                </div>
                <div className="flex-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Status</Label>
                  <Badge className={`mt-1 ${getStatusColor(selectedReport.status)}`}>
                    {getStatusIcon(selectedReport.status)}
                    <span className="ml-1 capitalize">{selectedReport.status}</span>
                  </Badge>
                </div>
              </div>

              {/* Already resolved with completion pic */}
              {selectedReport.completion_image_url && (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <p className="font-medium text-success">Work Completed</p>
                  </div>
                  <img
                    src={selectedReport.completion_image_url}
                    alt="Completion"
                    className="w-full h-40 object-cover rounded-lg border border-success/20"
                  />
                </div>
              )}

              {/* Camera / Completion Section */}
              {selectedReport.status !== 'resolved' && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <p className="font-medium text-foreground text-sm">Upload Completion Photo</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Capture a photo after finishing the work. This will notify the student that the issue is resolved.
                  </p>

                  <canvas ref={canvasRef} className="hidden" />

                  {capturingPhoto ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover" />
                      <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={stopCamera}>Cancel</Button>
                        <AnimatedButton onClick={capturePhoto} className="gradient-primary text-primary-foreground">
                          <Camera className="w-4 h-4 mr-2" />
                          Capture
                        </AnimatedButton>
                      </div>
                    </div>
                  ) : capturedPreview ? (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden border-2 border-success/40">
                        <img src={capturedPreview} alt="Captured" className="w-full h-44 object-cover" />
                        <div className="absolute top-2 right-2 bg-success rounded-full p-1">
                          <CheckCircle2 className="w-4 h-4 text-success-foreground" />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => { setCapturedImage(null); setCapturedPreview(null); startCamera(); }}>
                        <Camera className="w-4 h-4 mr-2" />
                        Retake Photo
                      </Button>
                    </div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={startCamera}
                      className="w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                    >
                      <Camera className="w-10 h-10" />
                      <span className="text-sm">Tap to capture completion photo</span>
                    </motion.button>
                  )}

                  <AnimatedButton
                    onClick={handleMarkResolved}
                    disabled={!capturedImage || uploadingCompletion}
                    className="w-full gradient-primary text-primary-foreground h-12"
                  >
                    {uploadingCompletion ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Mark as Resolved & Notify Student
                      </>
                    )}
                  </AnimatedButton>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}

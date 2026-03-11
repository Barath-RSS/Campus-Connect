import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Hash, Phone, Shield, Calendar, Briefcase, GraduationCap, Wrench, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  full_name: string | null;
  email: string | null;
  register_no: string | null;
  emp_id: string | null;
  contact_number: string | null;
  created_at: string;
}

export function UserProfile({ role }: { role: 'student' | 'official' | 'staff' }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, email, register_no, emp_id, contact_number, created_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const roleConfig = {
    student: { icon: GraduationCap, label: 'Student', color: 'bg-primary/10 text-primary border-primary/20', gradient: 'from-primary/20 to-primary/5' },
    official: { icon: Briefcase, label: 'Official', color: 'bg-primary/10 text-primary border-primary/20', gradient: 'from-primary/20 to-primary/5' },
    staff: { icon: Wrench, label: 'Service Staff', color: 'bg-warning/10 text-warning border-warning/20', gradient: 'from-warning/20 to-warning/5' },
  };

  const config = roleConfig[role];
  const RoleIcon = config.icon;

  const fields = [
    { icon: User, label: 'Full Name', value: profile?.full_name },
    { icon: Mail, label: 'Email', value: profile?.email },
    role === 'student' && { icon: Hash, label: 'Register No', value: profile?.register_no },
    role === 'staff' && { icon: Hash, label: 'EMP ID', value: profile?.emp_id },
    role === 'staff' && { icon: Phone, label: 'Contact Number', value: profile?.contact_number },
    { icon: Calendar, label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null },
  ].filter(Boolean) as { icon: any; label: string; value: string | null }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      {/* Profile Header - 3D Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: -10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 150 }}
        className={`relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br ${config.gradient} p-8 text-center backdrop-blur-sm`}
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-60" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-full opacity-40" />
        
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-24 h-24 mx-auto rounded-3xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/25 relative"
        >
          <User className="w-12 h-12 text-primary-foreground" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-1 rounded-3xl border-2 border-dashed border-primary/20"
          />
        </motion.div>
        
        <div className="mt-5 relative z-10">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{profile?.full_name || 'User'}</h2>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Badge className={`mt-3 ${config.color} rounded-xl px-3 py-1 text-sm font-semibold`}>
              <RoleIcon className="w-3.5 h-3.5 mr-1.5" />
              {config.label}
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      {/* Profile Fields - 3D animated cards */}
      <div className="space-y-3">
        {fields.map((field, i) => {
          const Icon = field.icon;
          return (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, x: -30, rotateY: -5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 150 }}
              whileHover={{ x: 4, scale: 1.01, transition: { duration: 0.2 } }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
              style={{ perspective: '600px', transformStyle: 'preserve-3d' }}
            >
              {/* Hover highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:shadow-md group-hover:scale-105 transition-all duration-300 relative z-10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{field.label}</p>
                <p className="text-sm font-bold text-foreground truncate mt-0.5">
                  {field.value || 'Not provided'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Security footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-4 rounded-2xl border border-border/30 bg-gradient-to-r from-muted/40 to-muted/20 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-success" />
          </div>
          <p className="text-xs font-medium">Your data is securely stored and protected by enterprise-grade security policies.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

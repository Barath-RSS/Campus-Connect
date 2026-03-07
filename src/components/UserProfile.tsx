import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Hash, Phone, Shield, Calendar, Briefcase, GraduationCap, Wrench } from 'lucide-react';
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleConfig = {
    student: { icon: GraduationCap, label: 'Student', color: 'bg-primary/10 text-primary border-primary/20' },
    official: { icon: Briefcase, label: 'Official', color: 'bg-primary/10 text-primary border-primary/20' },
    staff: { icon: Wrench, label: 'Service Staff', color: 'bg-warning/10 text-warning border-warning/20' },
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
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 mx-auto rounded-3xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/25"
        >
          <User className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{profile?.full_name || 'User'}</h2>
          <Badge className={`mt-2 ${config.color} rounded-lg`}>
            <RoleIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="space-y-3">
        {fields.map((field, i) => {
          const Icon = field.icon;
          return (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{field.label}</p>
                <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                  {field.value || 'Not provided'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl border border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <p className="text-xs font-medium">Your data is securely stored and protected by row-level security policies.</p>
        </div>
      </div>
    </motion.div>
  );
}

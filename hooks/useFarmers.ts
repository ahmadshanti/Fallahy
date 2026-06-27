import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Farmer } from '../types';

export function useFarmers() {
  return useQuery({
    queryKey: ['farmers'],
    queryFn: async (): Promise<Farmer[]> => {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Farmer[]) || [];
    },
  });
}

export function useFarmer(id: string) {
  return useQuery({
    queryKey: ['farmer', id],
    queryFn: async (): Promise<Farmer> => {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Farmer;
    },
    enabled: !!id,
  });
}

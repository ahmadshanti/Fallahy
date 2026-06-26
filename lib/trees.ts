import { supabase } from './supabase';

export async function getAllTrees() {
  const { data, error } = await supabase
    .from('trees')
    .select('*, farmers(id, farm_name, city, owner_avatar_url)')
    .gt('available_count', 0)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTreesByFarmer(farmerId: string) {
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addTree(treeData: Record<string, any>) {
  const { data, error } = await supabase
    .from('trees')
    .insert(treeData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adoptTree(treeId: string, buyerId: string, customName: string) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { data, error } = await supabase
    .from('adopted_trees')
    .insert({
      tree_id: treeId,
      buyer_id: buyerId,
      custom_name: customName,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.rpc('decrement_tree_count', { tree_id_param: treeId }).catch(() => {
    supabase.from('trees').update({ available_count: 0 }).eq('id', treeId);
  });

  return data;
}

export async function getAdoptedTreesByBuyer(buyerId: string) {
  const { data, error } = await supabase
    .from('adopted_trees')
    .select('*, trees(*, farmers(farm_name, city))')
    .eq('buyer_id', buyerId)
    .order('adopted_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateTree(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('trees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTree(id: string) {
  const { error } = await supabase.from('trees').delete().eq('id', id);
  if (error) throw error;
}

'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
        return { error: 'Please enter your name.' };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You need to be signed in.' };
    }

    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', user.id);
    if (error) {
        return { error: 'Could not save your name. Please try again.' };
    }

    // Keep auth user_metadata.name in sync too — the Header reads it directly
    // (cheaper than a profiles lookup on every page) to show the account initial.
    await supabase.auth.updateUser({ data: { name: trimmed } });

    revalidatePath('/account');
    return { error: null };
}

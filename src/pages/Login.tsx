import { supabase } from '../lib/supabase';

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Error logging in with Google:', error.message);
  };

  return (
    // ZIP wali Login UI yahan rakhein aur Social Button par handleGoogleLogin trigger karein
    <button onClick={handleGoogleLogin}>Sign in with Google</button>
  );
}

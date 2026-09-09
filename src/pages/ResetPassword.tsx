import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const isNumericOnly = (s: string) => /^\d+$/.test(s);

const validatePasswordStrength = (pw: string): string | null => {
  if (!pw) return 'Ingresa una contraseña.';
  if (isNumericOnly(pw)) {
    if (pw.length < 4) return 'El PIN numérico debe tener al menos 4 dígitos.';
  } else if (pw.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  return null;
};

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El enlace no es válido. Pide uno nuevo.');
      return;
    }
    const pwError = validatePasswordStrength(newPw);
    if (pwError) { setError(pwError); return; }
    if (newPw !== confirmPw) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/felmat-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: newPw }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(
          json.error === 'invalid_or_expired_token'
            ? 'Este enlace ya venció o no es válido. Pide uno nuevo.'
            : 'No se pudo restablecer la contraseña.',
        );
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-700">GRUPO FELMAT</h1>
            <p className="text-xs text-muted-foreground">CRM Inmobiliario</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva contraseña</CardTitle>
            {!token && !done && <CardDescription>Este enlace no es válido.</CardDescription>}
          </CardHeader>
          <CardContent>
            {done ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">Tu contraseña se actualizó correctamente.</p>
                <Link to="/login"><Button className="w-full">Ir a iniciar sesión</Button></Link>
              </>
            ) : !token ? (
              <Link to="/olvide-contrasena" className="text-sm text-primary hover:underline">Pedir un enlace nuevo</Link>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-new-pw">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="reset-new-pw"
                      type={showPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="8+ caracteres o PIN de 4+ dígitos"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-pw">Confirmar contraseña</Label>
                  <Input
                    id="reset-confirm-pw"
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repite la contraseña"
                  />
                </div>
                {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Guardando...' : 'Restablecer contraseña'}
                </Button>
                <Link to="/login" className="block text-sm text-primary hover:underline text-center">
                  Volver a iniciar sesión
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ResetPassword;

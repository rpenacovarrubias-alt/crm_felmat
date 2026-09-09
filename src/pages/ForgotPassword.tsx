import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/felmat-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // misma respuesta se muestre o no falle la red -- no delatar si el correo existe
    }
    setLoading(false);
    setSent(true);
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
            <CardTitle>Recuperar contraseña</CardTitle>
            <CardDescription>
              {sent
                ? `Si ${email.trim()} tiene una cuenta, te enviamos un correo con un enlace para restablecer tu contraseña. El enlace expira en 30 minutos.`
                : 'Ingresa tu correo y te mandamos un enlace para restablecer tu contraseña.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <Link to="/login" className="text-sm text-primary hover:underline">Volver a iniciar sesión</Link>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Correo electrónico</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@felmat.com.mx"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Enviando...' : 'Enviar enlace'}
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

export default ForgotPassword;

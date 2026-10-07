import { useState } from "react";

function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user.trim(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        if (data.error === "auth_not_configured") throw new Error("Login seguro ainda não configurado na Vercel.");
        throw new Error("Usuário ou senha inválidos.");
      }
      onLogin(data.profile || { username: data.user, displayName: data.user, role: "admin", consultants: ["*"] });
    } catch (loginError) {
      setError(loginError.message || "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span>Painel protegido</span>
          <h1>Z Connect Intelligence</h1>
          <p>Informe suas credenciais para acessar o Analytics comercial.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Usuário
            <input
              value={user}
              onChange={(event) => setUser(event.target.value)}
              autoComplete="username"
              placeholder="Digite o usuário"
              autoFocus
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Digite a senha"
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Entrando..." : "Entrar no Analytics"}</button>
        </form>

        <p className="login-note">
          A sessão é protegida no servidor e expira automaticamente. Não existe cadastro público online.
        </p>
      </section>
    </main>
  );
}

export default LoginScreen;

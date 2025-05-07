document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const botaoLogin = form.querySelector('button[type="submit"]');

  if (!form || !emailInput || !passwordInput || !botaoLogin) {
    console.error("Elementos do formulário não encontrados.");
    return;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const senha = passwordInput.value;

    emailInput.classList.remove('input-erro');
    passwordInput.classList.remove('input-erro');

    if (!email || !senha) {
      alert("⚠️ Preencha todos os campos.");
      if (!email) emailInput.classList.add('input-erro');
      if (!senha) passwordInput.classList.add('input-erro');
      return;
    }

    botaoLogin.disabled = true;
    botaoLogin.textContent = "Entrando...";

    try {
      const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });

      const dados = await response.json();

      if (!response.ok) {
        switch (response.status) {
          case 400:
            alert("⚠️ E-mail e senha são obrigatórios.");
            break;
          case 401:
            alert("❌ Usuário ou senha incorretos.");
            passwordInput.classList.add('input-erro');
            break;
          case 403:
            alert("🚫 Seu acesso está desativado. Contate o administrador.");
            break;
          case 404:
            alert("❌ Usuário não encontrado no sistema.");
            break;
          case 429:
            alert("⏱️ Muitas tentativas de login. Tente novamente em alguns minutos.");
            break;
          default:
            alert(dados.erro || "❌ Erro desconhecido ao efetuar login.");
        }

        botaoLogin.disabled = false;
        botaoLogin.textContent = "Entrar";
        return;
      }

      const { token, usuario } = dados;
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      window.location.href = "/frontend/dashboard.html";

    } catch (erro) {
      console.error("❌ Erro ao conectar com o servidor:", erro);
      alert("Erro de rede. Verifique sua conexão ou tente novamente mais tarde.");
    } finally {
      botaoLogin.disabled = false;
      botaoLogin.textContent = "Entrar";
    }
  });
});

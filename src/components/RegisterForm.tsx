import { useState, useEffect } from "react";
import { dbService, isMockMode } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, CheckCircle, Clock, AlertTriangle, ShieldCheck, User, Users, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [registeredOrder, setRegisteredOrder] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolYear, setSchoolYear] = useState("");

  // Carrega se as inscrições estão abertas
  useEffect(() => {
    async function checkStatus() {
      try {
        const open = await dbService.settings.isOpen();
        setIsOpen(open);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
  }, []);

  // Máscara do Telefone: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não for dígito
    if (value.length > 11) value = value.slice(0, 11);
    
    // Aplica formatação
    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !className.trim() || !phone.trim() || !schoolYear) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await dbService.registrations.create({
        full_name: fullName.trim(),
        class_name: className.trim(),
        phone: phone.trim(),
        school_year: schoolYear,
      });
      setRegisteredOrder(response.order);
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro ao realizar a inscrição. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Redireciona para o Painel Admin com validação de senha simples
  const handleAdminAccess = () => {
    const password = prompt("Digite a senha de administrador para acessar o painel:");
    if (password === "admin123" || password === "olimpiada2026") {
      navigate("/admin");
    } else if (password !== null) {
      alert("Senha incorreta!");
    }
  };

  const getOrdinalText = (order: number) => {
    return `${order}º`;
  };

  if (checkingStatus) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="pulse-glow" style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--primary-glow)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <BrainCircuit size={40} className="pulse-glow" style={{ color: "var(--secondary)" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, width: "100%", margin: "40px auto", padding: "0 20px" }}>
      {/* Cabeçalho do App */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-flex", padding: 12, borderRadius: 20, background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", marginBottom: 16 }}>
          <BrainCircuit size={48} style={{ color: "var(--secondary)" }} />
        </div>
        <h1 style={{ fontSize: "2.2rem", marginBottom: 8 }} className="gradient-text">
          Olimpíada de IA
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
          Inscrições Oficiais da Olimpíada Escolar de Inteligência Artificial 2026
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* Estado de Inscrições Encerradas */
          <motion.div
            key="closed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel"
            style={{ padding: 40, textAlign: "center" }}
          >
            <Clock size={64} style={{ color: "var(--accent)", marginBottom: 20, filter: "drop-shadow(0 0 10px var(--accent-glow))" }} />
            <h2 style={{ fontSize: "1.8rem", marginBottom: 12, color: "var(--text-primary)" }}>
              Inscrições Encerradas
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              O período de inscrições para a Olimpíada de Inteligência Artificial foi finalizado. Fique atento às comunicações da coordenação para os próximos passos e datas das provas!
            </p>
            {isMockMode && (
              <div style={{ background: "rgba(6, 182, 212, 0.08)", border: "1px dashed rgba(6, 182, 212, 0.3)", padding: 12, borderRadius: 10, fontSize: "0.85rem", color: "var(--secondary)" }}>
                💡 Modo de Teste Local Ativo. Você pode reabrir as inscrições no Painel do Administrador abaixo.
              </div>
            )}
          </motion.div>
        ) : registeredOrder !== null ? (
          /* Estado de Sucesso (Inscrito com Posição) */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-panel"
            style={{ padding: 40, textAlign: "center", border: "1px solid rgba(34, 211, 238, 0.3)", boxShadow: "0 0 30px rgba(6, 182, 212, 0.15)" }}
          >
            <CheckCircle size={64} style={{ color: "var(--secondary)", marginBottom: 20, filter: "drop-shadow(0 0 10px var(--secondary-glow))" }} />
            <h2 style={{ fontSize: "1.8rem", marginBottom: 8 }} className="gradient-text">
              Inscrição Confirmada!
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>
              Sua vaga na Olimpíada de Inteligência Artificial está garantida.
            </p>

            <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: 20, padding: 24, marginBottom: 28 }}>
              <span style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                Sua ordem de inscrição é:
              </span>
              <span className="gradient-text-pink" style={{ fontSize: "3.5rem", fontWeight: 800, fontFamily: "var(--font-display)", display: "block", lineHeight: 1 }}>
                {getOrdinalText(registeredOrder)}
              </span>
              <span style={{ display: "block", fontSize: "0.95rem", color: "#a78bfa", marginTop: 8, fontWeight: 500 }}>
                Inscrito!
              </span>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>
              Guarde este comprovante. A ordem de inscrição poderá ser usada como critério de desempate em etapas futuras.
            </p>

            <button 
              className="btn btn-secondary" 
              style={{ width: "100%", marginTop: 24 }}
              onClick={() => setRegisteredOrder(null)}
            >
              Fazer outra inscrição
            </button>
          </motion.div>
        ) : (
          /* Formulário de Registro */
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            onSubmit={handleSubmit}
            className="glass-panel"
            style={{ padding: 32 }}
          >
            <h2 style={{ fontSize: "1.4rem", marginBottom: 24, borderBottom: "1px solid var(--border-glass)", paddingBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={22} style={{ color: "var(--secondary)" }} />
              Formulário de Inscrição
            </h2>

            {errorMessage && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: 14, borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#f87171", fontSize: "0.9rem" }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Nome Completo */}
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                <User size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                placeholder="Ex: Amanda Silva Oliveira"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Ano Escolar */}
            <div className="form-group">
              <label className="form-label" htmlFor="schoolYear">
                <Calendar size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Ano do Aluno na Escola
              </label>
              <select
                id="schoolYear"
                className="form-input"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Selecione o ano escolar...</option>
                <optgroup label="Ensino Fundamental II">
                  <option value="6º Ano - Ensino Fundamental">6º Ano - Ensino Fundamental</option>
                  <option value="7º Ano - Ensino Fundamental">7º Ano - Ensino Fundamental</option>
                  <option value="8º Ano - Ensino Fundamental">8º Ano - Ensino Fundamental</option>
                  <option value="9º Ano - Ensino Fundamental">9º Ano - Ensino Fundamental</option>
                </optgroup>
                <optgroup label="Ensino Médio">
                  <option value="1º Ano - Ensino Médio">1º Ano - Ensino Médio</option>
                  <option value="2º Ano - Ensino Médio">2º Ano - Ensino Médio</option>
                  <option value="3º Ano - Ensino Médio">3º Ano - Ensino Médio</option>
                </optgroup>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Turma */}
            <div className="form-group">
              <label className="form-label" htmlFor="className">
                <Users size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Turma
              </label>
              <input
                id="className"
                type="text"
                className="form-input"
                placeholder="Ex: 3º Ano B ou Turma A"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Telefone */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                <Phone size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Telefone (Whatsapp)
              </label>
              <input
                id="phone"
                type="text"
                className="form-input"
                placeholder="(99) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: 16, marginTop: 12 }}
              disabled={loading}
            >
              {loading ? "Processando Inscrição..." : "Realizar Inscrição Gratuita"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Rodapé Dinâmico com link de Admin */}
      <footer style={{ marginTop: 48, textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <p>© 2026 Olimpíada de Inteligência Artificial. Todos os direitos reservados.</p>
        <button
          onClick={handleAdminAccess}
          style={{ background: "none", border: "none", color: "var(--text-muted)", textDecoration: "underline", cursor: "pointer", marginTop: 12, fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          🔐 Área do Professor (Admin)
        </button>
      </footer>
    </div>
  );
}

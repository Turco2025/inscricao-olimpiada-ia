import { useState, useEffect } from "react";
import { dbService, type Registration } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  ArrowLeft, 
  FileText, 
  Search, 
  Check, 
  X, 
  ToggleLeft, 
  ToggleRight, 
  Database,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { jsPDF } from "jspdf";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await dbService.registrations.list();
      setRegistrations(list);
      const open = await dbService.settings.isOpen();
      setIsOpen(open);
    } catch (err) {
      console.error("Erro ao carregar dados administrativos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Alterar status de inscrições abertas/fechadas
  const handleToggleStatus = async () => {
    setActionLoading(true);
    setSuccessMessage(null);
    try {
      const nextStatus = !isOpen;
      await dbService.settings.setOpenStatus(nextStatus);
      setIsOpen(nextStatus);
      setSuccessMessage(
        nextStatus 
          ? "Inscrições reabertas com sucesso!" 
          : "Inscrições encerradas! Nenhum aluno novo poderá se cadastrar."
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar status das inscrições.");
    } finally {
      setActionLoading(false);
    }
  };

  // Limpar todas as inscrições (para redefinir testes)
  const handleClearAll = async () => {
    const confirm = window.confirm(
      "ATENÇÃO: Você tem certeza que deseja EXCLUIR TODAS as inscrições? Esta ação não pode ser desfeita!"
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      await dbService.registrations.clearAll();
      setRegistrations([]);
      setSuccessMessage("Todas as inscrições foram apagadas.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Erro ao limpar banco de dados.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtra as inscrições de acordo com a pesquisa e o ano escolar selecionado
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.email && reg.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      reg.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.phone.includes(searchQuery);
      
    const matchesYear = filterYear === "" || reg.school_year === filterYear;
    
    return matchesSearch && matchesYear;
  });

  // Função para Gerar o PDF Oficial em formato elegante
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const pageHeight = 210;
    const pageWidth = 297;
    const margin = 15;
    let y = 20;

    // Cabeçalho Corporativo / Estilizado
    doc.setFillColor(13, 10, 28); // Fundo Escuro para Título
    doc.rect(0, 0, pageWidth, 42, "F");

    // Detalhes Decorativos
    doc.setFillColor(6, 182, 212); // Neon Cyan Line
    doc.rect(0, 42, pageWidth, 1.5, "F");

    // Título Principal
    let yHeader = 15;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18); // Voltado para 18 pois na horizontal (landscape) há espaço de sobra
    doc.text("OLIMPÍADA DE INTELIGÊNCIA ARTIFICIAL 2026", margin, yHeader);
    
    // Subtítulo
    yHeader += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Cinza Secundário
    doc.text("Relatório Oficial de Alunos Inscritos por Ordem Cronológica", margin, yHeader);
    
    // Status e Metadados (Posicionados abaixo do subtítulo para evitar colisões)
    yHeader += 6;
    const today = new Date().toLocaleString("pt-BR");
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Data de Emissão: ${today}`, margin, yHeader);
    
    yHeader += 5;
    doc.text(`Status das Inscrições: ${isOpen ? "EM ABERTO" : "ENCERRADAS"}`, margin, yHeader);

    y = 55; // Ajusta y para o início do conteúdo da página


    // Informações Estatísticas Rápidas
    doc.setTextColor(13, 10, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumo de Candidaturas", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total de inscrições registradas: ${registrations.length} alunos.`, margin, y);
    y += 10;

    // Tabela - Cabeçalho
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - (margin * 2), 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    
    // Posições das Colunas no PDF (Ajustadas sob demanda do usuário)
    const colOrder = margin + 2;       // 17
    const colName = margin + 15;       // 30 (largura disponível: 55mm)
    const colEmail = margin + 70;      // 85 (largura disponível: 50mm)
    const colYear = margin + 120;      // 135 (largura disponível: 40mm)
    const colClass = margin + 160;     // 175 (largura disponível: 30mm)
    const colPhone = margin + 190;     // 205 (largura disponível: 35mm)
    const colDateTime = margin + 225;  // 240 (largura disponível: 42mm)

    doc.text("Ordem", colOrder, y + 5.5);
    doc.text("Nome Completo", colName, y + 5.5);
    doc.text("E-mail", colEmail, y + 5.5);
    doc.text("Ano Escolar", colYear, y + 5.5);
    doc.text("Turma", colClass, y + 5.5);
    doc.text("Telefone", colPhone, y + 5.5);
    doc.text("Data/Hora", colDateTime, y + 5.5);
    
    y += 8; // Avança depois do header

    // Tabela - Linhas dos Alunos
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    filteredRegistrations.forEach((reg, index) => {
      // Verifica se a linha vai ultrapassar o limite inferior da folha A4
      if (y > pageHeight - margin - 10) {
        doc.addPage();
        y = 20;

        // Cabeçalho Compacto na Nova Página
        doc.setFillColor(13, 10, 28);
        doc.rect(0, 0, pageWidth, 25, "F");
        doc.setFillColor(6, 182, 212);
        doc.rect(0, 25, pageWidth, 1, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("OLIMPÍADA DE INTELIGÊNCIA ARTIFICIAL 2026 - RELATÓRIO", margin, 15);
        
        y = 35;

        // Reapresenta Header da Tabela
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, pageWidth - (margin * 2), 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text("Ordem", colOrder, y + 5.5);
        doc.text("Nome Completo", colName, y + 5.5);
        doc.text("E-mail", colEmail, y + 5.5);
        doc.text("Ano Escolar", colYear, y + 5.5);
        doc.text("Turma", colClass, y + 5.5);
        doc.text("Telefone", colPhone, y + 5.5);
        doc.text("Data/Hora", colDateTime, y + 5.5);
        
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }

      // Zebra striping (fundo cinza claro para linhas pares)
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - (margin * 2), 7.5, "F");
      }

      // Desenha borda inferior sutil
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

      doc.setTextColor(15, 23, 42);
      
      // Formata a ordem (1º, 2º, etc.)
      const orderStr = `${reg.order_number}º`;
      doc.setFont("helvetica", "bold");
      doc.text(orderStr, colOrder, y + 5);
      doc.setFont("helvetica", "normal");

      // Trunca nomes muito longos para caber no PDF
      let nameText = reg.full_name;
      if (nameText.length > 30) {
        nameText = nameText.substring(0, 27) + "...";
      }

      doc.text(nameText, colName, y + 5);

      // Trunca emails muito longos
      let emailText = reg.email || "";
      if (emailText.length > 28) {
        emailText = emailText.substring(0, 25) + "...";
      }
      doc.text(emailText, colEmail, y + 5);
      
      let yearText = reg.school_year;
      if (yearText.length > 22) {
        yearText = yearText.substring(0, 19) + "...";
      }
      doc.text(yearText, colYear, y + 5);
      doc.text(reg.class_name, colClass, y + 5);
      doc.text(reg.phone, colPhone, y + 5);

      // Formata data e hora da inscrição de forma compacta (ex: DD/MM/AA, HH:MM)
      const formattedDate = reg.created_at
        ? new Date(reg.created_at).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "-";
      doc.text(formattedDate, colDateTime, y + 5);

      y += 7.5;
    });

    // Rodapé de Conclusão de Relatório
    if (y > pageHeight - margin - 30) {
      doc.addPage();
      y = 30;
    } else {
      y += 10;
    }

    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fim do relatório. Total de alunos listados: ${filteredRegistrations.length}.`, margin, y);
    doc.text("Este documento lista inscrições válidas e oficiais no sistema eletrônico da Olimpíada de IA.", margin, y + 4);

    // Salva o PDF com o nome correspondente
    const dateFormatted = new Date().toISOString().slice(0, 10);
    doc.save(`Inscritos_Olimpiada_IA_${dateFormatted}.pdf`);
  };

  const getOrdinalText = (order: number) => {
    return `${order}º`;
  };

  return (
    <div style={{ maxWidth: 1080, width: "100%", margin: "40px auto", padding: "0 20px" }}>
      {/* Botão Voltar */}
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate("/")}
        style={{ marginBottom: 24, padding: "10px 18px", fontSize: "0.9rem" }}
      >
        <ArrowLeft size={16} />
        Voltar à Inscrição
      </button>

      {/* Header do Painel */}
      <div className="glass-panel" style={{ padding: "32px 40px", marginBottom: 32, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: 6 }} className="gradient-text">
            Painel do Professor
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Controle de Inscrições e Emissão de Relatório Oficial da Olimpíada de IA
          </p>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* Botão de Fechar/Abrir inscrições */}
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`btn ${isOpen ? "btn-danger" : "btn-primary"}`}
            style={{ minWidth: 220 }}
          >
            {isOpen ? (
              <>
                <X size={18} />
                Encerrar Inscrições
              </>
            ) : (
              <>
                <Check size={18} />
                Reabrir Inscrições
              </>
            )}
          </button>

          {/* Botão para Gerar PDF */}
          <button
            onClick={generatePDF}
            className="btn btn-primary"
            style={{ 
              background: "linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)",
              boxShadow: "0 4px 15px var(--secondary-glow)"
            }}
            disabled={filteredRegistrations.length === 0}
          >
            <FileText size={18} />
            Gerar PDF Oficial
          </button>
        </div>
      </div>

      {/* Alerta de feedback */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: "rgba(6, 182, 212, 0.1)", 
            border: "1px solid rgba(6, 182, 212, 0.3)", 
            padding: 16, 
            borderRadius: 16, 
            marginBottom: 32,
            color: "var(--secondary)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <Check size={20} />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {/* Grid de Informações e Controle */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 32 }}>
        
        {/* Card Total */}
        <div className="glass-panel stat-card">
          <div className="stat-icon purple">
            <Users size={28} />
          </div>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Total de Alunos Inscritos
            </span>
            <span style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>
              {registrations.length}
            </span>
          </div>
        </div>

        {/* Card Status */}
        <div className="glass-panel stat-card">
          <div className={`stat-icon ${isOpen ? "cyan" : ""}`} style={{ 
            background: isOpen ? "rgba(6, 182, 212, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: isOpen ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            color: isOpen ? "#22d3ee" : "#ef4444"
          }}>
            {isOpen ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </div>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Período de Inscrição
            </span>
            <span style={{ fontSize: "1.4rem", fontWeight: 700, color: isOpen ? "var(--secondary)" : "#ef4444" }}>
              {isOpen ? "Aberto para Respostas" : "Inscrições Bloqueadas"}
            </span>
          </div>
        </div>

        {/* Card Dev/Limpar Banco */}
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: "rgba(100, 116, 139, 0.1)", border: "1px solid rgba(100, 116, 139, 0.2)", color: "var(--text-secondary)" }}>
            <Database size={24} />
          </div>
          <div style={{ flexGrow: 1 }}>
            <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              Banco de Dados
            </span>
            <button
              onClick={handleClearAll}
              disabled={actionLoading || registrations.length === 0}
              className="btn btn-secondary"
              style={{ padding: "10px 18px", fontSize: "0.92rem", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#ef4444", display: "inline-flex", gap: 8, alignItems: "center", marginTop: 4 }}
            >
              <Trash2 size={16} />
              Resetar Tudo
            </button>
          </div>
        </div>
      </div>

      {/* Seção da Tabela de Inscritos */}
      <div className="glass-panel" style={{ padding: 32 }}>
        
        {/* Barra de Filtros */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.3rem", display: "flex", alignItems: "center", gap: 10 }}>
            Listagem de Candidatos na Ordem de Inscrição
          </h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, width: "100%", maxWidth: 600 }}>
            {/* Input Busca */}
            <div style={{ position: "relative", flexGrow: 1 }}>
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, turma ou telefone..."
                className="form-input"
                style={{ paddingLeft: 44, paddingRight: 16, marginBottom: 0, height: 48 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>

            {/* Filtro Ano */}
            <select
              className="form-input"
              style={{ width: "auto", minWidth: 180, marginBottom: 0, height: 48 }}
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">Todos os anos</option>
              <option value="6º Ano - Ensino Fundamental">6º Ano EF</option>
              <option value="7º Ano - Ensino Fundamental">7º Ano EF</option>
              <option value="8º Ano - Ensino Fundamental">8º Ano EF</option>
              <option value="9º Ano - Ensino Fundamental">9º Ano EF</option>
              <option value="1º Ano - Ensino Médio">1º Ano EM</option>
              <option value="2º Ano - Ensino Médio">2º Ano EM</option>
              <option value="3º Ano - Ensino Médio">3º Ano EM</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>

        {/* Tabela de Inscritos */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            Carregando lista de inscrições...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, border: "1px dashed var(--border-glass)", borderRadius: 16 }}>
            <AlertTriangle size={32} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
            <p style={{ color: "var(--text-secondary)" }}>
              Nenhuma inscrição encontrada para os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Ordem</th>
                  <th>Nome Completo</th>
                  <th>E-mail</th>
                  <th>Ano Escolar</th>
                  <th>Turma</th>
                  <th>Telefone</th>
                  <th style={{ width: 180 }}>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const orderNum = reg.order_number || 1;
                  
                  // Escolhe badge de ordem
                  let badgeClass = "badge-other";
                  if (orderNum === 1) badgeClass = "badge-1st";
                  else if (orderNum === 2) badgeClass = "badge-2nd";
                  else if (orderNum === 3) badgeClass = "badge-3rd";

                  const formattedDate = reg.created_at 
                    ? new Date(reg.created_at).toLocaleString("pt-BR") 
                    : "-";

                  return (
                    <tr key={reg.id}>
                      <td>
                        <span className={`badge-order ${badgeClass}`}>
                          {getOrdinalText(orderNum)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{reg.full_name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{reg.email}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{reg.school_year}</td>
                      <td>{reg.class_name}</td>
                      <td style={{ color: "var(--secondary)", fontFamily: "monospace" }}>{reg.phone}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{formattedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

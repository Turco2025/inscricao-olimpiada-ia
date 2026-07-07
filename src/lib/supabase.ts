import { createClient } from "@supabase/supabase-js";

// Tipos do Domínio
export interface Registration {
  id?: number;
  full_name: string;
  email: string;
  class_name: string;
  phone: string;
  school_year: string;
  created_at?: string;
  order_number?: number; // Posição (1º, 2º, etc.)
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Identifica se estamos em modo mock (caso chaves não estejam configuradas)
export const isMockMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === "YOUR_SUPABASE_URL" ||
  supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY";

export const supabase = !isMockMode
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

// --- INICIALIZAÇÃO DO MOCK DATABASE ---
const initMockDB = () => {
  if (typeof window !== "undefined") {
    if (!localStorage.getItem("olympiad_registrations")) {
      localStorage.setItem("olympiad_registrations", JSON.stringify([]));
    }
    if (!localStorage.getItem("olympiad_settings")) {
      localStorage.setItem(
        "olympiad_settings",
        JSON.stringify({ registrations_open: "true" })
      );
    }
  }
};

initMockDB();

// Helper de LocalStorage
const getMockData = <T>(key: string): T | null => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const setMockData = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const dbService = {
  // --- INSCRIÇÕES ---
  registrations: {
    /**
     * Obtém todas as inscrições ordenadas pela ordem que foram criadas (ID sequencial)
     */
    async list(): Promise<Registration[]> {
      if (isMockMode) {
        const list = getMockData<Registration[]>("olympiad_registrations") || [];
        // No localStorage, a ordem é a própria posição no array
        return list.map((item, index) => ({
          ...item,
          order_number: index + 1,
        }));
      } else {
        const { data, error } = await supabase
          .from("olympiad_registrations")
          .select("*")
          .order("id", { ascending: true });

        if (error) {
          console.error("Erro ao listar inscrições no Supabase:", error);
          throw error;
        }

        // Atribui o número de ordem baseado no índice da lista ordenada por ID
        return (data || []).map((item: any, index: number) => ({
          ...item,
          order_number: index + 1,
        }));
      }
    },

    /**
     * Registra um novo aluno
     */
    async create(student: Omit<Registration, "id" | "created_at" | "order_number">): Promise<{ registration: Registration; order: number }> {
      // Primeiro verifica se as inscrições estão abertas
      const isOpen = await dbService.settings.isOpen();
      if (!isOpen) {
        throw new Error("As inscrições já estão encerradas!");
      }

      if (isMockMode) {
        const list = getMockData<Registration[]>("olympiad_registrations") || [];
        
        // Verifica se o email já existe (case-insensitive)
        if (list.some(r => r.email && r.email.toLowerCase() === student.email.toLowerCase())) {
          throw new Error("Este e-mail já está cadastrado!");
        }

        const newReg: Registration = {
          id: list.length + 1,
          ...student,
          created_at: new Date().toISOString(),
        };
        
        list.push(newReg);
        setMockData("olympiad_registrations", list);

        
        return {
          registration: newReg,
          order: list.length, // A ordem final é o tamanho da lista
        };
      } else {
        const { data, error } = await supabase
          .from("olympiad_registrations")
          .insert([student])
          .select()
          .single();

        if (error) {
          console.error("Erro ao cadastrar inscrição no Supabase:", error);
          throw error;
        }

        // Para pegar a ordem exata no Supabase, contamos quantos registros possuem ID menor ou igual ao recém criado
        const { count, error: countError } = await supabase
          .from("olympiad_registrations")
          .select("*", { count: "exact", head: true })
          .lte("id", data.id);

        if (countError) {
          console.error("Erro ao obter contador de ordem:", countError);
        }

        const finalOrder = count || 1;

        return {
          registration: { ...data, order_number: finalOrder },
          order: finalOrder,
        };
      }
    },

    /**
     * Limpa todas as inscrições (para reinício de testes, se necessário)
     */
    async clearAll(): Promise<void> {
      if (isMockMode) {
        setMockData("olympiad_registrations", []);
      } else {
        const { error } = await supabase
          .from("olympiad_registrations")
          .delete()
          .neq("id", 0); // Exclui tudo

        if (error) {
          console.error("Erro ao limpar inscrições:", error);
          throw error;
        }
      }
    }
  },

  // --- CONFIGURAÇÕES ---
  settings: {
    /**
     * Verifica se as inscrições estão abertas
     */
    async isOpen(): Promise<boolean> {
      if (isMockMode) {
        const settings = getMockData<{ registrations_open: string }>("olympiad_settings");
        return settings ? settings.registrations_open === "true" : true;
      } else {
        try {
          const { data, error } = await supabase
            .from("olympiad_settings")
            .select("value")
            .eq("key", "registrations_open")
            .single();

          if (error) {
            // Se der erro ou a chave não existir, por padrão consideramos aberto
            if (error.code === "PGRST116") {
              // Chave não encontrada, tenta criar
              await supabase
                .from("olympiad_settings")
                .insert([{ key: "registrations_open", value: "true" }]);
              return true;
            }
            console.error("Erro ao ler configuração do Supabase:", error);
            return true;
          }

          return data.value === "true";
        } catch (e) {
          console.error("Falha ao ler configuração:", e);
          return true;
        }
      }
    },

    /**
     * Abre ou fecha o período de inscrições
     */
    async setOpenStatus(open: boolean): Promise<boolean> {
      const stringValue = open ? "true" : "false";

      if (isMockMode) {
        setMockData("olympiad_settings", { registrations_open: stringValue });
        return open;
      } else {
        const { error } = await supabase
          .from("olympiad_settings")
          .upsert({ key: "registrations_open", value: stringValue }, { onConflict: "key" });

        if (error) {
          console.error("Erro ao atualizar configuração de inscrições:", error);
          throw error;
        }

        return open;
      }
    },
  },
};

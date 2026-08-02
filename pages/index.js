import { useEffect, useState } from "react";
import Head from "next/head";

const STORAGE_KEY = "mks-painel-v3";

function loadData() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveData(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}
function statusOfPart(part) {
  const qty = Number(part.quantidade) || 0;
  const min = Number(part.minimo) || 0;
  if (qty <= 0) return "esgotado";
  if (qty <= min) return "baixo";
  return "ok";
}
function statusColor(status) {
  if (status === "esgotado") return "#e5484d";
  if (status === "baixo") return "#f0b429";
  return "#34c759";
}
function statusLabel(status) {
  if (status === "esgotado") return "Esgotado";
  if (status === "baixo") return "Estoque baixo";
  return "Em estoque";
}

const MODELOS_PADRAO = [
  { marca: "Fiat", nome: "Uno", categoria: "hatch", motor: "1.0 Fire/Firefly", cambio: "Manual 5v", consumo: "13 km/l (cidade)", problemas: "Correia dentada exige troca preventiva rigorosa; embreagem costuma pedir troca mais cedo em uso urbano.", dica: "Confira o esticador da correia junto com a troca, não só a correia." },
  { marca: "Fiat", nome: "Palio", categoria: "hatch", motor: "1.0/1.4 Fire", cambio: "Manual 5v", consumo: "12 km/l (cidade)", problemas: "Bandejas e terminais de suspensão dianteira desgastam antes do esperado em ruas ruins.", dica: "Vale inspecionar suspensão a cada 20 mil km em cidades com buracos." },
  { marca: "Fiat", nome: "Siena", categoria: "sedan", motor: "1.0/1.4 Fire", cambio: "Manual 5v", consumo: "12 km/l (cidade)", problemas: "Mesmos pontos de atenção do Palio na suspensão, por compartilhar plataforma.", dica: "Boa opção pra quem quer porta-malas grande com manutenção conhecida." },
  { marca: "Fiat", nome: "Strada", categoria: "pickup", motor: "1.4/1.3 Firefly", cambio: "Manual 5/6v", consumo: "11 km/l (cidade)", problemas: "Amortecedores traseiros desgastam mais rápido quando usada pra carga constante.", dica: "Verificar folga na caçamba e feixe de molas em uso comercial pesado." },
  { marca: "Fiat", nome: "Argo", categoria: "hatch", motor: "1.0/1.3 Firefly", cambio: "Manual/CVT", consumo: "13 km/l (cidade)", problemas: "Sistema multimídia e sensores eletrônicos podem apresentar travamentos esporádicos.", dica: "Manter atualização de software da central multimídia em dia." },
  { marca: "Volkswagen", nome: "Gol (G4/G5/G6)", categoria: "hatch", motor: "1.0/1.6 EA111", cambio: "Manual 5v", consumo: "12 km/l (cidade)", problemas: "Bobinas de ignição costumam falhar com o tempo; assoalho pode enferrujar em carros mais antigos.", dica: "Checar corrosão do assoalho em revisões, principalmente em carros de litoral." },
  { marca: "Volkswagen", nome: "Fox", categoria: "hatch", motor: "1.0/1.6 EA111", cambio: "Manual 5v", consumo: "12 km/l (cidade)", problemas: "Suspensão costuma gerar ruídos em pista ruim antes de outros itens pedirem troca.", dica: "Bandejas e buchas valem inspeção visual a cada revisão." },
  { marca: "Volkswagen", nome: "Voyage", categoria: "sedan", motor: "1.0/1.6 EA111", cambio: "Manual 5v", consumo: "12 km/l (cidade)", problemas: "Compartilha os pontos de atenção do Gol, por usar a mesma plataforma.", dica: "Boa opção com peças fáceis de achar no mercado." },
  { marca: "Volkswagen", nome: "Polo", categoria: "hatch", motor: "1.0 TSI/200 TSI", cambio: "Manual/Automático", consumo: "13 km/l (cidade)", problemas: "Versões turbo pedem atenção redobrada à troca de óleo no prazo certo.", dica: "Não atrasar a troca de óleo em motores turbo é essencial." },
  { marca: "Chevrolet", nome: "Celta", categoria: "hatch", motor: "1.0 VHC/VHCE", cambio: "Manual 5v", consumo: "12 km/l (cidade)", problemas: "Consumo de óleo acima do normal é comum em motores mais rodados.", dica: "Verificar nível de óleo com mais frequência em carros com muita quilometragem." },
  { marca: "Chevrolet", nome: "Onix", categoria: "hatch", motor: "1.0/1.4 SPE4", cambio: "Manual/Automático", consumo: "13 km/l (cidade)", problemas: "Correia auxiliar e tensionador pedem atenção; sensores de estacionamento às vezes falham.", dica: "Ouvir ruído de correia auxiliar ao ligar o carro frio." },
  { marca: "Chevrolet", nome: "Prisma", categoria: "sedan", motor: "1.0/1.4 SPE4", cambio: "Manual/Automático", consumo: "13 km/l (cidade)", problemas: "Mesma mecânica do Onix, com os mesmos pontos de atenção.", dica: "Bom custo-benefício em peças por ser volume alto de vendas." },
  { marca: "Chevrolet", nome: "S10", categoria: "pickup", motor: "2.5 Flex / 2.8 Diesel", cambio: "Manual/Automático", consumo: "9 km/l (cidade)", problemas: "Kit de embreagem desgasta mais rápido em uso pesado ou reboque frequente.", dica: "Verificar embreagem antes de longas viagens com carga." },
  { marca: "Ford", nome: "Ka", categoria: "hatch", motor: "1.0/1.5 Dragon", cambio: "Manual/Automático", consumo: "13 km/l (cidade)", problemas: "Bobinas de ignição e correia dentada são os pontos mais citados em revisões.", dica: "Seguir à risca o intervalo de troca da correia dentada." },
  { marca: "Ford", nome: "Fiesta", categoria: "hatch", motor: "1.0/1.6 Sigma", cambio: "Manual/Automático Powershift", consumo: "12 km/l (cidade)", problemas: "Câmbio automático Powershift (versões antigas) é um ponto de atenção bastante conhecido.", dica: "Em versões com Powershift, testar bem o câmbio antes de fechar negócio." },
  { marca: "Ford", nome: "EcoSport", categoria: "suv", motor: "1.6/2.0 Duratec", cambio: "Manual/Automático", consumo: "10 km/l (cidade)", problemas: "Suspensão traseira pode gerar ruído em pisos irregulares com o tempo de uso.", dica: "Checar buchas da suspensão traseira em revisões periódicas." },
  { marca: "Renault", nome: "Sandero", categoria: "hatch", motor: "1.0/1.6 SCe", cambio: "Manual/CVT", consumo: "12 km/l (cidade)", problemas: "Painel de instrumentos e itens elétricos têm histórico de pequenas falhas intermitentes.", dica: "Testar todos os comandos elétricos na hora da revisão." },
  { marca: "Renault", nome: "Logan", categoria: "sedan", motor: "1.0/1.6 SCe", cambio: "Manual/CVT", consumo: "12 km/l (cidade)", problemas: "Compartilha os mesmos pontos elétricos de atenção do Sandero.", dica: "Boa opção com porta-malas grande e peças acessíveis." },
  { marca: "Renault", nome: "Duster", categoria: "suv", motor: "1.6/2.0 SCe", cambio: "Manual/CVT/Automático", consumo: "10 km/l (cidade)", problemas: "Suspensão reforçada aguenta bem estrada ruim, mas sensores 4x4 merecem checagem periódica.", dica: "Testar tração 4x4 periodicamente mesmo se pouco usada." },
  { marca: "Hyundai", nome: "HB20", categoria: "hatch", motor: "1.0/1.6", cambio: "Manual/Automático", consumo: "13 km/l (cidade)", problemas: "Compressor do ar-condicionado é um dos itens mais citados em revisões mais longas.", dica: "Não ignorar ruídos no ar-condicionado, o reparo cedo sai mais barato." },
  { marca: "Toyota", nome: "Corolla", categoria: "sedan", motor: "1.8/2.0 Dynamic Force", cambio: "CVT", consumo: "13 km/l (cidade)", problemas: "Histórico geral de baixa incidência de problemas; atenção maior é ao fluido do CVT no prazo certo.", dica: "Trocar o fluido do câmbio CVT no intervalo recomendado, mesmo sem sintomas." },
];

function CarIcon({ categoria }) {
  const alturaTeto = categoria === "suv" || categoria === "pickup" ? 18 : 12;
  return (
    <svg width="64" height="36" viewBox="0 0 72 40" fill="none">
      <path
        d={`M6 30 Q6 20 16 ${20 - (alturaTeto - 12)} L24 ${30 - alturaTeto} Q30 ${24 - alturaTeto} 40 ${24 - alturaTeto} L50 ${30 - alturaTeto} Q60 ${20 - (alturaTeto - 12)} 66 30 L66 32 Q66 34 64 34 L8 34 Q6 34 6 32 Z`}
        fill="none" stroke="rgba(234,240,251,0.55)" strokeWidth="1"
      />
      <circle cx="18" cy="34" r="5" fill="none" stroke="rgba(234,240,251,0.55)" strokeWidth="1" />
      <circle cx="54" cy="34" r="5" fill="none" stroke="rgba(234,240,251,0.55)" strokeWidth="1" />
    </svg>
  );
}

/* ---------- ACCESS GATE ---------- */

function AccessGate({ onUnlock }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function verificar() {
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        window.localStorage.setItem("mks_access", "1");
        onUnlock();
      } else {
        setError("Código inválido.");
      }
    } catch (e) {
      setError("Sem conexão pra verificar agora. Conecte no Wi-Fi pelo menos uma vez pra liberar o acesso neste aparelho.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="gate glass">
      <img src="/logo-512.png" alt="MKS" style={{ height: 40, margin: "0 auto 14px", display: "block" }} />
      <p style={{ color: "#8ca0c4", fontSize: 14 }}>Digite o código de acesso ao painel.</p>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CÓDIGO" onKeyDown={(e) => e.key === "Enter" && verificar()} />
      <button className="btn" style={{ width: "100%" }} onClick={verificar} disabled={checking || !code}>
        {checking ? "Verificando..." : "Entrar"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

/* ---------- ESTOQUE ---------- */

function EstoqueTab({ parts, setParts }) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [minimo, setMinimo] = useState("");
  const [categoria, setCategoria] = useState("");

  function addPart() {
    if (!nome.trim()) return;
    setParts((prev) => [...prev, { id: Date.now(), nome: nome.trim(), quantidade: quantidade === "" ? 0 : Number(quantidade), minimo: minimo === "" ? 0 : Number(minimo), categoria: categoria.trim() }]);
    setNome(""); setQuantidade(""); setMinimo(""); setCategoria(""); setShowAdd(false);
  }
  function changeQty(id, newQty) { setParts((prev) => prev.map((p) => (p.id === id ? { ...p, quantidade: Math.max(0, newQty) } : p))); }
  function deletePart(id) { setParts((prev) => prev.filter((p) => p.id !== id)); }

  const filtered = parts.filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()) || (p.categoria || "").toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    const order = { esgotado: 0, baixo: 1, ok: 2 };
    const sa = order[statusOfPart(a)], sb = order[statusOfPart(b)];
    if (sa !== sb) return sa - sb;
    return a.nome.localeCompare(b.nome);
  });
  const baixoCount = parts.filter((p) => statusOfPart(p) === "baixo").length;
  const esgotadoCount = parts.filter((p) => statusOfPart(p) === "esgotado").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div className="stat glass"><div className="stat-num">{parts.length}</div><div className="stat-label">peças</div></div>
        <div className="stat glass"><div className="stat-num" style={{ color: "#f0b429" }}>{baixoCount}</div><div className="stat-label">baixo estoque</div></div>
        <div className="stat glass"><div className="stat-num" style={{ color: "#e5484d" }}>{esgotadoCount}</div><div className="stat-label">esgotadas</div></div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar peça..." style={{ flex: 1 }} />
        <button className="btn" onClick={() => setShowAdd((v) => !v)}>{showAdd ? "Fechar" : "+ Peça"}</button>
      </div>

      {showAdd && (
        <div className="card glass" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da peça" style={{ gridColumn: "span 2" }} />
            <input value={quantidade} onChange={(e) => setQuantidade(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Quantidade atual" inputMode="numeric" />
            <input value={minimo} onChange={(e) => setMinimo(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Avisar quando chegar em" inputMode="numeric" />
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria (opcional)" style={{ gridColumn: "span 2" }} />
          </div>
          <button className="btn" style={{ width: "100%" }} onClick={addPart}>Adicionar peça</button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="empty">{parts.length === 0 ? 'Nenhuma peça cadastrada. Toque em "+ Peça" pra começar.' : "Nenhuma peça encontrada."}</div>
      ) : (
        sorted.map((p) => {
          const status = statusOfPart(p);
          return (
            <div key={p.id} className="item-row glass">
              <div className="item-stripe" style={{ background: statusColor(status) }} />
              <div className="item-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#eaf0fb", fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                    {p.categoria && <span style={{ color: "#8ca0c4", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{p.categoria}</span>}
                    <span style={{ color: statusColor(status), fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{statusLabel(status)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className="qty-btn" onClick={() => changeQty(p.id, Number(p.quantidade) - 1)}>−</button>
                  <span style={{ color: "#eaf0fb", fontFamily: "'IBM Plex Mono', monospace", minWidth: 24, textAlign: "center", fontSize: 14 }}>{p.quantidade}</span>
                  <button className="qty-btn" onClick={() => changeQty(p.id, Number(p.quantidade) + 1)}>+</button>
                  <button onClick={() => deletePart(p.id)} style={{ color: "#8ca0c4", background: "none", border: "none", fontSize: 12, marginLeft: 4 }}>✕</button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ---------- SERVIÇOS ---------- */

function ServiceForm({ onAdd }) {
  const [cliente, setCliente] = useState(""), [telefone, setTelefone] = useState(""), [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState(""), [servico, setServico] = useState(""), [valor, setValor] = useState("");
  function submit() {
    if (!cliente.trim() || !servico.trim()) return;
    onAdd({ id: Date.now(), cliente: cliente.trim(), telefone: telefone.trim(), placa: placa.trim().toUpperCase(), modelo: modelo.trim(), servico: servico.trim(), valor: valor.trim(), status: "andamento", dataEntrada: new Date().toISOString(), dataConclusao: null });
    setCliente(""); setTelefone(""); setPlaca(""); setModelo(""); setServico(""); setValor("");
  }
  return (
    <div className="card glass" style={{ marginBottom: 18 }}>
      <div style={{ color: "#8ca0c4", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", marginBottom: 10 }}>Novo serviço</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente" />
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" />
        <input value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Placa" />
        <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Modelo do carro" />
        <input value={servico} onChange={(e) => setServico(e.target.value)} placeholder="Serviço a ser feito" style={{ gridColumn: "span 2" }} />
        <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor estimado (R$)" />
      </div>
      <button className="btn" style={{ width: "100%" }} onClick={submit}>Adicionar à lista de andamento</button>
    </div>
  );
}

function ServiceCard({ s, onConcluir, onDelete, concluido }) {
  return (
    <div className="card glass" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#eaf0fb", fontWeight: 600, fontSize: 14 }}>{s.cliente}</div>
          <div style={{ color: "#8ca0c4", fontSize: 12, marginTop: 2 }}>{s.telefone}</div>
        </div>
        <div style={{ background: "#071022", color: "#f0b429", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(240,180,41,0.18)" }}>
          {s.placa || "sem placa"}
        </div>
      </div>
      <div style={{ color: "#8ca0c4", fontSize: 13, marginTop: 8 }}>{s.modelo && <span>{s.modelo} · </span>}{s.servico}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ color: "#8ca0c4", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
          {concluido ? `Concluído em ${fmtDate(s.dataConclusao)}` : `Entrada: ${fmtDate(s.dataEntrada)}`}{s.valor && ` · R$ ${s.valor}`}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {!concluido && <button onClick={() => onConcluir(s.id)} style={{ background: "#34c759", color: "#08210f", fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none" }}>Concluir</button>}
          <button onClick={() => onDelete(s.id)} style={{ color: "#8ca0c4", background: "none", border: "none", fontSize: 12 }}>✕</button>
        </div>
      </div>
    </div>
  );
}

function AndamentoTab({ services, setServices }) {
  const ativos = services.filter((s) => s.status === "andamento");
  function addService(s) { setServices((prev) => [...prev, s]); }
  function concluir(id) { setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "concluido", dataConclusao: new Date().toISOString() } : s))); }
  function del(id) { setServices((prev) => prev.filter((s) => s.id !== id)); }
  return (
    <div>
      <ServiceForm onAdd={addService} />
      {ativos.length === 0 ? <div className="empty">Nenhum serviço em andamento.</div> : ativos.map((s) => <ServiceCard key={s.id} s={s} onConcluir={concluir} onDelete={del} concluido={false} />)}
    </div>
  );
}

function ConcluidosTab({ services, setServices }) {
  const concluidos = [...services].filter((s) => s.status === "concluido").sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao));
  function del(id) { setServices((prev) => prev.filter((s) => s.id !== id)); }
  return (
    <div>
      {concluidos.length === 0 ? <div className="empty">Nenhum serviço concluído ainda.</div> : concluidos.map((s) => <ServiceCard key={s.id} s={s} onConcluir={() => {}} onDelete={del} concluido />)}
    </div>
  );
}

function ClientesTab({ services }) {
  const map = {};
  services.forEach((s) => {
    const key = (s.cliente || "").toLowerCase() + "|" + (s.telefone || "");
    if (!map[key]) map[key] = { nome: s.cliente, telefone: s.telefone, veiculos: new Set(), visitas: 0, ultima: null };
    if (s.placa) map[key].veiculos.add(`${s.placa}${s.modelo ? " · " + s.modelo : ""}`);
    map[key].visitas += 1;
    const d = s.dataConclusao || s.dataEntrada;
    if (!map[key].ultima || new Date(d) > new Date(map[key].ultima)) map[key].ultima = d;
  });
  const clientes = Object.values(map).sort((a, b) => new Date(b.ultima) - new Date(a.ultima));
  return (
    <div>
      {clientes.length === 0 ? <div className="empty">Nenhum cliente registrado ainda.</div> : clientes.map((c, i) => (
        <div key={i} className="card glass" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "#eaf0fb", fontWeight: 600, fontSize: 14 }}>{c.nome}</div>
              <div style={{ color: "#8ca0c4", fontSize: 12, marginTop: 2 }}>{c.telefone}</div>
            </div>
            <div style={{ color: "#f0b429", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{c.visitas} visita{c.visitas > 1 ? "s" : ""}</div>
          </div>
          {c.veiculos.size > 0 && <div style={{ color: "#8ca0c4", fontSize: 12, marginTop: 8 }}>{Array.from(c.veiculos).join(" · ")}</div>}
          <div style={{ color: "#8ca0c4", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, marginTop: 4 }}>Última visita: {fmtDate(c.ultima)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- SOBRE / CRIADOR ---------- */

function SobreTab({ info, setInfo }) {
  const [form, setForm] = useState(info);
  useEffect(() => setForm(info), [info]);
  return (
    <div className="card glass">
      <div style={{ color: "#f0b429", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", marginBottom: 10 }}>Informações da oficina</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da oficina" style={{ gridColumn: "span 2" }} />
        <input value={form.dono || ""} onChange={(e) => setForm({ ...form, dono: e.target.value })} placeholder="Nome do dono" style={{ gridColumn: "span 2" }} />
        <input value={form.telefone || ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="Telefone / WhatsApp" />
        <input value={form.horario || ""} onChange={(e) => setForm({ ...form, horario: e.target.value })} placeholder="Horário de funcionamento" />
        <input value={form.endereco || ""} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço" style={{ gridColumn: "span 2" }} />
        <input value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="Instagram (opcional)" style={{ gridColumn: "span 2" }} />
      </div>
      <button className="btn" style={{ width: "100%" }} onClick={() => setInfo(form)}>Salvar informações</button>
    </div>
  );
}

function CriadorTab({ criador, setCriador }) {
  const [form, setForm] = useState(criador);
  useEffect(() => setForm(criador), [criador]);
  return (
    <div className="card glass">
      <div style={{ color: "#2f6fed", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", marginBottom: 10 }}>Sobre o criador</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome" style={{ gridColumn: "span 2" }} />
        <input value={form.contato || ""} onChange={(e) => setForm({ ...form, contato: e.target.value })} placeholder="WhatsApp / contato" style={{ gridColumn: "span 2" }} />
        <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail (opcional)" style={{ gridColumn: "span 2" }} />
      </div>
      <button className="btn-blue" style={{ width: "100%", justifyContent: "center" }} onClick={() => setCriador(form)}>Salvar</button>
    </div>
  );
}

/* ---------- MODELOS ---------- */

function ModelosTab({ modelos, setModelos }) {
  const [showAdd, setShowAdd] = useState(false);
  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("hatch");
  const [problemas, setProblemas] = useState("");
  const [expandido, setExpandido] = useState(null);

  function add() {
    if (!nome.trim()) return;
    setModelos((prev) => [...prev, { id: Date.now(), nome: nome.trim(), marca: marca.trim(), categoria, problemas: problemas.trim() }]);
    setNome(""); setMarca(""); setProblemas(""); setShowAdd(false);
  }
  function del(id) { setModelos((prev) => prev.filter((m) => m.id !== id)); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#f0b429", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase" }}>Modelos cadastrados ({modelos.length})</span>
        <button className="btn" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setShowAdd((v) => !v)}>{showAdd ? "Fechar" : "+ Modelo"}</button>
      </div>

      {showAdd && (
        <div className="card glass" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Marca (ex: Fiat)" />
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Modelo (ex: Uno)" />
          </div>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ marginBottom: 12 }}>
            <option value="hatch">Hatch</option>
            <option value="sedan">Sedã</option>
            <option value="suv">SUV</option>
            <option value="pickup">Picape</option>
          </select>
          <textarea value={problemas} onChange={(e) => setProblemas(e.target.value)} placeholder="Problemas crônicos conhecidos" rows={3} style={{ marginBottom: 12 }} />
          <button className="btn" style={{ width: "100%" }} onClick={add}>Adicionar modelo</button>
        </div>
      )}

      {modelos.map((m) => {
        const aberto = expandido === m.id;
        return (
          <div key={m.id} className="card glass" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: 4, flexShrink: 0 }}>
                <CarIcon categoria={m.categoria} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: "#eaf0fb", fontWeight: 700, fontSize: 14 }}>{m.marca ? `${m.marca} ` : ""}{m.nome}</div>
                    <div style={{ color: "#8ca0c4", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase" }}>{m.categoria}</div>
                  </div>
                  <button onClick={() => del(m.id)} style={{ color: "#8ca0c4", background: "none", border: "none", fontSize: 12 }}>✕</button>
                </div>
              </div>
            </div>

            {m.problemas && (
              <div style={{ color: "#eaf0fb", background: "rgba(0,0,0,0.2)", borderLeft: "2px solid rgba(234,240,251,0.3)", fontSize: 12, marginTop: 12, padding: 8, borderRadius: 6, whiteSpace: "pre-wrap" }}>
                <span style={{ fontWeight: 700 }}>Problemas crônicos: </span>{m.problemas}
              </div>
            )}

            {(m.motor || m.cambio || m.consumo || m.dica) && (
              <button onClick={() => setExpandido(aberto ? null : m.id)} style={{ color: "#8ca0c4", border: "1px solid rgba(240,180,41,0.18)", background: "none", fontSize: 12, marginTop: 12, padding: "6px 12px", borderRadius: 6, width: "100%", textAlign: "left" }}>
                {aberto ? "▾ Fechar detalhes" : "▸ Ver mais detalhes"}
              </button>
            )}

            {aberto && (
              <div style={{ color: "#8ca0c4", fontSize: 12, marginTop: 8, paddingLeft: 4 }}>
                {m.motor && <div><span style={{ color: "#eaf0fb" }}>Motorização:</span> {m.motor}</div>}
                {m.cambio && <div><span style={{ color: "#eaf0fb" }}>Câmbio:</span> {m.cambio}</div>}
                {m.consumo && <div><span style={{ color: "#eaf0fb" }}>Consumo médio:</span> {m.consumo}</div>}
                {m.dica && <div style={{ paddingTop: 4 }}><span style={{ color: "#eaf0fb" }}>Dica de manutenção:</span> {m.dica}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- ORÇAMENTO ---------- */

function OrcamentoTab({ parts }) {
  const [selecionadas, setSelecionadas] = useState({});
  const [maoDeObra, setMaoDeObra] = useState("");
  const [cliente, setCliente] = useState("");
  const [copiado, setCopiado] = useState(false);

  function toggle(id) {
    setSelecionadas((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = 1;
      return next;
    });
  }
  function setQty(id, qty) { setSelecionadas((prev) => ({ ...prev, [id]: Math.max(1, qty) })); }

  const itensSelecionados = parts.filter((p) => selecionadas[p.id]);

  function gerarTexto() {
    let txt = `Orçamento${cliente ? ` — ${cliente}` : ""}\n\n`;
    itensSelecionados.forEach((p) => { txt += `${selecionadas[p.id]}x ${p.nome}\n`; });
    if (maoDeObra) txt += `\nMão de obra: R$ ${maoDeObra}\n`;
    return txt;
  }

  function copiar() {
    navigator.clipboard.writeText(gerarTexto()).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div>
      <div className="card glass" style={{ marginBottom: 16 }}>
        <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do cliente (opcional)" style={{ marginBottom: 12 }} />
        <div style={{ color: "#8ca0c4", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", marginBottom: 8 }}>Peças do estoque</div>
        {parts.length === 0 ? (
          <div style={{ color: "#8ca0c4", fontSize: 14 }}>Cadastre peças no Estoque pra usar aqui.</div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 8 }}>
            {parts.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(240,180,41,0.12)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <input type="checkbox" checked={!!selecionadas[p.id]} onChange={() => toggle(p.id)} style={{ width: "auto" }} />
                  <span style={{ color: "#eaf0fb", fontSize: 14 }}>{p.nome}</span>
                </label>
                {selecionadas[p.id] && (
                  <input type="number" min={1} value={selecionadas[p.id]} onChange={(e) => setQty(p.id, Number(e.target.value))} style={{ width: 50, padding: "4px", fontSize: 12, textAlign: "center", marginLeft: 8 }} />
                )}
              </div>
            ))}
          </div>
        )}
        <input value={maoDeObra} onChange={(e) => setMaoDeObra(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Mão de obra (R$)" style={{ marginTop: 8 }} />
      </div>

      <div className="card glass">
        <div style={{ color: "#f0b429", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", marginBottom: 8 }}>Resumo</div>
        <pre style={{ color: "#eaf0fb", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "pre-wrap", fontSize: 13, marginBottom: 12 }}>{gerarTexto()}</pre>
        <button className="btn" style={{ width: "100%" }} onClick={copiar}>{copiado ? "Copiado!" : "Copiar orçamento"}</button>
      </div>
    </div>
  );
}

/* ---------- BACKUP ---------- */

function BackupTab({ allData, onImport }) {
  const [error, setError] = useState("");
  function exportar() {
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        onImport(JSON.parse(ev.target.result));
        setError("");
      } catch (err) {
        setError("Arquivo inválido. Confira se é o backup certo.");
      }
    };
    reader.readAsText(file);
  }
  return (
    <div className="card glass">
      <div style={{ color: "#f0b429", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", marginBottom: 10 }}>Backup dos dados</div>
      <p style={{ color: "#8ca0c4", fontSize: 14, marginBottom: 16 }}>
        Guarde uma cópia de tudo num arquivo — útil antes de mexer em algo importante, ou pra levar os dados pra outro aparelho.
      </p>
      <button className="btn" style={{ width: "100%", marginBottom: 12 }} onClick={exportar}>Exportar backup</button>
      <label className="btn-outline" style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
        Importar backup
        <input type="file" accept=".json" onChange={importar} style={{ display: "none" }} />
      </label>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function BackgroundLine() {
  return (
    <svg style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.35, zIndex: 0 }} viewBox="0 0 800 1000" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f6fed" stopOpacity="0" />
          <stop offset="50%" stopColor="#5b9dff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2f6fed" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M -50 100 L 300 400 L 200 700 L 850 950" stroke="url(#lineGrad)" strokeWidth="1.5" fill="none" />
      <circle cx="300" cy="400" r="3" fill="#5b9dff" />
      <circle cx="200" cy="700" r="3" fill="#5b9dff" />
      <circle cx="520" cy="830" r="2" fill="#5b9dff" />
    </svg>
  );
}

/* ---------- APP ---------- */

export default function Painel() {
  const [checkedAccess, setCheckedAccess] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("estoque");
  const [moreOpen, setMoreOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const [parts, setParts] = useState([]);
  const [services, setServices] = useState([]);
  const [modelos, setModelos] = useState(MODELOS_PADRAO.map((m, i) => ({ id: i + 1, ...m })));
  const [info, setInfo] = useState({
    nome: "MKS Autopeças e Serviços",
    telefone: "(71) 8201-2487",
    endereco: "Rua 7 de Setembro da Ceasa, Terreo, Nova Esperança, Salvador - BA, 41402-320",
  });
  const [criador, setCriador] = useState({ nome: "Daniel Ricky", contato: "", email: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUnlocked(window.localStorage.getItem("mks_access") === "1");
    setCheckedAccess(true);
    const data = loadData();
    setParts(data.parts || []);
    setServices(data.services || []);
    if (data.modelos && data.modelos.length) setModelos(data.modelos);
    if (data.info) setInfo(data.info);
    if (data.criador) setCriador(data.criador);
    setLoaded(true);

    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveData({ parts, services, modelos, info, criador });
  }, [parts, services, modelos, info, criador, loaded]);

  function handleImport(data) {
    setParts(data.parts || []);
    setServices(data.services || []);
    if (data.modelos) setModelos(data.modelos);
    if (data.info) setInfo(data.info);
    if (data.criador) setCriador(data.criador);
  }

  if (!checkedAccess) return null;

  if (!unlocked) {
    return (
      <>
        <Head><title>MKS — Acesso</title></Head>
        <BackgroundLine />
        <div className="wrap" style={{ zIndex: 1 }}><AccessGate onUnlock={() => setUnlocked(true)} /></div>
      </>
    );
  }

  const counts = { andamento: services.filter((s) => s.status === "andamento").length };
  const titles = {
    estoque: "Estoque", andamento: "Em andamento", concluidos: "Concluídos", clientes: "Clientes",
    modelos: "Modelos de carro", orcamento: "Calculadora de orçamento", backup: "Backup dos dados",
    sobre: "Informações da oficina", criador: "Sobre o criador",
  };
  const navTabs = [
    { key: "estoque", label: "Estoque" },
    { key: "andamento", label: "Em andamento" },
    { key: "concluidos", label: "Concluídos" },
    { key: "clientes", label: "Clientes" },
    { key: "modelos", label: "Modelos" },
    { key: "orcamento", label: "Orçamento" },
    { key: "backup", label: "Backup" },
  ];
  const whatsappHref = (() => {
    const digits = (info.telefone || "").replace(/\D/g, "");
    if (!digits) return null;
    const numero = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${numero}`;
  })();

  return (
    <>
      <Head><title>MKS — Painel</title></Head>
      <BackgroundLine />
      <div className="wrap" style={{ zIndex: 1 }}>
        {!isOnline && <div className="offline-banner">Você está offline — os dados continuam salvos neste aparelho normalmente.</div>}

        <div className="topbar">
          <img src="/logo.png" alt="MKS" style={{ height: 26 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            <button className="icon-btn" onClick={() => setMoreOpen((v) => !v)} aria-label="Mais opções">•••</button>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-blue">Fale Conosco</a>
            )}
            {moreOpen && (
              <>
                <div className="blur-overlay" onClick={() => setMoreOpen(false)} />
                <div className="more-menu glass">
                  <div className={`more-menu-item ${tab === "sobre" ? "active" : ""}`} onClick={() => { setTab("sobre"); setMoreOpen(false); }}>Informações da oficina</div>
                  <div className={`more-menu-item ${tab === "criador" ? "active" : ""}`} onClick={() => { setTab("criador"); setMoreOpen(false); }}>Sobre o criador</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="topnav">
          {navTabs.map((t) => (
            <div key={t.key} className={`topnav-item ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</div>
          ))}
        </div>

        <h1 className="page-title">{titles[tab]}</h1>

        {tab === "estoque" && <EstoqueTab parts={parts} setParts={setParts} />}
        {tab === "andamento" && <AndamentoTab services={services} setServices={setServices} />}
        {tab === "concluidos" && <ConcluidosTab services={services} setServices={setServices} />}
        {tab === "clientes" && <ClientesTab services={services} />}
        {tab === "modelos" && <ModelosTab modelos={modelos} setModelos={setModelos} />}
        {tab === "orcamento" && <OrcamentoTab parts={parts} />}
        {tab === "backup" && <BackupTab allData={{ parts, services, modelos, info, criador }} onImport={handleImport} />}
        {tab === "sobre" && <SobreTab info={info} setInfo={setInfo} />}
        {tab === "criador" && <CriadorTab criador={criador} setCriador={setCriador} />}

        {counts.andamento > 0 && tab !== "andamento" && (
          <div style={{ color: "#8ca0c4", fontSize: 12, marginTop: 24, textAlign: "center" }}>
            {counts.andamento} serviço{counts.andamento > 1 ? "s" : ""} em andamento
          </div>
        )}

        <div className="footer-mark">MKS</div>
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import Head from "next/head";

const STORAGE_KEY = "mks-painel-v1";

function loadData() {
  if (typeof window === "undefined") return { parts: [], services: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { parts: [], services: [] };
  } catch (e) {
    return { parts: [], services: [] };
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

/* ---------------- ACCESS GATE ---------------- */

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
      setError("Não consegui verificar agora. Tente de novo.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="gate">
      <div className="brand" style={{ justifyContent: "center" }}>
        <div className="brand-mark">M</div>
        <div className="brand-name">MKS</div>
      </div>
      <p style={{ color: "#8ca0c4", fontSize: 14 }}>Digite o código de acesso ao painel.</p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="CÓDIGO"
        onKeyDown={(e) => e.key === "Enter" && verificar()}
      />
      <button className="btn" style={{ width: "100%" }} onClick={verificar} disabled={checking || !code}>
        {checking ? "Verificando..." : "Entrar"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

/* ---------------- ESTOQUE ---------------- */

function EstoqueTab({ parts, setParts }) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [minimo, setMinimo] = useState("");
  const [categoria, setCategoria] = useState("");

  function addPart() {
    if (!nome.trim()) return;
    setParts((prev) => [
      ...prev,
      {
        id: Date.now(),
        nome: nome.trim(),
        quantidade: quantidade === "" ? 0 : Number(quantidade),
        minimo: minimo === "" ? 0 : Number(minimo),
        categoria: categoria.trim(),
      },
    ]);
    setNome("");
    setQuantidade("");
    setMinimo("");
    setCategoria("");
    setShowAdd(false);
  }

  function changeQty(id, newQty) {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, quantidade: Math.max(0, newQty) } : p)));
  }

  function deletePart(id) {
    setParts((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = parts.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoria || "").toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const order = { esgotado: 0, baixo: 1, ok: 2 };
    const sa = order[statusOfPart(a)];
    const sb = order[statusOfPart(b)];
    if (sa !== sb) return sa - sb;
    return a.nome.localeCompare(b.nome);
  });

  const baixoCount = parts.filter((p) => statusOfPart(p) === "baixo").length;
  const esgotadoCount = parts.filter((p) => statusOfPart(p) === "esgotado").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-num">{parts.length}</div>
          <div className="stat-label">peças</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: "#f0b429" }}>{baixoCount}</div>
          <div className="stat-label">baixo estoque</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: "#e5484d" }}>{esgotadoCount}</div>
          <div className="stat-label">esgotadas</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar peça..." style={{ flex: 1 }} />
        <button className="btn" onClick={() => setShowAdd((v) => !v)}>{showAdd ? "Fechar" : "+ Peça"}</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
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
            <div key={p.id} className="item-row">
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

/* ---------------- SERVIÇOS ---------------- */

function ServiceForm({ onAdd }) {
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [servico, setServico] = useState("");
  const [valor, setValor] = useState("");

  function submit() {
    if (!cliente.trim() || !servico.trim()) return;
    onAdd({
      id: Date.now(),
      cliente: cliente.trim(),
      telefone: telefone.trim(),
      placa: placa.trim().toUpperCase(),
      modelo: modelo.trim(),
      servico: servico.trim(),
      valor: valor.trim(),
      status: "andamento",
      dataEntrada: new Date().toISOString(),
      dataConclusao: null,
    });
    setCliente(""); setTelefone(""); setPlaca(""); setModelo(""); setServico(""); setValor("");
  }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Novo serviço</div>
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
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#eaf0fb", fontWeight: 600, fontSize: 14 }}>{s.cliente}</div>
          <div style={{ color: "#8ca0c4", fontSize: 12, marginTop: 2 }}>{s.telefone}</div>
        </div>
        <div style={{ background: "#071022", color: "#f0b429", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid #23355c" }}>
          {s.placa || "sem placa"}
        </div>
      </div>
      <div style={{ color: "#8ca0c4", fontSize: 13, marginTop: 8 }}>
        {s.modelo && <span>{s.modelo} · </span>}{s.servico}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ color: "#8ca0c4", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
          {concluido ? `Concluído em ${fmtDate(s.dataConclusao)}` : `Entrada: ${fmtDate(s.dataEntrada)}`}
          {s.valor && ` · R$ ${s.valor}`}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {!concluido && (
            <button onClick={() => onConcluir(s.id)} style={{ background: "#34c759", color: "#08210f", fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none" }}>
              Concluir
            </button>
          )}
          <button onClick={() => onDelete(s.id)} style={{ color: "#8ca0c4", background: "none", border: "none", fontSize: 12 }}>✕</button>
        </div>
      </div>
    </div>
  );
}

function AndamentoTab({ services, setServices }) {
  const ativos = services.filter((s) => s.status === "andamento");
  function addService(s) { setServices((prev) => [...prev, s]); }
  function concluir(id) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "concluido", dataConclusao: new Date().toISOString() } : s)));
  }
  function del(id) { setServices((prev) => prev.filter((s) => s.id !== id)); }

  return (
    <div>
      <ServiceForm onAdd={addService} />
      {ativos.length === 0 ? (
        <div className="empty">Nenhum serviço em andamento.</div>
      ) : (
        ativos.map((s) => <ServiceCard key={s.id} s={s} onConcluir={concluir} onDelete={del} concluido={false} />)
      )}
    </div>
  );
}

function ConcluidosTab({ services, setServices }) {
  const concluidos = [...services].filter((s) => s.status === "concluido").sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao));
  function del(id) { setServices((prev) => prev.filter((s) => s.id !== id)); }
  return (
    <div>
      {concluidos.length === 0 ? (
        <div className="empty">Nenhum serviço concluído ainda.</div>
      ) : (
        concluidos.map((s) => <ServiceCard key={s.id} s={s} onConcluir={() => {}} onDelete={del} concluido />)
      )}
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
      {clientes.length === 0 ? (
        <div className="empty">Nenhum cliente registrado ainda — cadastre um serviço pra começar a ver aqui.</div>
      ) : (
        clientes.map((c, i) => (
          <div key={i} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#eaf0fb", fontWeight: 600, fontSize: 14 }}>{c.nome}</div>
                <div style={{ color: "#8ca0c4", fontSize: 12, marginTop: 2 }}>{c.telefone}</div>
              </div>
              <div style={{ color: "#f0b429", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                {c.visitas} visita{c.visitas > 1 ? "s" : ""}
              </div>
            </div>
            {c.veiculos.size > 0 && (
              <div style={{ color: "#8ca0c4", fontSize: 12, marginTop: 8 }}>{Array.from(c.veiculos).join(" · ")}</div>
            )}
            <div style={{ color: "#8ca0c4", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, marginTop: 4 }}>
              Última visita: {fmtDate(c.ultima)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- APP ---------------- */

export default function Painel() {
  const [checkedAccess, setCheckedAccess] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("estoque");
  const [parts, setParts] = useState([]);
  const [services, setServices] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUnlocked(window.localStorage.getItem("mks_access") === "1");
    setCheckedAccess(true);
    const data = loadData();
    setParts(data.parts || []);
    setServices(data.services || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveData({ parts, services });
  }, [parts, services, loaded]);

  if (!checkedAccess) return null;

  if (!unlocked) {
    return (
      <>
        <Head><title>MKS — Acesso</title></Head>
        <AccessGate onUnlock={() => setUnlocked(true)} />
      </>
    );
  }

  const counts = { andamento: services.filter((s) => s.status === "andamento").length };
  const tabs = [
    { key: "estoque", label: "Estoque" },
    { key: "andamento", label: `Em andamento${counts.andamento ? ` (${counts.andamento})` : ""}` },
    { key: "concluidos", label: "Concluídos" },
    { key: "clientes", label: "Clientes" },
  ];

  return (
    <>
      <Head><title>MKS — Painel</title></Head>
      <div className="wrap">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div className="brand-name">MKS</div>
        </div>
        <div className="eyebrow">Painel interno</div>
        <h1>Gestão da oficina</h1>

        <div className="tabs">
          {tabs.map((t) => (
            <div key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </div>
          ))}
        </div>

        {tab === "estoque" && <EstoqueTab parts={parts} setParts={setParts} />}
        {tab === "andamento" && <AndamentoTab services={services} setServices={setServices} />}
        {tab === "concluidos" && <ConcluidosTab services={services} setServices={setServices} />}
        {tab === "clientes" && <ClientesTab services={services} />}
      </div>
    </>
  );
}

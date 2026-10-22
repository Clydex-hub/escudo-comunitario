
import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

function App() {
  const [evidence, setEvidence] = useState("");
  const [result, setResult] = useState(null);
  const [evidenceHash, setEvidenceHash] = useState("");
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

useEffect(() => {
  async function initializeSession() {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      setAuthError("No se pudo recuperar la sesión.");
      setAuthReady(true);
      return;
    }

    let currentUser = sessionData.session?.user;

    if (!currentUser) {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error("Error al iniciar sesión:", error);
        setAuthError("No se pudo iniciar la sesión anónima.");
        setAuthReady(true);
        return;
      }

      currentUser = data.user;
    }

    setUserId(currentUser.id);
    setAuthReady(true);
  }

  initializeSession();
}, []);

  

  async function analyzeEvidence() {
    const text = evidence.trim();

    if (!authReady || !userId) {
  alert("La sesión todavía no está lista. Inténtalo de nuevo en unos segundos.");
  return;
}
    if (!text) {
      setResult({
        level: "empty",
        title: "Necesitamos contenido para analizar",
        details: "Pega un mensaje o enlace en el campo de texto e inténtalo de nuevo.",
        signals: [],
      });

      return;
    }

    const indicators = [
      {
        name: "Urgencia o amenazas",
        pattern: /urgente|inmediatamente|última oportunidad|será bloqueada|suspendida|hoy mismo/i,
      },
      {
        name: "Solicitud de datos sensibles",
        pattern: /contraseña|clave|código de verificación|datos bancarios|número de tarjeta/i,
      },
      {
        name: "Promesas o premios inesperados",
        pattern: /ganaste|premio|regalo|dinero gratis|felicitaciones/i,
      },
      {
        name: "Enlaces para verificar o actualizar datos",
        pattern: /https?:\/\/|www\.|verifica tus datos|ingresa a este enlace|haz clic/i,
      },
    ];

    const detected = indicators
      .filter((indicator) => indicator.pattern.test(text))
      .map((indicator) => indicator.name);

    let level = "low";
    let title = "Pocas señales de alerta detectadas";
    let details =
      "Este análisis básico no encontró muchas de las señales configuradas. Esto no significa que el contenido sea seguro.";

    if (detected.length >= 2) {
      level = "high";
      title = "Se detectaron varias señales de alerta";
      details =
        "El contenido presenta patrones que pueden aparecer en intentos de fraude. Verifica el mensaje por un canal oficial antes de actuar.";
    } else if (detected.length === 1) {
      level = "medium";
      title = "Se detectó una señal de alerta";
      details =
        "Hay un elemento que merece revisión. No compartas datos personales ni abras enlaces sin verificar su origen.";
    }

    
    setResult({
      level,
      title,
      details,
      signals: detected,
    });

    
const hashBuffer = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(text)
);

const evidenceHash = Array.from(new Uint8Array(hashBuffer))
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");
  setEvidenceHash(evidenceHash);


    const { error } = await supabase.from("cases").insert({
      user_id: userId,
      content: text,
      risk_level: level,
      signals: detected,
      analysis_details: details,
      evidence_hash: evidenceHash,
    });

    if (error) {
      console.error("Error al guardar el caso:", error);
      alert("El análisis terminó, pero no se pudo guardar el caso.");
    } else {
      alert("¡Análisis guardado correctamente en Supabase!");
    }

  }

  
async function loadCases() {
  if (!authReady || !userId) {
  setHistoryError("La sesión todavía no está lista.");
  return;
}
  setLoadingCases(true);
  setHistoryError("");

  const { data, error } = await supabase
    .from("cases")
    .select("id, content, risk_level, signals, created_at, evidence_hash")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error al cargar el historial:", error);
    setHistoryError("No se pudo cargar el historial.");
  } else {
    setCases(data ?? []);
  }

  setLoadingCases(false);
}



async function verifyEvidence(item) {
  try {
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(item.content)
    );

    const calculatedHash = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedHash === item.evidence_hash) {
      alert("✅ Integridad verificada: la huella coincide.");
    } else {
      alert("⚠️ La huella no coincide con el contenido.");
    }
  } catch (error) {
    console.error("Error al verificar:", error);
    alert("No se pudo verificar la evidencia.");
  }
}



  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">🛡️</span>
          <div>
            <h1>Escudo Comunitario</h1>
            <p>Inteligencia contra el fraude digital</p>
          </div>
        </div>
        <span className="status">● Sistema activo</span>
      </header>

      <section className="hero">
        <span className="eyebrow">PROTECCIÓN DIGITAL COMUNITARIA</span>
        <h2>Antes de confiar,<br />verifica.</h2>
        <p>
          Analiza mensajes sospechosos, identifica señales de fraude
          y aprende cómo protegerte antes de actuar.
        </p>
      </section>

      
<section className="history-section">
  <div className="section-heading">
    <span className="number">02</span>
    <div>
      <h3>Historial de casos</h3>
      <p>Consulta los análisis guardados en tu sesión.</p>
    </div>
  </div>

  <button
    type="button"
    onClick={loadCases}
    disabled={!authReady || loadingCases}
  >
    {loadingCases ? "Cargando..." : "Consultar mis casos"}
  </button>

  {authError && <p>{authError}</p>}
  {historyError && <p>{historyError}</p>}

  {cases.map((item) => (
    <article className="history-item" key={item.id}>
      <div>
        <strong>Riesgo: {item.risk_level}</strong>
        <p>{item.content}</p>
        <small>{new Date(item.created_at).toLocaleString()}</small>
      </div>

      {item.evidence_hash && (
        <p className="history-hash">
          SHA-256: <code>{item.evidence_hash}</code>
        </p>
      )}

      
{item.evidence_hash && (
  <button
    type="button"
    onClick={() => verifyEvidence(item)}
  >
    Verificar integridad
  </button>
)}


    </article>
  ))}
</section>


      <section className="analysis-card">
        <div className="section-heading">
          <span className="number">01</span>
          <div>
            <h3>Analizar contenido sospechoso</h3>
            <p>Pega un mensaje, correo o enlace para iniciar la revisión.</p>
          </div>
        </div>

        <label htmlFor="evidence">Contenido por analizar</label>
        <textarea
          id="evidence"
          value={evidence}
          onChange={(event) => {
            setEvidence(event.target.value);
            setResult(null);
          }}
          placeholder="Ejemplo: Tu cuenta será bloqueada. Ingresa ahora a este enlace para verificar tus datos..."
          rows={6}
        />

        <div className="form-footer">
          <span>🔒 Evita incluir contraseñas o datos bancarios.</span>
          <button type="button" onClick={analyzeEvidence}>
            Analizar riesgo →
          </button>
        </div>

        {result && (
          <section className={`result-panel result-${result.level}`} aria-live="polite">
            <span className="result-label">RESULTADO PRELIMINAR</span>
            <h3>{result.title}</h3>
            <p>{result.details}</p>

            {result.signals.length > 0 && (
              <>
                <h4>Señales identificadas</h4>
                <ul>
                  {result.signals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </>
            )}

            <p className="disclaimer">
              Esta herramienta usa reglas básicas, no inteligencia artificial.
              El resultado no confirma ni descarta por sí solo un fraude.
            </p>
            
{evidenceHash && (
  <div className="hash-box">
    <h4>🔐 Huella digital de la evidencia (SHA-256)</h4>
    <code>{evidenceHash}</code>
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(evidenceHash)}
    >
      Copiar huella
    </button>
  </div>
)}

          </section>
        )}
      </section>

      <footer>
        <p>Escudo Comunitario · La prevención empieza con la verificación.</p>
      </footer>
    </main>
  );
}

export default App;


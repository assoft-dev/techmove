import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { corridasService } from "../../services/corridasService.js";
import { useSessionStore } from "../../store/sessionStore.js";
import "./PedirCorrida.modulo.css";

function parseCoord(value: string): number | null {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default function PedirCorrida() {
  const navigate = useNavigate();
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const [pickupLat, setPickupLat] = useState("38.7223");
  const [pickupLng, setPickupLng] = useState("-9.1393");
  const [dropLat, setDropLat] = useState("38.6979");
  const [dropLng, setDropLng] = useState("-9.1775");
  const [price, setPrice] = useState("5.00");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const client = user;

  if (client.role !== "client") {
    return (
      <div className="corridaPedir_wrap">
        <div className="corridaPedir_blocked">
          <p className="font-medium">Pedido disponível apenas para clientes</p>
          <p className="mt-2">
            O teu perfil é <strong>{client.role}</strong>. Entra com uma conta
            Cliente para pedir uma corrida.
          </p>
          <p className="mt-4">
            <Link to="/" className="corridaPedir_link">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const pLat = parseCoord(pickupLat);
    const pLng = parseCoord(pickupLng);
    const dLat = parseCoord(dropLat);
    const dLng = parseCoord(dropLng);
    const priceNum = parseFloat(price.replace(",", "."));

    if (
      pLat === null ||
      pLng === null ||
      dLat === null ||
      dLng === null ||
      !Number.isFinite(priceNum) ||
      priceNum <= 0
    ) {
      setError(
        "Preenche coordenadas e preço válidos (usa ponto ou vírgula nos números).",
      );
      return;
    }

    setLoading(true);
    try {
      const corrida = await corridasService.guardar({
        clientId: client.id,
        pickupLat: pLat,
        pickupLng: pLng,
        dropLat: dLat,
        dropLng: dLng,
        price: priceNum,
      });
      navigate(`/corrida/${corrida.id}/rastrear`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível pedir a corrida.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="corridaPedir_wrap">
      <h1 className="corridaPedir_title">Pedir corrida</h1>
      <p className="corridaPedir_lead">
        Cliente: <strong>{client.name}</strong> ({client.email})
      </p>

      <div className="corridaPedir_card">
        <form onSubmit={onSubmit} className="corridaPedir_form">
          <p className="text-sm text-slate-600">
            Indica recolha, destino e preço acordado. Coordenadas em graus
            decimais (ex.: Lisboa).
          </p>

          <div>
            <span className="corridaPedir_label">Recolha — latitude</span>
            <input
              className="corridaPedir_input"
              value={pickupLat}
              onChange={(e) => setPickupLat(e.target.value)}
              inputMode="decimal"
              required
            />
          </div>
          <div>
            <span className="corridaPedir_label">Recolha — longitude</span>
            <input
              className="corridaPedir_input"
              value={pickupLng}
              onChange={(e) => setPickupLng(e.target.value)}
              inputMode="decimal"
              required
            />
          </div>

          <div>
            <span className="corridaPedir_label">Destino — latitude</span>
            <input
              className="corridaPedir_input"
              value={dropLat}
              onChange={(e) => setDropLat(e.target.value)}
              inputMode="decimal"
              required
            />
          </div>
          <div>
            <span className="corridaPedir_label">Destino — longitude</span>
            <input
              className="corridaPedir_input"
              value={dropLng}
              onChange={(e) => setDropLng(e.target.value)}
              inputMode="decimal"
              required
            />
          </div>

          <div>
            <span className="corridaPedir_label">Preço (€)</span>
            <input
              className="corridaPedir_input"
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              required
            />
          </div>

          {error ? (
            <p className="corridaPedir_error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="corridaPedir_submit"
          >
            {loading ? "A enviar…" : "Confirmar pedido"}
          </button>
        </form>
        <p className="corridaPedir_hint">
          Valores iniciais são um exemplo em Lisboa; podes alterar para o teu
          percurso.
        </p>
      </div>
    </div>
  );
}

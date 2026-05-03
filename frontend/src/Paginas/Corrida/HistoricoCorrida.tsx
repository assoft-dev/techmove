import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Corridas, Motoristas } from "../../Models/index.js";
import { corridasService } from "../../services/corridasService.js";
import { motoristasService } from "../../services/motoristasService.js";
import { useSessionStore } from "../../store/sessionStore.js";
import {
  formatPrecoEUR,
  formatQuando,
  rideStatusLabelPt,
  sortCorridasPorDataDesc,
} from "./corridaUi.js";
import "./HistoricoCorrida.modulo.css";

export default function HistoricoCorrida() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const [lista, setLista] = useState<Corridas[]>([]);
  const [driverProfile, setDriverProfile] = useState<Motoristas | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !user) return;

    try {
      setFetchError(null);
      const todas = await corridasService.buscarTodos();

      if (user.role === "admin") {
        setLista(sortCorridasPorDataDesc(todas));
        setDriverProfile(null);
        return;
      }

      if (user.role === "client") {
        const mine = todas.filter((c) => c.clientId === user.id);
        setLista(sortCorridasPorDataDesc(mine));
        setDriverProfile(null);
        return;
      }

      if (user.role === "driver") {
        const motoristas = await motoristasService.buscarTodos();
        const me =
          motoristas.find((m) => m.userId === user.id) ?? null;
        setDriverProfile(me);
        if (!me) {
          setLista([]);
          return;
        }
        const mine = todas.filter((c) => c.driverId === me.id);
        setLista(sortCorridasPorDataDesc(mine));
        return;
      }

      setLista([]);
      setDriverProfile(null);
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Não foi possível carregar o histórico.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }
    load();
  }, [token, user, load]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const account = user;

  return (
    <div className="historicoCorrida_wrap">
      <h1 className="historicoCorrida_title">Histórico de corridas</h1>
      <p className="historicoCorrida_lead">
        Conta: <strong>{account.name}</strong> ({account.email}) ·{" "}
        <span className="historicoCorrida_role">{account.role}</span>
      </p>

      {account.role === "driver" &&
      !loading &&
      !fetchError &&
      driverProfile === null ? (
        <div className="historicoCorrida_notice mt-4">
          Sem perfil de motorista associado — o histórico só mostrará corridas
          depois de existir esse registo (matrícula / viatura).
        </div>
      ) : null}

      {loading ? (
        <p className="historicoCorrida_meta mt-4">A carregar…</p>
      ) : null}

      {fetchError ? (
        <p className="historicoCorrida_error mt-4" role="alert">
          {fetchError}
        </p>
      ) : null}

      {!loading && !fetchError && lista.length === 0 ? (
        <p className="historicoCorrida_empty mt-6">
          Ainda não há corridas neste histórico.
        </p>
      ) : null}

      {!loading && lista.length > 0 ? (
        <ul className="historicoCorrida_list mt-6">
          {lista.map((c) => (
            <li key={c.id} className="historicoCorrida_card">
              <div className="historicoCorrida_cardHead">
                <span className="historicoCorrida_id">#{c.id}</span>
                <span
                  className={`historicoCorrida_status historicoCorrida_status__${c.status}`}
                >
                  {rideStatusLabelPt(c.status)}
                </span>
                <span className="historicoCorrida_when">
                  {formatQuando(c.requested_at)}
                </span>
              </div>
              <dl className="historicoCorrida_dl">
                <div>
                  <dt>Preço</dt>
                  <dd>{formatPrecoEUR(c.price)}</dd>
                </div>
                <div>
                  <dt>Cliente (ID)</dt>
                  <dd>{c.clientId}</dd>
                </div>
                <div>
                  <dt>Motorista (ID)</dt>
                  <dd>{c.driverId ?? "—"}</dd>
                </div>
                <div className="historicoCorrida_dlWide">
                  <dt>Recolha</dt>
                  <dd>
                    {c.pickupLat.toFixed(5)}, {c.pickupLng.toFixed(5)}
                  </dd>
                </div>
                <div className="historicoCorrida_dlWide">
                  <dt>Destino</dt>
                  <dd>
                    {c.dropLat.toFixed(5)}, {c.dropLng.toFixed(5)}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="historicoCorrida_footer mt-8">
        <Link to="/" className="historicoCorrida_link">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}

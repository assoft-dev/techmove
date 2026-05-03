import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Corridas, Motoristas } from "../../Models/index.js";
import { corridasService } from "../../services/corridasService.js";
import { motoristasService } from "../../services/motoristasService.js";
import { ensureSocket } from "../../services/socketManager.js";
import { useSessionStore } from "../../store/sessionStore.js";
import "./AceitarCorrida.modulo.css";
import {
  formatPrecoEUR,
  formatQuando,
  sortCorridasPorDataDesc,
} from "./corridaUi.js";

export default function AceitarCorrida() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const [driverProfile, setDriverProfile] = useState<Motoristas | null>(null);
  const [pending, setPending] = useState<Corridas[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token || !user || user.role !== "driver") return;

    try {
      setFetchError(null);
      const motoristas = await motoristasService.buscarTodos();
      const me =
        motoristas.find((m) => m.userId === user.id) ?? null;
      setDriverProfile(me);

      const rides = await corridasService.buscarTodos();
      const livres = rides.filter(
        (c) => c.status === "requested" && c.driverId == null,
      );
      livres.sort((a, b) => {
        const ta =
          typeof a.requested_at === "string"
            ? new Date(a.requested_at).getTime()
            : a.requested_at.getTime();
        const tb =
          typeof b.requested_at === "string"
            ? new Date(b.requested_at).getTime()
            : b.requested_at.getTime();
        return tb - ta;
      });
      setPending(livres);
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Não foi possível carregar os dados.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user || user.role !== "driver") {
      setLoading(false);
      return;
    }
    load();
    const id = window.setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [token, user, load]);

  useEffect(() => {
    if (!token || !driverProfile) return;
    const s = ensureSocket(token);
    s.emit("driver:join", { driverId: driverProfile.id }, () => {});
    function onNova(payload: { corrida: Corridas }) {
      const c = payload.corrida;
      if (c.status !== "requested" || c.driverId != null) return;
      setPending((prev) => {
        if (prev.some((x) => x.id === c.id)) return prev;
        return sortCorridasPorDataDesc([...prev, c]);
      });
    }
    s.on("corrida:solicitada", onNova);
    return () => {
      s.off("corrida:solicitada", onNova);
    };
  }, [token, driverProfile]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const account = user;

  if (account.role !== "driver") {
    return (
      <div className="aceitarCorrida_wrap">
        <div className="aceitarCorrida_blocked">
          <p className="font-medium">Área exclusiva de motoristas</p>
          <p className="mt-2">
            O teu perfil é <strong>{account.role}</strong>. Entra com uma conta
            Motorista para aceitar pedidos.
          </p>
          <p className="mt-4">
            <Link to="/" className="aceitarCorrida_link">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  async function aceitar(corridaId: number) {
    if (!driverProfile) return;
    setAcceptingId(corridaId);
    setAcceptError(null);
    try {
      await corridasService.atualizar(corridaId, {
        driverId: driverProfile.id,
        status: "accepted",
      });
      setPending((prev) => prev.filter((c) => c.id !== corridaId));
    } catch (e) {
      setAcceptError(
        e instanceof Error ? e.message : "Não foi possível aceitar a corrida.",
      );
    } finally {
      setAcceptingId(null);
    }
  }

  const semPerfilMotorista =
    !loading && !fetchError && driverProfile === null;

  return (
    <div className="aceitarCorrida_wrap">
      <h1 className="aceitarCorrida_title">Aceitar corrida</h1>
      <p className="aceitarCorrida_lead">
        Motorista: <strong>{account.name}</strong> ({account.email})
      </p>

      {loading ? (
        <p className="aceitarCorrida_meta">A carregar pedidos…</p>
      ) : null}

      {semPerfilMotorista ? (
        <div className="aceitarCorrida_blocked mt-6">
          <p className="font-medium">Perfil de motorista em falta</p>
          <p className="mt-2 text-sm">
            A tua conta está como motorista, mas não existe registo na tabela de
            motoristas (matrícula / viatura). É preciso criar esse vínculo na API
            ou na base de dados para poderes aceitar corridas.
          </p>
        </div>
      ) : null}

      {!semPerfilMotorista && driverProfile ? (
        <p className="aceitarCorrida_meta">
          Viatura: <strong>{driverProfile.carModel}</strong> · Matrícula{" "}
          <strong>{driverProfile.plate}</strong>
        </p>
      ) : null}

      {fetchError ? (
        <p className="aceitarCorrida_error mt-4" role="alert">
          {fetchError}
        </p>
      ) : null}
      {acceptError ? (
        <p className="aceitarCorrida_error mt-4" role="alert">
          {acceptError}
        </p>
      ) : null}

      {!loading && !semPerfilMotorista ? (
        <div className="aceitarCorrida_toolbar">
          <button
            type="button"
            className="aceitarCorrida_refresh"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Atualizar lista
          </button>
          <span className="aceitarCorrida_hint">
            Novos pedidos são atualizados automaticamente a cada 15&nbsp;s.
          </span>
        </div>
      ) : null}

      {!loading && !semPerfilMotorista && pending.length === 0 ? (
        <p className="aceitarCorrida_empty mt-6">
          Não há pedidos em espera (estado “solicitada”, sem motorista atribuído).
        </p>
      ) : null}

      {!semPerfilMotorista && pending.length > 0 ? (
        <ul className="aceitarCorrida_list">
          {pending.map((c) => (
            <li key={c.id} className="aceitarCorrida_card">
              <div className="aceitarCorrida_cardHead">
                <span className="aceitarCorrida_id">#{c.id}</span>
                <span className="aceitarCorrida_when">
                  {formatQuando(c.requested_at)}
                </span>
              </div>
              <dl className="aceitarCorrida_dl">
                <div>
                  <dt>Preço</dt>
                  <dd>{formatPrecoEUR(c.price)}</dd>
                </div>
                <div>
                  <dt>Cliente (ID)</dt>
                  <dd>{c.clientId}</dd>
                </div>
                <div className="aceitarCorrida_dlWide">
                  <dt>Recolha</dt>
                  <dd>
                    {c.pickupLat.toFixed(5)}, {c.pickupLng.toFixed(5)}
                  </dd>
                </div>
                <div className="aceitarCorrida_dlWide">
                  <dt>Destino</dt>
                  <dd>
                    {c.dropLat.toFixed(5)}, {c.dropLng.toFixed(5)}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                className="aceitarCorrida_submit"
                disabled={acceptingId !== null || !driverProfile}
                onClick={() => aceitar(c.id)}
              >
                {acceptingId === c.id ? "A aceitar…" : "Aceitar corrida"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
